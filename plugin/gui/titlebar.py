import os
from typing import Optional

from qgis.PyQt.QtWidgets import QHBoxLayout, QLabel, QWidget

from ..api.client import MapaLabClient
from ..assets_cache import fetch_asset
from ..config import LOGO_HEIGHT
from ..identidad import guardar_icono, icono_urls, logo_urls
from ..theme import set_role

TITULO: str = 'MapaLab'


def es_tema_oscuro(widget: QWidget) -> bool:
    return widget.palette().window().color().lightness() < 128


def _widget_svg(datos: bytes) -> Optional[QWidget]:
    try:
        from qgis.PyQt.QtSvg import QSvgWidget
    except ImportError:
        return None

    widget = QSvgWidget()
    widget.load(datos)
    tamano = widget.renderer().defaultSize()
    if not tamano.isValid() or tamano.height() <= 0:
        return None
    ancho = int(tamano.width() * LOGO_HEIGHT / tamano.height())
    widget.setFixedSize(ancho, LOGO_HEIGHT)
    return widget


class TitleBar(QWidget):

    def __init__(self, client: MapaLabClient, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self._client = client
        self.setMinimumHeight(LOGO_HEIGHT + 12)

        layout = QHBoxLayout()
        layout.setContentsMargins(10, 6, 10, 6)
        layout.setSpacing(10)
        self.setLayout(layout)
        self._layout = layout

    def cargar(self) -> None:
        oscuro = es_tema_oscuro(self)

        self._layout.addWidget(self._logo_o_texto('mapalab', oscuro, TITULO))
        self._layout.addStretch(1)

        derecha = self._logo('iieg', oscuro)
        if derecha is not None:
            self._layout.addWidget(derecha)

        self._asegurar_icono()

    def _logo(self, marca: str, oscuro: bool) -> Optional[QWidget]:
        datos = fetch_asset(self._client, logo_urls(marca, oscuro))
        if not datos:
            return None
        widget = _widget_svg(datos)
        if widget is not None:
            widget.setToolTip(marca.upper())
        return widget

    def _logo_o_texto(self, marca: str, oscuro: bool, texto: str) -> QWidget:
        widget = self._logo(marca, oscuro)
        if widget is not None:
            return widget
        etiqueta = QLabel(texto)
        set_role(etiqueta, 'title')
        return etiqueta

    def _asegurar_icono(self) -> None:
        from ..identidad import icono_guardado

        if icono_guardado():
            return
        datos = fetch_asset(self._client, icono_urls())
        if datos:
            guardar_icono(datos)
