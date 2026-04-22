from fastapi import APIRouter, Query

from app.schemas import (MetadataResponse, LayerSourceResponse)
from app.services import layer_metadata_service
from app.utils.api_responses import api_responses
from app.config import settings
from app.utils.logger import Logger

router = APIRouter(prefix="/metadata", tags=["Metadata"])


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
