from __future__ import annotations

from fastapi import APIRouter, Body, Request
from pydantic import BaseModel, Field

from app.services.client_error_tracker import record
from app.utils.logger import Logger

router = APIRouter(tags=['client-errors'])


class ClientErrorPayload(BaseModel):
    type: str = Field(default='unknown', max_length=64)
    url: str = Field(default='', max_length=2048)
    message: str = Field(default='', max_length=512)
    userAgent: str = Field(default='', max_length=512)
    href: str = Field(default='', max_length=2048)


@router.post('/log/client-error', include_in_schema=False)
async def log_client_error(payload: ClientErrorPayload = Body(...), request: Request = None):
    record(payload.type)
    Logger.warning(
        f'client.chunk_error type={payload.type} '
        f'url={payload.url[:200]} '
        f'detalle={payload.message[:200]} '
        f'page={payload.href[:200]} '
        f'ua={(payload.userAgent or "")[:120]}'
    )
    return {'ok': True}
