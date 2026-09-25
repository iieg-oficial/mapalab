from __future__ import annotations

import base64
import hashlib
import hmac
import json
from typing import Any

from app.config import settings


CURRENT_SCHEMA_VERSION = 2
ALLOWED_VERSIONS = {1, 2}
ALLOWED_KINDS = {"single", "swipe"}
MAX_PAYLOAD_BYTES = 256 * 1024
ALLOWED_ANNOTATION_TYPES = {"LineString", "Polygon", "Select", "Freehand", "Text", "Emoji", "Pin"}
MAX_ANNOTATIONS = 200
MAX_COORDINATES_PER_GEOMETRY = 2000
ALLOWED_MUNICIPIO_SOURCES = {"iieg", "inegi"}
ALLOWED_MUNICIPIO_SCOPES = {"municipio", "region", "zmg"}
MAX_SCOPE_VALUE = 80
MAX_MUNICIPIOS = 125
MAX_PITCH_3D = 80
EXAGERACION_3D = (1, 5)
MAX_EXTRUIDAS_3D = 10
MAX_CAPAS = 60
MAX_FILTROS_POR_CAPA = 20
MAX_REFERENCIA = 200
MAX_TEXTO_ANOTACION = 200
MAX_ETIQUETA_LADO = 60
TEXTOS_ANOTACION = ("id", "label", "unit", "textLabel", "pinEtiqueta")
RANGO_LAT = (10.0, 35.0)
RANGO_LON = (-120.0, -84.0)


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
    secret = settings.MAPALAB_SHARE_IP_HASH_SECRET
    if not ip or not secret:
        return None
    return hmac.new(secret.encode("utf-8"), f"mapalab-share|{ip}".encode("utf-8"), hashlib.sha256).hexdigest()


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
    for campo, (minimo, maximo) in (("lat", RANGO_LAT), ("lon", RANGO_LON)):
        valor = view.get(campo)
        if valor is not None and not (_es_numero(valor) and minimo <= valor <= maximo):
            raise ValueError(f"view.{campo} fuera de rango")
    rotation = view.get("rotation")
    if rotation is not None and not (_es_numero(rotation) and -360 <= rotation <= 360):
        raise ValueError("view.rotation fuera de rango")


def _validate_referencia(valor: Any, campo: str) -> None:
    if valor is None:
        return
    if not isinstance(valor, str) or not valor.strip() or len(valor) > MAX_REFERENCIA:
        raise ValueError(f"{campo} debe ser texto de hasta {MAX_REFERENCIA} caracteres")


def _validate_filtros(filtros: Any, source: str) -> None:
    if filtros is None:
        return
    if not isinstance(filtros, dict) or len(filtros) > MAX_FILTROS_POR_CAPA:
        raise ValueError(f"{source}.filters debe ser objeto de hasta {MAX_FILTROS_POR_CAPA} filtros")
    for nombre, valor in filtros.items():
        if len(nombre) > 64 or not isinstance(valor, (str, int, float, bool)):
            raise ValueError(f"{source}.filters.{nombre[:64]} invalido")


def _validate_layer_entries(entries: Any, source: str) -> None:
    if not isinstance(entries, list):
        raise ValueError(f"{source}.layers debe ser lista")
    if len(entries) > MAX_CAPAS:
        raise ValueError(f"{source}.layers excede {MAX_CAPAS} capas")
    for entry in entries:
        if not isinstance(entry, dict) or "slug" not in entry:
            raise ValueError(f"{source}: cada layer debe tener slug")
        _validate_referencia(entry["slug"], f"{source}.layers.slug")
        _validate_filtros(entry.get("filters"), f"{source}.{entry['slug']}")
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
        for campo in TEXTOS_ANOTACION:
            texto = item.get(campo)
            if texto is not None and (not isinstance(texto, (str, int, float)) or len(str(texto)) > MAX_TEXTO_ANOTACION):
                raise ValueError(f"{prefix}.{campo} debe ser texto de hasta {MAX_TEXTO_ANOTACION} caracteres")
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
        if not isinstance(clave, str) or not clave.strip() or len(clave) > 10:
            raise ValueError(f"{source}.municipios.selected: cada clave debe ser string no vacio")
    _validate_municipio_scope(municipios.get("scope"), source)


def _validate_municipio_scope(scope: Any, source: str) -> None:
    if scope is None:
        return
    if not isinstance(scope, dict) or scope.get("type") not in ALLOWED_MUNICIPIO_SCOPES:
        raise ValueError(f"{source}.municipios.scope.type debe ser uno de {sorted(ALLOWED_MUNICIPIO_SCOPES)}")
    value = scope.get("value")
    if value is not None and (not isinstance(value, str) or len(value) > MAX_SCOPE_VALUE):
        raise ValueError(f"{source}.municipios.scope.value debe ser texto de hasta {MAX_SCOPE_VALUE} caracteres")


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
    _validate_referencia(payload.get("basemap"), "single.payload.basemap")
    _validate_referencia(payload.get("selected"), "single.payload.selected")
    _validate_view(payload.get("view"))
    _validate_annotations(payload.get("annotations"), "single.payload")
    _validate_municipios(payload.get("municipios"), "single.payload")
    _validate_vista3d(payload.get("vista3d"), "single.payload")


def _validate_swipe_payload(payload: dict) -> None:
    shared = payload.get("shared")
    if not isinstance(shared, dict):
        raise ValueError("swipe.payload.shared requerido")
    _validate_view(shared.get("view"))
    _validate_referencia(shared.get("basemap"), "swipe.payload.shared.basemap")
    _validate_referencia(shared.get("selected"), "swipe.payload.shared.selected")
    _validate_municipios(shared.get("municipios"), "swipe.payload.shared")
    _validate_vista3d(shared.get("vista3d"), "swipe.payload.shared")
    for pane_key in ("paneA", "paneB"):
        pane = payload.get(pane_key)
        if not isinstance(pane, dict):
            raise ValueError(f"swipe.payload.{pane_key} requerido")
        _validate_layer_entries(pane.get("layers"), f"swipe.payload.{pane_key}")
        label = pane.get("label")
        if label is not None and (not isinstance(label, str) or len(label) > MAX_ETIQUETA_LADO):
            raise ValueError(f"swipe.payload.{pane_key}.label debe ser texto de hasta {MAX_ETIQUETA_LADO} caracteres")
    active_slot = payload.get("activeSlot")
    if active_slot not in {"A", "B"}:
        raise ValueError("swipe.payload.activeSlot debe ser 'A' o 'B'")
    position = payload.get("position")
    if position is not None and not (isinstance(position, (int, float)) and 0 <= position <= 1):
        raise ValueError("swipe.payload.position fuera de rango [0,1]")
    _validate_annotations(payload.get("annotations"), "swipe.payload")


def capas_del_payload(kind: str, payload: dict) -> set[str]:
    if kind == "single":
        grupos = [payload.get("layers") or []]
    else:
        grupos = [(payload.get(p) or {}).get("layers") or [] for p in ("paneA", "paneB")]
    return {entry["slug"] for grupo in grupos for entry in grupo}


def validar_capas_en_catalogo(kind: str, payload: dict, conocidas: set[str]) -> None:
    desconocidas = sorted(s for s in capas_del_payload(kind, payload) if s not in conocidas and s.lower() not in conocidas)
    if desconocidas:
        raise ValueError(f"capas que no estan en el catalogo: {', '.join(desconocidas[:3])}")
