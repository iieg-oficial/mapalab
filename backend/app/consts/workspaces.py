from sqlalchemy import text

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory


_cache: dict[str, str] = {}


def _refresh_cache() -> None:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        rows = session.execute(
            text('SELECT alias, db_schema FROM mapalab.workspaces')
        ).fetchall()
    _cache.clear()
    for alias, db_schema in rows:
        _cache[alias] = db_schema


def resolve_schema(workspace: str) -> str:
    if not _cache:
        try:
            _refresh_cache()
        except Exception:
            pass
    return _cache.get(workspace, workspace)


def invalidate_cache() -> None:
    _cache.clear()
