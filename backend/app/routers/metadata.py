from fastapi import APIRouter, Query

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.mapalab_repository import MapalabRepository
from app.services import GeoServerService
from app.services.periodicity import get_periodicity
from app.schemas import (MetadataResponse,  LayerResponse)
from app.utils.api_responses import api_responses
from app.utils.logger import Logger
from app.utils.clean import NanToNone

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
        if record.nombre_capa_geoserver and ":" in record.nombre_capa_geoserver:
            workspace, layer = record.nombre_capa_geoserver.split(":", 1)
            try:
                wfs_query_url = GeoServerService.get_layer_url(
                    workspace, layer, cql_filter="", property_name='fecha'
                )

                georserver_periodicity = get_periodicity(wfs_query_url)
                periodicity = georserver_periodicity["fecha"]
            except Exception as e:
                Logger.error(f"Error fetching periodicity for {record.nombre_capa_geoserver}: {str(e)}")

        numeralia = []
        for i in range(1, 7):
            valor = getattr(record, f'numeralia_0{i}_valor', None)
            nombre = getattr(record, f'numeralia_0{i}_nombre', None)

            numeralia.append({"valor": NanToNone(valor), "nombre": NanToNone(nombre)})

        layer_data = LayerResponse.model_validate(record).model_dump()
        transformed_layer_data = {key: NanToNone(value) for key, value in layer_data.items()}
        pie_numeralia = NanToNone(record.nombre_pie_numeralia)
        item = MetadataResponse(
            **transformed_layer_data,
            periodicity=periodicity,
            numeralia=numeralia,
            nombre_pie_numeralia= pie_numeralia
            )
        metadata_list.append(item)

    return metadata_list
