from __future__ import annotations

import json
import os
from urllib.parse import urlsplit

from starlette.types import ASGIApp, Receive, Scope, Send

MAX_CUERPO = 256 * 1024
ORIGENES_LOCALES = frozenset({'localhost', '127.0.0.1', '[::1]'})


def _origen_publico() -> str:
    partes = urlsplit(os.environ.get('MAPALAB_PUBLIC_BASE_URL') or '')
    return f'{partes.scheme}://{partes.netloc}' if partes.scheme and partes.netloc else ''


def origen_permitido(origen: str) -> bool:
    partes = urlsplit(origen)
    if partes.scheme not in ('http', 'https'):
        return False
    if (partes.hostname or '') in ORIGENES_LOCALES:
        return True
    return bool(_origen_publico()) and f'{partes.scheme}://{partes.netloc}' == _origen_publico()


async def _rechazar(send: Send, estado: int, mensaje: str) -> None:
    cuerpo = json.dumps({'jsonrpc': '2.0', 'id': None, 'error': {'code': -32600, 'message': mensaje}}).encode()
    await send({'type': 'http.response.start', 'status': estado, 'headers': [
        (b'content-type', b'application/json'), (b'content-length', str(len(cuerpo)).encode()),
    ]})
    await send({'type': 'http.response.body', 'body': cuerpo})


class BordeMiddleware:
    def __init__(self, app: ASGIApp, path_prefix: str = '/mcp') -> None:
        self.app = app
        self.path_prefix = path_prefix

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get('type') != 'http' or not (scope.get('path') or '').startswith(self.path_prefix):
            await self.app(scope, receive, send)
            return
        headers = {k.decode('latin-1').lower(): v.decode('latin-1') for k, v in scope.get('headers', [])}
        origen = headers.get('origin')
        if origen and not origen_permitido(origen):
            await _rechazar(send, 403, 'Origin no permitido.')
            return
        largo = headers.get('content-length')
        if largo and largo.isdigit() and int(largo) > MAX_CUERPO:
            await _rechazar(send, 413, f'La petición pasa de {MAX_CUERPO // 1024} KB.')
            return
        await self.app(scope, receive, send)
