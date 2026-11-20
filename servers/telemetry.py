from __future__ import annotations

import asyncio
import hashlib
import json
import re
import threading
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import httpx
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import settings
from app.utils.logger import Logger


_FLUSH_INTERVAL_SECONDS = 30.0
_MAX_BUFFER_SIZE = 5000
_HTTP_TIMEOUT = 6.0
_MAX_CUERPO_LEIDO = 256 * 1024
_LARGOS = {'method': 40, 'tool': 80, 'client_name': 80, 'client_version': 40}
_MARCA_ERROR = b'"isError":true'
_PRODUCTO_UA = re.compile(r'[A-Za-z0-9._-]{1,36}')


@dataclass
class McpEventRecord:
    timestamp: datetime
    method: str
    tool: Optional[str]
    status: str
    error_code: Optional[int] = None
    duration_ms: Optional[int] = None
    bytes_out: Optional[int] = None
    session_hash: Optional[str] = None
    ip_hash: Optional[str] = None
    client_name: Optional[str] = None
    client_version: Optional[str] = None

    def to_payload(self) -> dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'method': self.method,
            'tool': self.tool,
            'status': self.status,
            'errorCode': self.error_code,
            'durationMs': self.duration_ms,
            'bytesOut': self.bytes_out,
            'sessionHash': self.session_hash,
            'ipHash': self.ip_hash,
            'clientName': self.client_name,
            'clientVersion': self.client_version,
        }


def _hash_with_salt(value: Optional[str]) -> Optional[str]:
    if not value or not settings.MAPALAB_INTERNAL_TOKEN:
        return None
    return hashlib.sha256(f"{settings.MAPALAB_INTERNAL_TOKEN}|{value}".encode('utf-8')).hexdigest()


def _recortar(valor: Optional[str], campo: str) -> Optional[str]:
    return valor[:_LARGOS[campo]] if isinstance(valor, str) else None


class _McpTelemetryLogger:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._buffer: deque[McpEventRecord] = deque(maxlen=_MAX_BUFFER_SIZE)

    def record(self, record: McpEventRecord) -> None:
        with self._lock:
            self._buffer.append(record)

    def drain(self) -> list[McpEventRecord]:
        with self._lock:
            items = list(self._buffer)
            self._buffer.clear()
        return items


_instance: Optional[_McpTelemetryLogger] = None


def get_logger() -> _McpTelemetryLogger:
    global _instance
    if _instance is None:
        _instance = _McpTelemetryLogger()
    return _instance


def _flush_sync(records: list[McpEventRecord]) -> None:
    if not records:
        return
    if not settings.MARIACHI_BACKEND_URL or not settings.MAPALAB_INTERNAL_TOKEN:
        Logger.warning(f'mcp_telemetry.skip reason=no_config records={len(records)}')
        return
    url = f"{settings.MARIACHI_BACKEND_URL.rstrip('/')}/api/mariachi/internal/mapalab/mcp/events"
    headers = {'X-Internal-Token': settings.MAPALAB_INTERNAL_TOKEN}
    body = {'items': [r.to_payload() for r in records]}
    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT, verify=settings.MARIACHI_VERIFY_SSL) as client:
            response = client.post(url, json=body, headers=headers)
        if response.status_code >= 400:
            Logger.warning(
                f"mcp_telemetry.flush.bad_status status={response.status_code} body={response.text[:200]}"
            )
    except Exception as exc:
        Logger.warning(f"mcp_telemetry.flush.error error={type(exc).__name__} records={len(records)}")


async def flush_loop() -> None:
    logger = get_logger()
    while True:
        await asyncio.sleep(_FLUSH_INTERVAL_SECONDS)
        records = logger.drain()
        if not records:
            continue
        try:
            await asyncio.to_thread(_flush_sync, records)
        except Exception as exc:
            Logger.warning(f"mcp_telemetry.loop.error error={type(exc).__name__}")


def _safe_parse_jsonrpc(body: bytes) -> tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    if not body:
        return None, None, None, None
    try:
        parsed = json.loads(body)
    except (ValueError, json.JSONDecodeError):
        return None, None, None, None
    if not isinstance(parsed, dict):
        return None, None, None, None
    method = parsed.get('method')
    if not isinstance(method, str):
        return None, None, None, None
    params = parsed.get('params') if isinstance(parsed.get('params'), dict) else {}
    tool = None
    client_name = None
    client_version = None
    if method == 'tools/call':
        name = params.get('name')
        if isinstance(name, str):
            tool = name
    if method == 'initialize':
        info = params.get('clientInfo') if isinstance(params.get('clientInfo'), dict) else {}
        cn = info.get('name')
        cv = info.get('version')
        if isinstance(cn, str):
            client_name = cn
        if isinstance(cv, str):
            client_version = cv
    return method, tool, client_name, client_version


def _producto_de_agente(user_agent: Optional[str]) -> Optional[str]:
    if not user_agent:
        return None
    producto = _PRODUCTO_UA.match(user_agent.strip())
    return f'ua:{producto.group(0)}' if producto else None


class MCPTelemetryMiddleware:
    def __init__(self, app: ASGIApp, path_prefix: str = '/mcp') -> None:
        self.app = app
        self.path_prefix = path_prefix

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get('type') != 'http' or scope.get('method') != 'POST':
            await self.app(scope, receive, send)
            return

        path = scope.get('path') or ''
        if not path.startswith(self.path_prefix):
            await self.app(scope, receive, send)
            return

        buffered: list[Message] = []
        body_bytes = b''
        more_body = True
        while more_body:
            message = await receive()
            buffered.append(message)
            if message['type'] == 'http.request':
                if len(body_bytes) < _MAX_CUERPO_LEIDO:
                    body_bytes += message.get('body', b'')
                more_body = message.get('more_body', False)
            else:
                more_body = False

        async def replay_receive() -> Message:
            if buffered:
                return buffered.pop(0)
            return await receive()

        method, tool, client_name, client_version = _safe_parse_jsonrpc(body_bytes)
        if not method:
            await self.app(scope, replay_receive, send)
            return

        headers = {k.decode('latin-1').lower(): v.decode('latin-1') for k, v in scope.get('headers', [])}
        session_id = headers.get('mcp-session-id')
        if not client_name:
            client_name = _producto_de_agente(headers.get('user-agent'))
        state = {'status': 0, 'bytes_out': 0, 'tool_error': False}

        async def wrapped_send(message: Message) -> None:
            if message['type'] == 'http.response.start':
                state['status'] = int(message.get('status') or 0)
            elif message['type'] == 'http.response.body':
                body = message.get('body') or b''
                if body:
                    state['bytes_out'] += len(body)
                    state['tool_error'] = state['tool_error'] or _MARCA_ERROR in body.replace(b' ', b'')
            await send(message)

        start = time.monotonic()
        try:
            await self.app(scope, replay_receive, wrapped_send)
        finally:
            duration_ms = int((time.monotonic() - start) * 1000)
            http_status = state['status']
            outcome = 'ok' if 200 <= http_status < 400 and not state['tool_error'] else 'error'
            get_logger().record(McpEventRecord(
                timestamp=datetime.now(timezone.utc),
                method=_recortar(method, 'method') or '',
                tool=_recortar(tool, 'tool'),
                status=outcome,
                error_code=http_status if http_status >= 400 else None,
                duration_ms=duration_ms,
                bytes_out=state['bytes_out'] or None,
                session_hash=_hash_with_salt(session_id),
                ip_hash=None,
                client_name=_recortar(client_name, 'client_name'),
                client_version=_recortar(client_version, 'client_version'),
            ))


def flush_pending_sync() -> None:
    try:
        _flush_sync(get_logger().drain())
    except Exception as exc:
        Logger.warning(f"mcp_telemetry.shutdown_flush.error {exc}")
