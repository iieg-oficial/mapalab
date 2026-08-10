import os
from typing import Optional

from qgis.PyQt.QtCore import QSize, Qt
from qgis.PyQt.QtWidgets import QHBoxLayout, QLabel, QPushButton, QWidget

from ..api.client import MapaLabClient
from ..assets_cache import fetch_asset
from ..config import LOGO_HEIGHT
from ..identidad import guardar_icono, icono_urls, logo_urls, refrescar_urls
from ..theme import icono_refrescar, set_role

TITULO: str = 'MapaLab'


def es_tema_oscuro(widget: QWidget) -> bool:
    return widget.palette().window().color().lightness() < 128


def _widget_svg(datos: bytes, alto: int = LOGO_HEIGHT) -> Optional[QWidget]:
    try:
        from qgis.PyQt.QtSvg import QSvgWidget
    except ImportError:
        return None

    widget = QSvgWidget()
    widget.load(datos)
    tamano = widget.renderer().defaultSize()
    if not tamano.isValid() or tamano.height() <= 0:
        return None
    ancho = int(tamano.width() * alto / tamano.height())
    widget.setFixedSize(ancho, alto)
    return widget


FOOTER_HEIGHT: int = 26


def logo_widget(client: MapaLabClient, marca: str, oscuro: bool,
                alto: int = FOOTER_HEIGHT) -> Optional[QWidget]:
    datos = fetch_asset(client, logo_urls(marca, oscuro))
    if not datos:
        return None
    widget = _widget_svg(datos, alto)
    if widget is not None:
        widget.setToolTip(marca.upper())
    return widget


def montar_footer(footer: QWidget, layout: QHBoxLayout, client: MapaLabClient,
                  alto: int) -> None:
    oscuro = es_tema_oscuro(footer)
    iieg = logo_widget(client, 'iieg', oscuro, alto)
    jalisco = logo_widget(client, 'jalisco', oscuro, alto)

    if iieg is None and jalisco is None:
        footer.hide()
        return

    if iieg is not None:
        layout.addWidget(iieg, 0, Qt.AlignVCenter)
    layout.addStretch(1)
    if jalisco is not None:
        layout.addWidget(jalisco, 0, Qt.AlignVCenter)


class TitleBar(QWidget):

    def __init__(self, client: MapaLabClient, al_recargar=None,
                 parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self._client = client
        self._al_recargar = al_recargar
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

        if self._al_recargar is not None:
            self._layout.addWidget(self._boton_recargar(), 0, Qt.AlignVCenter)

        self._asegurar_icono()

    def _boton_recargar(self) -> QPushButton:
        boton = QPushButton()
        boton.setIcon(self._icono_refrescar())
        boton.setIconSize(QSize(18, 18))
        boton.setFixedSize(28, 28)
        boton.setToolTip('Recargar catálogo')
        boton.setFlat(True)
        boton.clicked.connect(self._al_recargar)
        set_role(boton, 'icon')
        return boton

    def _icono_refrescar(self):
        from qgis.PyQt.QtGui import QIcon, QPixmap

        datos = fetch_asset(self._client, refrescar_urls())
        if datos:
            pixmap = QPixmap()
            if pixmap.loadFromData(datos):
                return QIcon(pixmap)
        return icono_refrescar()

    def _logo(self, marca: str, oscuro: bool) -> Optional[QWidget]:
        return logo_widget(self._client, marca, oscuro, LOGO_HEIGHT)

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
