from __future__ import annotations

import json
import os
import re
from typing import Any, Optional
from urllib.parse import quote, urlencode

from sqlalchemy import text

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.repositories.share_repository import ShareRepository
from app.utils.logger import Logger
from app.services.share_service import (
    CURRENT_SCHEMA_VERSION,
    MAX_COORDINATES_PER_GEOMETRY,
    _count_coordinates,
    hash_id,
    validate_payload,
)
from app.services.layer_tree_service import get_cached_state
from app.config import settings

_POSTGIS_STATEMENT_TIMEOUT_MS = 5000


def _public_base_url() -> str:
    return (os.getenv('MAPALAB_PUBLIC_BASE_URL') or 'https://iieg.jalisco.gob.mx').rstrip('/')


def _build_share_url(share_id: str) -> str:
    return f"{_public_base_url()}/mapalab/mapa?s={quote(share_id)}"


def _build_embed_html(share_id: str, height: int = 500) -> str:
    base = _public_base_url()
    return (
        f'<script src="{base}/mapalab/widget/v1/mapalab.js" defer></script>\n'
        f'<iieg-mapalab api-key="mk_pub_TU_API_KEY" share="{share_id}" height="{height}"></iieg-mapalab>'
    )


def _normalize_layer_entries(items: list) -> list[dict]:
    out: list[dict] = []
    for raw in items or []:
        if isinstance(raw, str):
            out.append({"slug": raw})
        elif isinstance(raw, dict) and raw.get("slug"):
            out.append({k: v for k, v in raw.items() if k in {"slug", "opacity", "visible", "filters"}})
    return out


def _persist_share(envelope: dict) -> dict:
    kind, payload = validate_payload(envelope)
    share_id = hash_id(payload, kind)
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        share = ShareRepository.upsert(
            session=session,
            share_id=share_id,
            payload=payload,
            kind=kind,
            schema_version=CURRENT_SCHEMA_VERSION,
            created_ip_hash=None,
        )
        session.commit()
        return {
            "id": share.id,
            "kind": share.kind,
            "url": _build_share_url(share.id),
            "embed_html": _build_embed_html(share.id),
        }


def _normalize_municipios(municipios: dict | list | None) -> dict | None:
    if not municipios:
        return None
    if isinstance(municipios, list):
        return {"source": "iieg", "selected": [str(c) for c in municipios if c]}
    if isinstance(municipios, dict) and municipios.get("selected"):
        source = municipios.get("source") or "iieg"
        if source not in ("iieg", "inegi"):
            source = "iieg"
        selected = [str(c) for c in municipios["selected"] if c]
        if not selected:
            return None
        return {"source": source, "selected": selected}
    return None


def _find_node_in_tree(nodes: list[dict], target_id: str) -> Optional[dict]:
    for n in nodes:
        if n['id'] == target_id:
            return n
        if n.get('children'):
            found = _find_node_in_tree(n['children'], target_id)
            if found:
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


def _default_view(municipios: dict | None = None) -> dict:
    if municipios and municipios.get('selected'):
        try:
            from app.repositories.municipios_repository import (
                MunicipiosRepository,
            )
            conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
            with conn.get_session() as session:
                bbox = MunicipiosRepository.get_union_bbox(
                    session=session,
                    claves=municipios['selected'],
                    source=municipios.get('source', 'iieg'),
                    target_srid=4326,
                )
            if bbox:
                lon = (bbox[0] + bbox[2]) / 2
                lat = (bbox[1] + bbox[3]) / 2
                dx = bbox[2] - bbox[0]
                dy = bbox[3] - bbox[1]
                if dx > 0 and dy > 0:
                    span = max(dx, dy)
                    if span > 4:
                        zoom = 7
                    elif span > 2:
                        zoom = 8
                    elif span > 1:
                        zoom = 9
                    elif span > 0.5:
                        zoom = 10
                    elif span > 0.2:
                        zoom = 11
                    else:
                        zoom = 12
                    return {'zoom': zoom, 'lat': lat, 'lon': lon}
        except Exception as exc:
            Logger.warning(f"_default_view.bbox_error {exc}")
    return {'zoom': 7.5, 'lat': 20.6, 'lon': -103.4}


def _make_date_filter(year: str, month: Optional[int] = None) -> str:
    if month is not None:
        next_month = month + 1
        next_year = int(year)
        if next_month > 12:
            next_month = 1
            next_year += 1
        return f"(fecha >= '{year}-{month:02d}-01' AND fecha < '{next_year}-{next_month:02d}-01')"
    return f"(fecha >= '{year}-01-01' AND fecha < '{int(year) + 1}-01-01')"


def create_single_share(
    layers: list,
    view: dict | None = None,
    basemap: str | None = None,
    selected: str | None = None,
    annotations: list | None = None,
    municipios: dict | list | None = None,
) -> dict:
    norm_municipios = _normalize_municipios(municipios)
    resolved_view = view or _default_view(norm_municipios)
    payload: dict[str, Any] = {"layers": _normalize_layer_entries(layers), "view": resolved_view}
    if basemap:
        payload["basemap"] = basemap
    if selected:
        payload["selected"] = selected
    if annotations:
        payload["annotations"] = annotations
    if norm_municipios:
        payload["municipios"] = norm_municipios
    return _persist_share({"version": 2, "kind": "single", "payload": payload})


def create_swipe_share(
    pane_a_layers: list,
    pane_b_layers: list,
    position: float = 0.5,
    view: dict | None = None,
    basemap: str | None = None,
    selected: str | None = None,
    active_slot: str = "A",
    label_a: str = "A",
    label_b: str = "B",
    annotations: list | None = None,
    municipios: dict | list | None = None,
) -> dict:
    norm_municipios = _normalize_municipios(municipios)
    resolved_view = view or _default_view(norm_municipios)
    shared: dict[str, Any] = {
        "view": resolved_view,
        "basemap": basemap,
        "selected": selected,
    }
    if norm_municipios:
        shared["municipios"] = norm_municipios
    payload: dict[str, Any] = {
        "shared": shared,
        "paneA": {"label": label_a, "layers": _normalize_layer_entries(pane_a_layers)},
        "paneB": {"label": label_b, "layers": _normalize_layer_entries(pane_b_layers)},
        "activeSlot": active_slot if active_slot in {"A", "B"} else "A",
        "position": position,
    }
    if annotations:
        payload["annotations"] = annotations
    return _persist_share({"version": 2, "kind": "swipe", "payload": payload})


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


def measure_geometry(geometry: dict) -> dict:
    if not isinstance(geometry, dict):
        raise ValueError("geometry debe ser objeto GeoJSON")
    gtype = geometry.get("type")
    if gtype not in {"LineString", "Polygon", "MultiPolygon"}:
        raise ValueError(f"geometry.type debe ser LineString o Polygon, recibido {gtype}")
    if _count_coordinates(geometry.get("coordinates")) > MAX_COORDINATES_PER_GEOMETRY:
        raise ValueError(f"geometry excede {MAX_COORDINATES_PER_GEOMETRY} coordenadas")
    geojson_str = json.dumps(geometry)
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        session.execute(text(f"SET LOCAL statement_timeout = {_POSTGIS_STATEMENT_TIMEOUT_MS}"))
        if gtype == "LineString":
            row = session.execute(
                text("SELECT ST_Length(ST_GeomFromGeoJSON(:g)::geography) AS v"),
                {"g": geojson_str},
            ).first()
            meters = float(row.v) if row and row.v is not None else 0.0
            return {
                "type": "LineString",
                "metric": "length",
                "value": round(meters, 2),
                "unit": "m",
                "value_km": round(meters / 1000.0, 4),
            }
        row = session.execute(
            text("SELECT ST_Area(ST_GeomFromGeoJSON(:g)::geography) AS v"),
            {"g": geojson_str},
        ).first()
        sqm = float(row.v) if row and row.v is not None else 0.0
        return {
            "type": gtype,
            "metric": "area",
            "value": round(sqm, 2),
            "unit": "m²",
            "value_km2": round(sqm / 1_000_000.0, 6),
        }


import httpx

_WFS_TIMEOUT = 120.0

_CQL_BLOCKED = re.compile(
    r"(?:;|--|/\*|\*/|\\x|UNION\b|SELECT\b|INSERT\b|UPDATE\b|DELETE\b|DROP\b"
    r"|ALTER\b|CREATE\b|EXEC\b|EXECUTE\b|TRUNCATE\b|MERGE\b|REPLACE\b"
    r"|GRANT\b|REVOKE\b|SCRIPT\b)",
    re.IGNORECASE,
)

_YEAR_RE = re.compile(r'\d{4}')
_MONTH_RANGE = range(1, 13)


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


def compare_years(
    layer: str,
    year_a: str,
    year_b: str,
    municipio: str | None = None,
    view: dict | None = None,
    basemap: str = 'voyager',
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

    if not re.fullmatch(r'\d{4}', str(year_a)) or not re.fullmatch(r'\d{4}', str(year_b)):
        raise ValueError("year_a y year_b deben ser un anio de 4 digitos (p. ej. '2025')")

    layer_entry_a = {
        'slug': layer,
        'filters': {
            'date': _make_date_filter(str(year_a)),
        },
    }
    layer_entry_b = {
        'slug': layer,
        'filters': {
            'date': _make_date_filter(str(year_b)),
        },
    }

    norm_municipios = None
    if municipio:
        items = resolve_municipios(query=municipio, limit=1)
        if not items:
            raise ValueError(f"No se encontró el municipio '{municipio}'. Usa el tool municipios para buscar.")
        norm_municipios = {'source': 'iieg', 'selected': [items[0]['clave']]}

    resolved_view = view or _default_view(norm_municipios)

    kwargs = {
        'pane_a_layers': [layer_entry_a],
        'pane_b_layers': [layer_entry_b],
        'label_a': f'{node["label"]} {year_a}',
        'label_b': f'{node["label"]} {year_b}',
        'basemap': basemap,
        'position': 0.5,
        'view': resolved_view,
    }

    if norm_municipios:
        kwargs['municipios'] = norm_municipios

    return create_swipe_share(**kwargs)


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

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        gs_layer = node['wmsConfig'].get('geoserverLayer') or layer
        ws = node['wmsConfig'].get('geoserverWorkspace') or node['wmsConfig'].get('workspace', '')
        try:
            session.execute(text(f"SET LOCAL statement_timeout = {_POSTGIS_STATEMENT_TIMEOUT_MS}"))
            rows = session.execute(
                text(
                    "SELECT stats->>'label' AS label, stats->>'value' AS value, "
                    "stats->>'unit' AS unit "
                    "FROM mapalab.layer_stats, "
                    "jsonb_array_elements(values->'stats') AS stats "
                    "WHERE geoserver_workspace = :ws AND geoserver_layer = :l"
                ),
                {'ws': ws, 'l': gs_layer},
            ).fetchall()
        except Exception as exc:
            Logger.warning(f"get_layer_stats.query_error layer={layer} ws={ws} {exc}")
            rows = []

        stats = []
        for row in rows:
            stat = {'label': row.label}
            if row.value is not None:
                stat['value'] = row.value
            if row.unit is not None:
                stat['unit'] = row.unit
            stats.append(stat)

        return {
            'layer_id': layer,
            'label': node.get('label', ''),
            'stats': stats,
        }


def describe_layer(layer: str) -> dict:
    from app.services import layer_metadata_service

    fuzzy = _resolve_layer_fuzzy(layer)
    if not fuzzy:
        return {'error': f"No encontré la capa '{layer}'. Usa search_layers para ver ids válidos."}

    resolved_id = fuzzy['id']
    ws = fuzzy['workspace'] or ''
    label = fuzzy['label'] or resolved_id

    metadata = layer_metadata_service.get_metadata_response(ws, resolved_id, _acervo_base())
    metadata_result = [metadata] if metadata else []

    try:
        stats_result = get_layer_stats(layer=resolved_id)
    except ValueError as exc:
        stats_result = {'error': str(exc)}

    from app.services.periodicity_service import PeriodicityService
    ws_alias = fuzzy.get('workspace') or ''
    layer_key = f"{ws_alias}:{resolved_id}" if ws_alias else resolved_id
    raw_period = PeriodicityService.get_periodicities_batch([layer_key])
    periodicity = {k.split(':')[-1]: v for k, v in (raw_period or {}).items()}

    return {
        'id': resolved_id,
        'label': label,
        'metadata': metadata_result,
        'stats': stats_result,
        'periodicity': periodicity,
    }


def _acervo_base() -> str:
    return settings.ACERVO_PUBLIC_URL.rstrip('/') if settings.ACERVO_PUBLIC_URL else ''


def make_map(
    query: str,
    municipio: str | None = None,
    year: str | None = None,
    theme: str = '',
) -> dict:
    q = (query or '').strip()
    th = (theme or '').strip()
    if not q and not th:
        return {'error': "Pasa 'query' (texto) o 'theme' (area). Usa search_layers primero si necesitas explorar."}

    state = get_cached_state()
    tree = state['tree']

    best_layer_id = None
    best_label = None
    priority = 999

    if th:
        for item in search_by_theme(theme=th, limit=50):
            score = 1
            if q:
                haystack = f"{item.get('label', '')} {item.get('id', '')}".lower()
                if q.lower() not in haystack:
                    continue
                score = 0
            if score < priority:
                priority = score
                best_layer_id = item['id']
                best_label = item['label']
    else:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            search_terms = [q]
            words = [w for w in q.split() if len(w) > 2]
            if len(words) > 1:
                search_terms.extend(words)

            seen_ids: set[str] = set()
            for term_rank, term in enumerate(search_terms):
                fuzzy_layer = LayersRepository.find_layer_by_slug_or_alias(session, term)
                if fuzzy_layer is not None and fuzzy_layer.id not in seen_ids:
                    seen_ids.add(fuzzy_layer.id)
                    score = -1 if term_rank == 0 else term_rank
                    if score < priority:
                        priority = score
                        best_layer_id = fuzzy_layer.id
                        best_label = fuzzy_layer.label

                for row in LayersRepository.search_layers(session, term, limit=3):
                    if row.id in seen_ids:
                        continue
                    seen_ids.add(row.id)
                    score = term_rank
                    if score < priority:
                        priority = score
                        best_layer_id = row.id
                        best_label = row.label

    if not best_layer_id:
        return {'error': f"No encontré capas para '{query}'. Usa search_layers para explorar el catalogo."}

    layers_payload = [{'slug': best_layer_id}]

    if year:
        if not _YEAR_RE.fullmatch(str(year)):
            return {'error': "'year' debe ser 4 digitos (ej. '2025')."}
        layers_payload[0]['filters'] = {'date': _make_date_filter(str(year))}

    norm_municipios = None
    if municipio:
        items = resolve_municipios(query=municipio, limit=1)
        if not items:
            return {'error': f"No se encontró el municipio '{municipio}'. Usa el tool municipios para buscar."}
        norm_municipios = {'source': 'iieg', 'selected': [items[0]['clave']]}

    view = _default_view(norm_municipios)

    payload: dict[str, Any] = {'layers': layers_payload, 'view': view}
    if norm_municipios:
        payload['municipios'] = norm_municipios

    result = _persist_share({'version': 2, 'kind': 'single', 'payload': payload})
    result['layer'] = {'id': best_layer_id, 'label': best_label}
    return result
