from __future__ import annotations

import hashlib
import threading
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.dialects.postgresql import insert

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.models.layer import Layer, LayerAlias, LayerTreeCache, Workspace
from app.repositories.layers_repository import LayersRepository
from app.utils.logger import Logger


_MEM_LOCK = threading.Lock()
_MEM_CACHE: dict[str, Any] = {
    'etag': None,
    'tree': None,
    'initial_order': None,
    'workspaces': None,
    'updated_at': None,
}


def _workspace_to_dict(ws: Workspace) -> dict:
    return {
        'alias': ws.alias,
        'geoserverWorkspace': ws.geoserver_workspace,
        'dbSchema': ws.db_schema,
        'label': ws.label,
    }


def _layer_to_wms_config(layer: Layer, workspace_map: dict[str, Workspace]) -> Optional[dict]:
    if not layer.workspace_alias:
        return None
    ws = workspace_map.get(layer.workspace_alias)
    if not ws:
        return None
    return {
        'workspace': layer.workspace_alias,
        'geoserverLayer': layer.geoserver_layer,
        'geoserverWorkspace': ws.geoserver_workspace,
        'styles': layer.styles or '',
        'cqlFilter': layer.cql_filter or '',
        'wmsGroup': layer.wms_group,
        'wfsAvailable': layer.wfs_available,
        'wfsLayerName': layer.wfs_layer_name,
        'timeEnabled': layer.time_enabled,
        'timeStylePattern': layer.time_style_pattern,
        'metadataLayer': layer.metadata_layer,
    }


def _layer_to_search_meta(layer: Layer) -> Optional[dict]:
    if not (layer.search_tags or layer.searchable_fields or layer.has_municipio or layer.has_direccion):
        return None
    meta: dict[str, Any] = {}
    if layer.search_tags:
        meta['tags'] = layer.search_tags
    if layer.searchable_fields:
        meta['searchableFields'] = layer.searchable_fields
    if layer.has_municipio:
        meta['hasMunicipio'] = True
        if layer.municipio_field:
            meta['municipioField'] = layer.municipio_field
    if layer.has_direccion:
        meta['hasDireccion'] = True
        if layer.direccion_field:
            meta['direccionField'] = layer.direccion_field
    return meta


def _layer_to_dict(layer: Layer, workspace_map: dict[str, Workspace], aliases_map: dict[str, list[str]]) -> dict:
    label = layer.label
    if layer.disabled:
        label = f'*{label}'

    result: dict[str, Any] = {
        'id': layer.id,
        'label': label,
        'nodeType': layer.node_type,
        'sortOrder': layer.sort_order,
        'children': [],
    }

    if layer.slug:
        result['slug'] = layer.slug

    layer_aliases = aliases_map.get(layer.id)
    if layer_aliases:
        result['aliases'] = layer_aliases

    if layer.node_type == 'category':
        result['isCategory'] = True
    elif layer.node_type == 'label':
        result['isLabel'] = True
    elif layer.node_type == 'group':
        result['forceGroup'] = True

    if layer.node_type == 'tema' and getattr(layer, 'icon_url', None):
        result['iconUrl'] = layer.icon_url

    if layer.hidden_in_menu:
        result['hiddenInMenu'] = True

    wms = _layer_to_wms_config(layer, workspace_map)
    if wms:
        result['wmsConfig'] = wms

    if layer.downloadable is False:
        result['downloadable'] = False

    if layer.default_date is not None:
        result['defaultDate'] = layer.default_date
    if layer.default_zoom is not None:
        result['defaultZoom'] = layer.default_zoom
    if layer.zoom_range is not None:
        result['zoomRange'] = layer.zoom_range
    if layer.raster_periodicity is not None:
        result['rasterPeriodicity'] = layer.raster_periodicity
    if layer.hide_periodicity:
        result['hidePeriodicity'] = True

    search_meta = _layer_to_search_meta(layer)
    if search_meta:
        result['searchMeta'] = search_meta

    if layer.infobox_config is not None:
        result['littleCard'] = layer.infobox_config

    return result


def _build_tree_from_rows(
    layers: list[Layer],
    workspace_map: dict[str, Workspace],
    aliases_map: dict[str, list[str]],
) -> list[dict]:
    nodes_by_id: dict[str, dict] = {}
    roots: list[dict] = []

    for layer in layers:
        nodes_by_id[layer.id] = _layer_to_dict(layer, workspace_map, aliases_map)

    for layer in layers:
        node = nodes_by_id[layer.id]
        if layer.parent_id is None:
            roots.append(node)
        else:
            parent = nodes_by_id.get(layer.parent_id)
            if parent is not None:
                parent['children'].append(node)

    return roots


def _compute_etag(max_updated_at: Optional[datetime], count: int) -> str:
    ts = max_updated_at.isoformat() if max_updated_at else 'empty'
    raw = f'{ts}|{count}'
    digest = hashlib.md5(raw.encode()).hexdigest()[:16]
    return f'W/"{digest}"'


def refresh_cache() -> dict[str, Any]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        workspaces = LayersRepository.get_all_workspaces(session)
        ws_map = {w.alias: w for w in workspaces}
        layers = LayersRepository.get_all_layers(session)
        aliases_map = LayersRepository.get_aliases_by_layer(session)
        max_updated_at = LayersRepository.get_max_updated_at(session)
        count = len(layers)

        tree = _build_tree_from_rows(layers, ws_map, aliases_map)
        initial_order = LayersRepository.get_initial_order(session)
        ws_list = [_workspace_to_dict(w) for w in workspaces]
        etag = _compute_etag(max_updated_at, count)

        stmt = insert(LayerTreeCache).values(
            id=1,
            etag=etag,
            tree=tree,
            initial_order=initial_order,
            workspaces=ws_list,
            source_max_updated_at=max_updated_at,
            layer_count=count,
            updated_at=datetime.utcnow(),
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=['id'],
            set_={
                'etag': stmt.excluded.etag,
                'tree': stmt.excluded.tree,
                'initial_order': stmt.excluded.initial_order,
                'workspaces': stmt.excluded.workspaces,
                'source_max_updated_at': stmt.excluded.source_max_updated_at,
                'layer_count': stmt.excluded.layer_count,
                'updated_at': stmt.excluded.updated_at,
            },
        )
        session.execute(stmt)
        session.commit()

        with _MEM_LOCK:
            _MEM_CACHE['etag'] = etag
            _MEM_CACHE['tree'] = tree
            _MEM_CACHE['initial_order'] = initial_order
            _MEM_CACHE['workspaces'] = ws_list
            _MEM_CACHE['updated_at'] = datetime.utcnow()

        Logger.info(f'layer_tree_cache refreshed: {count} capas, etag={etag}')

        return {
            'etag': etag,
            'tree': tree,
            'initial_order': initial_order,
            'workspaces': ws_list,
            'layer_count': count,
        }


def get_cached_state() -> dict[str, Any]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        db_etag = session.query(LayerTreeCache.etag).filter(LayerTreeCache.id == 1).scalar()

        with _MEM_LOCK:
            if db_etag and _MEM_CACHE['etag'] == db_etag and _MEM_CACHE['tree']:
                return {
                    'etag': _MEM_CACHE['etag'],
                    'tree': _MEM_CACHE['tree'],
                    'initial_order': _MEM_CACHE['initial_order'],
                    'workspaces': _MEM_CACHE['workspaces'],
                }

        row = session.query(LayerTreeCache).filter(LayerTreeCache.id == 1).first()
        if row is None:
            result = refresh_cache()
            return {
                'etag': result['etag'],
                'tree': result['tree'],
                'initial_order': result['initial_order'],
                'workspaces': result['workspaces'],
            }

        with _MEM_LOCK:
            _MEM_CACHE['etag'] = row.etag
            _MEM_CACHE['tree'] = row.tree
            _MEM_CACHE['initial_order'] = row.initial_order
            _MEM_CACHE['workspaces'] = row.workspaces
            _MEM_CACHE['updated_at'] = row.updated_at

        return {
            'etag': row.etag,
            'tree': row.tree,
            'initial_order': row.initial_order,
            'workspaces': row.workspaces,
        }


def invalidate_memory_cache() -> None:
    with _MEM_LOCK:
        _MEM_CACHE['etag'] = None
        _MEM_CACHE['tree'] = None
        _MEM_CACHE['initial_order'] = None
        _MEM_CACHE['workspaces'] = None
        _MEM_CACHE['updated_at'] = None
