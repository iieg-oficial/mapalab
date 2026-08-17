from typing import Optional

from qgis.core import QgsMapLayer, QgsProject

from ..config import NODE_ID_PROPERTY


def capa_por_nodo(node_id: str) -> Optional[QgsMapLayer]:
    if not node_id:
        return None
    for capa in QgsProject.instance().mapLayers().values():
        if str(capa.customProperty(NODE_ID_PROPERTY) or '') == node_id:
            return capa
    return None


def nodo_cargado(node_id: str) -> bool:
    return capa_por_nodo(node_id) is not None


def quitar_nodo(node_id: str) -> int:
    project = QgsProject.instance()
    quitadas = 0
    for capa in list(project.mapLayers().values()):
        if str(capa.customProperty(NODE_ID_PROPERTY) or '') == node_id:
            project.removeMapLayer(capa.id())
            quitadas += 1
    return quitadas
