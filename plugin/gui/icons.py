from typing import Any, Optional

from qgis.PyQt.QtCore import QByteArray
from qgis.PyQt.QtGui import QIcon, QImage, QPixmap

from ..api.client import MapaLabClient
from ..assets_cache import fetch_asset
from ..identidad import tema_icono_urls

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


def alias_de_tema(node: dict[str, Any]) -> str:
    wms_config = node.get('wmsConfig') or {}
    alias = wms_config.get('workspace')
    if isinstance(alias, str) and alias:
        return alias
    for hijo in node.get('children') or []:
        encontrado = alias_de_tema(hijo)
        if encontrado:
            return encontrado
    return ''


def icono_de_tema(client: MapaLabClient, node: dict[str, Any]) -> Optional[QIcon]:
    alias = alias_de_tema(node)
    if not alias:
        return None
    if alias in _memoria:
        return _memoria[alias]

    datos = fetch_asset(client, tema_icono_urls(alias))
    icono = _desde_svg(datos) if datos and b'<svg' in datos[:400] else None
    _memoria[alias] = icono
    return icono


def icono_de_nodo(client: MapaLabClient, node: dict[str, Any],
                  es_raiz: bool = False) -> Optional[QIcon]:
    url = node.get('iconUrl')
    if isinstance(url, str) and url:
        return icono_de_url(client, url)
    if es_raiz:
        return icono_de_tema(client, node)
    return None
