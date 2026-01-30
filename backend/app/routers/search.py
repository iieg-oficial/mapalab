

from fastapi import APIRouter, Query

from app.services import SearchCacheService, SearchService
from app.schemas import SearchResponse
from app.utils.logger import Logger
from app.consts import CACHE_FILE

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/", response_model=SearchResponse)
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
