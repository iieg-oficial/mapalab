import asyncio
from datetime import date, datetime, timedelta, timezone
from typing import AsyncIterator, Optional

import asyncpg
from sqlalchemy import text
from sqlalchemy.orm import Session


CHUNK_SIZE = 65536
QUEUE_MAX_CHUNKS = 16
DATE_COLUMN = 'fecha'


def _quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def _build_select(
    schema: str,
    table: str,
    columns: list[str],
    date_from: Optional[str],
    date_to: Optional[str],
) -> tuple[str, list]:
    if not columns:
        raise ValueError(f'{schema}.{table} no tiene columnas exportables')
    cols_sql = ', '.join(_quote_ident(c) for c in columns)
    query = f'SELECT {cols_sql} FROM {_quote_ident(schema)}.{_quote_ident(table)}'
    conditions: list[str] = []
    params: list = []
    if date_from:
        params.append(date.fromisoformat(date_from))
        conditions.append(f'{_quote_ident(DATE_COLUMN)} >= ${len(params)}')
    if date_to:
        params.append(date.fromisoformat(date_to))
        conditions.append(f'{_quote_ident(DATE_COLUMN)} <= ${len(params)}')
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    return query, params


async def _fetch_export_columns(conn: asyncpg.Connection, schema: str, table: str) -> list[str]:
    """Columnas exportables excluyendo geometria/geografia.

    Se consulta ``pg_attribute`` y no ``information_schema.columns`` porque esta
    ultima no lista vistas materializadas, que son la mayoria de las capas
    descargables.
    """
    rows = await conn.fetch(
        'SELECT a.attname FROM pg_attribute a '
        'JOIN pg_class c ON c.oid = a.attrelid '
        'JOIN pg_namespace n ON n.oid = c.relnamespace '
        'JOIN pg_type t ON t.oid = a.atttypid '
        'WHERE n.nspname = $1 AND c.relname = $2 '
        "AND c.relkind IN ('r', 'v', 'm', 'p', 'f') "
        'AND a.attnum > 0 AND NOT a.attisdropped '
        "AND t.typname NOT IN ('geometry', 'geography') "
        'ORDER BY a.attnum',
        schema,
        table,
    )
    return [row['attname'] for row in rows]


class DownloadRepository:

    @staticmethod
    def resolve_downloadable(
        session: Session, workspace_alias: str, layer: str
    ) -> Optional[tuple[str, str, str]]:
        row = session.execute(
            text(
                'SELECT m.layer_key, m.layer_name_db FROM mapalab.workspaces w '
                'JOIN mapalab.layer_metadata m ON m.layer_key IN '
                "(w.geoserver_workspace || ':' || :layer, w.db_schema || ':' || :layer) "
                'WHERE w.alias = :alias AND m.downloadable '
                "AND m.layer_name_db IS NOT NULL AND m.layer_name_db != '' "
                "ORDER BY m.layer_key = w.geoserver_workspace || ':' || :layer DESC "
                'LIMIT 1'
            ),
            {'alias': workspace_alias, 'layer': layer},
        ).first()
        if row is None or '.' not in row[1]:
            return None
        schema, table = row[1].split('.', 1)
        return (row[0], schema, table)

    @staticmethod
    def find_fresh_cache(
        session: Session, layer_key: str, ttl_hours: int
    ) -> Optional[str]:
        cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=ttl_hours)
        result = session.execute(
            text(
                'SELECT object_key FROM mapalab.layer_downloads '
                'WHERE layer_key = :key AND generated_at >= :cutoff '
                'LIMIT 1'
            ),
            {'key': layer_key, 'cutoff': cutoff},
        )
        return result.scalar()

    @staticmethod
    def validate_table_exists(session: Session, schema: str, table: str) -> bool:
        result = session.execute(
            text(
                'SELECT 1 FROM pg_class c '
                'JOIN pg_namespace n ON n.oid = c.relnamespace '
                "WHERE c.relkind IN ('r','v','m') "
                'AND n.nspname = :schema AND c.relname = :table'
            ),
            {'schema': schema, 'table': table},
        )
        return result.scalar() is not None

    @staticmethod
    def column_exists(session: Session, schema: str, table: str, column: str) -> bool:
        result = session.execute(
            text(
                'SELECT 1 FROM pg_attribute a '
                'JOIN pg_class c ON c.oid = a.attrelid '
                'JOIN pg_namespace n ON n.oid = c.relnamespace '
                'WHERE n.nspname = :schema AND c.relname = :table '
                'AND a.attname = :column AND a.attnum > 0 AND NOT a.attisdropped'
            ),
            {'schema': schema, 'table': table, 'column': column},
        )
        return result.scalar() is not None

    @staticmethod
    async def stream_csv(
        pool: asyncpg.Pool,
        schema: str,
        table: str,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> AsyncIterator[bytes]:
        queue: asyncio.Queue = asyncio.Queue(maxsize=QUEUE_MAX_CHUNKS)
        sentinel: object = object()

        async def writer(buf) -> None:
            await queue.put(bytes(buf))

        async def producer() -> None:
            try:
                async with pool.acquire() as conn:
                    columns = await _fetch_export_columns(conn, schema, table)
                    query, params = _build_select(
                        schema, table, columns, date_from, date_to
                    )
                    await conn.copy_from_query(
                        query,
                        *params,
                        output=writer,
                        format='csv',
                        header=True,
                    )
            except Exception as exc:
                await queue.put(exc)
            finally:
                await queue.put(sentinel)

        task = asyncio.create_task(producer())
        try:
            while True:
                item = await queue.get()
                if item is sentinel:
                    break
                if isinstance(item, BaseException):
                    raise item
                yield item
        finally:
            if not task.done():
                task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass
