from __future__ import annotations

from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool

from app.config import settings
from app.routers.sesion import usuario_actual
from app.services import acceso_capas, arbol_privado
from app.services.embed_wms_params import WMS_ALLOWED_PARAMS, known_workspaces, split_layers
from app.utils.api_responses import api_responses
from app.utils.logger import Logger

router = APIRouter(prefix='/privado', tags=['Capas privadas'])

_TIMEOUT = 120
_WFS_PARAMS = {
    'service', 'version', 'request', 'typename', 'typenames', 'outputformat', 'srsname', 'bbox',
    'cql_filter', 'filter', 'propertyname', 'count', 'maxfeatures', 'startindex', 'sortby',
    'resulttype', 'exceptions', 'format_options',
}
_PEDIDOS = {
    'wms': {'getmap', 'getfeatureinfo', 'getlegendgraphic'},
    'wfs': {'getfeature', 'describefeaturetype'},
}


def _limpiar(request: Request, permitidos: set[str]) -> dict[str, str]:
    limpio: dict[str, str] = {}
    for clave, valor in request.query_params.multi_items():
        nombre = clave.lower()
        if nombre not in permitidos:
            continue
        if nombre in limpio:
            raise HTTPException(status_code=400, detail=f"El parámetro '{nombre}' viene repetido")
        limpio[nombre] = valor
    return limpio


def _capas_pedidas(servicio: str, limpio: dict[str, str]) -> list[str]:
    if servicio == 'wms':
        return split_layers(limpio.get('layers')) + split_layers(limpio.get('query_layers')) + split_layers(limpio.get('layer'))
    return split_layers(limpio.get('typenames') or limpio.get('typename'))


def _autorizar(nombres: list[str], workspace: Optional[str], usuario_id: int) -> None:
    if not nombres:
        raise HTTPException(status_code=400, detail='Falta la capa')
    for nombre in nombres:
        completo = nombre if ':' in nombre or not workspace else f'{workspace}:{nombre}'
        nodos = arbol_privado.capa_por_nombre_geoserver(completo)
        if not any(acceso_capas.es_privada(n) and acceso_capas.puede_ver(n, usuario_id) for n in nodos):
            raise HTTPException(status_code=403, detail=f"No tienes acceso a la capa '{completo}'")


def _reenviar(destino: str) -> httpx.Response:
    auth = (settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD) if settings.GEOSERVER_USER else None
    with httpx.Client(timeout=_TIMEOUT, verify=settings.GEOSERVER_VERIFY_SSL) as client:
        return client.get(destino, auth=auth)


async def _proxy(request: Request, servicio: str, workspace: Optional[str]) -> Response:
    usuario = usuario_actual(request)
    if usuario is None:
        raise HTTPException(status_code=401, detail='Inicia sesión para ver esta capa')
    if not settings.GEOSERVER_URL:
        raise HTTPException(status_code=503, detail='El servicio de mapas no está disponible en este momento')
    if workspace is not None and workspace not in await run_in_threadpool(known_workspaces):
        raise HTTPException(status_code=404, detail='Espacio de trabajo desconocido')

    limpio = _limpiar(request, (WMS_ALLOWED_PARAMS | {'layer', 'legend_options', 'scale', 'rule'}) if servicio == 'wms' else _WFS_PARAMS)
    pedido = (limpio.get('request') or '').lower()
    if pedido not in _PEDIDOS[servicio]:
        raise HTTPException(status_code=400, detail='Operación no permitida')
    await run_in_threadpool(_autorizar, _capas_pedidas(servicio, limpio), workspace, usuario['uid'])

    base = settings.GEOSERVER_URL.rstrip('/')
    ruta = f'{workspace}/{servicio}' if workspace else servicio
    try:
        upstream = await run_in_threadpool(_reenviar, f'{base}/{ruta}?{urlencode(limpio)}')
    except httpx.RequestError as exc:
        Logger.error(f'privado.proxy.upstream_error {exc}')
        raise HTTPException(status_code=502, detail='El servidor de mapas no respondió. Intenta de nuevo en unos segundos.')

    cabeceras = {'Cache-Control': 'private, no-store'}
    disposicion = upstream.headers.get('content-disposition')
    if disposicion:
        cabeceras['Content-Disposition'] = disposicion
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get('content-type', 'application/octet-stream'),
        headers=cabeceras,
    )


@router.get('/{workspace}/wms', responses=api_responses(400, 403, 500))
async def wms_workspace(request: Request, workspace: str):
    return await _proxy(request, 'wms', workspace)


@router.get('/{workspace}/wfs', responses=api_responses(400, 403, 500))
async def wfs_workspace(request: Request, workspace: str):
    return await _proxy(request, 'wfs', workspace)


@router.get('/wfs', responses=api_responses(400, 403, 500))
async def wfs_global(request: Request):
    return await _proxy(request, 'wfs', None)
