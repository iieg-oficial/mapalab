import json
import os
from typing import Any, Optional

from qgis.PyQt.QtCore import Qt
from qgis.PyQt.QtWidgets import QHBoxLayout, QLabel, QWidget

from ..api.client import MapaLabClient, MapaLabError
from ..theme import set_role

IDENTIDAD_FILE: str = 'identidad.json'

LOGO_HEIGHT: int = 26

TITULO: str = 'MapaLab'


def _identidad() -> dict[str, Any]:
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), IDENTIDAD_FILE)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, 'r', encoding='utf-8') as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return {}


def _es_tema_oscuro(widget: QWidget) -> bool:
    fondo = widget.palette().window().color()
    return fondo.lightness() < 128


def logo_url(widget: QWidget) -> Optional[str]:
    logos = _identidad().get('logos') or {}
    clave = 'logo.largo.oscuro' if _es_tema_oscuro(widget) else 'logo.largo.claro'
    return logos.get(clave) or logos.get('logo.largo.claro')


def _descargar_logo(client: MapaLabClient, url: str) -> Optional[bytes]:
    try:
        status, content, _ = client._request(url)
    except MapaLabError:
        return None
    if status and status >= 400:
        return None
    return content or None


def _widget_logo(datos: bytes) -> Optional[QWidget]:
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
        layout = QHBoxLayout()
        layout.setContentsMargins(8, 4, 8, 4)
        layout.setSpacing(8)

        self._texto = QLabel(TITULO)
        set_role(self._texto, 'title')
        layout.addWidget(self._texto)
        layout.addStretch(1)
        self.setLayout(layout)
        self._layout = layout

    def cargar_logo(self) -> bool:
        url = logo_url(self)
        if not url:
            return False

        datos = _descargar_logo(self._client, url)
        if not datos:
            return False

        widget = _widget_logo(datos)
        if widget is None:
            return False

        widget.setToolTip(TITULO)
        self._layout.replaceWidget(self._texto, widget)
        self._texto.hide()
        self._texto.deleteLater()
        return True
