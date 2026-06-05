from __future__ import annotations

import asyncio
import json
from typing import Optional

from starlette.types import ASGIApp, Receive, Scope, Send

from app.config import settings
from app.services.api_key_quota import flush_to_mariachi
from app.services.api_key_validator import validate_api_key
from app.utils.logger import Logger


_BEARER_PREFIX = 'bearer '

_HOW_TO = (
    'MapaLab MCP requiere una API key. Pide una en el administrador de MapaLab y '
    'configura tu cliente MCP con el header "Authorization: Bearer mk_...".'
)


async def send_json(send: Send, status: int, payload: dict, extra_headers=()) -> None:
    body = json.dumps(payload).encode('utf-8')
    headers = [
        (b'content-type', b'application/json'),
        (b'content-length', str(len(body)).encode('ascii')),
    ]
    headers.extend(extra_headers)
    await send({'type': 'http.response.start', 'status': status, 'headers': headers})
    await send({'type': 'http.response.body', 'body': body})


def _extract_token(headers: dict[str, str]) -> Optional[str]:
    auth = headers.get('authorization') or ''
    if auth.lower().startswith(_BEARER_PREFIX):
        token = auth[len(_BEARER_PREFIX):].strip()
        return token or None
    xk = headers.get('x-api-key')
    if xk and xk.strip():
        return xk.strip()
    return None


def _client_ip(scope: Scope, headers: dict[str, str]) -> Optional[str]:
    real = headers.get('x-real-ip')
    if real and real.strip():
        return real.strip()
    client = scope.get('client') or (None,)
    return client[0]


class MCPAuthMiddleware:
    def __init__(self, app: ASGIApp, path_prefix: str = '/mcp') -> None:
        self.app = app
        self.path_prefix = path_prefix

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get('type') != 'http':
            await self.app(scope, receive, send)
            return

        path = scope.get('path') or ''
        if not path.startswith(self.path_prefix) or not settings.MCP_AUTH_ENABLED:
            await self.app(scope, receive, send)
            return

        headers = {k.decode('latin-1').lower(): v.decode('latin-1') for k, v in scope.get('headers', [])}
        token = _extract_token(headers)
        if not token:
            await send_json(
                send,
                401,
                {'error': 'unauthorized', 'message': _HOW_TO},
                [(b'www-authenticate', b'Bearer realm="mapalab-mcp"')],
            )
            return

        ip = _client_ip(scope, headers)
        result = await asyncio.to_thread(validate_api_key, token, None, ip)
        if not result.valid:
            await send_json(
                send,
                401,
                {'error': 'invalid_key', 'reason': result.reason, 'message': _HOW_TO},
                [(b'www-authenticate', b'Bearer realm="mapalab-mcp", error="invalid_token"')],
            )
            return

        scope['mapalab_key'] = result
        await self.app(scope, receive, send)


async def quota_flush_loop() -> None:
    interval = float(settings.MCP_QUOTA_FLUSH_INTERVAL_SECONDS or 60)
    while True:
        await asyncio.sleep(interval)
        try:
            await asyncio.to_thread(flush_to_mariachi)
        except Exception as exc:
            Logger.warning(f"mcp_quota.flush.error {exc}")


def quota_flush_pending_sync() -> None:
    try:
        flush_to_mariachi()
    except Exception as exc:
        Logger.warning(f"mcp_quota.shutdown_flush.error {exc}")
