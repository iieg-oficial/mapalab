import re
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.consts.databases import DatabaseType
from app.consts.workspaces import resolve_schema
from app.databases.factory import DatabaseFactory
from app.exceptions.common_exceptions import NotFoundException, BadRequestException
from app.repositories.download_repository import DownloadRepository
from app.utils.api_responses import api_responses
from app.utils.logger import Logger

router = APIRouter(prefix='/download', tags=['Download'])


def _resolve_layer(session, workspace: str, layer: str) -> tuple[Optional[str], Optional[str]]:
    geoserver_key = f'{resolve_schema(workspace)}:{layer}'
    resolved = DownloadRepository.resolve_db_name(session, geoserver_key)
    if resolved:
        schema, table = resolved
        if DownloadRepository.validate_table_exists(session, schema, table):
            return schema, table

    schema = resolve_schema(workspace)
    if DownloadRepository.validate_table_exists(session, schema, layer):
        return schema, layer

    return None, None


def _csv_generator(schema: str, table: str, date_from: Optional[str], date_to: Optional[str]):
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    session = conn.SessionLocal()
    try:
        yield from DownloadRepository.stream_csv(session, schema, table, date_from, date_to)
    except Exception as e:
        Logger.error(f'Error streaming CSV for {schema}.{table}: {str(e)}')
        raise
    finally:
        session.close()


@router.get(
    '/{workspace}/{layer}',
    responses=api_responses(400, 404, 500),
)
def download_layer(
    workspace: str,
    layer: str,
    date_from: Optional[str] = Query(default=None, description='Fecha inicio (YYYY-MM-DD)'),
    date_to: Optional[str] = Query(default=None, description='Fecha fin (YYYY-MM-DD)'),
):
    date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
    if date_from and not date_pattern.match(date_from):
        raise BadRequestException('date_from debe tener formato YYYY-MM-DD')
    if date_to and not date_pattern.match(date_to):
        raise BadRequestException('date_to debe tener formato YYYY-MM-DD')

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        schema, table = _resolve_layer(session, workspace, layer)
        if not schema:
            raise NotFoundException(f'Capa {workspace}:{layer} no encontrada')

    filename = f'{table}.csv'
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Access-Control-Expose-Headers': 'Content-Disposition',
    }

    return StreamingResponse(
        _csv_generator(schema, table, date_from, date_to),
        media_type='text/csv; charset=utf-8',
        headers=headers,
    )
