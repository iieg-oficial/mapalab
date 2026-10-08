from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any, Optional

from app.config import settings


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode('ascii').rstrip('=')


def _unb64(texto: str) -> bytes:
    return base64.urlsafe_b64decode(texto + '=' * (-len(texto) % 4))


def _firma(proposito: str, carga: str) -> str:
    secreto = (settings.MAPALAB_SESSION_SECRET or '').encode('utf-8')
    return _b64(hmac.new(secreto, f'{proposito}.{carga}'.encode('ascii'), hashlib.sha256).digest())


def firmar(proposito: str, datos: dict[str, Any], segundos: int) -> str:
    carga = _b64(json.dumps({**datos, 'exp': int(time.time()) + segundos}, separators=(',', ':')).encode('utf-8'))
    return f'{carga}.{_firma(proposito, carga)}'


def leer(proposito: str, valor: Optional[str]) -> Optional[dict[str, Any]]:
    if not valor or '.' not in valor or not settings.MAPALAB_SESSION_SECRET:
        return None
    carga, firma = valor.rsplit('.', 1)
    if not hmac.compare_digest(firma, _firma(proposito, carga)):
        return None
    try:
        datos = json.loads(_unb64(carga))
    except (ValueError, json.JSONDecodeError):
        return None
    if not isinstance(datos, dict) or int(datos.get('exp') or 0) < time.time():
        return None
    return datos
