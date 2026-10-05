from __future__ import annotations

import copy
import threading
import time
from typing import Any, Optional

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.services import acceso_capas
from app.services.layer_tree_service import _build_tree_from_rows

_TTL = 60
_LOCK = threading.Lock()
_cache: dict[str, Any] = {'exp': 0.0, 'nodos': {}, 'padre': {}}


def _indexar(nodes: list[dict], padre: Optional[str], nodos: dict[str, dict], padres: dict[str, Optional[str]]) -> None:
    for node in nodes:
        nodos[node['id']] = node
        padres[node['id']] = padre
        _indexar(node.get('children') or [], node['id'], nodos, padres)


def _arbol_completo() -> tuple[dict[str, dict], dict[str, Optional[str]]]:
    ahora = time.monotonic()
    with _LOCK:
        if _cache['exp'] > ahora:
            return _cache['nodos'], _cache['padre']
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        ws_map = {w.alias: w for w in LayersRepository.get_all_workspaces(session)}
        arbol = _build_tree_from_rows(
            LayersRepository.get_all_layers(session),
            ws_map,
            LayersRepository.get_aliases_by_layer(session),
            incluir_privadas=True,
        )
    nodos: dict[str, dict] = {}
    padres: dict[str, Optional[str]] = {}
    _indexar(arbol, None, nodos, padres)
    with _LOCK:
        _cache.update(exp=ahora + _TTL, nodos=nodos, padre=padres)
    return nodos, padres


def _podar(node: dict, visibles: set[str]) -> dict:
    copia = copy.copy(node)
    copia['privada'] = True
    copia['children'] = [_podar(h, visibles) for h in node.get('children') or [] if h['id'] in visibles]
    return copia


def complemento(usuario_id: Optional[int]) -> list[dict]:
    visibles = acceso_capas.visibles(usuario_id)
    if not visibles:
        return []
    nodos, padres = _arbol_completo()
    resultado = []
    for fid in sorted(visibles, key=lambda i: (nodos.get(i, {}).get('sortOrder') or 0, i)):
        if fid not in nodos:
            continue
        padre = padres.get(fid)
        if padre is not None and padre in visibles:
            continue
        if padre is not None and acceso_capas.es_privada(padre):
            continue
        resultado.append({'parentId': padre, 'node': _podar(nodos[fid], visibles)})
    return resultado


def capa_por_nombre_geoserver(nombre: str) -> list[str]:
    nodos, _ = _arbol_completo()
    ids = []
    for fid, node in nodos.items():
        wms = node.get('wmsConfig') or {}
        completo = f"{wms.get('geoserverWorkspace')}:{wms.get('geoserverLayer')}"
        if wms.get('geoserverLayer') and completo == nombre:
            ids.append(fid)
    return ids


def contar_capas(usuario_id: Optional[int]) -> int:
    nodos, _ = _arbol_completo()
    return sum(1 for fid in acceso_capas.visibles(usuario_id) if nodos.get(fid, {}).get('nodeType') == 'leaf')


def olvidar_cache() -> None:
    with _LOCK:
        _cache['exp'] = 0.0


def nodos_por_capa(workspace: str, capa: str) -> list[str]:
    nodos, _ = _arbol_completo()
    return [
        fid for fid, node in nodos.items()
        if (wms := node.get('wmsConfig') or {}).get('geoserverLayer') == capa
        and workspace in (wms.get('workspace'), wms.get('geoserverWorkspace'))
    ]


def nodos_privados() -> list[dict]:
    nodos, _ = _arbol_completo()
    privadas = acceso_capas.compuertas()
    return [{**node, 'children': []} for fid, node in nodos.items() if fid in privadas]


def privadas_no_visibles(referencias: list[str], usuario_id: Optional[int]) -> int:
    nodos, _ = _arbol_completo()
    privadas = acceso_capas.compuertas()
    visibles = acceso_capas.visibles(usuario_id)
    por_referencia: dict[str, str] = {}
    for fid in privadas:
        node = nodos.get(fid) or {}
        for ref in [fid, node.get('slug'), *(node.get('aliases') or [])]:
            if ref:
                por_referencia[str(ref).lower()] = fid
    encontradas = {por_referencia[r.lower()] for r in referencias if r and r.lower() in por_referencia}
    return sum(1 for fid in encontradas if fid not in visibles)
