import re
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.config import settings
from app.consts.databases import DatabaseType
from app.consts.workspaces import resolve_schema
from app.databases.async_pool import get_pool
from app.databases.factory import DatabaseFactory
from app.exceptions.common_exceptions import NotFoundException, BadRequestException
from app.metrics import COUNTER_DOWNLOAD_REQUESTS, incr
from app.repositories.download_repository import DATE_COLUMN, DownloadRepository
from app.services.acervo_client import iter_object_body, open_object
from app.utils.api_responses import api_responses

router = APIRouter(prefix='/download', tags=['Download'])

_DATE_PATTERN = re.compile(r'^\d{4}-\d{2}-\d{2}$')


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


@router.get(
    '/{workspace}/{layer}',
    responses=api_responses(400, 404, 500),
)
async def download_layer(
    workspace: str,
    layer: str,
    date_from: Optional[str] = Query(default=None, description='Fecha inicio (YYYY-MM-DD)'),
    date_to: Optional[str] = Query(default=None, description='Fecha fin (YYYY-MM-DD)'),
):
    incr(COUNTER_DOWNLOAD_REQUESTS)
    if date_from and not _DATE_PATTERN.match(date_from):
        raise BadRequestException('date_from debe tener formato YYYY-MM-DD')
    if date_to and not _DATE_PATTERN.match(date_to):
        raise BadRequestException('date_to debe tener formato YYYY-MM-DD')

    geoserver_key = f'{resolve_schema(workspace)}:{layer}'
    has_date_filter = bool(date_from or date_to)

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        if not has_date_filter:
            object_key = DownloadRepository.find_fresh_cache(
                session, geoserver_key, settings.DOWNLOAD_CACHE_TTL_HOURS
            )
            if object_key:
                obj = open_object(object_key)
                if obj is not None:
                    _, _, table_name = geoserver_key.rpartition(':')
                    headers = {
                        'Content-Disposition': f'attachment; filename="{table_name}.csv"',
                        'Access-Control-Expose-Headers': 'Content-Disposition',
                    }
                    if object_key.endswith('.gz'):
                        headers['Content-Encoding'] = 'gzip'
                    return StreamingResponse(
                        iter_object_body(obj),
                        media_type='text/csv; charset=utf-8',
                        headers=headers,
                    )

        schema, table = _resolve_layer(session, workspace, layer)
        if not schema:
            raise NotFoundException(f'Capa {workspace}:{layer} no encontrada')

        if has_date_filter and not DownloadRepository.column_exists(
            session, schema, table, DATE_COLUMN
        ):
            raise BadRequestException(
                f'Capa {workspace}:{layer} no tiene columna "{DATE_COLUMN}", '
                'no se puede filtrar por fecha'
            )

    pool = await get_pool()
    filename = f'{table}.csv'
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Access-Control-Expose-Headers': 'Content-Disposition',
    }

    return StreamingResponse(
        DownloadRepository.stream_csv(pool, schema, table, date_from, date_to),
        media_type='text/csv; charset=utf-8',
        headers=headers,
    )
