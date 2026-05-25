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
    return (os.getenv('MAPALAB_PUBLIC_BASE_URL') or 'https://iieg.gob.mx').rstrip('/')


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


def create_single_share(
    layers: list,
    view: dict | None = None,
    basemap: str | None = None,
    selected: str | None = None,
    annotations: list | None = None,
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
    return _persist_share({"version": 1, "kind": "single", "payload": payload})


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
) -> dict:
    payload: dict[str, Any] = {
        "shared": {
            "view": view or {},
            "basemap": basemap,
            "selected": selected,
        },
        "paneA": {"label": label_a, "layers": _normalize_layer_entries(pane_a_layers)},
        "paneB": {"label": label_b, "layers": _normalize_layer_entries(pane_b_layers)},
        "activeSlot": active_slot if active_slot in {"A", "B"} else "A",
        "position": position,
    }
    if annotations:
        payload["annotations"] = annotations
    return _persist_share({"version": 1, "kind": "swipe", "payload": payload})


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
