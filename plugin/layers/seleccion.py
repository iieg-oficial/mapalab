from typing import Any, Optional

from qgis.core import (
    Qgis,
    QgsCoordinateReferenceSystem,
    QgsCoordinateTransform,
    QgsFeature,
    QgsField,
    QgsFields,
    QgsFillSymbol,
    QgsLineSymbol,
    QgsMarkerSymbol,
    QgsProject,
    QgsVariantUtils,
    QgsVectorLayer,
    QgsWkbTypes,
)
from qgis.PyQt.QtCore import QVariant
from qgis.PyQt.QtGui import QColor

from ..config import DATA_CRS
from ..theme import color_de_rol

SELECCION_PROPERTY: str = 'mapalab/seleccionDe'

CAMPO_ORIGEN: str = 'mapalab_fid'

PREFIJO: str = 'Selección — '

ALPHA_RELLENO: int = 60

ALPHA_RESALTE: int = 150

ANCHO_BORDE: str = '0.5'

TAMANO_PUNTO: str = '3'

TIPOS_SOPORTADOS: set = {
    QVariant.Bool,
    QVariant.Date,
    QVariant.DateTime,
    QVariant.Double,
    QVariant.Int,
    QVariant.LongLong,
    QVariant.String,
    QVariant.Time,
}


def _colores() -> tuple[str, str]:
    borde = QColor(color_de_rol('primary', 'background-color', '#5C2472'))
    relleno = QColor(borde)
    relleno.setAlpha(ALPHA_RELLENO)
    return relleno.name(QColor.HexArgb), borde.name()


def _color_resalte() -> QColor:
    color = QColor(color_de_rol('primary', 'background-color', '#5C2472'))
    color.setAlpha(ALPHA_RESALTE)
    return color


def _simbolo(capa: QgsVectorLayer) -> Any:
    relleno, borde = _colores()
    if capa.geometryType() == QgsWkbTypes.PointGeometry:
        return QgsMarkerSymbol.createSimple(
            {'color': relleno, 'outline_color': borde, 'size': TAMANO_PUNTO})
    if capa.geometryType() == QgsWkbTypes.LineGeometry:
        return QgsLineSymbol.createSimple({'color': borde, 'width': ANCHO_BORDE})
    return QgsFillSymbol.createSimple(
        {'color': relleno, 'outline_color': borde, 'outline_width': ANCHO_BORDE})


def _es_estructura(valor: Any) -> bool:
    return isinstance(valor, (dict, list, tuple, bytes, bytearray))


def _campos_utiles(feature: QgsFeature) -> list[QgsField]:
    utiles: list[QgsField] = []
    for campo in feature.fields():
        if campo.type() not in TIPOS_SOPORTADOS:
            continue
        if _es_estructura(feature[campo.name()]):
            continue
        utiles.append(QgsField(campo))
    return utiles


def _copiar_atributos(destino: QgsFeature, origen: QgsFeature, campos: QgsFields) -> None:
    for campo in origen.fields():
        indice = campos.indexOf(campo.name())
        if indice < 0:
            continue
        valor: Any = origen[campo.name()]
        if QgsVariantUtils.isNull(valor) or _es_estructura(valor):
            continue
        if campos.at(indice).type() == QVariant.String and not isinstance(valor, str):
            valor = str(valor)
        destino.setAttribute(indice, valor)


def _existente(node_id: str) -> Optional[QgsVectorLayer]:
    for capa in QgsProject.instance().mapLayers().values():
        if str(capa.customProperty(SELECCION_PROPERTY) or '') == node_id:
            return capa if isinstance(capa, QgsVectorLayer) else None
    return None


def _crear(node_id: str, nombre: str, feature: QgsFeature) -> Optional[QgsVectorLayer]:
    tipo = QgsWkbTypes.displayString(feature.geometry().wkbType())
    capa = QgsVectorLayer(f'{tipo}?crs={DATA_CRS}', f'{PREFIJO}{nombre}', 'memory')
    if not capa.isValid():
        return None

    campos = _campos_utiles(feature)
    campos.append(QgsField(CAMPO_ORIGEN, QVariant.String))
    capa.dataProvider().addAttributes(campos)
    capa.updateFields()
    capa.setCustomProperty(SELECCION_PROPERTY, node_id)
    capa.renderer().setSymbol(_simbolo(capa))
    seleccion = capa.selectionProperties()
    seleccion.setSelectionRenderingMode(Qgis.SelectionRenderingMode.CustomColor)
    seleccion.setSelectionColor(_color_resalte())

    project = QgsProject.instance()
    project.addMapLayer(capa, False)
    project.layerTreeRoot().insertLayer(0, capa)
    return capa


def _fid_existente(capa: QgsVectorLayer, marca: str) -> Optional[int]:
    for existente in capa.getFeatures():
        if str(existente[CAMPO_ORIGEN]) == marca:
            return existente.id()
    return None


def _reproyectada(feature: QgsFeature, origen: QgsCoordinateReferenceSystem) -> QgsFeature:
    destino = QgsCoordinateReferenceSystem(DATA_CRS)
    if not origen.isValid() or origen == destino:
        return feature

    geometria = feature.geometry()
    transformacion = QgsCoordinateTransform(origen, destino, QgsProject.instance())
    if geometria.transform(transformacion) != 0:
        return feature

    copia = QgsFeature(feature)
    copia.setGeometry(geometria)
    return copia


def agregar(node_id: str, nombre: str, crs: QgsCoordinateReferenceSystem,
            feature: Optional[QgsFeature], marca: str,
            ) -> tuple[Optional[QgsVectorLayer], int, str]:
    if feature is None or not feature.hasGeometry():
        return None, -1, 'El servidor no devolvió la geometría de ese elemento.'
    if not node_id:
        return None, -1, 'Esa capa no la agregó MapaLab.'

    listo = _reproyectada(feature, crs)
    capa = _existente(node_id) or _crear(node_id, nombre, listo)
    if capa is None:
        return None, -1, 'No se pudo crear la capa de selección.'

    repetido = _fid_existente(capa, marca)
    if repetido is not None:
        return capa, repetido, ''

    copia = QgsFeature(capa.fields())
    copia.setGeometry(listo.geometry())
    _copiar_atributos(copia, listo, capa.fields())
    copia[CAMPO_ORIGEN] = marca

    correcto, agregados = capa.dataProvider().addFeatures([copia])
    if not correcto or not agregados:
        return None, -1, 'No se pudo copiar el elemento a la capa de selección.'

    capa.updateExtents()
    capa.triggerRepaint()
    return capa, agregados[0].id(), ''
