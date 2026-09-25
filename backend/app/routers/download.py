import asyncio
import re
from typing import Any, Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.config import settings
from app.consts.databases import DatabaseType
from app.databases.async_pool import get_pool
from app.databases.factory import DatabaseFactory
from app.exceptions.common_exceptions import NotFoundException, BadRequestException
from app.repositories.download_repository import DATE_COLUMN, DownloadRepository
from app.services.acervo_client import iter_object_body, open_object
from app.utils.api_responses import api_responses

router = APIRouter(prefix='/download', tags=['Download'])

_DATE_PATTERN = re.compile(r'^\d{4}-\d{2}-\d{2}$')


_WORKSPACE_PATTERN = re.compile(r'^[a-z0-9_]{1,50}$')
_LAYER_PATTERN = re.compile(r'^[A-Za-z0-9_]{1,100}$')


def _prepare_download(
    workspace: str,
    layer: str,
    has_date_filter: bool,
) -> tuple[str, str, Any, Any]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        resolved = DownloadRepository.resolve_downloadable(session, workspace, layer)
        if resolved is None:
            raise NotFoundException(f'Capa {workspace}:{layer} no encontrada')
        layer_key, schema, table = resolved

        if not has_date_filter:
            object_key = DownloadRepository.find_fresh_cache(
                session, layer_key, settings.DOWNLOAD_CACHE_TTL_HOURS
            )
            if object_key:
                obj = open_object(object_key)
                if obj is not None:
                    return 'cache', table, object_key, obj

        if not DownloadRepository.validate_table_exists(session, schema, table):
            raise NotFoundException(f'Capa {workspace}:{layer} no encontrada')

        if has_date_filter and not DownloadRepository.column_exists(
            session, schema, table, DATE_COLUMN
        ):
            raise BadRequestException(
                f'Capa {workspace}:{layer} no tiene columna "{DATE_COLUMN}", '
                'no se puede filtrar por fecha'
            )

        return 'table', table, schema, table


def _csv_headers(filename: str) -> dict[str, str]:
    return {
        'Content-Disposition': f'attachment; filename="{filename}.csv"',
        'Access-Control-Expose-Headers': 'Content-Disposition',
    }


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
    if not _WORKSPACE_PATTERN.match(workspace) or not _LAYER_PATTERN.match(layer):
        raise NotFoundException(f'Capa {workspace}:{layer} no encontrada')
    if date_from and not _DATE_PATTERN.match(date_from):
        raise BadRequestException('date_from debe tener formato YYYY-MM-DD')
    if date_to and not _DATE_PATTERN.match(date_to):
        raise BadRequestException('date_to debe tener formato YYYY-MM-DD')

    has_date_filter = bool(date_from or date_to)
    kind, filename, first, second = await asyncio.to_thread(
        _prepare_download, workspace, layer, has_date_filter
    )

    if kind == 'cache':
        object_key, obj = first, second
        headers = _csv_headers(filename)
        if object_key.endswith('.gz'):
            headers['Content-Encoding'] = 'gzip'
        return StreamingResponse(
            iter_object_body(obj),
            media_type='text/csv; charset=utf-8',
            headers=headers,
        )

    schema, table = first, second
    pool = await get_pool()

    return StreamingResponse(
        DownloadRepository.stream_csv(pool, schema, table, date_from, date_to),
        media_type='text/csv; charset=utf-8',
        headers=_csv_headers(filename),
    )
