from typing import Any, Optional

from qgis.PyQt.QtCore import QByteArray
from qgis.PyQt.QtGui import QIcon, QImage, QPixmap

from ..api.client import MapaLabClient
from ..assets_cache import fetch_asset

ICON_SIZE: int = 20

_memoria: dict[str, Optional[QIcon]] = {}


def _desde_svg(datos: bytes) -> Optional[QIcon]:
    try:
        from qgis.PyQt.QtSvg import QSvgRenderer
    except ImportError:
        return None

    renderer = QSvgRenderer(QByteArray(datos))
    if not renderer.isValid():
        return None

    from qgis.PyQt.QtGui import QPainter
    imagen = QImage(ICON_SIZE, ICON_SIZE, QImage.Format_ARGB32)
    imagen.fill(0)
    painter = QPainter(imagen)
    renderer.render(painter)
    painter.end()
    return QIcon(QPixmap.fromImage(imagen))


def _desde_raster(datos: bytes) -> Optional[QIcon]:
    pixmap = QPixmap()
    if not pixmap.loadFromData(datos):
        return None
    return QIcon(pixmap.scaledToHeight(ICON_SIZE))


def icono_de_url(client: MapaLabClient, url: str) -> Optional[QIcon]:
    if not url:
        return None
    if url in _memoria:
        return _memoria[url]

    datos = fetch_asset(client, [url])
    icono: Optional[QIcon] = None
    if datos:
        icono = _desde_svg(datos) if b'<svg' in datos[:400] else _desde_raster(datos)

    _memoria[url] = icono
    return icono


def icono_de_nodo(client: MapaLabClient, node: dict[str, Any]) -> Optional[QIcon]:
    url = node.get('iconUrl')
    if isinstance(url, str) and url:
        return icono_de_url(client, url)
    return None
