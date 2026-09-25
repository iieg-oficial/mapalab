from __future__ import annotations

import hashlib

from fastapi import APIRouter, Body, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.client_error_tracker import record
from app.utils.client_ip import get_client_ip
from app.utils.logger import Logger
from app.utils.rate_limiter import RateLimiter

router = APIRouter(tags=['client-errors'])

_RATE_MAX_REQUESTS = 20
_RATE_WINDOW_SECONDS = 60.0
_DEDUP_WINDOW_SECONDS = 300.0

_por_ip = RateLimiter(_RATE_MAX_REQUESTS, _RATE_WINDOW_SECONDS)
_repetidos = RateLimiter(1, _DEDUP_WINDOW_SECONDS)


class ClientErrorPayload(BaseModel):
    type: str = Field(default='unknown', max_length=64)
    url: str = Field(default='', max_length=2048)
    message: str = Field(default='', max_length=512)
    userAgent: str = Field(default='', max_length=512)
    href: str = Field(default='', max_length=2048)


def _huella(ip: str, payload: ClientErrorPayload) -> str:
    base = '|'.join((ip, payload.type, payload.url[:200], payload.message[:200]))
    return hashlib.sha256(base.encode('utf-8')).hexdigest()


@router.post('/log/client-error', include_in_schema=False)
async def log_client_error(request: Request, payload: ClientErrorPayload = Body(...)):
    ip = get_client_ip(request) or 'desconocida'
    if not _por_ip.hit(ip):
        raise HTTPException(status_code=429, detail='Demasiados reportes de error')
    if not _repetidos.hit(_huella(ip, payload)):
        return {'ok': True, 'duplicado': True}
    record(payload.type)
    Logger.warning(
        f'client.chunk_error type={payload.type} '
        f'url={payload.url[:200]} '
        f'detalle={payload.message[:200]} '
        f'page={payload.href[:200]} '
        f'ua={(payload.userAgent or "")[:120]}'
    )
    return {'ok': True}
