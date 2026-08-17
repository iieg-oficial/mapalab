from typing import Any, Optional

from qgis.PyQt.QtCore import Qt
from qgis.PyQt.QtWidgets import QHBoxLayout, QLabel, QWidget

from ..api.client import MapaLabClient
from ..assets_cache import fetch_asset
from ..config import LOGO_HEIGHT
from ..identidad import guardar_icono, icono_urls, logo_urls
from ..theme import set_role

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


def montar_titulo(dock: Any, client: MapaLabClient, switch: QWidget) -> None:
    from ..theme import apply_theme

    barra = TitleBar(client, switch, dock)
    set_role(barra, 'panel')
    barra.setAutoFillBackground(True)
    apply_theme(barra)
    barra.cargar()
    dock.setTitleBarWidget(barra)


class TitleBar(QWidget):

    def __init__(self, client: MapaLabClient, switch: Optional[QWidget] = None,
                 parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self._client = client
        self._switch = switch
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

        if self._switch is not None:
            self._layout.addWidget(self._switch, 0, Qt.AlignVCenter)

        self._asegurar_icono()

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
