import re
from time import monotonic
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.schemas import (MetadataResponse, LayerSourceResponse)
from app.services import columnas_service, layer_metadata_service
from app.utils.api_responses import api_responses
from app.config import settings
from app.exceptions.common_exceptions import BadRequestException
from app.utils.logger import Logger

router = APIRouter(prefix="/metadata", tags=["Metadata"])

_DB_STATS_TTL_SECONDS = 3600
_db_stats_cache: dict = {"value": None, "expires_at": 0.0}
_CLAVE_PATTERN = re.compile(r"^\d{5}$")
_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_MUNICIPIOS = 125


def _parse_claves(municipio: Optional[str]) -> list[str]:
    if not municipio:
        return []
    claves = [c.strip() for c in municipio.split(",") if c.strip()]
    if len(claves) > MAX_MUNICIPIOS:
        raise BadRequestException(f"municipio admite hasta {MAX_MUNICIPIOS} claves")
    for clave in claves:
        if not _CLAVE_PATTERN.match(clave):
            raise BadRequestException(f"clave de municipio invalida: '{clave}' (5 digitos)")
    return sorted(set(claves))


def _validate_fecha(value: Optional[str], label: str) -> None:
    if value and not _DATE_PATTERN.match(value):
        raise BadRequestException(f"{label} debe tener formato YYYY-MM-DD")


def _acervo_base() -> str:
    return settings.ACERVO_PUBLIC_URL.rstrip("/") if settings.ACERVO_PUBLIC_URL else ""


@router.get(
    "/sources",
    response_model=list[LayerSourceResponse],
    responses=api_responses(404, 500),
    operation_id="get_sources_batch",
    summary="Fuentes (origen y atribución) de varias capas en lote",
    description=(
        "Devuelve las fuentes (organismo, año, URL) de múltiples capas identificadas "
        "como 'workspace:layer' separadas por coma. Útil para construir la atribución "
        "de varias capas activas en una sola llamada en lugar de ir una por una a /metadata."
    ),
)
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


@router.get(
    "/",
    response_model=list[MetadataResponse],
    responses=api_responses(404, 500),
    operation_id="get_metadata",
    summary="Metadata completa de una capa",
    description=(
        "Devuelve la metadata completa de una capa: descripción, metodología, fuentes, "
        "periodicidad, flag de descargable y URLs de los archivos de metadatos en Acervo "
        "(TXT/XLSX). Identifica la capa por workspace + layer; usa el alias corto del "
        "workspace (p. ej. 'seguridad', no 'seguridad_y_proteccion_ciudadana')."
    ),
)
def get_metadata(
    workspace: str = Query(description="Alias del workspace (p. ej. seguridad)"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
    municipio: Optional[str] = Query(
        default=None,
        description="Claves INEGI de 5 digitos separadas por coma; recalcula la numeralia para esos municipios",
    ),
    fecha_inicio: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
):
    claves = _parse_claves(municipio)
    _validate_fecha(fecha_inicio, "fecha_inicio")
    _validate_fecha(fecha_fin, "fecha_fin")

    context = None
    if claves or fecha_inicio or fecha_fin:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            context = layer_metadata_service.build_stats_context(
                session, claves, fecha_inicio, fecha_fin
            )

    modern = layer_metadata_service.get_metadata_response(
        workspace, layer, _acervo_base(), context
    )
    if modern:
        return [MetadataResponse(**modern)]
    return []


class FiltroPersonalizado(BaseModel):
    field: str = Field(description="Columna del catálogo de la capa")
    op: str = Field(description="eq, in, gte, lte, between o is_not_null")
    value: Any = Field(default=None, description="Valor o lista de valores")


class DefinicionPersonalizada(BaseModel):
    operation: str = Field(description="count, count_distinct, sum, avg, min o max")
    field: Optional[str] = Field(default=None, description="Columna sobre la que opera")
    label: Optional[str] = Field(default=None, max_length=60)
    symbol: Optional[str] = Field(default=None, max_length=8)
    filters: list[FiltroPersonalizado] = Field(default_factory=list, max_length=6)


@router.get(
    "/campos",
    responses=api_responses(404, 500),
    operation_id="get_layer_fields",
    summary="Columnas y valores que el visor puede ofrecer para armar una estadística",
    description=(
        "Devuelve las columnas filtrables de la tabla que respalda la capa, con sus valores "
        "cuando son pocos (hasta 50 distintos). Las columnas de alta cardinalidad se omiten "
        "a propósito: no sirven para un selector. El esquema y la tabla salen de la "
        "configuración de la capa, nunca del cliente."
    ),
)
def get_layer_fields(
    workspace: str = Query(description="Alias del workspace (p. ej. educacion)"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
):
    catalogo = layer_metadata_service.get_catalogo_response(workspace, layer)
    if not catalogo:
        raise HTTPException(status_code=404, detail="La capa no tiene estadisticas dinamicas")
    return catalogo


@router.get(
    "/columnas",
    responses=api_responses(404, 500),
    operation_id="get_layer_columns_config",
    summary="Alias y orden de las columnas en la tabla de atributos",
    description=(
        "Devuelve la configuracion de presentacion de las columnas de una capa: alias, "
        "orden, visibilidad y formato. El WFS entrega los nombres crudos de la base "
        "(`cve_mun`, `p_total`), y esta tabla es lo que los vuelve legibles. Una capa sin "
        "configurar responde con la lista vacia: la tabla del visor la muestra igual, con "
        "los nombres crudos en el orden del WFS."
    ),
)
def get_layer_columns_config(
    workspace: str = Query(description="Alias del workspace (p. ej. educacion)"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
):
    configuracion = columnas_service.get_columnas_response(workspace, layer)
    if configuracion is None:
        raise HTTPException(status_code=404, detail="La capa no existe")
    return configuracion


@router.post(
    "/personalizada",
    responses=api_responses(400, 404, 500),
    operation_id="compute_custom_stat",
    summary="Calcula una estadística armada en el visor",
    description=(
        "Evalúa una definición armada con el catálogo de `/metadata/campos`. La operación, "
        "las columnas y los operadores se validan contra ese catálogo, los valores viajan "
        "como parámetros ligados y la tabla la resuelve el servidor a partir de la capa: el "
        "cliente no puede apuntar a otra. Devuelve el valor y su receta, igual que las "
        "estadísticas configuradas."
    ),
)
def compute_custom_stat(
    definicion: DefinicionPersonalizada,
    workspace: str = Query(description="Alias del workspace (p. ej. educacion)"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
    municipio: Optional[str] = Query(default=None, description="Claves INEGI separadas por coma"),
    fecha_inicio: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
):
    claves = _parse_claves(municipio)
    _validate_fecha(fecha_inicio, "fecha_inicio")
    _validate_fecha(fecha_fin, "fecha_fin")

    context = None
    if claves or fecha_inicio or fecha_fin:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            context = layer_metadata_service.build_stats_context(
                session, claves, fecha_inicio, fecha_fin
            )

    resultado = layer_metadata_service.get_personalizada_response(
        workspace, layer, definicion.model_dump(), context
    )
    if not resultado:
        raise HTTPException(status_code=400, detail="La definicion no es valida para esta capa")
    return resultado


@router.get(
    "/ranking",
    responses=api_responses(404, 500),
    operation_id="get_layer_ranking",
    summary="Numeralia de una capa agrupada por municipio",
    description=(
        "Devuelve, para cada municipio con datos en la capa, el valor de cada slot de la "
        "numeralia que sea agrupable (count, count_where, count_distinct y sum). Es una "
        "consulta con GROUP BY por capa, no 125 consultas sueltas. El filtro de municipio "
        "de la configuración se ignora a propósito: aquí el municipio es la llave de "
        "agrupación. Devuelve 404 si la capa no tiene estadísticas dinámicas."
    ),
)
def get_layer_ranking(
    workspace: str = Query(description="Alias del workspace (p. ej. educacion)"),
    layer: str = Query(description="Nombre de la capa dentro del workspace"),
    fecha_inicio: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
):
    _validate_fecha(fecha_inicio, "fecha_inicio")
    _validate_fecha(fecha_fin, "fecha_fin")

    context = None
    if fecha_inicio or fecha_fin:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            context = layer_metadata_service.build_stats_context(
                session, [], fecha_inicio, fecha_fin
            )

    ranking = layer_metadata_service.get_ranking_response(workspace, layer, context)
    if not ranking:
        raise HTTPException(status_code=404, detail="La capa no tiene estadisticas agrupables")
    return ranking


@router.get(
    "/database-stats",
    responses=api_responses(500),
    operation_id="get_database_stats",
    summary="Conteo total de registros en la base del visor",
    description=(
        "Devuelve el conteo total de registros vivos en todas las tablas del schema "
        "mapalab (suma de `n_live_tup` de pg_stat_user_tables). Cache de 1 hora. "
        "Útil para mostrar 'X millones de datos' en la home y como verificación rápida "
        "de salud de la base."
    ),
)
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
