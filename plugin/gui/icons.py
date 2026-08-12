from typing import Any, Optional

from qgis.PyQt.QtCore import QByteArray, QSize
from qgis.PyQt.QtGui import QIcon, QImage, QPixmap
from qgis.PyQt.QtWidgets import QPushButton

from ..api.client import MapaLabClient
from ..assets_cache import fetch_asset
from ..identidad import refrescar_urls, tema_icono_urls
from ..model.tree import alias_de_tema
from ..theme import icono_refrescar, set_role

ICON_SIZE: int = 20

TEMA_ICON_SIZE: int = 34

RECARGA_ICON_SIZE: int = 18

RECARGA_BOTON_SIZE: int = 34

_memoria: dict[str, Optional[QIcon]] = {}


def _desde_svg(datos: bytes, tamano: int = ICON_SIZE) -> Optional[QIcon]:
    try:
        from qgis.PyQt.QtSvg import QSvgRenderer
    except ImportError:
        return None

    renderer = QSvgRenderer(QByteArray(datos))
    if not renderer.isValid():
        return None

    from qgis.PyQt.QtGui import QPainter
    imagen = QImage(tamano, tamano, QImage.Format_ARGB32)
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


def icono_de_tema(client: MapaLabClient, node: dict[str, Any],
                  hover: bool = False) -> Optional[QIcon]:
    alias = alias_de_tema(node)
    if not alias:
        return None

    clave = f'{alias}:hover' if hover else alias
    if clave in _memoria:
        return _memoria[clave]

    datos = fetch_asset(client, tema_icono_urls(alias, hover))
    icono = _desde_svg(datos, TEMA_ICON_SIZE) if datos and b'<svg' in datos[:400] else None
    if icono is None and hover:
        icono = icono_de_tema(client, node, hover=False)

    _memoria[clave] = icono
    return icono


def icono_de_recarga(client: MapaLabClient) -> QIcon:
    datos = fetch_asset(client, refrescar_urls())
    if datos:
        pixmap = QPixmap()
        if pixmap.loadFromData(datos):
            return QIcon(pixmap)
    return icono_refrescar()


def boton_de_recarga(client: MapaLabClient, al_pulsar: Any) -> QPushButton:
    boton = QPushButton()
    boton.setIcon(icono_de_recarga(client))
    boton.setIconSize(QSize(RECARGA_ICON_SIZE, RECARGA_ICON_SIZE))
    boton.setFixedSize(RECARGA_BOTON_SIZE, RECARGA_BOTON_SIZE)
    boton.setToolTip('Recargar catálogo')
    boton.setFlat(True)
    boton.clicked.connect(al_pulsar)
    set_role(boton, 'icon')
    return boton


def icono_de_nodo(client: MapaLabClient, node: dict[str, Any],
                  es_raiz: bool = False, hover: bool = False) -> Optional[QIcon]:
    url = node.get('iconUrl')
    if isinstance(url, str) and url:
        return icono_de_url(client, url)
    if es_raiz:
        return icono_de_tema(client, node, hover)
    return None
