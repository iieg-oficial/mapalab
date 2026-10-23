from __future__ import annotations

import re
from typing import Any, Optional

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.services.layer_tree_service import get_cached_state

from servers.blindaje import (
    limpiar_anotaciones,
    limpiar_capas,
    techo_compartidos,
    validar_etiqueta,
    validar_vista,
    vista3d_a_payload,
)
from servers.busqueda import buscar, indice_de_capas
from servers.compartidos import _persist_share, create_single_share, create_swipe_share
from servers.layers import filtro_de_municipio
from servers.resolve import (
    _resolve_layer_fuzzy,
    filtro_de_fecha,
    periodicidad_detallada,
    resolver_municipio,
    search_by_theme,
)

MAX_PALABRAS_BUSQUEDA = 8
MAX_BUSQUEDA = 200

__all__ = ['_persist_share', 'create_map', 'create_swipe']


def exigir_cupo() -> None:
    if not techo_compartidos.consumir():
        raise ValueError('Se alcanzó el límite de mapas que el MCP puede crear por ahora. Intenta en unos minutos.')


def _capas_del_catalogo(items: Optional[list]) -> list[dict]:
    capas = limpiar_capas(items)
    for capa in capas:
        resuelta = _resolve_layer_fuzzy(capa['slug'])
        if not resuelta:
            raise ValueError(f"No existe la capa '{capa['slug']}'. Usa search_layers para encontrar su id.")
        capa['slug'] = resuelta['id']
    return list({capa['slug']: capa for capa in capas}.values())


def _nodo(entry: dict) -> Optional[dict]:
    resuelta = _resolve_layer_fuzzy(entry['slug'])
    return (resuelta or {}).get('node')


def _municipio(municipio: Optional[str]) -> Optional[dict]:
    return resolver_municipio(municipio) if municipio else None


def _seleccion(item: Optional[dict]) -> Optional[dict]:
    return {'source': 'iieg', 'selected': [item['clave']]} if item else None


def _aplicar_municipio(entries: list[dict], item: Optional[dict]) -> None:
    if not item:
        return
    aplicadas = 0
    for entry in entries:
        node = _nodo(entry)
        filtro = filtro_de_municipio(node, item) if node else None
        if filtro:
            entry['filters'] = {**entry.get('filters', {}), 'municipio': filtro}
            aplicadas += 1
    if not aplicadas:
        raise ValueError("Ninguna capa del mapa se puede filtrar por municipio. Quita 'municipio' o usa una capa con capabilities.hasMunicipio.")


def _apply_year_filter(entries: list[dict], year: str, month: Optional[int] = None) -> None:
    temporales = 0
    for entry in entries:
        node = _nodo(entry)
        if not node or not periodicidad_detallada(node):
            continue
        entry['filters'] = {**entry.get('filters', {}), 'date': filtro_de_fecha(node, year, month)}
        temporales += 1
    if not temporales:
        raise ValueError("Ninguna capa del mapa es temporal; no se puede filtrar por año. Quita 'year'.")


def _pick_best_layer(query: str, theme: str = '') -> tuple[Optional[str], Optional[str]]:
    q = (query or '').strip()[:MAX_BUSQUEDA]
    th = (theme or '').strip()[:MAX_BUSQUEDA]
    if not q and not th:
        return None, None
    index = indice_de_capas(get_cached_state()['tree'])
    if th:
        del_tema = [c['id'] for c in search_by_theme(theme=th, limit=200)]
        ids = buscar(index, q, permitidos=del_tema) if q else del_tema
    else:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            exacta = LayersRepository.find_layer_by_slug_or_alias(session, q)
        ids = ([exacta.id] if exacta is not None else []) + buscar(index, ' '.join(q.split()[:MAX_PALABRAS_BUSQUEDA]))
    for layer_id in ids:
        resuelta = _resolve_layer_fuzzy(layer_id)
        if resuelta:
            return resuelta['id'], resuelta['label']
    return None, None


def create_map(
    query: Optional[str] = None,
    layers: Optional[list] = None,
    municipio: Optional[str] = None,
    year: Optional[str] = None,
    month: Optional[int] = None,
    theme: str = '',
    view: Optional[dict] = None,
    basemap: Optional[str] = None,
    selected: Optional[str] = None,
    annotations: Optional[list] = None,
    vista_3d: Any = None,
) -> dict:
    has_query = bool((query or '').strip() or (theme or '').strip())
    if has_query and layers:
        raise ValueError("Pasa 'query'/'theme' O 'layers', no ambos.")
    if not has_query and not layers:
        raise ValueError("Pasa 'query' (texto) o 'layers' (ids de capa).")
    exigir_cupo()

    view = validar_vista(view)
    annotations = limpiar_anotaciones(annotations)
    municipio_item = _municipio(municipio)

    layer_label = None
    if has_query:
        best_id, layer_label = _pick_best_layer(query or '', theme)
        if not best_id:
            raise ValueError(f"No encontré capas para '{(query or theme)[:MAX_BUSQUEDA]}'. Usa search_layers para explorar el catálogo.")
        entries = [{'slug': best_id}]
    else:
        entries = _capas_del_catalogo(layers)
        if not entries:
            raise ValueError("'layers' vacío o inválido. Pasa ids de capa (texto) u objetos {slug}.")

    if selected:
        resuelta = _resolve_layer_fuzzy(selected)
        if not resuelta or resuelta['id'] not in {entry['slug'] for entry in entries}:
            raise ValueError("'selected' debe ser una de las capas del mapa.")
        selected = resuelta['id']

    vista3d = vista3d_a_payload(vista_3d, {entry['slug'] for entry in entries}, _resolve_layer_fuzzy)
    if month is not None and not year:
        raise ValueError("'month' solo vale junto con 'year'.")
    if year:
        _apply_year_filter(entries, str(year), month)
    _aplicar_municipio(entries, municipio_item)

    result = create_single_share(
        layers=entries,
        view=view,
        basemap=basemap,
        selected=selected,
        annotations=annotations,
        municipios=_seleccion(municipio_item),
        vista3d=vista3d,
    )
    if layer_label:
        result['layer'] = {'id': entries[0]['slug'], 'label': layer_label}
    return result


def compare_years(
    layer: str,
    year_a: str,
    year_b: str,
    municipio_item: Optional[dict],
    **comunes: Any,
) -> dict:
    if not re.fullmatch(r'\d{4}', str(year_a)) or not re.fullmatch(r'\d{4}', str(year_b)):
        raise ValueError("year_a y year_b deben ser años de 4 dígitos (p. ej. '2025').")
    if str(year_a) == str(year_b):
        raise ValueError('year_a y year_b deben ser años distintos.')
    resuelta = _resolve_layer_fuzzy(layer)
    if not resuelta:
        raise ValueError(f"No encontré la capa '{layer}'. Usa search_layers para ver ids válidos.")
    node = resuelta['node']
    lado_a = [{'slug': node['id'], 'filters': {'date': filtro_de_fecha(node, str(year_a))}}]
    lado_b = [{'slug': node['id'], 'filters': {'date': filtro_de_fecha(node, str(year_b))}}]
    _aplicar_municipio(lado_a, municipio_item)
    _aplicar_municipio(lado_b, municipio_item)
    vista3d = vista3d_a_payload(comunes.pop('vista_3d', None), {node['id']}, _resolve_layer_fuzzy)
    return create_swipe_share(
        pane_a_layers=lado_a,
        pane_b_layers=lado_b,
        label_a=f"{node['label']} {year_a}"[:60],
        label_b=f"{node['label']} {year_b}"[:60],
        municipios=_seleccion(municipio_item),
        vista3d=vista3d,
        **comunes,
    )


def create_swipe(
    layer: Optional[str] = None,
    year_a: Optional[str] = None,
    year_b: Optional[str] = None,
    pane_a_layers: Optional[list] = None,
    pane_b_layers: Optional[list] = None,
    municipio: Optional[str] = None,
    position: float = 0.5,
    view: Optional[dict] = None,
    basemap: str = 'voyager',
    label_a: str = 'A',
    label_b: str = 'B',
    annotations: Optional[list] = None,
    vista_3d: Any = None,
) -> dict:
    use_layer = bool(layer)
    use_panes = bool(pane_a_layers or pane_b_layers)
    if use_layer and use_panes:
        raise ValueError("Usa `layer` (una capa en dos años) O `pane_a_layers`/`pane_b_layers` (dos capas), no ambos.")
    if not use_layer and not use_panes:
        raise ValueError("Faltan argumentos: para comparar años de una capa pasa layer+year_a+year_b; para comparar dos capas pasa pane_a_layers+pane_b_layers.")
    if use_layer and not (year_a and year_b):
        raise ValueError('Con `layer` debes pasar year_a y year_b (los dos años a comparar).')
    exigir_cupo()

    comunes: dict[str, Any] = {
        'position': position,
        'view': validar_vista(view),
        'basemap': basemap,
        'annotations': limpiar_anotaciones(annotations),
    }
    label_a = validar_etiqueta(label_a, 'label_a') or 'A'
    label_b = validar_etiqueta(label_b, 'label_b') or 'B'
    municipio_item = _municipio(municipio)

    if use_layer:
        return compare_years(layer, year_a, year_b, municipio_item, vista_3d=vista_3d, **comunes)

    entries_a = _capas_del_catalogo(pane_a_layers)
    entries_b = _capas_del_catalogo(pane_b_layers)
    if not entries_a or not entries_b:
        raise ValueError('Cada lado del comparador necesita al menos una capa.')
    vista3d = vista3d_a_payload(vista_3d, {entry['slug'] for entry in entries_a + entries_b}, _resolve_layer_fuzzy)
    if year_a:
        _apply_year_filter(entries_a, str(year_a))
    if year_b:
        _apply_year_filter(entries_b, str(year_b))
    if municipio_item:
        _aplicar_municipio(entries_a + entries_b, municipio_item)

    return create_swipe_share(
        pane_a_layers=entries_a,
        pane_b_layers=entries_b,
        label_a=label_a,
        label_b=label_b,
        municipios=_seleccion(municipio_item),
        vista3d=vista3d,
        **comunes,
    )
