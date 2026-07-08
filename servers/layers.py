from __future__ import annotations

import json
import re
from typing import Any
from urllib.parse import urlencode

import httpx
from sqlalchemy import text

from app.config import settings
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.services.layer_tree_service import get_cached_state
from app.utils.logger import Logger

from servers.resolve import (
    _find_node_in_tree,
    _layer_key_for_stats,
    _make_date_filter,
    _node_path,
    _periodicity_summary,
    _resolve_layer_fuzzy,
    _YEAR_RE,
    resolve_municipios,
)

_POSTGIS_STATEMENT_TIMEOUT_MS = 5000
_WFS_TIMEOUT = 120.0

_CQL_BLOCKED = re.compile(
    r"(?:;|--|/\*|\*/|\\x|UNION\b|SELECT\b|INSERT\b|UPDATE\b|DELETE\b|DROP\b"
    r"|ALTER\b|CREATE\b|EXEC\b|EXECUTE\b|TRUNCATE\b|MERGE\b|REPLACE\b"
    r"|GRANT\b|REVOKE\b|SCRIPT\b)",
    re.IGNORECASE,
)


def _sanitize_cql(cql: str | None) -> str | None:
    if not cql:
        return None
    stripped = cql.strip()
    if not stripped:
        return None
    if _CQL_BLOCKED.search(stripped):
        raise ValueError("CQL contiene patrones no permitidos")
    return stripped


def query_wfs(
    layer: str,
    cql_filter: str | None = None,
    limit: int = 1000,
    srs_name: str | None = None,
    workspace: str | None = None,
    municipio: str | None = None,
    year: str | None = None,
    month: int | None = None,
) -> dict:
    if cql_filter and (municipio or year or month):
        raise ValueError("No combines 'cql_filter' con 'municipio'/'year'/'month'. Usa uno u otro.")

    state = get_cached_state()
    tree = state['tree']

    node = _find_node_in_tree(tree, layer)
    if not node or not node.get('wmsConfig'):
        fuzzy = _resolve_layer_fuzzy(layer)
        if fuzzy:
            node = fuzzy['node']
        else:
            raise ValueError(f"No encontré la capa '{layer}'. Usa search_layers para ver ids válidos.")

    wms = node['wmsConfig']
    ws_map = {w.get('alias'): w.get('geoserver_workspace') for w in state.get('workspaces', []) if w.get('alias')}
    gs_workspace = (
        ws_map.get(workspace) if workspace
        else wms.get('geoserverWorkspace') or ws_map.get(wms.get('workspace'))
    )
    if not gs_workspace:
        raise ValueError(f"No se pudo resolver el workspace de la capa '{layer}'")

    gs_layer = wms.get('layers') or wms.get('geoserverLayer') or layer
    if ':' not in gs_layer:
        gs_layer = f"{gs_workspace}:{gs_layer}"

    parts: list[str] = []
    if year:
        if not _YEAR_RE.fullmatch(str(year)):
            raise ValueError("'year' debe ser 4 digitos (ej. '2025')")
        parts.append(_make_date_filter(str(year), month))
    if municipio:
        items = resolve_municipios(query=municipio, limit=1)
        if not items:
            raise ValueError(f"No se encontró el municipio '{municipio}'. Usa el tool municipios para buscar.")
        search_meta = node.get('searchMeta') or {}
        muni_field = search_meta.get('municipioField') or 'municipio'
        muni_type = search_meta.get('municipioFieldType') or 'clave'
        if not search_meta.get('hasMunicipio'):
            raise ValueError(f"La capa '{layer}' no soporta filtro por municipio. Usa search_layers para encontrar capas que sí lo soporten.")
        if muni_type == 'nombre':
            value = items[0]['nombre']
        else:
            value = items[0]['clave']
        parts.append(f"{muni_field} = '{value}'")

    safe_cql = _sanitize_cql(cql_filter)
    if safe_cql:
        parts.insert(0, safe_cql)

    combined_cql = ' AND '.join(parts) if parts else None

    params = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeNames': gs_layer,
        'outputFormat': 'application/json',
        'count': str(max(1, min(limit, 10000))),
    }
    if combined_cql:
        params['CQL_FILTER'] = combined_cql

    base = settings.GEOSERVER_URL.rstrip('/')
    url = f"{base}/{gs_workspace}/ows?{urlencode(params)}"
    auth = None
    if settings.GEOSERVER_USER and settings.GEOSERVER_PASSWORD:
        auth = (settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD)

    try:
        with httpx.Client(timeout=_WFS_TIMEOUT, verify=settings.GEOSERVER_VERIFY_SSL) as client:
            response = client.get(url, auth=auth)
        response.raise_for_status()
        geojson = response.json()
    except httpx.HTTPStatusError as exc:
        Logger.warning(f"query_wfs.geoserver_status status={exc.response.status_code} body={exc.response.text[:500]}")
        raise ValueError(f"GeoServer respondió {exc.response.status_code}")
    except httpx.RequestError as exc:
        Logger.warning(f"query_wfs.geoserver_unreachable {exc}")
        raise ValueError("No se pudo conectar a GeoServer")

    if srs_name and srs_name.upper() != 'EPSG:6368':
        geojson = _reproject_geojson(geojson, srs_name)

    return geojson


def _reproject_geojson(geojson: dict, target_srs: str) -> dict:
    features = geojson.get('features', [])
    indexed = [(i, f.get('geometry')) for i, f in enumerate(features) if f.get('geometry')]
    if not indexed:
        geojson['crs'] = {'type': 'name', 'properties': {'name': target_srs}}
        return geojson

    target_epsg = int(target_srs.upper().replace('EPSG:', ''))
    geoms_json = json.dumps([geom for _, geom in indexed])
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        session.execute(text(f"SET LOCAL statement_timeout = {_POSTGIS_STATEMENT_TIMEOUT_MS}"))
        rows = session.execute(
            text(
                "SELECT ord - 1 AS pos, ST_AsGeoJSON("
                "ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(g.value), 6368), :tgt)"
                ") AS geom "
                "FROM jsonb_array_elements(CAST(:geoms AS jsonb)) "
                "WITH ORDINALITY AS g(value, ord)"
            ),
            {'geoms': geoms_json, 'tgt': target_epsg},
        ).fetchall()

    transformed = {int(r.pos): r.geom for r in rows if r.geom}
    for pos, (feat_idx, _) in enumerate(indexed):
        geom = transformed.get(pos)
        if geom:
            features[feat_idx]['geometry'] = json.loads(geom)
    geojson['crs'] = {'type': 'name', 'properties': {'name': target_srs}}
    return geojson


def _numeralia_from_values(raw: Any) -> list[dict]:
    if not isinstance(raw, list):
        return []
    by_pos = {v.get('posicion'): v for v in raw if isinstance(v, dict)}
    result: list[dict] = []
    for i in range(1, 9):
        v = by_pos.get(i)
        if v and (v.get('valor') or v.get('nombre')):
            result.append({
                'nombre': v.get('nombre'),
                'valor': v.get('valor'),
                'simbolo': v.get('simbolo'),
            })
    return result


def get_layer_stats(
    layer: str,
) -> dict:
    state = get_cached_state()
    tree = state['tree']

    node = _find_node_in_tree(tree, layer)
    if not node or not node.get('wmsConfig'):
        fuzzy = _resolve_layer_fuzzy(layer)
        if fuzzy:
            node = fuzzy['node']
            layer = fuzzy['id']
        else:
            raise ValueError(f"No encontré la capa '{layer}'. Usa search_layers para ver ids válidos.")

    layer_key = _layer_key_for_stats(node, layer)
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        try:
            row = session.execute(
                text(
                    "SELECT values, pie_numeralia FROM mapalab.layer_stats "
                    "WHERE layer_key = :k"
                ),
                {'k': layer_key},
            ).first()
        except Exception as exc:
            Logger.warning(f"get_layer_stats.query_error layer={layer} key={layer_key} {exc}")
            row = None

    numeralia = _numeralia_from_values(row.values if row else None)
    return {
        'layer_id': layer,
        'label': node.get('label', ''),
        'numeralia': numeralia,
        'pie_numeralia': row.pie_numeralia if row else None,
    }


def _capabilities_from_node(node: dict) -> dict:
    wms = node.get('wmsConfig') or {}
    search_meta = node.get('searchMeta') or {}
    caps: dict[str, Any] = {
        'temporal': bool(wms.get('timeEnabled')),
        'hasMunicipio': bool(search_meta.get('hasMunicipio')),
        'descargable': node.get('downloadable', True) is not False,
        'consultableWfs': wms.get('wfsAvailable', True) is not False,
    }
    if search_meta.get('municipioField'):
        caps['municipioField'] = search_meta['municipioField']
    if node.get('zoomRange'):
        caps['zoomRange'] = node['zoomRange']
    return caps


def _acervo_base() -> str:
    return settings.ACERVO_PUBLIC_URL.rstrip('/') if settings.ACERVO_PUBLIC_URL else ''


def describe_layer(layer: str) -> dict:
    from app.services import layer_metadata_service

    fuzzy = _resolve_layer_fuzzy(layer)
    if not fuzzy:
        return {'error': f"No encontré la capa '{layer}'. Usa search_layers para ver ids válidos."}

    resolved_id = fuzzy['id']
    ws_alias = fuzzy['workspace'] or ''
    label = fuzzy['label'] or resolved_id
    node = fuzzy['node']

    meta = layer_metadata_service.get_metadata_response(ws_alias, resolved_id, _acervo_base()) or {}

    stats = get_layer_stats(layer=resolved_id)

    layer_key = f"{ws_alias}:{resolved_id}" if ws_alias else resolved_id
    periodicidad = _periodicity_summary(layer_key)

    path_labels = _node_path(get_cached_state()['tree'], resolved_id)
    path = ' > '.join(path_labels) if path_labels else None

    capabilities = _capabilities_from_node(node)
    capabilities['temporal'] = capabilities['temporal'] or bool(periodicidad['años'])

    return {
        'id': resolved_id,
        'label': label,
        'path': path,
        'capabilities': capabilities,
        'descripcion': meta.get('descripcion'),
        'fuentes': meta.get('fuentes'),
        'metodologia': meta.get('metodologia'),
        'frecuencia': meta.get('frecuencia_actualizacion'),
        'fecha_ultima': meta.get('fecha_ultima_actualizacion'),
        'metadato_archivos': meta.get('metadato'),
        'numeralia': stats.get('numeralia', []),
        'pie_numeralia': stats.get('pie_numeralia'),
        'periodicidad': periodicidad,
    }
