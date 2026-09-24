from __future__ import annotations

import os
import re
from typing import Any
from urllib.parse import quote

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.repositories.share_repository import ShareRepository
from app.services.layer_tree_service import get_cached_state
from app.services.share_service import (
    CURRENT_SCHEMA_VERSION,
    hash_id,
    validate_payload,
)
from app.utils.logger import Logger

from servers.blindaje import (
    limpiar_anotaciones,
    limpiar_capas,
    techo_compartidos,
    validar_etiqueta,
    validar_vista,
    vista3d_a_payload,
)
from servers.resolve import (
    _find_node_in_tree,
    _make_date_filter,
    _resolve_layer_fuzzy,
    _resolve_municipio_selection,
    _years_for_layer,
    _YEAR_RE,
    resolve_municipios,
    search_by_theme,
)


def _public_base_url() -> str:
    return (os.getenv('MAPALAB_PUBLIC_BASE_URL') or 'https://iieg.jalisco.gob.mx').rstrip('/')


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


def _capas_del_catalogo(items: list | None) -> list[dict]:
    capas = limpiar_capas(items)
    for capa in capas:
        resuelta = _resolve_layer_fuzzy(capa['slug'])
        if not resuelta:
            raise ValueError(f"No existe la capa '{capa['slug']}'. Usa search_layers para encontrar su id.")
        capa['slug'] = resuelta['id']
    return capas


def _persist_share(envelope: dict) -> dict:
    kind, payload = validate_payload(envelope)
    if not techo_compartidos.consumir():
        raise ValueError('Se alcanzó el límite de mapas que el MCP puede crear por ahora. Intenta en unos minutos.')
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


def _normalize_municipios(municipios: dict | list | None) -> dict | None:
    if not municipios:
        return None
    if isinstance(municipios, list):
        return {"source": "iieg", "selected": [str(c) for c in municipios if c]}
    if isinstance(municipios, dict) and municipios.get("selected"):
        source = municipios.get("source") or "iieg"
        if source not in ("iieg", "inegi"):
            source = "iieg"
        selected = [str(c) for c in municipios["selected"] if c]
        if not selected:
            return None
        return {"source": source, "selected": selected}
    return None


def _default_view(municipios: dict | None = None) -> dict:
    if municipios and municipios.get('selected'):
        try:
            from app.repositories.municipios_repository import (
                MunicipiosRepository,
            )
            conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
            with conn.get_session() as session:
                bbox = MunicipiosRepository.get_union_bbox(
                    session=session,
                    claves=municipios['selected'],
                    source=municipios.get('source', 'iieg'),
                    target_srid=4326,
                )
            if bbox:
                lon = (bbox[0] + bbox[2]) / 2
                lat = (bbox[1] + bbox[3]) / 2
                dx = bbox[2] - bbox[0]
                dy = bbox[3] - bbox[1]
                if dx > 0 and dy > 0:
                    span = max(dx, dy)
                    if span > 4:
                        zoom = 7
                    elif span > 2:
                        zoom = 8
                    elif span > 1:
                        zoom = 9
                    elif span > 0.5:
                        zoom = 10
                    elif span > 0.2:
                        zoom = 11
                    else:
                        zoom = 12
                    return {'zoom': zoom, 'lat': lat, 'lon': lon}
        except Exception as exc:
            Logger.warning(f"_default_view.bbox_error {exc}")
    return {'zoom': 7.5, 'lat': 20.6, 'lon': -103.4}


def create_single_share(
    layers: list,
    view: dict | None = None,
    basemap: str | None = None,
    selected: str | None = None,
    annotations: list | None = None,
    municipios: dict | list | None = None,
    vista3d: dict | None = None,
) -> dict:
    norm_municipios = _normalize_municipios(municipios)
    resolved_view = view or _default_view(norm_municipios)
    payload: dict[str, Any] = {"layers": _normalize_layer_entries(layers), "view": resolved_view}
    if vista3d:
        payload["vista3d"] = vista3d
    if basemap:
        payload["basemap"] = basemap
    if selected:
        payload["selected"] = selected
    if annotations:
        payload["annotations"] = annotations
    if norm_municipios:
        payload["municipios"] = norm_municipios
    return _persist_share({"version": 2, "kind": "single", "payload": payload})


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
    municipios: dict | list | None = None,
    vista3d: dict | None = None,
) -> dict:
    norm_municipios = _normalize_municipios(municipios)
    resolved_view = view or _default_view(norm_municipios)
    shared: dict[str, Any] = {
        "view": resolved_view,
        "basemap": basemap,
        "selected": selected,
    }
    if vista3d:
        shared["vista3d"] = vista3d
    if norm_municipios:
        shared["municipios"] = norm_municipios
    payload: dict[str, Any] = {
        "shared": shared,
        "paneA": {"label": label_a, "layers": _normalize_layer_entries(pane_a_layers)},
        "paneB": {"label": label_b, "layers": _normalize_layer_entries(pane_b_layers)},
        "activeSlot": active_slot if active_slot in {"A", "B"} else "A",
        "position": position,
    }
    if annotations:
        payload["annotations"] = annotations
    return _persist_share({"version": 2, "kind": "swipe", "payload": payload})


def compare_years(
    layer: str,
    year_a: str,
    year_b: str,
    municipio: str | None = None,
    view: dict | None = None,
    basemap: str = 'voyager',
    vista_3d: Any = None,
) -> dict:
    node = _find_node_in_tree(get_cached_state()['tree'], layer)
    if not node or not node.get('wmsConfig'):
        fuzzy = _resolve_layer_fuzzy(layer)
        if fuzzy:
            node = fuzzy['node']
            layer = fuzzy['id']
        else:
            raise ValueError(f"No encontré la capa '{layer}'. Usa search_layers para ver ids válidos.")

    if not re.fullmatch(r'\d{4}', str(year_a)) or not re.fullmatch(r'\d{4}', str(year_b)):
        raise ValueError("year_a y year_b deben ser un anio de 4 digitos (p. ej. '2025')")

    layer_entry_a = {
        'slug': layer,
        'filters': {
            'date': _make_date_filter(str(year_a)),
        },
    }
    layer_entry_b = {
        'slug': layer,
        'filters': {
            'date': _make_date_filter(str(year_b)),
        },
    }

    norm_municipios = None
    if municipio:
        items = resolve_municipios(query=municipio, limit=1)
        if not items:
            raise ValueError(f"No se encontró el municipio '{municipio}'. Usa el tool municipios para buscar.")
        norm_municipios = {'source': 'iieg', 'selected': [items[0]['clave']]}

    resolved_view = view or _default_view(norm_municipios)

    kwargs = {
        'pane_a_layers': [layer_entry_a],
        'pane_b_layers': [layer_entry_b],
        'label_a': f'{node["label"]} {year_a}',
        'label_b': f'{node["label"]} {year_b}',
        'basemap': basemap,
        'position': 0.5,
        'view': resolved_view,
        'vista3d': vista3d_a_payload(vista_3d, {layer}, _resolve_layer_fuzzy),
    }

    if norm_municipios:
        kwargs['municipios'] = norm_municipios

    return create_swipe_share(**kwargs)


def _pick_best_layer(query: str, theme: str = '') -> tuple[str | None, str | None]:
    q = (query or '').strip()
    th = (theme or '').strip()
    if not q and not th:
        return None, None

    best_layer_id = None
    best_label = None
    priority = 999

    if th:
        for item in search_by_theme(theme=th, limit=50):
            score = 1
            if q:
                haystack = f"{item.get('label', '')} {item.get('id', '')}".lower()
                if q.lower() not in haystack:
                    continue
                score = 0
            if score < priority:
                priority = score
                best_layer_id = item['id']
                best_label = item['label']
    else:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            search_terms = [q]
            words = [w for w in q.split() if len(w) > 2]
            if len(words) > 1:
                search_terms.extend(words)

            seen_ids: set[str] = set()
            for term_rank, term in enumerate(search_terms):
                fuzzy_layer = LayersRepository.find_layer_by_slug_or_alias(session, term)
                if fuzzy_layer is not None and fuzzy_layer.id not in seen_ids:
                    seen_ids.add(fuzzy_layer.id)
                    score = -1 if term_rank == 0 else term_rank
                    if score < priority:
                        priority = score
                        best_layer_id = fuzzy_layer.id
                        best_label = fuzzy_layer.label

                for row in LayersRepository.search_layers(session, term, limit=3):
                    if row.id in seen_ids:
                        continue
                    seen_ids.add(row.id)
                    score = term_rank
                    if score < priority:
                        priority = score
                        best_layer_id = row.id
                        best_label = row.label

    return best_layer_id, best_label


def _apply_year_filter(entries: list[dict], year: str) -> None:
    if not _YEAR_RE.fullmatch(str(year)):
        raise ValueError("'year' debe ser 4 digitos (ej. '2025').")
    ref = entries[0].get('slug')
    años = _years_for_layer(ref)
    if not años:
        raise ValueError(f"La capa '{ref}' no tiene periodicidad temporal; no se puede filtrar por año. Quita 'year'.")
    if int(year) not in años:
        raise ValueError(f"La capa '{ref}' no tiene datos para {year}. Años disponibles: {min(años)}–{max(años)}.")
    date_f = _make_date_filter(str(year))
    for e in entries:
        filters = dict(e.get('filters') or {})
        filters['date'] = date_f
        e['filters'] = filters


def create_map(
    query: str | None = None,
    layers: list | None = None,
    municipio: str | None = None,
    year: str | None = None,
    theme: str = '',
    view: dict | None = None,
    basemap: str | None = None,
    selected: str | None = None,
    annotations: list | None = None,
    vista_3d: Any = None,
) -> dict:
    has_query = bool((query or '').strip() or (theme or '').strip())
    has_layers = bool(layers)
    if has_query and has_layers:
        raise ValueError("Pasa 'query'/'theme' O 'layers', no ambos.")
    if not has_query and not has_layers:
        raise ValueError("Pasa 'query' (texto) o 'layers' (ids de capa).")

    view = validar_vista(view)
    annotations = limpiar_anotaciones(annotations)
    norm_municipios = _resolve_municipio_selection(municipio)

    layer_label = None
    if has_query:
        best_id, best_label = _pick_best_layer(query or '', theme)
        if not best_id:
            raise ValueError(f"No encontré capas para '{query or theme}'. Usa search_layers para explorar el catalogo.")
        entries = [{'slug': best_id}]
        layer_label = best_label
    else:
        entries = _capas_del_catalogo(layers)
        if not entries:
            raise ValueError("'layers' vacío o inválido. Pasa ids de capa (string) u objetos {slug}.")

    if selected:
        resuelta = _resolve_layer_fuzzy(selected)
        slugs = {entry['slug'] for entry in entries}
        if not resuelta or resuelta['id'] not in slugs:
            raise ValueError("'selected' debe ser una de las capas del mapa.")
        selected = resuelta['id']

    vista3d = vista3d_a_payload(vista_3d, {entry['slug'] for entry in entries}, _resolve_layer_fuzzy)
    if year:
        _apply_year_filter(entries, str(year))

    result = create_single_share(
        layers=entries,
        view=view,
        basemap=basemap,
        selected=selected,
        annotations=annotations,
        municipios=norm_municipios,
        vista3d=vista3d,
    )
    if layer_label:
        result['layer'] = {'id': entries[0]['slug'], 'label': layer_label}
    return result


def create_swipe(
    layer: str | None = None,
    year_a: str | None = None,
    year_b: str | None = None,
    pane_a_layers: list | None = None,
    pane_b_layers: list | None = None,
    municipio: str | None = None,
    position: float = 0.5,
    view: dict | None = None,
    basemap: str = 'voyager',
    label_a: str = 'A',
    label_b: str = 'B',
    annotations: list | None = None,
    vista_3d: Any = None,
) -> dict:
    view = validar_vista(view)
    annotations = limpiar_anotaciones(annotations)
    label_a = validar_etiqueta(label_a, 'label_a') or 'A'
    label_b = validar_etiqueta(label_b, 'label_b') or 'B'
    use_layer = bool(layer)
    use_panes = bool(pane_a_layers or pane_b_layers)
    if use_layer and use_panes:
        raise ValueError("Usa `layer` (una capa en dos años) O `pane_a_layers`/`pane_b_layers` (dos capas), no ambos.")
    if not use_layer and not use_panes:
        raise ValueError("Faltan args: para comparar años de una capa pasa layer+year_a+year_b; para comparar dos capas pasa pane_a_layers+pane_b_layers.")

    if use_layer:
        if not (year_a and year_b):
            raise ValueError("Con `layer` debes pasar year_a y year_b (los dos años a comparar).")
        return compare_years(
            layer=layer,
            year_a=year_a,
            year_b=year_b,
            municipio=municipio,
            view=view,
            basemap=basemap,
            vista_3d=vista_3d,
        )

    entries_a = _capas_del_catalogo(pane_a_layers)
    entries_b = _capas_del_catalogo(pane_b_layers)
    vista3d = vista3d_a_payload(vista_3d, {entry['slug'] for entry in entries_a + entries_b}, _resolve_layer_fuzzy)
    if year_a and entries_a:
        _apply_year_filter(entries_a, str(year_a))
    if year_b and entries_b:
        _apply_year_filter(entries_b, str(year_b))

    norm_municipios = _resolve_municipio_selection(municipio)
    return create_swipe_share(
        pane_a_layers=entries_a,
        pane_b_layers=entries_b,
        position=position,
        view=view,
        basemap=basemap,
        label_a=label_a,
        label_b=label_b,
        annotations=annotations,
        municipios=norm_municipios,
        vista3d=vista3d,
    )
