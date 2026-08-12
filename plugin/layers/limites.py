from typing import Any, Optional

from qgis.core import QgsDataSourceUri, QgsMapLayer, QgsProject

from ..config import CAPAS_BASE, MODO_IIEG, MODO_INEGI, NODE_ID_PROPERTY
from ..model.tree import find_node
from .wms import add_wms_layer, con_env


def _node_id(layer: QgsMapLayer) -> str:
    return str(layer.customProperty(NODE_ID_PROPERTY) or '')


def _capa_wms(layer: QgsMapLayer) -> str:
    if layer.providerType() != 'wms':
        return ''
    uri = QgsDataSourceUri()
    uri.setEncodedUri(layer.source())
    return uri.param('layers') or ''


def capas_del_modo(modo: str) -> list[QgsMapLayer]:
    ids = set(CAPAS_BASE.get(modo) or ())
    if not ids:
        return []
    return [capa for capa in QgsProject.instance().mapLayers().values()
            if _node_id(capa) in ids or _capa_wms(capa) in ids]


def modo_actual() -> Optional[str]:
    if capas_del_modo(MODO_INEGI):
        return MODO_INEGI
    if capas_del_modo(MODO_IIEG):
        return MODO_IIEG
    return None


def modo_contrario(modo: str) -> str:
    return MODO_IIEG if modo == MODO_INEGI else MODO_INEGI


def _quitar(modo: str) -> None:
    project = QgsProject.instance()
    for capa in capas_del_modo(modo):
        project.removeMapLayer(capa.id())


def capas_del_plugin() -> list[QgsMapLayer]:
    return [capa for capa in QgsProject.instance().mapLayers().values()
            if capa.providerType() == 'wms' and capa.customProperty(NODE_ID_PROPERTY)]


def actualizar_env(modo: str) -> int:
    cambiadas = 0
    for capa in capas_del_plugin():
        uri = con_env(capa.source(), modo)
        if uri == capa.source():
            continue
        capa.setDataSource(uri, capa.name(), 'wms')
        capa.triggerRepaint()
        cambiadas += 1
    return cambiadas


def aplicar_modo(arbol: list[dict[str, Any]], modo: str) -> tuple[bool, str]:
    ids = CAPAS_BASE.get(modo)
    if not ids:
        return False, f'No existe el modo «{modo}».'

    _quitar(modo_contrario(modo))

    presentes = {_node_id(capa) for capa in capas_del_modo(modo)}
    faltantes = [node_id for node_id in ids if node_id not in presentes]
    sin_catalogo: list[str] = []

    for node_id in reversed(faltantes):
        node = find_node(arbol, node_id)
        if node is None:
            sin_catalogo.append(node_id)
            continue
        capa, razon = add_wms_layer(node, al_tope=True, modo=modo)
        if capa is None:
            return False, f'No se pudo agregar «{node_id}»: {razon}'

    actualizar_env(modo)

    if sin_catalogo:
        return False, 'El catálogo no trae: ' + ', '.join(sin_catalogo)
    return True, ''
