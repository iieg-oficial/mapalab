from typing import Optional

from qgis.core import QgsMapLayer, QgsProject

from ..config import NODE_ID_PROPERTY

GRUPO_PROPERTY: str = 'mapalab/grupoId'

SELECCION_PROPERTY: str = 'mapalab/seleccionDe'

PROPIEDADES: tuple[str, ...] = (NODE_ID_PROPERTY, GRUPO_PROPERTY, SELECCION_PROPERTY)


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


def es_del_plugin(capa: QgsMapLayer) -> bool:
    return any(capa.customProperty(propiedad) for propiedad in PROPIEDADES)


def quitar_grupos_vacios() -> None:
    raiz = QgsProject.instance().layerTreeRoot()
    for nodo in list(raiz.children()):
        if hasattr(nodo, 'children') and not nodo.children() and nodo.name():
            raiz.removeChildNode(nodo)


def limpiar_todo() -> int:
    project = QgsProject.instance()
    capas = [capa for capa in project.mapLayers().values() if es_del_plugin(capa)]
    for capa in capas:
        project.removeMapLayer(capa.id())
    quitar_grupos_vacios()
    return len(capas)
