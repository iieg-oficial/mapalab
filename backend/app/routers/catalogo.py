from fastapi import APIRouter, HTTPException, Response

from app.services import catalogo_service
from app.utils.api_responses import api_responses

router = APIRouter(prefix='/catalogo', tags=['Catalogo'])

_CACHE_CONTROL = 'public, max-age=300'


@router.get(
    '/capas',
    responses=api_responses(500),
    summary='Capas del catálogo habilitadas',
    description=(
        'Lista plana de capas del catálogo (`enabled=true` y no borradas) para la '
        'vista /catalogo del visor. Cada capa incluye `geoserverWorkspace` resuelto '
        'para armar las peticiones WMS/WFS.'
    ),
)
def list_capas(response: Response):
    response.headers['Cache-Control'] = _CACHE_CONTROL
    return catalogo_service.get_capas()


@router.get(
    '/capas/{slug}',
    responses=api_responses(404, 500),
    summary='Capa del catálogo por slug',
    description='Devuelve una capa del catálogo por su slug (carga directa vía URL).',
)
def get_capa(slug: str, response: Response):
    capa = catalogo_service.get_capa_by_slug(slug)
    if capa is None:
        raise HTTPException(status_code=404, detail=f"No existe capa de catálogo '{slug}'")
    response.headers['Cache-Control'] = _CACHE_CONTROL
    return capa
