import time
from typing import Optional

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.catalogo_repository import CatalogoRepository

_TTL_SECONDS = 300
_cache: dict = {'ts': 0.0, 'capas': None}


def _serialize(row: dict) -> dict:
    return {
        'id': row['id'],
        'slug': row['slug'],
        'nombre': row['nombre'],
        'workspaceAlias': row['workspace_alias'],
        'geoserverWorkspace': row['geoserver_workspace'],
        'geoserverLayer': row['geoserver_layer'],
        'searchTags': row['search_tags'] or [],
        'littleCard': row.get('infobox_config'),
    }


def get_capas() -> list[dict]:
    now = time.monotonic()
    cached = _cache['capas']
    if cached is not None and (now - _cache['ts']) < _TTL_SECONDS:
        return cached

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        rows = CatalogoRepository.get_enabled_capas(session)

    capas = [_serialize(row) for row in rows]
    _cache['capas'] = capas
    _cache['ts'] = now
    return capas


def get_capa_by_slug(slug: str) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        row = CatalogoRepository.get_capa_by_slug(session, slug)
    return _serialize(row) if row else None


def invalidate_cache() -> None:
    _cache['capas'] = None
    _cache['ts'] = 0.0
