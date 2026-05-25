from __future__ import annotations

import base64
import hashlib
import json
from typing import Any


CURRENT_SCHEMA_VERSION = 1
ALLOWED_KINDS = {"single", "swipe"}
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
        _validate_swipe_payload(payload)

    return kind, payload


def _validate_view(view: dict | None) -> None:
    if view is None:
        return
    if not isinstance(view, dict):
        raise ValueError("view debe ser objeto JSON")
    zoom = view.get("zoom")
    if zoom is not None and not (isinstance(zoom, (int, float)) and 1 <= zoom <= 24):
        raise ValueError("view.zoom fuera de rango")


def _validate_layer_entries(entries: Any, source: str) -> None:
    if not isinstance(entries, list):
        raise ValueError(f"{source}.layers debe ser lista")
    for entry in entries:
        if not isinstance(entry, dict) or "slug" not in entry:
            raise ValueError(f"{source}: cada layer debe tener slug")
        opacity = entry.get("opacity", 1.0)
        if not (isinstance(opacity, (int, float)) and 0 <= opacity <= 1):
            raise ValueError(f"{source}: opacity fuera de rango en {entry.get('slug')}")


def _validate_single_payload(payload: dict) -> None:
    _validate_layer_entries(payload.get("layers"), "single.payload")
    _validate_view(payload.get("view"))


def _validate_swipe_payload(payload: dict) -> None:
    shared = payload.get("shared")
    if not isinstance(shared, dict):
        raise ValueError("swipe.payload.shared requerido")
    _validate_view(shared.get("view"))
    for pane_key in ("paneA", "paneB"):
        pane = payload.get(pane_key)
        if not isinstance(pane, dict):
            raise ValueError(f"swipe.payload.{pane_key} requerido")
        _validate_layer_entries(pane.get("layers"), f"swipe.payload.{pane_key}")
    active_slot = payload.get("activeSlot")
    if active_slot not in {"A", "B"}:
        raise ValueError("swipe.payload.activeSlot debe ser 'A' o 'B'")
    position = payload.get("position")
    if position is not None and not (isinstance(position, (int, float)) and 0 <= position <= 1):
        raise ValueError("swipe.payload.position fuera de rango [0,1]")
