from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field, ValidationError
from starlette.concurrency import run_in_threadpool

from app.routers import embed as base
from app.services.client_error_tracker import record as record_client_error
from app.services.embed_telemetria import get_agregador
from app.utils.api_responses import api_responses
from app.utils.client_ip import get_request_origin
from app.utils.logger import Logger

router = APIRouter(prefix='/embed', tags=['Embed'])

_MAX_VITALS = 10
_MAX_ERRORES = 5
_MAX_EVENTOS = 5
_METRICA_POR_VITAL = {
    'LCP': 'LCP',
    'INP': 'INP',
    'CLS': 'CLS',
    'FCP': 'FCP',
    'TTFB': 'TTFB',
    'IFRAME_READY': 'LISTO',
}


class _TelemetryVital(BaseModel):
    name: str = Field(..., max_length=20)
    value: float = Field(..., ge=0, le=600000)


class _TelemetryError(BaseModel):
    message: str = Field(..., max_length=400)
    source: str | None = Field(default=None, max_length=200)


class _TelemetryEvento(BaseModel):
    tipo: Literal['timeout', 'error']


class _TelemetryPayload(BaseModel):
    vitals: list[_TelemetryVital] = Field(default_factory=list)
    errors: list[_TelemetryError] = Field(default_factory=list)
    eventos: list[_TelemetryEvento] = Field(default_factory=list)


def _registrar_telemetria(
    request: Request,
    response: Response,
    key: str,
    payload: _TelemetryPayload,
) -> dict:
    result = base._validate_or_403(request, key, 'telemetry', record_quota=False)
    origin = get_request_origin(request)
    base._set_response_headers(response, origin, result.dominios_permitidos)
    prefix = key[:12] if key else ''
    errores = payload.errors[:_MAX_ERRORES]
    for err in errores:
        record_client_error('embed_js')
        Logger.warning(f"embed.telemetry.js_error prefix={prefix} msg={(err.message or '')[:120]}")
    if result.key_id is None:
        return {'ok': True}
    sitio = base.origen_de_telemetria(request)
    agregador = get_agregador()
    for vital in payload.vitals[:_MAX_VITALS]:
        metrica = _METRICA_POR_VITAL.get(vital.name.upper())
        if metrica is None:
            continue
        agregador.registrar_metrica(result.key_id, sitio, metrica, vital.value)
        if metrica == 'LISTO':
            agregador.sumar(result.key_id, sitio, 'listos')
    eventos = payload.eventos[:_MAX_EVENTOS]
    agregador.sumar(result.key_id, sitio, 'timeouts', sum(1 for evento in eventos if evento.tipo == 'timeout'))
    errores_js = len(errores) + sum(1 for evento in eventos if evento.tipo == 'error')
    agregador.sumar(result.key_id, sitio, 'errores_js', errores_js)
    return {'ok': True}


@router.post('/telemetry', responses=api_responses(403, 422, 429, 500))
async def post_telemetry(
    request: Request,
    response: Response,
    key: str = Query(min_length=8, max_length=120),
):
    crudo = await request.body()
    try:
        payload = _TelemetryPayload.model_validate_json(crudo or b'{}')
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors(include_url=False, include_context=False, include_input=False))
    return await run_in_threadpool(_registrar_telemetria, request, response, key, payload)
