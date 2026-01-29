from fastapi import APIRouter, Query

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.mapalab_repository import MapalabRepository
from app.services import (GeoServerService, SearchCacheService, SearchService)
from app.schemas import ( MetadataResponse, SearchResponse)
from app.utils.api_responses import api_responses
from app.utils.logger import Logger
from app.consts import CACHE_FILE

router = APIRouter(prefix="/metadata", tags=["Metadata"])

@router.get("/", response_model=list[MetadataResponse], responses=api_responses(404, 500))
def get_metadata(
    workspace: str = Query(description="Nombre del workspace de GeoServer (p. ej. mapalab)"),
    layer: str = Query(description="Nombre de la capa dentro del workspace (p. ej. capa_anual)"),
):
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)

    with conn.get_session() as session:
        results = MapalabRepository.get_metadata(
            session=session,
            workspace=workspace,
            layer=layer,
        )

    metadata_list = []
    for record in results:
        periodicity = None
        if record.nombre_capa_db and ":" in record.nombre_capa_db:
            workspace, layer = record.nombre_capa_db.split(":", 1)
            try:
                wfs_query_url = GeoServerService.get_layer_url(
                    workspace, layer, cql_filter="",  property_name='fecha'
                )

                georserver_periodicity = GeoServerService.get_periodicity(wfs_query_url)
                periodicity = georserver_periodicity["fecha"]
            except Exception as e:
                Logger.error(f"Error fetching periodicity for {record.nombre_capa_db}: {str(e)}")

        item = MetadataResponse.model_validate(record)
        item.periodicity = periodicity
        metadata_list.append(item)

    return metadata_list

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
            "cache_file": str(CACHE_FILE.absolute())
        }
    except Exception as e:
        Logger.error(f"Error refreshing cache: {str(e)}")
        raise
