from __future__ import annotations

import os
from typing import Any, Optional
from urllib.parse import quote

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.municipios_repository import MunicipiosRepository
from app.repositories.share_repository import ShareRepository
from app.services.share_service import CURRENT_SCHEMA_VERSION, hash_id, validate_payload
from app.utils.logger import Logger

from servers.blindaje import ES_BETA

VISTA_JALISCO = {'zoom': 7.5, 'lat': 20.6, 'lon': -103.4}
ZOOM_POR_EXTENSION = ((4, 7), (2, 8), (1, 9), (0.5, 10), (0.2, 11))


def _public_base_url() -> str:
    return (os.getenv('MAPALAB_PUBLIC_BASE_URL') or 'https://iieg.jalisco.gob.mx').rstrip('/')


def _build_share_url(share_id: str) -> str:
    return f"{_public_base_url()}/mapalab/mapa?s={quote(share_id)}"


def _build_embed_html(share_id: str, height: int = 500) -> str:
    base = _public_base_url()
    return (
        f'<script src="{base}/mapalab/widget/v1/mapalab.js" defer></script>\n'
        f'<iieg-mapalab api-key="LLAVE_PUBLICA_DEL_SITIO" share="{quote(share_id)}" height="{height}"></iieg-mapalab>'
    )


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
        resultado = {'id': share.id, 'kind': share.kind, 'url': _build_share_url(share.id)}
    if ES_BETA:
        resultado['embed_html'] = _build_embed_html(resultado['id'])
    return resultado


def _default_view(municipios: Optional[dict] = None) -> dict:
    if not municipios or not municipios.get('selected'):
        return dict(VISTA_JALISCO)
    try:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            bbox = MunicipiosRepository.get_union_bbox(
                session=session,
                claves=municipios['selected'],
                source=municipios.get('source', 'iieg'),
                target_srid=4326,
            )
    except Exception as exc:
        Logger.warning(f"_default_view.bbox_error {type(exc).__name__}")
        return dict(VISTA_JALISCO)
    if not bbox:
        return dict(VISTA_JALISCO)
    dx, dy = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if dx <= 0 or dy <= 0:
        return dict(VISTA_JALISCO)
    extension = max(dx, dy)
    zoom = next((z for limite, z in ZOOM_POR_EXTENSION if extension > limite), 12)
    return {'zoom': zoom, 'lat': (bbox[1] + bbox[3]) / 2, 'lon': (bbox[0] + bbox[2]) / 2}


def create_single_share(
    layers: list[dict],
    view: Optional[dict] = None,
    basemap: Optional[str] = None,
    selected: Optional[str] = None,
    annotations: Optional[list] = None,
    municipios: Optional[dict] = None,
    vista3d: Optional[dict] = None,
) -> dict:
    payload: dict[str, Any] = {'layers': layers, 'view': view or _default_view(municipios)}
    opcionales = {'vista3d': vista3d, 'basemap': basemap, 'selected': selected, 'annotations': annotations, 'municipios': municipios}
    payload.update({k: v for k, v in opcionales.items() if v})
    return _persist_share({'version': 2, 'kind': 'single', 'payload': payload})


def create_swipe_share(
    pane_a_layers: list[dict],
    pane_b_layers: list[dict],
    position: float = 0.5,
    view: Optional[dict] = None,
    basemap: Optional[str] = None,
    label_a: str = 'A',
    label_b: str = 'B',
    annotations: Optional[list] = None,
    municipios: Optional[dict] = None,
    vista3d: Optional[dict] = None,
) -> dict:
    shared: dict[str, Any] = {'view': view or _default_view(municipios), 'basemap': basemap, 'selected': None}
    if vista3d:
        shared['vista3d'] = vista3d
    if municipios:
        shared['municipios'] = municipios
    payload: dict[str, Any] = {
        'shared': shared,
        'paneA': {'label': label_a, 'layers': pane_a_layers},
        'paneB': {'label': label_b, 'layers': pane_b_layers},
        'activeSlot': 'A',
        'position': position,
    }
    if annotations:
        payload['annotations'] = annotations
    return _persist_share({'version': 2, 'kind': 'swipe', 'payload': payload})
