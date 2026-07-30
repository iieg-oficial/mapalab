from __future__ import annotations

from typing import Optional
from urllib.parse import urlencode, urlparse

import httpx
from fastapi import APIRouter, Body, Header, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field

from app.config import settings
from app.metrics import (
    COUNTER_EMBED_DENIED,
    COUNTER_EMBED_JS_ERRORS,
    COUNTER_EMBED_QUOTA_EXCEEDED,
    COUNTER_EMBED_REQUESTS,
    incr,
)
from app.services.access_logger import get_logger as get_access_logger
from app.services.api_key_quota import get_tracker
from app.services.api_key_validator import (
    ValidationResult,
    invalidate_cache_for_prefix,
    validate_api_key,
)
from app.services.layer_tree_service import get_cached_state
from app.utils.api_responses import api_responses
from app.utils.logger import Logger

router = APIRouter(prefix='/embed', tags=['Embed'])

_WMS_PROXY_TIMEOUT = 30.0
_WMS_ALLOWED_PARAMS = {
    'service', 'version', 'request', 'layers', 'styles', 'format',
    'transparent', 'srs', 'crs', 'bbox', 'width', 'height', 'tiled',
    'cql_filter', 'time', 'query_layers', 'info_format', 'feature_count',
    'x', 'y', 'i', 'j', 'env', 'sld', 'sld_body', 'exceptions',
}


def _extract_request_origin(request: Request) -> Optional[str]:
    origin = request.headers.get('origin')
    if origin and origin.lower() != 'null':
        return origin
    referer = request.headers.get('referer')
    if not referer:
        return None
    try:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        pass
    return None


def _extract_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get('x-forwarded-for')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.client.host if request.client else None


def _frame_ancestors_value(allowed_domains: Optional[list[str]]) -> str:
    """Construye el header frame-ancestors a partir de la allowlist de la key.

    Si la key no tiene allowlist (None) se cae a `*` para preservar compatibilidad.
    Si tiene allowlist vacía o con valores válidos, se serializan; los wildcards
    *.dependencia.gob.mx se traducen a https://*.dependencia.gob.mx para CSP.
    También se incluye 'self' para que el visor pueda ser cargado desde su propio
    host (página /mapa, admin de IIEG, etc.).
    """
    if allowed_domains is None:
        return "frame-ancestors *"
    sources: list[str] = ["'self'"]
    for raw in allowed_domains:
        if not raw:
            continue
        domain = raw.strip()
        if not domain:
            continue
        if domain == '*':
            return "frame-ancestors *"
        if '://' not in domain:
            if domain.startswith('*.'):
                domain = f"https://{domain}"
            else:
                domain = f"https://{domain}"
        sources.append(domain.rstrip('/'))
    return f"frame-ancestors {' '.join(sources)}"


def _set_response_headers(
    response: Response,
    origin: Optional[str],
    allowed_domains: Optional[list[str]] = None,
) -> None:
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Content-Security-Policy'] = _frame_ancestors_value(allowed_domains)
    response.headers['Cache-Control'] = 'no-store'


def _validate_or_403(
    request: Request,
    key: str,
    endpoint: str,
    requested_layers: Optional[list[str]] = None,
    record_quota: bool = True,
) -> ValidationResult:
    origin = _extract_request_origin(request)
    ip = _extract_client_ip(request)
    result = validate_api_key(key, origin=origin, ip=ip, requested_layers=requested_layers or [])
    prefix = key[:12] if key else ''
    access_logger = get_access_logger()
    request_id = request.headers.get('x-request-id')
    if not result.valid:
        incr(COUNTER_EMBED_DENIED, {'endpoint': endpoint, 'reason': result.reason or 'unknown'})
        Logger.warning(
            f"embed.validate.denied reason={result.reason} origin={origin} prefix={prefix}"
        )
        access_logger.record(
            api_key_id=result.key_id,
            endpoint=endpoint,
            resultado='denied',
            motivo=result.reason,
            origin=origin,
            ip=ip,
            layers=requested_layers,
            request_id=request_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"La llave no es válida o no está autorizada para este sitio ({result.reason or 'motivo no especificado'})",
        )

    tracker = get_tracker()
    if result.key_id is not None and not tracker.can_consume(
        result.key_id, result.cuota_diaria, result.cuota_mensual
    ):
        incr(COUNTER_EMBED_QUOTA_EXCEEDED, {'prefix': prefix})
        access_logger.record(
            api_key_id=result.key_id,
            endpoint=endpoint,
            resultado='quota_exceeded',
            motivo='daily_or_monthly_quota',
            origin=origin,
            ip=ip,
            layers=requested_layers,
            request_id=request_id,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Esta llave alcanzó su límite de peticiones (por día o por mes). Intenta más tarde.",
        )
    if record_quota and result.key_id is not None:
        tracker.record(result.key_id)
    incr(COUNTER_EMBED_REQUESTS, {'endpoint': endpoint, 'prefix': prefix})
    access_logger.record(
        api_key_id=result.key_id,
        endpoint=endpoint,
        resultado='allowed',
        origin=origin,
        ip=ip,
        layers=requested_layers,
        request_id=request_id,
    )
    return result


def _filter_tree(tree: list[dict], allowed: set[str]) -> list[dict]:
    if not allowed:
        return tree
    filtered: list[dict] = []
    for node in tree:
        children = node.get('children') or []
        sub = _filter_tree(children, allowed) if children else []
        wms_cfg = node.get('wmsConfig')
        if wms_cfg:
            layer_name = wms_cfg.get('geoserverLayer') or wms_cfg.get('layers') or ''
            workspace = wms_cfg.get('geoserverWorkspace') or wms_cfg.get('workspace') or ''
            layer_id = f"{workspace}:{layer_name}" if workspace and layer_name else node.get('id')
            if layer_id in allowed or node.get('id') in allowed:
                filtered.append({**node, 'children': sub} if sub else node)
                continue
        if sub:
            filtered.append({**node, 'children': sub})
    return filtered


@router.get('/config', responses=api_responses(403, 429, 500))
def get_embed_config(
    request: Request,
    response: Response,
    key: str = Query(min_length=8, max_length=120),
):
    requested_layers: list[str] = []
    layers_param = request.query_params.get('layers')
    if layers_param:
        requested_layers = [s.strip() for s in layers_param.split(',') if s.strip()]
    result = _validate_or_403(request, key, 'config', requested_layers)
    origin = _extract_request_origin(request)
    _set_response_headers(response, origin, result.dominios_permitidos)
    return {
        'institucion': result.institucion_nombre,
        'visibility': result.visibility,
        'capasPermitidas': result.capas_permitidas,
        'dominiosPermitidos': result.dominios_permitidos,
        'cuotaDiaria': result.cuota_diaria,
        'cuotaMensual': result.cuota_mensual,
        'requestedLayers': requested_layers,
    }


@router.get('/layers/tree', responses=api_responses(403, 429, 500))
def get_embed_tree(
    request: Request,
    response: Response,
    key: str = Query(min_length=8, max_length=120),
):
    result = _validate_or_403(request, key, 'tree')
    state = get_cached_state()
    tree = state['tree']
    if result.capas_permitidas:
        tree = _filter_tree(tree, set(result.capas_permitidas))
    origin = _extract_request_origin(request)
    _set_response_headers(response, origin, result.dominios_permitidos)
    return {'tree': tree, 'etag': state['etag']}


@router.get('/wms-proxy', responses=api_responses(403, 429, 500))
def wms_proxy(
    request: Request,
    response: Response,
    key: str = Query(min_length=8, max_length=120),
):
    if not settings.GEOSERVER_URL:
        raise HTTPException(status_code=503, detail='El servicio de mapas no está disponible en este momento')

    params = dict(request.query_params)
    params.pop('key', None)

    layers_param = params.get('layers') or params.get('LAYERS') or ''
    requested = [s.strip() for s in layers_param.split(',') if s.strip()]
    result = _validate_or_403(request, key, 'wms', requested_layers=requested, record_quota=False)

    if result.capas_permitidas:
        allowed = set(result.capas_permitidas)
        for layer in requested:
            if layer not in allowed:
                raise HTTPException(
                    status_code=403,
                    detail=f"La capa '{layer}' no está autorizada para esta llave",
                )

    clean = {k: v for k, v in params.items() if k.lower() in _WMS_ALLOWED_PARAMS}
    workspace = ''
    layer_first = (params.get('layers') or params.get('LAYERS') or '').split(',')[0].strip()
    if ':' in layer_first:
        workspace = layer_first.split(':', 1)[0]
    base = settings.GEOSERVER_URL.rstrip('/')
    target = f"{base}/{workspace}/wms?{urlencode(clean)}" if workspace else f"{base}/wms?{urlencode(clean)}"

    try:
        with httpx.Client(timeout=_WMS_PROXY_TIMEOUT) as client:
            upstream = client.get(target)
    except httpx.RequestError as exc:
        Logger.error(f"embed.wms_proxy.upstream_error {exc}")
        raise HTTPException(status_code=502, detail='El servidor de mapas no respondió. Intenta de nuevo en unos segundos.')

    if result.key_id is not None:
        get_tracker().record(
            result.key_id,
            error=upstream.status_code >= 400,
            bytes_out=len(upstream.content or b''),
        )

    origin = _extract_request_origin(request)
    headers = {
        'Cache-Control': 'public, max-age=300',
        'Content-Security-Policy': "frame-ancestors *",
    }
    if origin:
        headers['Access-Control-Allow-Origin'] = origin
        headers['Vary'] = 'Origin'
    content_type = upstream.headers.get('content-type', 'application/octet-stream')
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=content_type,
        headers=headers,
    )


class _TelemetryVital(BaseModel):
    name: str = Field(..., max_length=20)
    value: float = Field(..., ge=0, le=600000)


class _TelemetryError(BaseModel):
    message: str = Field(..., max_length=400)
    source: str | None = Field(default=None, max_length=200)


class _TelemetryPayload(BaseModel):
    vitals: list[_TelemetryVital] = Field(default_factory=list)
    errors: list[_TelemetryError] = Field(default_factory=list)


@router.post('/telemetry', responses=api_responses(403, 429, 500))
def post_telemetry(
    request: Request,
    response: Response,
    key: str = Query(min_length=8, max_length=120),
    payload: _TelemetryPayload = Body(...),
):
    result = _validate_or_403(request, key, 'telemetry', record_quota=False)
    origin = _extract_request_origin(request)
    _set_response_headers(response, origin, result.dominios_permitidos)
    prefix = key[:12] if key else ''
    for err in payload.errors[:5]:
        incr(COUNTER_EMBED_JS_ERRORS, {'prefix': prefix})
        Logger.warning(f"embed.telemetry.js_error prefix={prefix} msg={(err.message or '')[:120]}")
    return {'ok': True}


@router.post('/cache/invalidate', responses=api_responses(403, 500))
def invalidate_cache(
    key_prefix: str = Query(min_length=4, max_length=20),
    x_internal_token: Optional[str] = Header(default=None, alias='X-Internal-Token'),
):
    expected = settings.MAPALAB_INTERNAL_TOKEN
    if not expected:
        raise HTTPException(status_code=503, detail='MAPALAB_INTERNAL_TOKEN no configurado')
    if not x_internal_token or x_internal_token != expected:
        raise HTTPException(status_code=401, detail='Token interno inválido')
    removed = invalidate_cache_for_prefix(key_prefix)
    return {'ok': True, 'removed': removed}
