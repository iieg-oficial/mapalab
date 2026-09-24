from __future__ import annotations

import base64
import hashlib
import json
from typing import Any


CURRENT_SCHEMA_VERSION = 2
ALLOWED_VERSIONS = {1, 2}
ALLOWED_KINDS = {"single", "swipe"}
MAX_PAYLOAD_BYTES = 256 * 1024
ALLOWED_ANNOTATION_TYPES = {"LineString", "Polygon", "Freehand", "Text", "Emoji"}
MAX_ANNOTATIONS = 200
MAX_COORDINATES_PER_GEOMETRY = 2000
ALLOWED_MUNICIPIO_SOURCES = {"iieg", "inegi"}
MAX_MUNICIPIOS = 125
MAX_PITCH_3D = 80
EXAGERACION_3D = (1, 5)
MAX_EXTRUIDAS_3D = 10


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
    if version not in ALLOWED_VERSIONS:
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


def _count_coordinates(coords: Any) -> int:
    if not isinstance(coords, list):
        return 0
    if coords and isinstance(coords[0], (int, float)):
        return 1
    return sum(_count_coordinates(c) for c in coords)


def _validate_geometry(geometry: Any, source: str) -> None:
    if not isinstance(geometry, dict):
        raise ValueError(f"{source}: geometry debe ser objeto GeoJSON")
    gtype = geometry.get("type")
    if gtype not in {"Point", "LineString", "Polygon", "MultiPolygon"}:
        raise ValueError(f"{source}: geometry.type invalido ({gtype})")
    coords = geometry.get("coordinates")
    if not isinstance(coords, list) or not coords:
        raise ValueError(f"{source}: geometry.coordinates requerido")
    if _count_coordinates(coords) > MAX_COORDINATES_PER_GEOMETRY:
        raise ValueError(f"{source}: geometry excede {MAX_COORDINATES_PER_GEOMETRY} coordenadas")


def _validate_annotations(annotations: Any, source: str) -> None:
    if annotations is None:
        return
    if not isinstance(annotations, list):
        raise ValueError(f"{source}.annotations debe ser lista")
    if len(annotations) > MAX_ANNOTATIONS:
        raise ValueError(f"{source}.annotations excede {MAX_ANNOTATIONS} items")
    for idx, item in enumerate(annotations):
        prefix = f"{source}.annotations[{idx}]"
        if not isinstance(item, dict):
            raise ValueError(f"{prefix} debe ser objeto")
        if not item.get("id"):
            raise ValueError(f"{prefix}.id requerido")
        atype = item.get("type")
        if atype not in ALLOWED_ANNOTATION_TYPES:
            raise ValueError(f"{prefix}.type debe ser uno de {sorted(ALLOWED_ANNOTATION_TYPES)}")
        _validate_geometry(item.get("geometry"), prefix)
        rotation = item.get("rotation")
        if rotation is not None and not isinstance(rotation, (int, float)):
            raise ValueError(f"{prefix}.rotation debe ser numero")


def _validate_municipios(municipios: Any, source: str) -> None:
    if municipios is None:
        return
    if not isinstance(municipios, dict):
        raise ValueError(f"{source}.municipios debe ser objeto")
    src = municipios.get("source")
    if src is not None and src not in ALLOWED_MUNICIPIO_SOURCES:
        raise ValueError(f"{source}.municipios.source debe ser uno de {sorted(ALLOWED_MUNICIPIO_SOURCES)}")
    selected = municipios.get("selected")
    if not isinstance(selected, list) or len(selected) == 0:
        raise ValueError(f"{source}.municipios.selected debe ser lista no vacia")
    if len(selected) > MAX_MUNICIPIOS:
        raise ValueError(f"{source}.municipios.selected excede {MAX_MUNICIPIOS} claves")
    for clave in selected:
        if not isinstance(clave, str) or not clave.strip():
            raise ValueError(f"{source}.municipios.selected: cada clave debe ser string no vacio")


def _es_numero(valor: Any) -> bool:
    return isinstance(valor, (int, float)) and not isinstance(valor, bool)


def _validate_vista3d(vista: Any, source: str) -> None:
    if vista is None:
        return
    if not isinstance(vista, dict):
        raise ValueError(f"{source}.vista3d debe ser objeto")
    pitch = vista.get("pitch")
    if not (_es_numero(pitch) and 0 <= pitch <= MAX_PITCH_3D):
        raise ValueError(f"{source}.vista3d.pitch fuera de rango [0,{MAX_PITCH_3D}]")
    bearing = vista.get("bearing", 0)
    if not (_es_numero(bearing) and -180 <= bearing <= 180):
        raise ValueError(f"{source}.vista3d.bearing fuera de rango [-180,180]")
    exaggeration = vista.get("exaggeration", 1)
    if not (_es_numero(exaggeration) and EXAGERACION_3D[0] <= exaggeration <= EXAGERACION_3D[1]):
        raise ValueError(f"{source}.vista3d.exaggeration fuera de rango {list(EXAGERACION_3D)}")
    extruir = vista.get("extruir", [])
    if not isinstance(extruir, list) or len(extruir) > MAX_EXTRUIDAS_3D:
        raise ValueError(f"{source}.vista3d.extruir debe ser lista de hasta {MAX_EXTRUIDAS_3D} capas")
    if not all(isinstance(slug, str) and slug.strip() for slug in extruir):
        raise ValueError(f"{source}.vista3d.extruir: cada capa debe ser string no vacio")


def _validate_single_payload(payload: dict) -> None:
    _validate_layer_entries(payload.get("layers"), "single.payload")
    _validate_view(payload.get("view"))
    _validate_annotations(payload.get("annotations"), "single.payload")
    _validate_municipios(payload.get("municipios"), "single.payload")
    _validate_vista3d(payload.get("vista3d"), "single.payload")


def _validate_swipe_payload(payload: dict) -> None:
    shared = payload.get("shared")
    if not isinstance(shared, dict):
        raise ValueError("swipe.payload.shared requerido")
    _validate_view(shared.get("view"))
    _validate_municipios(shared.get("municipios"), "swipe.payload.shared")
    _validate_vista3d(shared.get("vista3d"), "swipe.payload.shared")
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
    _validate_annotations(payload.get("annotations"), "swipe.payload")
