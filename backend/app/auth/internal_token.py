from typing import Optional

from fastapi import Header, HTTPException

from app.config import settings


def require_internal_token(
    x_internal_token: Optional[str] = Header(default=None, alias='X-Internal-Token'),
) -> None:
    expected = settings.MAPALAB_INTERNAL_TOKEN
    if not expected:
        raise HTTPException(status_code=503, detail='MAPALAB_INTERNAL_TOKEN no configurado')
    if not x_internal_token or x_internal_token != expected:
        raise HTTPException(status_code=401, detail='Token interno inválido')
