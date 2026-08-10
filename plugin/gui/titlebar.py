import os
from typing import Optional

from qgis.PyQt.QtWidgets import QHBoxLayout, QLabel, QWidget
from qgis.core import QgsApplication

from ..api.client import MapaLabClient, MapaLabError
from ..config import LOGO_HEIGHT, LOGOS, logo_url
from ..theme import set_role

TITULO: str = 'MapaLab'

CACHE_DIR: str = 'logos'


def _cache_path(nombre: str) -> str:
    carpeta = os.path.join(QgsApplication.qgisSettingsDirPath(), 'mapalab', CACHE_DIR)
    os.makedirs(carpeta, exist_ok=True)
    return os.path.join(carpeta, nombre)


def _leer_cache(nombre: str) -> Optional[bytes]:
    path = _cache_path(nombre)
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'rb') as handle:
            return handle.read() or None
    except OSError:
        return None


def _escribir_cache(nombre: str, datos: bytes) -> None:
    try:
        with open(_cache_path(nombre), 'wb') as handle:
            handle.write(datos)
    except OSError:
        pass


def es_tema_oscuro(widget: QWidget) -> bool:
    return widget.palette().window().color().lightness() < 128


def obtener_logo(client: MapaLabClient, marca: str, oscuro: bool) -> Optional[bytes]:
    archivo = LOGOS.get(marca, ('', ''))[1 if oscuro else 0]
    if not archivo:
        return None

    cacheado = _leer_cache(archivo)
    if cacheado:
        return cacheado

    url = logo_url(marca, oscuro)
    if not url:
        return None

    try:
        status, content, _ = client._request(url)
    except MapaLabError:
        return None

    if (status and status >= 400) or not content:
        return None

    _escribir_cache(archivo, content)
    return content


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

        izquierda = self._logo_o_texto('mapalab', oscuro, TITULO)
        self._layout.addWidget(izquierda)
        self._layout.addStretch(1)

        derecha = self._logo('iieg', oscuro)
        if derecha is not None:
            self._layout.addWidget(derecha)

    def _logo(self, marca: str, oscuro: bool) -> Optional[QWidget]:
        datos = obtener_logo(self._client, marca, oscuro)
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
