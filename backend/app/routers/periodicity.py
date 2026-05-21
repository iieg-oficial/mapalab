from fastapi import APIRouter, Query

from app.services.periodicity_service import PeriodicityService
from app.utils.api_responses import api_responses

router = APIRouter(prefix="/periodicity", tags=["Periodicity"])


@router.get(
    "/",
    responses=api_responses(404, 500),
    operation_id="get_periodicity",
    summary="Fechas disponibles de una capa temporal",
    description=(
        "Devuelve la estructura jerárquica `{year: {month: [day, ...]}}` con las fechas "
        "disponibles para una capa con dimensión temporal (mensual, anual, eventual). "
        "Si la capa no es temporal devuelve `{periodicity: {}}`. Los datos vienen de "
        "`public.layer_periodicity`, una tabla materializada que se refresca diariamente "
        "a las 03:00 desde el cron de dataengine-jobs."
    ),
)
def get_periodicity(
    workspace: str = Query(description="Nombre del workspace de GeoServer"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
):
    result = PeriodicityService.get_periodicity(workspace, layer)
    return {"periodicity": result}


@router.get(
    "/batch",
    responses=api_responses(404, 500),
    operation_id="get_periodicities_batch",
    summary="Periodicidad de varias capas en lote",
    description=(
        "Devuelve la estructura `{workspace:layer: {year: {month: [day, ...]}}}` con "
        "las fechas disponibles para múltiples capas, identificadas como 'workspace:layer' "
        "separadas por coma. Capas sin dimensión temporal aparecen con valor vacío."
    ),
)
def get_periodicities_batch(
    layers: str = Query(description="Capas separadas por coma en formato workspace:layer"),
):
    layer_keys = list(dict.fromkeys(l.strip() for l in layers.split(",") if l.strip()))
    return PeriodicityService.get_periodicities_batch(layer_keys)
