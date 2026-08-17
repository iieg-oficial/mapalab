from typing import Any, Optional

from qgis.core import QgsMapLayer, QgsProject

from ..model.tree import clean_label, iter_leaves, layer_key, node_cql
from .wms import crear_wms_layer

CQL_MAXIMO: int = 4000

GRUPO_PROPERTY: str = 'mapalab/grupoId'


def hojas_de(node: dict[str, Any]) -> list[dict[str, Any]]:
    if node.get('wmsConfig'):
        return [node]
    return list(iter_leaves(node.get('children') or []))


def es_grupo(node: Optional[dict[str, Any]]) -> bool:
    if not isinstance(node, dict) or node.get('wmsConfig'):
        return False
    return len(hojas_de(node)) > 1


def es_grupo_de_propiedades(node: Optional[dict[str, Any]]) -> bool:
    if not es_grupo(node):
        return False
    return len(por_tabla(hojas_de(node))) == 1


def capas_de_grupo(node_id: str) -> list[QgsMapLayer]:
    if not node_id:
        return []
    return [capa for capa in QgsProject.instance().mapLayers().values()
            if str(capa.customProperty(GRUPO_PROPERTY) or '') == node_id]


def grupo_cargado(node_id: str) -> bool:
    return bool(capas_de_grupo(node_id))


def quitar_grupo(node_id: str) -> int:
    project = QgsProject.instance()
    capas = capas_de_grupo(node_id)
    for capa in capas:
        project.removeMapLayer(capa.id())

    raiz = project.layerTreeRoot()
    for nodo in list(raiz.children()):
        if hasattr(nodo, 'children') and not nodo.children() and nodo.name():
            raiz.removeChildNode(nodo)
    return len(capas)


def por_tabla(hojas: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    tablas: dict[str, list[dict[str, Any]]] = {}
    for hoja in hojas:
        clave = layer_key(hoja) or ''
        if clave:
            tablas.setdefault(clave, []).append(hoja)
    return tablas


def cql_de_tabla(hojas: list[dict[str, Any]]) -> str:
    filtros = [node_cql(hoja) for hoja in hojas]
    if not all(filtros):
        return ''

    unicos: list[str] = []
    for filtro in filtros:
        if filtro not in unicos:
            unicos.append(filtro)

    if len(unicos) == 1:
        return unicos[0]

    combinado = ' OR '.join(f'({filtro})' for filtro in unicos)
    return combinado if len(combinado) <= CQL_MAXIMO else ''


def _nombre(hojas: list[dict[str, Any]], etiqueta_grupo: str) -> str:
    if len(hojas) == 1:
        return clean_label(hojas[0].get('label') or '')
    return etiqueta_grupo


def add_group_layers(node: dict[str, Any], modo: Optional[str] = None,
                     completa: bool = False) -> tuple[int, str]:
    hojas = hojas_de(node)
    tablas = por_tabla(hojas)
    if not tablas:
        return 0, 'Ese grupo no tiene capas publicadas.'

    etiqueta = clean_label(node.get('label') or 'Grupo')
    project = QgsProject.instance()
    destino = project.layerTreeRoot()
    if len(tablas) > 1:
        destino = project.layerTreeRoot().insertGroup(0, etiqueta)

    agregadas = 0
    fallo = ''
    for hojas_tabla in tablas.values():
        cql = '' if completa else cql_de_tabla(hojas_tabla)
        capa, razon = crear_wms_layer(
            hojas_tabla[0], cql, None, modo, _nombre(hojas_tabla, etiqueta))
        if capa is None:
            fallo = razon
            continue
        capa.setCustomProperty(GRUPO_PROPERTY, str(node.get('id') or ''))
        project.addMapLayer(capa, False)
        destino.insertLayer(0, capa)
        agregadas += 1

    if agregadas == 0:
        return 0, fallo or f'No se pudo agregar «{etiqueta}».'
    return agregadas, ''
