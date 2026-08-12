from typing import Any, Optional

from qgis.core import QgsFeature, QgsVectorLayer
from qgis.gui import QgsAttributeDialog, QgsAttributeEditorContext
from qgis.PyQt.QtWidgets import QWidget

ANCHO_MINIMO: int = 320

ALTO_MINIMO: int = 180

ANCHO_TOPE: int = 720

ALTO_TOPE: int = 640

MARGEN_PANTALLA: float = 0.75


def _topes(dialogo: QWidget) -> tuple[int, int]:
    pantalla = dialogo.screen()
    if pantalla is None:
        return ANCHO_TOPE, ALTO_TOPE
    libre = pantalla.availableGeometry()
    return (min(ANCHO_TOPE, int(libre.width() * MARGEN_PANTALLA)),
            min(ALTO_TOPE, int(libre.height() * MARGEN_PANTALLA)))


def _ajustar(dialogo: QWidget) -> None:
    dialogo.adjustSize()
    ancho_tope, alto_tope = _topes(dialogo)
    deseado = dialogo.sizeHint()
    dialogo.resize(max(ANCHO_MINIMO, min(deseado.width(), ancho_tope)),
                   max(ALTO_MINIMO, min(deseado.height(), alto_tope)))


def abrir_ficha(capa: QgsVectorLayer, feature: QgsFeature,
                parent: Optional[QWidget] = None) -> Any:
    contexto = QgsAttributeEditorContext()
    contexto.setFormMode(QgsAttributeEditorContext.StandaloneDialog)

    dialogo = QgsAttributeDialog(capa, feature, False, parent, True, contexto)
    dialogo.setMode(QgsAttributeEditorContext.IdentifyMode)
    dialogo.setWindowTitle(capa.name())
    dialogo.show()
    _ajustar(dialogo)
    return dialogo
