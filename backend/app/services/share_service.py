from __future__ import annotations

import base64
import hashlib
import json
from typing import Any


CURRENT_SCHEMA_VERSION = 1
ALLOWED_KINDS = {"single", "compare"}
MAX_PAYLOAD_BYTES = 64 * 1024


def canonicalize(payload: Any) -> bytes:
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")


def hash_id(payload: Any, kind: str) -> str:
    canonical = canonicalize({"version": CURRENT_SCHEMA_VERSION, "kind": kind, "payload": payload})
    digest = hashlib.sha256(canonical).digest()[:7]
    return base64.b32encode(digest).decode("ascii").rstrip("=").lower()[:10]


def hash_ip(ip: str | None) -> str | None:
    if not ip:
        return None
    return hashlib.sha256(f"mapalab-share|{ip}".encode("utf-8")).hexdigest()


def validate_payload(envelope: dict) -> tuple[str, dict]:
    if not isinstance(envelope, dict):
        raise ValueError("envelope debe ser objeto JSON")
    version = envelope.get("version")
    if version != CURRENT_SCHEMA_VERSION:
        raise ValueError(f"version desconocida: {version}")
    kind = envelope.get("kind")
    if kind not in ALLOWED_KINDS:
        raise ValueError(f"kind invalido: {kind}")
    payload = envelope.get("payload")
    if not isinstance(payload, dict):
        raise ValueError("payload debe ser objeto JSON")

    raw = canonicalize(envelope)
    if len(raw) > MAX_PAYLOAD_BYTES:
        raise ValueError(f"payload excede {MAX_PAYLOAD_BYTES} bytes")

    if kind == "single":
        _validate_single_payload(payload)
    else:
        _validate_compare_payload(payload)

    return kind, payload


def _validate_single_payload(payload: dict) -> None:
    layers = payload.get("layers")
    if not isinstance(layers, list):
        raise ValueError("single.payload.layers debe ser lista")
    for entry in layers:
        if not isinstance(entry, dict) or "slug" not in entry:
            raise ValueError("cada layer debe tener slug")
        opacity = entry.get("opacity", 1.0)
        if not (isinstance(opacity, (int, float)) and 0 <= opacity <= 1):
            raise ValueError(f"opacity fuera de rango en {entry.get('slug')}")
    view = payload.get("view") or {}
    zoom = view.get("zoom")
    if zoom is not None and not (isinstance(zoom, (int, float)) and 1 <= zoom <= 24):
        raise ValueError("view.zoom fuera de rango")


def _validate_compare_payload(payload: dict) -> None:
    base = payload.get("base")
    if not isinstance(base, dict):
        raise ValueError("compare.payload.base requerido")
    _validate_single_payload(base)
    axis = payload.get("axis")
    if axis not in {"date", "filter", "geo"}:
        raise ValueError(f"axis invalido: {axis}")
    panes = payload.get("panes")
    if not isinstance(panes, list) or len(panes) < 2:
        raise ValueError("compare.payload.panes requiere al menos 2 entradas")
    for pane in panes:
        if not isinstance(pane, dict) or "value" not in pane:
            raise ValueError("cada pane requiere value")
