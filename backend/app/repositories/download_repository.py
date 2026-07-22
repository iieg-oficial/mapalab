import asyncio
from datetime import date, datetime, timedelta, timezone
from typing import AsyncIterator, Optional

import asyncpg
from sqlalchemy import text
from sqlalchemy.orm import Session


CHUNK_SIZE = 65536
QUEUE_MAX_CHUNKS = 16


def _quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def _build_select(
    schema: str,
    table: str,
    columns: Optional[list[str]],
    date_from: Optional[str],
    date_to: Optional[str],
) -> tuple[str, list]:
    cols_sql = ', '.join(_quote_ident(c) for c in columns) if columns else '*'
    query = f'SELECT {cols_sql} FROM {_quote_ident(schema)}.{_quote_ident(table)}'
    conditions: list[str] = []
    params: list = []
    if date_from:
        params.append(date.fromisoformat(date_from))
        conditions.append(f'fecha >= ${len(params)}')
    if date_to:
        params.append(date.fromisoformat(date_to))
        conditions.append(f'fecha <= ${len(params)}')
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    return query, params


async def _fetch_export_columns(conn: asyncpg.Connection, schema: str, table: str) -> list[str]:
    """Columnas de la tabla excluyendo geometria/geografia (aligera el CSV)."""
    rows = await conn.fetch(
        'SELECT column_name FROM information_schema.columns '
        'WHERE table_schema = $1 AND table_name = $2 '
        "AND udt_name NOT IN ('geometry', 'geography') "
        'ORDER BY ordinal_position',
        schema,
        table,
    )
    return [row['column_name'] for row in rows]


class DownloadRepository:

    @staticmethod
    def resolve_db_name(session: Session, geoserver_key: str) -> Optional[tuple[str, str]]:
        result = session.execute(
            text(
                'SELECT layer_name_db FROM mapalab.layer_metadata '
                'WHERE layer_key = :key AND layer_name_db IS NOT NULL '
                "AND layer_name_db != '' LIMIT 1"
            ),
            {'key': geoserver_key},
        )
        row = result.scalar()
        if not row or '.' not in row:
            return None
        schema, table = row.split('.', 1)
        return (schema, table)

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
