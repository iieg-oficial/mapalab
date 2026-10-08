from __future__ import annotations

import re
from typing import Iterable, Optional

from fastapi import HTTPException

from app.services.layer_tree_service import get_cached_state
from app.utils.logger import Logger

WMS_ALLOWED_PARAMS = {
    'service', 'version', 'request', 'layers', 'styles', 'format',
    'transparent', 'srs', 'crs', 'bbox', 'width', 'height', 'tiled',
    'cql_filter', 'time', 'query_layers', 'info_format', 'feature_count',
    'x', 'y', 'i', 'j', 'env', 'exceptions',
}
_WORKSPACE_PATTERN = re.compile(r'^[a-z0-9_]+$')


def known_workspaces() -> set[str]:
    try:
        workspaces = get_cached_state().get('workspaces') or []
    except Exception as exc:
        Logger.warning(f'embed.wms_proxy.workspaces_no_disponibles {exc}')
        return set()
    return {ws['geoserverWorkspace'] for ws in workspaces if ws.get('geoserverWorkspace')}


def clean_params(items: Iterable[tuple[str, str]]) -> dict[str, str]:
    clean: dict[str, str] = {}
    for key, value in items:
        name = key.lower()
        if name not in WMS_ALLOWED_PARAMS:
            continue
        if name in clean:
            raise HTTPException(status_code=400, detail=f"El parámetro '{name}' viene repetido")
        clean[name] = value
    return clean


def split_layers(value: Optional[str]) -> list[str]:
    return [s.strip() for s in (value or '').split(',') if s.strip()]


def resolve_workspace(layers: list[str], known: set[str]) -> Optional[str]:
    if not layers:
        raise HTTPException(status_code=400, detail='Falta el parámetro layers')
    workspaces: set[str] = set()
    for layer in layers:
        workspace, sep, name = layer.partition(':')
        if not sep or not name or not _WORKSPACE_PATTERN.match(workspace) or workspace not in known:
            raise HTTPException(status_code=403, detail=f"La capa '{layer}' no pertenece a un espacio de trabajo conocido")
        workspaces.add(workspace)
    return workspaces.pop() if len(workspaces) == 1 else None


def check_allowed(layers: list[str], allowed: list[str]) -> None:
    if not allowed:
        return
    permitted = set(allowed)
    for layer in layers:
        if layer not in permitted:
            raise HTTPException(status_code=403, detail=f"La capa '{layer}' no está autorizada para esta llave")
