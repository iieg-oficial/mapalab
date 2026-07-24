from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth.internal_token import require_internal_token
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
    '/instituciones',
    responses=api_responses(500),
    summary='Instituciones del catálogo',
    description=(
        'Instituciones que agrupan las capas del catálogo, ordenadas como se muestran '
        'en la vista pública. Solo incluye instituciones con al menos una capa habilitada.'
    ),
)
def list_instituciones(response: Response):
    response.headers['Cache-Control'] = _CACHE_CONTROL
    return catalogo_service.get_instituciones()


@router.post(
    '/invalidate-cache',
    responses=api_responses(401, 500),
    dependencies=[Depends(require_internal_token)],
    summary='Invalida la cache en memoria del catálogo (token interno)',
    description=(
        'Vacía la cache de capas e instituciones del catálogo en el proceso actual, para '
        'que un alta o edición hecha en mariachi se vea sin esperar los 5 minutos del TTL. '
        'Requiere `X-Internal-Token`.'
    ),
)
def invalidate_cache_endpoint():
    catalogo_service.invalidate_cache()
    return {'ok': True}


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
