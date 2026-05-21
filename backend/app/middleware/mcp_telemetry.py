from __future__ import annotations

import json
import time
from typing import Optional

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.metrics import COUNTER_MCP_CALLS, HISTOGRAM_MCP_LATENCY, incr, observe
from app.services.mcp_telemetry import get_logger


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


class MCPTelemetryMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get('type') != 'http' or scope.get('method') != 'POST':
            await self.app(scope, receive, send)
            return

        buffered: list[Message] = []
        body_bytes = b''
        more_body = True
        while more_body:
            message = await receive()
            buffered.append(message)
            if message['type'] == 'http.request':
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
        client = scope.get('client') or (None, None)
        ip = client[0] if client else None

        state = {'status': 0, 'bytes_out': 0}

        async def wrapped_send(message: Message) -> None:
            if message['type'] == 'http.response.start':
                state['status'] = int(message.get('status') or 0)
            elif message['type'] == 'http.response.body':
                body = message.get('body') or b''
                if body:
                    state['bytes_out'] += len(body)
            await send(message)

        start = time.monotonic()
        try:
            await self.app(scope, replay_receive, wrapped_send)
        finally:
            duration_ms = int((time.monotonic() - start) * 1000)
            http_status = state['status']
            outcome = 'ok' if 200 <= http_status < 400 else 'error'
            get_logger().record(
                method=method,
                tool=tool,
                status=outcome,
                error_code=http_status if outcome == 'error' else None,
                duration_ms=duration_ms,
                bytes_out=state['bytes_out'] or None,
                session_id=session_id,
                ip=ip,
                client_name=client_name,
                client_version=client_version,
            )
            metric_labels = {'method': method, 'tool': tool or '', 'status': outcome}
            incr(COUNTER_MCP_CALLS, metric_labels)
            if method == 'tools/call' and tool:
                observe(HISTOGRAM_MCP_LATENCY, duration_ms, {'tool': tool})
