import unicodedata
from typing import Any, Iterator, Optional

from ..config import DATA_CRS, WMS_FORMAT, WMS_VERSION, geoserver_url, wfs_url


def hydrate_wms_config(wms_config: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if not wms_config:
        return None

    workspace = wms_config.get('geoserverWorkspace') or wms_config.get('workspace')
    layer = wms_config.get('geoserverLayer')
    if not workspace or not layer:
        return None

    hydrated = dict(wms_config)
    hydrated['baseUrl'] = geoserver_url(workspace)
    hydrated['wfsUrl'] = wfs_url(workspace)
    hydrated['layerName'] = layer
    hydrated['qualifiedName'] = f'{workspace}:{layer}'
    hydrated['format'] = wms_config.get('format') or WMS_FORMAT
    hydrated['version'] = WMS_VERSION
    hydrated['crs'] = DATA_CRS
    return hydrated


def hydrate_tree(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    hydrated: list[dict[str, Any]] = []
    for node in nodes:
        item = dict(node)
        if node.get('wmsConfig'):
            item['wmsConfig'] = hydrate_wms_config(node['wmsConfig'])
        item['children'] = hydrate_tree(node.get('children') or [])
        hydrated.append(item)
    return hydrated


def iter_leaves(nodes: list[dict[str, Any]]) -> Iterator[dict[str, Any]]:
    for node in nodes:
        if node.get('wmsConfig'):
            yield node
        yield from iter_leaves(node.get('children') or [])


def find_node(nodes: list[dict[str, Any]], node_id: str) -> Optional[dict[str, Any]]:
    for node in nodes:
        if node.get('id') == node_id:
            return node
        found = find_node(node.get('children') or [], node_id)
        if found:
            return found
    return None


def normalize(text: str) -> str:
    stripped = unicodedata.normalize('NFD', text or '')
    without_marks = ''.join(ch for ch in stripped if not unicodedata.combining(ch))
    return without_marks.lower()


def matches(node: dict[str, Any], query: str) -> bool:
    if not query:
        return True
    needle = normalize(query)
    haystack = [node.get('label') or '', node.get('id') or '', node.get('slug') or '']
    search_meta = node.get('searchMeta') or {}
    haystack.extend(search_meta.get('tags') or [])
    return any(needle in normalize(str(value)) for value in haystack)


def filter_tree(nodes: list[dict[str, Any]], query: str) -> list[dict[str, Any]]:
    if not query:
        return nodes

    filtered: list[dict[str, Any]] = []
    for node in nodes:
        children = filter_tree(node.get('children') or [], query)
        if children or matches(node, query):
            item = dict(node)
            item['children'] = children if children else node.get('children') or []
            filtered.append(item)
    return filtered


def clean_label(label: str) -> str:
    return label[1:] if label.startswith('*') else label


def is_disabled(node: dict[str, Any]) -> bool:
    return str(node.get('label') or '').startswith('*')


def layer_key(node: dict[str, Any]) -> Optional[str]:
    wms_config = node.get('wmsConfig') or {}
    return wms_config.get('qualifiedName')


def has_wfs(node: dict[str, Any]) -> bool:
    wms_config = node.get('wmsConfig') or {}
    return bool(wms_config.get('wfsAvailable'))


def is_downloadable(node: dict[str, Any]) -> bool:
    return node.get('downloadable') is not False


def workspace_and_layer(node: dict[str, Any]) -> tuple[str, str]:
    wms_config = node.get('wmsConfig') or {}
    return wms_config.get('workspace') or '', wms_config.get('geoserverLayer') or ''


def node_cql(node: dict[str, Any]) -> str:
    wms_config = node.get('wmsConfig') or {}
    return wms_config.get('cqlFilter') or ''


def typename(node: dict[str, Any]) -> str:
    wms_config = node.get('wmsConfig') or {}
    return wms_config.get('wfsLayerName') or wms_config.get('qualifiedName') or ''
