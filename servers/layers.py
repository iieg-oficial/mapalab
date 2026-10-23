from __future__ import annotations

import re
from typing import Any, Optional

from sqlalchemy import text

from app.config import settings
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.services.layer_tree_service import get_cached_state
from app.utils.logger import Logger

from servers.resolve import (
    _layer_key_for_stats,
    _node_path,
    _periodicity_summary,
    filtro_de_fecha,
    resolver_capa,
    resolver_municipio,
)

_NOMBRE_GS_RE = re.compile(r'[\w.\-]+(:[\w.\-]+)?')


def filtro_de_municipio(node: dict, municipio: dict) -> Optional[str]:
    meta = node.get('searchMeta') or {}
    if not meta.get('hasMunicipio'):
        return None
    campo = meta.get('municipioField') or 'municipio'
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]{0,62}', campo):
        return None
    valor = municipio['nombre'] if meta.get('municipioFieldType') == 'nombre' else municipio['clave']
    escapado = str(valor).replace("'", "''")
    return f"{campo} = '{escapado}'"


def es_raster(node: dict) -> bool:
    return node.get('geometryType') == 'raster'


def consultable_por_wfs(node: dict) -> bool:
    return (node.get('wmsConfig') or {}).get('wfsAvailable', True) is not False and not es_raster(node)


def resolver_consulta(
    layer: str,
    municipio: Optional[str] = None,
    year: Optional[str] = None,
    month: Optional[int] = None,
) -> tuple[dict, str, str, list[str]]:
    state = get_cached_state()
    node = resolver_capa(layer)['node']
    wms = node['wmsConfig']
    if es_raster(node):
        raise ValueError(f"La capa '{node['id']}' es ráster: no tiene filas ni cifras consultables. Usa describe_layer para su ficha o create_map para verla.")
    if not consultable_por_wfs(node):
        raise ValueError(f"La capa '{node['id']}' no publica sus datos por WFS. Usa describe_layer para su ficha o create_map para verla.")
    ws_map = {w.get('alias'): w.get('geoserver_workspace') for w in state.get('workspaces', []) if w.get('alias')}
    gs_workspace = wms.get('geoserverWorkspace') or ws_map.get(wms.get('workspace'))
    if not gs_workspace:
        raise ValueError(f"No se pudo resolver el workspace de la capa '{node['id']}'.")

    gs_layer = wms.get('wfsLayerName') or wms.get('layers') or wms.get('geoserverLayer')
    if not gs_layer or not _NOMBRE_GS_RE.fullmatch(gs_layer) or not _NOMBRE_GS_RE.fullmatch(gs_workspace):
        raise ValueError(f"La capa '{node['id']}' no tiene un servicio WFS consultable.")
    if ':' not in gs_layer:
        gs_layer = f"{gs_workspace}:{gs_layer}"

    parts: list[str] = [f"({wms['cqlFilter']})"] if wms.get('cqlFilter') else []
    fecha = filtro_de_fecha(node, year, month)
    if fecha:
        parts.append(fecha)
    if municipio:
        filtro = filtro_de_municipio(node, resolver_municipio(municipio))
        if not filtro:
            raise ValueError(f"La capa '{node['id']}' no soporta filtro por municipio. Usa search_layers para encontrar capas que sí lo soporten.")
        parts.append(filtro)

    return node, gs_workspace, gs_layer, parts


def _numeralia_from_values(raw: Any) -> list[dict]:
    if not isinstance(raw, list):
        return []
    by_pos = {v.get('posicion'): v for v in raw if isinstance(v, dict)}
    result: list[dict] = []
    for i in range(1, 9):
        v = by_pos.get(i)
        if v and (v.get('valor') or v.get('nombre')):
            result.append({'nombre': v.get('nombre'), 'valor': v.get('valor'), 'simbolo': v.get('simbolo')})
    return result


def leer_numeralia(node: dict) -> tuple[list[dict], Optional[str]]:
    layer_key = _layer_key_for_stats(node, node['id'])
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        try:
            row = session.execute(
                text("SELECT values, pie_numeralia FROM mapalab.layer_stats WHERE layer_key = :k"),
                {'k': layer_key},
            ).first()
        except Exception as exc:
            Logger.warning(f"describe_layer.numeralia_error key={layer_key} {type(exc).__name__}")
            row = None
    return _numeralia_from_values(row.values if row else None), row.pie_numeralia if row else None


def _capabilities_from_node(node: dict) -> dict:
    wms = node.get('wmsConfig') or {}
    search_meta = node.get('searchMeta') or {}
    caps: dict[str, Any] = {
        'temporal': bool(wms.get('timeEnabled')),
        'hasMunicipio': bool(search_meta.get('hasMunicipio')),
        'descargable': node.get('downloadable', True) is not False,
        'consultableWfs': consultable_por_wfs(node),
    }
    if search_meta.get('municipioField'):
        caps['municipioField'] = search_meta['municipioField']
    if node.get('zoomRange'):
        caps['zoomRange'] = node['zoomRange']
    return caps


def _acervo_base() -> str:
    return settings.ACERVO_PUBLIC_URL.rstrip('/') if settings.ACERVO_PUBLIC_URL else ''


def describe_layer(layer: str) -> dict:
    from app.services import layer_metadata_service

    resuelta = resolver_capa(layer)
    node = resuelta['node']
    meta = layer_metadata_service.get_metadata_response(resuelta['workspace'] or '', node['id'], _acervo_base()) or {}
    numeralia, pie = leer_numeralia(node)
    periodicidad = _periodicity_summary(node)
    path_labels = _node_path(get_cached_state()['tree'], node['id'])
    capabilities = _capabilities_from_node(node)
    capabilities['temporal'] = capabilities['temporal'] or bool(periodicidad['años'])

    retrato = {
        'id': node['id'],
        'label': resuelta['label'] or node['id'],
        'path': ' > '.join(path_labels) if path_labels else None,
        'capabilities': capabilities,
        'descripcion': meta.get('descripcion'),
        'fuentes': meta.get('fuentes'),
        'metodologia': meta.get('metodologia'),
        'frecuencia': meta.get('frecuencia_actualizacion'),
        'fecha_ultima': meta.get('fecha_ultima_actualizacion'),
        'metadato_archivos': meta.get('metadato'),
        'numeralia': numeralia,
        'pie_numeralia': pie,
        'periodicidad': periodicidad,
    }
    if resuelta.get('resuelto_de'):
        retrato['resuelto_de'] = resuelta['resuelto_de']
    return retrato
