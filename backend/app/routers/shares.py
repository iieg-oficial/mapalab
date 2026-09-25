import hmac
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.share_repository import ShareRepository
from app.services.layer_tree_service import get_cached_state
from app.services.share_service import (
    CURRENT_SCHEMA_VERSION,
    hash_id,
    hash_ip,
    validar_capas_en_catalogo,
    validate_payload,
)
from app.utils.api_responses import api_responses
from app.utils.client_ip import get_client_ip
from app.utils.logger import Logger
from app.utils.rate_limiter import RateLimiter


router = APIRouter(prefix='/shares', tags=['Shares'])


PIN_DURATION_DAYS = 365
PERMANENT_SENTINEL = datetime(9999, 12, 31)


def _require_internal_token(x_internal_token: Optional[str] = Header(default=None, alias='X-Internal-Token')) -> None:
    expected = settings.MAPALAB_INTERNAL_TOKEN
    if not expected:
        raise HTTPException(status_code=503, detail='MAPALAB_INTERNAL_TOKEN no configurado')
    if not x_internal_token or not hmac.compare_digest(x_internal_token, expected):
        raise HTTPException(status_code=401, detail='Token interno inválido')


RATE_WINDOW_SECONDS = 60.0
RATE_MAX_REQUESTS = 30
RATE_DAY_SECONDS = 86400.0
RATE_DAY_MAX_REQUESTS = 3000


_create_rate_limiter = RateLimiter(RATE_MAX_REQUESTS, RATE_WINDOW_SECONDS)
_create_daily_limiter = RateLimiter(RATE_DAY_MAX_REQUESTS, RATE_DAY_SECONDS)


def _get_session() -> Session:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    return conn.get_session()


def _referencias_del_catalogo() -> set[str]:
    try:
        tree = get_cached_state().get('tree') or []
    except Exception as exc:
        Logger.warning(f'shares.catalogo_no_disponible {exc}')
        return set()
    referencias: set[str] = set()
    pila = list(tree)
    while pila:
        nodo = pila.pop()
        referencias.add(str(nodo.get('id')))
        if nodo.get('slug'):
            referencias.add(str(nodo['slug']).lower())
        referencias.update(str(alias).lower() for alias in nodo.get('aliases') or [])
        pila.extend(nodo.get('children') or [])
    return referencias


class ShareEnvelope(BaseModel):
    version: int
    kind: str
    payload: dict


class ShareCreateResponse(BaseModel):
    id: str
    kind: str
    created_at: datetime
    pinned_until: Optional[datetime] = None


class ShareReadResponse(BaseModel):
    id: str
    version: int
    kind: str
    payload: dict
    created_at: datetime
    last_accessed_at: datetime
    access_count: int
    pinned_until: Optional[datetime] = None


@router.post(
    '',
    response_model=ShareCreateResponse,
    responses=api_responses(400, 429, 500),
    operation_id='create_share',
    summary='Crea un share del estado actual del mapa',
    description=(
        "Crea un share (snapshot del estado del visor) con un `payload` validado según "
        "el `kind`. El `id` devuelto es determinístico (hash del payload + kind), así "
        "que crear dos veces el mismo estado hace upsert y no genera duplicados. "
        "Las capas deben existir en el catalogo del visor. Techo de 30 shares por minuto "
        "por IP real (`X-Real-IP` del gateway) y 3000 al dia para todo el sitio."
    ),
)
def create_share(envelope: ShareEnvelope, request: Request):
    ip = get_client_ip(request)
    ip_hash = hash_ip(ip)

    try:
        kind, payload = validate_payload(envelope.model_dump())
        conocidas = _referencias_del_catalogo()
        if conocidas:
            validar_capas_en_catalogo(kind, payload, conocidas)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not _create_rate_limiter.hit(ip or 'desconocida') or not _create_daily_limiter.hit('sitio'):
        raise HTTPException(status_code=429, detail='Se alcanzó el límite de enlaces del sitio. Intenta en un minuto.')

    share_id = hash_id(payload, kind)

    with _get_session() as session:
        share = ShareRepository.upsert(
            session=session,
            share_id=share_id,
            payload=payload,
            kind=kind,
            schema_version=CURRENT_SCHEMA_VERSION,
            created_ip_hash=ip_hash,
        )
        session.commit()

        return ShareCreateResponse(
            id=share.id,
            kind=share.kind,
            created_at=share.created_at,
            pinned_until=share.pinned_until,
        )


@router.get(
    '/{share_id}',
    response_model=ShareReadResponse,
    responses=api_responses(404, 500),
    operation_id='get_share',
    summary='Lee un share por ID',
    description=(
        "Devuelve el envelope completo del share (`version`, `kind`, `payload`) junto "
        "con metadatos de uso (`created_at`, `last_accessed_at`, `access_count`, "
        "`pinned_until`). Incrementa el contador de accesos. 404 si no existe o expiró."
    ),
)
def get_share(share_id: str):
    with _get_session() as session:
        share = ShareRepository.get(session, share_id)
        if share is None:
            raise HTTPException(status_code=404, detail='Share no existe o expiro')
        ShareRepository.bump_access(session, share)
        session.commit()

        return ShareReadResponse(
            id=share.id,
            version=share.schema_version,
            kind=share.kind,
            payload=share.payload,
            created_at=share.created_at,
            last_accessed_at=share.last_accessed_at,
            access_count=share.access_count,
            pinned_until=share.pinned_until,
        )


@router.post(
    '/{share_id}/pin',
    responses=api_responses(404, 500),
    operation_id='pin_share',
    summary='Fija un share por 365 días',
    description=(
        "Extiende la vigencia del share por 365 días a partir de ahora. No requiere "
        "autenticación. Devuelve `{ok, pinnedUntil}`."
    ),
)
def pin_share(share_id: str):
    with _get_session() as session:
        share = ShareRepository.get(session, share_id)
        if share is None:
            raise HTTPException(status_code=404, detail='Share no existe o expiro')
        if share.pinned_until is not None and share.pinned_until.year >= PERMANENT_SENTINEL.year:
            return {'ok': True, 'pinnedUntil': PERMANENT_SENTINEL.isoformat() + 'Z', 'permanent': True}
        until = datetime.utcnow() + timedelta(days=PIN_DURATION_DAYS)
        ShareRepository.pin(session, share, until)
        session.commit()

        return {'ok': True, 'pinnedUntil': until.isoformat() + 'Z'}


@router.delete(
    '/{share_id}/pin',
    status_code=204,
    responses=api_responses(401, 404, 500),
    dependencies=[Depends(_require_internal_token)],
    operation_id='unpin_share',
    summary='Quita el pin de un share (token interno)',
    description=(
        "Quita el pin de un share, devolviéndolo a su vigencia base. Requiere "
        "`X-Internal-Token`: solo mariachi despinea."
    ),
)
def unpin_share(share_id: str):
    with _get_session() as session:
        share = ShareRepository.get(session, share_id)
        if share is None:
            raise HTTPException(status_code=404, detail='Share no existe o expiro')
        ShareRepository.unpin(session, share)
        session.commit()
        return None


@router.post(
    '/{share_id}/pin-permanent',
    responses=api_responses(401, 404, 500),
    dependencies=[Depends(_require_internal_token)],
    operation_id='pin_share_permanent',
    summary='Fija un share de forma permanente (token interno)',
    description=(
        "Marca el share como permanente (`pinned_until = 9999-12-31`). Requiere "
        "`X-Internal-Token`. Solo se puede despinear con el mismo token."
    ),
)
def pin_share_permanent(share_id: str):
    with _get_session() as session:
        share = ShareRepository.get(session, share_id)
        if share is None:
            raise HTTPException(status_code=404, detail='Share no existe o expiro')
        ShareRepository.pin(session, share, PERMANENT_SENTINEL)
        session.commit()

        return {'ok': True, 'pinnedUntil': PERMANENT_SENTINEL.isoformat() + 'Z', 'permanent': True}
