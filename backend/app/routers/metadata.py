from time import monotonic

from fastapi import APIRouter, Query
from sqlalchemy import text

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.schemas import (MetadataResponse, LayerSourceResponse)
from app.services import layer_metadata_service
from app.utils.api_responses import api_responses
from app.config import settings
from app.utils.logger import Logger

router = APIRouter(prefix="/metadata", tags=["Metadata"])

_DB_STATS_TTL_SECONDS = 3600
_db_stats_cache: dict = {"value": None, "expires_at": 0.0}


def _acervo_base() -> str:
    return settings.ACERVO_PUBLIC_URL.rstrip("/") if settings.ACERVO_PUBLIC_URL else ""


@router.get("/sources", response_model=list[LayerSourceResponse], responses=api_responses(404, 500))
def get_sources_batch(
    layers: str = Query(description="Capas separadas por coma en formato workspace:layer"),
):
    layer_keys = list(dict.fromkeys(l.strip() for l in layers.split(",") if l.strip()))
    try:
        modern = layer_metadata_service.get_sources_batch(layer_keys)
        return [LayerSourceResponse(**r) for r in modern]
    except Exception as e:
        Logger.error(f"Error fetching sources batch: {str(e)}")
        return []


@router.get("/", response_model=list[MetadataResponse], responses=api_responses(404, 500))
def get_metadata(
    workspace: str = Query(description="Alias del workspace (p. ej. seguridad)"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
):
    modern = layer_metadata_service.get_metadata_response(workspace, layer, _acervo_base())
    if modern:
        return [MetadataResponse(**modern)]
    return []


@router.get("/database-stats", responses=api_responses(500))
def get_database_stats():
    now = monotonic()
    if _db_stats_cache["value"] is not None and now < _db_stats_cache["expires_at"]:
        return _db_stats_cache["value"]

    try:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            row = session.execute(
                text("SELECT COALESCE(SUM(n_live_tup), 0)::bigint AS total FROM pg_stat_user_tables")
            ).first()
            total = int(row.total) if row else 0
        payload = {"total_records": total}
        _db_stats_cache["value"] = payload
        _db_stats_cache["expires_at"] = now + _DB_STATS_TTL_SECONDS
        return payload
    except Exception as e:
        Logger.error(f"Error fetching database stats: {str(e)}")
        return {"total_records": 0}
