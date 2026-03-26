from fastapi import APIRouter, Query

from app.services.periodicity_service import PeriodicityService
from app.utils.api_responses import api_responses

router = APIRouter(prefix="/periodicity", tags=["Periodicity"])


@router.get("/", responses=api_responses(404, 500))
def get_periodicity(
    workspace: str = Query(description="Nombre del workspace de GeoServer"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
):
    result = PeriodicityService.get_periodicity(workspace, layer)
    return {"periodicity": result}


@router.get("/batch", responses=api_responses(404, 500))
def get_periodicities_batch(
    layers: str = Query(description="Capas separadas por coma en formato workspace:layer"),
):
    layer_keys = list(dict.fromkeys(l.strip() for l in layers.split(",") if l.strip()))
    return PeriodicityService.get_periodicities_batch(layer_keys)
