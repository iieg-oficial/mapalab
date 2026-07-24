import time
from typing import Optional

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.catalogo_repository import CatalogoRepository

_TTL_SECONDS = 300
_cache: dict = {'capas': {'ts': 0.0, 'data': None}, 'instituciones': {'ts': 0.0, 'data': None}}


def _serialize(row: dict) -> dict:
    institucion = None
    if row.get('institucion_slug'):
        institucion = {
            'slug': row['institucion_slug'],
            'nombre': row['institucion_nombre'],
        }
    return {
        'id': row['id'],
        'slug': row['slug'],
        'nombre': row['nombre'],
        'workspaceAlias': row['workspace_alias'],
        'geoserverWorkspace': row['geoserver_workspace'],
        'geoserverLayer': row['geoserver_layer'],
        'searchTags': row['search_tags'] or [],
        'littleCard': row.get('infobox_config'),
        'institucion': institucion,
    }


def _serialize_institucion(row: dict) -> dict:
    return {
        'id': row['id'],
        'slug': row['slug'],
        'nombre': row['nombre'],
        'logoUrl': row['logo_url'],
        'orden': row['orden'],
    }


def _cached(key: str, loader) -> list[dict]:
    now = time.monotonic()
    entry = _cache[key]
    if entry['data'] is not None and (now - entry['ts']) < _TTL_SECONDS:
        return entry['data']

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        rows = loader(session)

    entry['data'] = rows
    entry['ts'] = now
    return rows


def get_capas() -> list[dict]:
    return _cached(
        'capas',
        lambda session: [
            _serialize(row) for row in CatalogoRepository.get_enabled_capas(session)
        ],
    )


def get_instituciones() -> list[dict]:
    return _cached(
        'instituciones',
        lambda session: [
            _serialize_institucion(row)
            for row in CatalogoRepository.get_instituciones(session)
        ],
    )


def get_capa_by_slug(slug: str) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        row = CatalogoRepository.get_capa_by_slug(session, slug)
    return _serialize(row) if row else None


def invalidate_cache() -> None:
    for entry in _cache.values():
        entry['data'] = None
        entry['ts'] = 0.0
