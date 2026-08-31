from typing import Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.models.columna import ColumnaTabla
from app.services.layer_metadata_service import resolve_layer_key
from app.utils.logger import Logger


def _to_dict(fila: ColumnaTabla) -> dict:
    return {
        'columna': fila.columna,
        'alias': fila.alias,
        'orden': fila.orden,
        'visible': fila.visible,
        'formato': fila.formato,
    }


def _consultar(session: Session, layer_key: str) -> list[dict]:
    try:
        filas = (
            session.query(ColumnaTabla)
            .filter(ColumnaTabla.layer_key == layer_key)
            .order_by(ColumnaTabla.orden, ColumnaTabla.columna)
            .all()
        )
    except SQLAlchemyError:
        session.rollback()
        Logger.warning(
            'atributos.columnas no esta disponible: la capa se sirve con los nombres crudos'
        )
        return []
    return [_to_dict(fila) for fila in filas]


def get_columnas_response(workspace_alias: str, layer: str) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer_key = resolve_layer_key(session, workspace_alias, layer)
        return {'layerKey': layer_key, 'columnas': _consultar(session, layer_key)}
