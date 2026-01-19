from fastapi import APIRouter, Query
from typing import Optional
from math import ceil

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.exceptions.common_exceptions import InternalServerException
from app.repositories.mapalab_repository import MapalabRepository
from app.services import (GeoServerService, SearchCacheService, SearchService)
from app.schemas import (LayerResponse, PaginatedResponse, PeriodicityLayer, SearchResponse)
from app.utils.api_responses import api_responses
from app.utils.logger import Logger

router = APIRouter(prefix="/mapalab", tags=["Mapalab"])

@router.get("/layers", response_model=PaginatedResponse[LayerResponse], responses=api_responses(400))
def get_layers(
    page: int = Query(default=1, ge=1, description="Número de página (comienza en 1)"),
    size: int = Query(default=50, ge=1, le=500, description="Elementos por página"),
    keyword: Optional[str] = Query(default=None, max_length=100, description="Buscar en nombre, descripción o tema"),
):
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)

    with conn.get_session() as session:
        results, total = MapalabRepository.get_layers(
            session=session,
            page=page,
            size=size,
            keyword=keyword,
        )

        layers = [LayerResponse.model_validate(layer) for layer in results]
        total_pages = ceil(total / size) if size > 0 else 0

        return PaginatedResponse(
        data=layers,
        page=page,
        total_pages=total_pages
       )

@router.get("/periodicity", response_model=PeriodicityLayer, responses=api_responses(404, 500))
def get_layer_periodicity(
    workspace: str = Query(..., description="Nombre del workspace de GeoServer (p. ej. mapalab)"),
    layer: str = Query(..., description="Nombre de la capa dentro del workspace (p. ej. capa_anual)"),
    cql_filter: Optional[str] = Query(default=None, description="Filtro CQL opcional para restringir la consulta WFS")
):
    wfs_query_url = GeoServerService.get_layer_url(
        workspace, layer, cql_filter=cql_filter, property_name='fecha'
    )

    try:
        georserver_periodicity = GeoServerService.get_periodicity(wfs_query_url)
    except Exception as e:
        Logger.error(f"Failed to fetch GeoServer metadata: {str(e)}")
        raise InternalServerException("No se pudo obtener los metadatos de la capa desde GeoServer")

    return PeriodicityLayer(
        url=wfs_query_url,
        fecha=georserver_periodicity["fecha"]
    )

@router.get("/search", response_model=SearchResponse)
async def search_layers(query: str = Query(..., description="Search query")):
    return SearchService.search(query)

@router.post("/search/refresh")
async def refresh_cache():
    try:
        cache = SearchCacheService.generate_cache()
        SearchCacheService.save_cache(cache)

        return {
            "message": "Cache regenerated successfully",
            "last_updated": cache.get("last_updated"),
            "layers_count": len(cache.get("layers", {})),
            "cache_file": str(SearchCacheService.CACHE_FILE.absolute())
        }
    except Exception as e:
        Logger.error(f"Error refreshing cache: {str(e)}")
        raise
