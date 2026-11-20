from __future__ import annotations

import re
import threading
import time
import unicodedata
from typing import Optional

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.repositories.municipios_repository import MunicipiosRepository
from app.services.layer_tree_service import get_cached_state
from app.services.periodicity_service import PeriodicityService

_YEAR_RE = re.compile(r'\d{4}')
_COLUMNA_RE = re.compile(r'[A-Za-z_][A-Za-z0-9_]{0,62}')
MAX_REFERENCIA = 200
MAX_CANDIDATOS = 6
TTL_MUNICIPIOS_S = 600.0

_municipios_cache: dict[str, tuple[float, list[dict]]] = {}
_candado_municipios = threading.Lock()


def _find_node_in_tree(nodes: list[dict], target_id: str) -> Optional[dict]:
    for n in nodes:
        if n['id'] == target_id:
            return n
        if n.get('children'):
            found = _find_node_in_tree(n['children'], target_id)
            if found:
                return found
    return None


def _node_path(nodes: list[dict], target_id: str, trail: Optional[list[str]] = None) -> Optional[list[str]]:
    trail = trail or []
    for n in nodes:
        if n['id'] == target_id:
            return trail
        children = n.get('children')
        if children:
            found = _node_path(children, target_id, trail + [n.get('label', '')])
            if found is not None:
                return found
    return None


def normalizar(texto: str) -> str:
    descompuesto = unicodedata.normalize('NFKD', texto or '')
    return ''.join(c for c in descompuesto if not unicodedata.combining(c)).strip().lower()


def es_capa(node: Optional[dict]) -> bool:
    return bool(node) and not node.get('children') and bool(node.get('wmsConfig')) and not node.get('disabled')


def hojas_de(node: dict) -> list[str]:
    if not node.get('children'):
        return [node['id']] if es_capa(node) else []
    return [hoja for hijo in node['children'] for hoja in hojas_de(hijo)]


def _retrato(node: dict, pedido: str) -> dict:
    wms = node.get('wmsConfig') or {}
    retrato = {
        'id': node['id'],
        'label': node.get('label'),
        'workspace': wms.get('workspace'),
        'geoserver_workspace': wms.get('geoserverWorkspace'),
        'geoserver_layer': wms.get('geoserverLayer'),
        'node': node,
    }
    if pedido != node['id']:
        retrato['resuelto_de'] = pedido
    return retrato


def _rechazar_grupo(node: dict, ref: str) -> None:
    hojas = hojas_de(node)
    muestra = ', '.join(hojas[:MAX_CANDIDATOS]) + (' …' if len(hojas) > MAX_CANDIDATOS else '')
    raise ValueError(f"'{ref}' es un grupo del árbol, no una capa. Usa una de sus capas: {muestra or 'ninguna publicada'}.")


def _elegir_candidato(ref: str, candidatos: list[dict]) -> Optional[dict]:
    if len(candidatos) == 1:
        return candidatos[0]
    buscado = normalizar(ref)
    exactos = [n for n in candidatos if normalizar(n.get('label') or '') == buscado]
    if len(exactos) == 1:
        return exactos[0]
    return None


def _resolve_layer_fuzzy(ref: str) -> Optional[dict]:
    ref = (ref or '').strip()
    if not ref or len(ref) > MAX_REFERENCIA:
        return None
    tree = get_cached_state()['tree']

    node = _find_node_in_tree(tree, ref)
    if node is not None:
        if es_capa(node):
            return _retrato(node, ref)
        _rechazar_grupo(node, ref)

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer = LayersRepository.find_layer_by_slug_or_alias(session, ref)
        if layer is not None:
            node = _find_node_in_tree(tree, layer.id)
            if es_capa(node):
                return _retrato(node, ref)
        rows = LayersRepository.search_layers(session, ref, limit=50)

    vistos: set[str] = set()
    candidatos: list[dict] = []
    for row in rows:
        node = _find_node_in_tree(tree, row.id)
        if es_capa(node) and node['id'] not in vistos:
            vistos.add(node['id'])
            candidatos.append(node)
    if not candidatos:
        return None
    elegido = _elegir_candidato(ref, candidatos)
    if elegido is None:
        ids = ', '.join(n['id'] for n in candidatos[:MAX_CANDIDATOS])
        extra = f' y {len(candidatos) - MAX_CANDIDATOS} más' if len(candidatos) > MAX_CANDIDATOS else ''
        raise ValueError(f"'{ref}' coincide con varias capas: {ids}{extra}. Usa el id exacto.")
    return _retrato(elegido, ref)


def resolver_capa(ref: str) -> dict:
    resuelta = _resolve_layer_fuzzy(ref)
    if not resuelta:
        raise ValueError(f"No encontré la capa '{(ref or '')[:MAX_REFERENCIA]}'. Usa search_layers para ver ids válidos.")
    return resuelta


def search_by_theme(theme: str, limit: int = 50) -> list[dict]:
    tree = get_cached_state()['tree']
    buscado = normalizar(theme)
    results: list[dict] = []

    def collect_leaves(node: dict) -> None:
        if es_capa(node):
            results.append({
                'id': node['id'],
                'label': node.get('label', ''),
                'slug': node.get('slug', ''),
                'workspace': (node.get('wmsConfig') or {}).get('workspace', ''),
            })
        for child in node.get('children') or []:
            collect_leaves(child)

    def walk(nodes: list[dict]) -> None:
        for n in nodes:
            claves = {normalizar(n.get('label') or ''), normalizar(n.get('id') or ''),
                      normalizar((n.get('wmsConfig') or {}).get('workspace') or '')}
            if buscado in claves:
                collect_leaves(n)
            else:
                walk(n.get('children') or [])

    walk(tree)
    deduped = list({r['id']: r for r in results}.values())
    return deduped[:limit]


def _layer_key_for_stats(node: dict, layer: str) -> str:
    wms = node.get('wmsConfig') or {}
    gs_workspace = wms.get('geoserverWorkspace') or wms.get('workspace') or ''
    gs_layer = wms.get('geoserverLayer') or layer
    return f"{gs_workspace}:{gs_layer}"


def llave_de_periodicidad(node: dict) -> str:
    ws = (node.get('wmsConfig') or {}).get('workspace')
    return f"{ws}:{node['id']}" if ws else node['id']


def periodicidad_detallada(node: dict) -> dict[int, set[int]]:
    llave = llave_de_periodicidad(node)
    datos = (PeriodicityService.get_periodicities_batch([llave]) or {}).get(llave) or node.get('rasterPeriodicity')
    if not isinstance(datos, dict):
        return {}
    detalle: dict[int, set[int]] = {}
    for anio, meses in datos.items():
        if not str(anio).isdigit():
            continue
        detalle[int(anio)] = {int(m) for m in (meses or {}) if str(m).isdigit()} if isinstance(meses, dict) else set()
    return detalle


def _periodicity_summary(node: dict) -> dict:
    detalle = periodicidad_detallada(node)
    meses = sorted({m for valores in detalle.values() for m in valores})
    return {'años': sorted(detalle), 'meses': meses}


def describir_años(años: list[int]) -> str:
    if años and años == list(range(años[0], años[-1] + 1)):
        return f'{años[0]}–{años[-1]}' if len(años) > 1 else str(años[0])
    return ', '.join(str(a) for a in años)


def _make_date_filter(year: str, month: Optional[int] = None, columna: str = 'fecha') -> str:
    if month is not None:
        next_month = month + 1
        next_year = int(year)
        if next_month > 12:
            next_month = 1
            next_year += 1
        return f"({columna} >= '{year}-{month:02d}-01' AND {columna} < '{next_year}-{next_month:02d}-01')"
    return f"({columna} >= '{year}-01-01' AND {columna} < '{int(year) + 1}-01-01')"


def columna_de_fecha(node: dict) -> str:
    ws = (node.get('wmsConfig') or {}).get('workspace') or ''
    columna = PeriodicityService.get_date_column(ws, node['id'])
    return columna if _COLUMNA_RE.fullmatch(columna or '') else 'fecha'


def filtro_de_fecha(node: dict, year: Optional[str], month: Optional[int] = None) -> Optional[str]:
    if month is not None and not year:
        raise ValueError("'month' solo vale junto con 'year'.")
    if not year:
        return None
    if not _YEAR_RE.fullmatch(str(year)):
        raise ValueError("'year' debe ser un año de 4 dígitos (p. ej. '2025').")
    detalle = periodicidad_detallada(node)
    if not detalle:
        raise ValueError(f"La capa '{node['id']}' no tiene periodicidad temporal; quita 'year'.")
    anio = int(year)
    if anio not in detalle:
        raise ValueError(f"La capa '{node['id']}' no tiene datos de {year}. Años disponibles: {describir_años(sorted(detalle))}.")
    meses = detalle[anio]
    if month is not None and meses and month not in meses:
        raise ValueError(f"La capa '{node['id']}' no tiene datos de {month:02d}/{year}. Meses de {year}: {', '.join(str(m) for m in sorted(meses))}.")
    if (node.get('wmsConfig') or {}).get('timeEnabled'):
        return instante_time(node, anio, month or max(meses, default=1))
    return _make_date_filter(str(year), month, columna_de_fecha(node))


def instante_time(node: dict, anio: int, mes: int) -> str:
    """En una capa timeEnabled el filtro `date` es el instante TIME, jamás CQL (ver CLAUDE.md)."""
    por_mes = (node.get('rasterPeriodicity') or {}).get(str(anio)) or {}
    return str(por_mes.get(str(mes)) or f'{anio}-{mes:02d}-01')


def _todos_los_municipios() -> list[dict]:
    ahora = time.monotonic()
    with _candado_municipios:
        guardado = _municipios_cache.get('iieg')
        if guardado and ahora - guardado[0] < TTL_MUNICIPIOS_S:
            return guardado[1]
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        items = MunicipiosRepository.list_all(session)
    with _candado_municipios:
        _municipios_cache['iieg'] = (ahora, items)
    return items


def list_municipios() -> dict:
    items = _todos_los_municipios()
    return {'items': items, 'count': len(items)}


def resolve_municipios(query: str, limit: int = 10) -> list[dict]:
    buscado = normalizar(query)
    if not buscado:
        return []
    matches = [
        it for it in _todos_los_municipios()
        if buscado in normalizar(it.get('nombre') or '') or buscado in (it.get('clave') or '')
    ]
    return matches[: max(1, min(limit, 200))]


def resolver_municipio(texto: str) -> dict:
    buscado = normalizar(texto)
    items = _todos_los_municipios()
    exactos = [it for it in items if normalizar(it.get('nombre') or '') == buscado or it.get('clave') == buscado]
    if exactos:
        return exactos[0]
    parciales = [it for it in items if buscado and buscado in normalizar(it.get('nombre') or '')]
    if len(parciales) == 1:
        return parciales[0]
    if not parciales:
        raise ValueError(f"No se encontró el municipio '{(texto or '')[:80]}'. Usa el tool municipios para buscar.")
    nombres = ', '.join(f"{it['nombre']} ({it['clave']})" for it in parciales[:MAX_CANDIDATOS])
    raise ValueError(f"'{texto}' coincide con varios municipios: {nombres}. Usa el nombre completo o la clave.")


def _resolve_municipio_selection(municipio: Optional[str]) -> Optional[dict]:
    if not municipio:
        return None
    return {'source': 'iieg', 'selected': [resolver_municipio(municipio)['clave']]}
