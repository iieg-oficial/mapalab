from __future__ import annotations

import re
from typing import Any, Optional

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.services.layer_tree_service import get_cached_state

_YEAR_RE = re.compile(r'\d{4}')


def _find_node_in_tree(nodes: list[dict], target_id: str) -> Optional[dict]:
    for n in nodes:
        if n['id'] == target_id:
            return n
        if n.get('children'):
            found = _find_node_in_tree(n['children'], target_id)
            if found:
                return found
    return None


def _node_path(nodes: list[dict], target_id: str, trail: Optional[list[str]] = None) -> Optional[list[str]]:
    trail = trail or []
    for n in nodes:
        if n['id'] == target_id:
            return trail
        children = n.get('children')
        if children:
            found = _node_path(children, target_id, trail + [n.get('label', '')])
            if found is not None:
                return found
    return None


def _resolve_layer_fuzzy(ref: str) -> Optional[dict]:
    state = get_cached_state()
    tree = state['tree']

    node = _find_node_in_tree(tree, ref)
    if node:
        wms = node.get('wmsConfig') or {}
        return {
            'id': ref,
            'label': node.get('label'),
            'workspace': wms.get('workspace'),
            'geoserver_workspace': wms.get('geoserverWorkspace'),
            'geoserver_layer': wms.get('geoserverLayer'),
            'node': node,
        }

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer = LayersRepository.find_layer_by_slug_or_alias(session, ref)
        if layer is not None:
            node = _find_node_in_tree(tree, layer.id)
            if node:
                wms = node.get('wmsConfig') or {}
                return {
                    'id': layer.id,
                    'label': node.get('label'),
                    'workspace': wms.get('workspace'),
                    'geoserver_workspace': wms.get('geoserverWorkspace'),
                    'geoserver_layer': wms.get('geoserverLayer'),
                    'node': node,
                }

        rows = LayersRepository.search_layers(session, ref, limit=1)
        for row in rows:
            node = _find_node_in_tree(tree, row.id)
            if node:
                wms = node.get('wmsConfig') or {}
                return {
                    'id': row.id,
                    'label': node.get('label'),
                    'workspace': wms.get('workspace'),
                    'geoserver_workspace': wms.get('geoserverWorkspace'),
                    'geoserver_layer': wms.get('geoserverLayer'),
                    'node': node,
                }

    return None


def search_by_theme(
    theme: str,
    limit: int = 50,
) -> list[dict]:
    state = get_cached_state()
    tree = state['tree']
    theme_lower = theme.strip().lower()
    results = []

    def collect_leaves(node):
        if node.get('nodeType') == 'leaf' and node.get('wmsConfig'):
            results.append({
                'id': node['id'],
                'label': node.get('label', ''),
                'slug': node.get('slug', ''),
                'workspace': (node.get('wmsConfig') or {}).get('workspace', ''),
            })
        for child in node.get('children') or []:
            collect_leaves(child)

    def walk(nodes):
        for n in nodes:
            label = (n.get('label') or '').lower()
            nid = (n.get('id') or '').lower()
            ws = ((n.get('wmsConfig') or {}).get('workspace') or '').lower()
            if theme_lower in (label, nid, ws):
                collect_leaves(n)
            else:
                walk(n.get('children') or [])

    walk(tree)

    seen = set()
    deduped = []
    for r in results:
        if r['id'] in seen:
            continue
        seen.add(r['id'])
        deduped.append(r)
    return deduped[:limit]


def _make_date_filter(year: str, month: Optional[int] = None) -> str:
    if month is not None:
        next_month = month + 1
        next_year = int(year)
        if next_month > 12:
            next_month = 1
            next_year += 1
        return f"(fecha >= '{year}-{month:02d}-01' AND fecha < '{next_year}-{next_month:02d}-01')"
    return f"(fecha >= '{year}-01-01' AND fecha < '{int(year) + 1}-01-01')"


def _layer_key_for_stats(node: dict, layer: str) -> str:
    wms = node.get('wmsConfig') or {}
    gs_workspace = wms.get('geoserverWorkspace') or wms.get('workspace') or ''
    gs_layer = wms.get('geoserverLayer') or layer
    return f"{gs_workspace}:{gs_layer}"


def _periodicity_summary(layer_key: str) -> dict:
    from app.services.periodicity_service import PeriodicityService
    raw = PeriodicityService.get_periodicities_batch([layer_key])
    data = None
    for value in (raw or {}).values():
        data = value
        break
    if not isinstance(data, dict) or not data:
        return {'años': [], 'meses': []}
    años = sorted(int(y) for y in data.keys() if str(y).isdigit())
    meses: set[int] = set()
    for months in data.values():
        if isinstance(months, dict):
            for m in months.keys():
                if str(m).isdigit():
                    meses.add(int(m))
    return {'años': años, 'meses': sorted(meses)}


def _years_for_layer(layer_id: str) -> list[int]:
    node = _find_node_in_tree(get_cached_state()['tree'], layer_id)
    resolved = layer_id
    if not node:
        fuzzy = _resolve_layer_fuzzy(layer_id)
        if fuzzy:
            node = fuzzy['node']
            resolved = fuzzy['id']
    ws_alias = (node.get('wmsConfig') or {}).get('workspace') if node else None
    key = f"{ws_alias}:{resolved}" if ws_alias else resolved
    return _periodicity_summary(key)['años']


def list_municipios() -> dict:
    from app.repositories.municipios_repository import MunicipiosRepository
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        items = MunicipiosRepository.list_all(session)
    return {"items": items, "count": len(items)}


def resolve_municipios(query: str, limit: int = 10) -> list[dict]:
    from app.repositories.municipios_repository import MunicipiosRepository
    q = (query or "").strip().lower()
    if not q:
        return []
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        items = MunicipiosRepository.list_all(session)
    matches = [
        it for it in items
        if q in (it.get("nombre") or "").lower() or q in (it.get("clave") or "")
    ]
    return matches[: max(1, min(limit, 50))]


def _resolve_municipio_selection(municipio: str | None) -> dict | None:
    if not municipio:
        return None
    items = resolve_municipios(query=municipio, limit=1)
    if not items:
        raise ValueError(f"No se encontró el municipio '{municipio}'. Usa el tool municipios para buscar.")
    return {'source': 'iieg', 'selected': [items[0]['clave']]}
