from fastapi import APIRouter, Query

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.mapalab_repository import MapalabRepository
from app.services import GeoServerService
from app.services.periodicity import get_periodicity
from app.services.periodicity_cache_service import PeriodicityCacheService
from app.schemas import (MetadataResponse, LayerResponse, LayerSourceResponse)
from app.utils.api_responses import api_responses
from app.config import settings
from app.utils.logger import Logger
from app.utils.clean import NanToNone

router = APIRouter(prefix="/metadata", tags=["Metadata"])

@router.get("/sources", response_model=list[LayerSourceResponse], responses=api_responses(404, 500))
def get_sources_batch(
    layers: str = Query(description="Capas separadas por coma en formato workspace:layer"),
):
    layer_keys = list(dict.fromkeys(l.strip() for l in layers.split(",") if l.strip()))
    try:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            results = MapalabRepository.get_sources_batch(session=session, layer_keys=layer_keys)
        return [
            LayerSourceResponse(
                nombre_capa_geoserver=row.nombre_capa_geoserver,
                fuentes_texto_corto=NanToNone(row.fuentes_texto_corto),
            )
            for row in results
        ]
    except Exception as e:
        Logger.error(f"Error fetching sources batch: {str(e)}")
        return []

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
        if record.nombre_capa_geoserver and ":" in record.nombre_capa_geoserver:
            cached = PeriodicityCacheService.get_periodicity(record.nombre_capa_geoserver)
            if cached:
                periodicity = cached
            else:
                ws, ln = record.nombre_capa_geoserver.split(":", 1)
                try:
                    wfs_query_url = GeoServerService.get_layer_url(
                        ws, ln, cql_filter="", property_name='fecha'
                    )
                    geoserver_periodicity = get_periodicity(wfs_query_url)
                    periodicity = geoserver_periodicity["fecha"]
                except Exception as e:
                    Logger.error(f"Error fetching periodicity for {record.nombre_capa_geoserver}: {str(e)}")

        numeralia = []
        for i in range(1, 9):
            valor = getattr(record, f'numeralia_0{i}_valor', None)
            nombre = getattr(record, f'numeralia_0{i}_nombre', None)
            simbolo = getattr(record, f'numeralia_0{i}_simbolo', None)

            numeralia.append({"valor": NanToNone(valor), "nombre": NanToNone(nombre), "simbolo": NanToNone(simbolo)})

        layer_data = LayerResponse.model_validate(record).model_dump()
        transformed_layer_data = {key: NanToNone(value) for key, value in layer_data.items()}
        pie_numeralia = NanToNone(record.nombre_pie_numeralia)

        metadato = []
        metadato_txt = NanToNone(record.metadato_txt)
        metadato_xlsx = NanToNone(record.metadato_xlsx)
        acervo_base = settings.ACERVO_PUBLIC_URL.rstrip("/") if settings.ACERVO_PUBLIC_URL else ""
        if metadato_txt:
            enlace = f"{acervo_base}/{metadato_txt.lstrip('/')}" if acervo_base else metadato_txt
            metadato.append({"nombre": "Metadato TXT", "enlace": enlace})
        if metadato_xlsx:
            enlace = f"{acervo_base}/{metadato_xlsx.lstrip('/')}" if acervo_base else metadato_xlsx
            metadato.append({"nombre": "Metadato XLSX", "enlace": enlace})

        item = MetadataResponse(
            **transformed_layer_data,
            periodicity=periodicity,
            numeralia=numeralia,
            nombre_pie_numeralia=pie_numeralia,
            metadato=metadato or None
            )
        metadata_list.append(item)

    return metadata_list
