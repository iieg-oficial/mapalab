from __future__ import annotations

import os
from typing import Any
from urllib.parse import quote

from sqlalchemy import text

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.share_repository import ShareRepository
from app.services.share_service import (
    CURRENT_SCHEMA_VERSION,
    hash_id,
    validate_payload,
)


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
        selected = [str(c) for c in municipios["selected"] if c]
        if not selected:
            return None
        return {"source": source, "selected": selected}
    return None


def create_single_share(
    layers: list,
    view: dict | None = None,
    basemap: str | None = None,
    selected: str | None = None,
    annotations: list | None = None,
    municipios: dict | list | None = None,
) -> dict:
    payload: dict[str, Any] = {"layers": _normalize_layer_entries(layers)}
    if view is not None:
        payload["view"] = view
    if basemap:
        payload["basemap"] = basemap
    if selected:
        payload["selected"] = selected
    if annotations:
        payload["annotations"] = annotations
    norm_municipios = _normalize_municipios(municipios)
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
    shared: dict[str, Any] = {
        "view": view or {},
        "basemap": basemap,
        "selected": selected,
    }
    norm_municipios = _normalize_municipios(municipios)
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
    import json
    geojson_str = json.dumps(geometry)
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
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


import re
from urllib.parse import urlencode

import httpx

from app.config import settings
from app.services.layer_tree_service import get_cached_state

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
    workspace: str,
    layer: str,
    cql_filter: str | None = None,
    limit: int = 1000,
    srs_name: str | None = None,
) -> dict:
    state = get_cached_state()
    tree = state['tree']

    def find_node(nodes, target):
        for n in nodes:
            if n['id'] == target:
                return n
            if n.get('children'):
                found = find_node(n['children'], target)
                if found:
                    return found
        return None

    node = find_node(tree, layer)
    if not node or not node.get('wmsConfig'):
        raise ValueError(f"Capa '{layer}' no encontrada en el arbol del visor")

    ws_map = {w['alias']: w['geoserver_workspace'] for w in state.get('workspaces', [])}
    gs_workspace = ws_map.get(workspace)
    if not gs_workspace:
        raise ValueError(f"Workspace '{workspace}' no encontrado")

    wms = node['wmsConfig']
    gs_layer = wms.get('layers') or wms.get('geoserverLayer') or layer
    if ':' not in gs_layer:
        gs_layer = f"{gs_workspace}:{gs_layer}"

    safe_cql = _sanitize_cql(cql_filter)
    params = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeNames': gs_layer,
        'outputFormat': 'application/json',
        'count': str(max(1, min(limit, 10000))),
    }
    if safe_cql:
        params['CQL_FILTER'] = safe_cql
    if srs_name:
        params['srsName'] = srs_name

    base = settings.GEOSERVER_URL.rstrip('/')
    url = f"{base}/{gs_workspace}/ows?{urlencode(params)}"
    auth = None
    if settings.GEOSERVER_USER and settings.GEOSERVER_PASSWORD:
        auth = (settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD)

    try:
        with httpx.Client(timeout=_WFS_TIMEOUT, verify=False) as client:
            response = client.get(url, auth=auth)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        raise ValueError(f"GeoServer error {exc.response.status_code}: {exc.response.text[:300]}")
    except httpx.RequestError as exc:
        raise ValueError(f"No se pudo conectar a GeoServer: {exc}")
