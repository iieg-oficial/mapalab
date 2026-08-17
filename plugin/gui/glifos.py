from qgis.PyQt.QtCore import QPointF, QRect, QRectF, Qt
from qgis.PyQt.QtGui import QColor, QPainter, QPainterPath, QPen

from ..theme import color_de_rol, color_de_selector

LINEA_RESPALDO: str = '#2e7d32'


def geom_colors() -> dict[str, str]:
    return {
        'point': color_de_rol('heading', 'color', '#2e4372'),
        'line': LINEA_RESPALDO,
        'polygon': color_de_rol('primary', 'background-color', '#5C2472'),
        'raster': color_de_selector('QTreeView::item:selected', 'color', '#A85700'),
    }

VIEWBOX: float = 24.0

TRAZO: float = 1.8

RELLENO_ALPHA: int = 46

VERTICES: dict[str, tuple[tuple[float, float, float], ...]] = {
    'point': ((12.0, 5.5, 1.9), (18.5, 16.5, 1.9), (5.5, 16.5, 1.9)),
    'line': ((4.0, 18.0, 1.8), (20.0, 5.0, 1.8)),
    'polygon': ((12.0, 3.5, 1.6), (20.0, 9.0, 1.6), (4.0, 9.0, 1.6)),
}

TRAZOS: dict[str, tuple[tuple[float, float], ...]] = {
    'line': ((4.0, 18.0), (9.5, 9.0), (15.0, 14.0), (20.0, 5.0)),
    'polygon': ((12.0, 3.5), (20.0, 9.0), (17.0, 18.5), (7.0, 18.5), (4.0, 9.0)),
}


def _camino(tipo: str, cerrado: bool) -> QPainterPath:
    camino = QPainterPath()
    puntos = TRAZOS[tipo]
    camino.moveTo(QPointF(*puntos[0]))
    for punto in puntos[1:]:
        camino.lineTo(QPointF(*punto))
    if cerrado:
        camino.closeSubpath()
    return camino


def _pintar_vertices(painter: QPainter, tipo: str, color: QColor) -> None:
    painter.setPen(Qt.NoPen)
    painter.setBrush(color)
    for x, y, radio in VERTICES.get(tipo, ()):
        painter.drawEllipse(QPointF(x, y), radio, radio)


def _pintar_raster(painter: QPainter, suave: QColor) -> None:
    painter.setBrush(Qt.NoBrush)
    painter.drawRoundedRect(QRectF(4.0, 4.0, 16.0, 16.0), 1.5, 1.5)
    painter.drawLine(QPointF(12.0, 4.0), QPointF(12.0, 20.0))
    painter.drawLine(QPointF(4.0, 12.0), QPointF(20.0, 12.0))
    painter.setPen(Qt.NoPen)
    painter.setBrush(suave)
    painter.drawRect(QRectF(4.0, 4.0, 8.0, 8.0))
    painter.drawRect(QRectF(12.0, 12.0, 8.0, 8.0))


def pintar_geometria(painter: QPainter, rect: QRect, tipo: str) -> None:
    color = QColor(geom_colors().get(tipo, color_de_rol('quiet', 'color', '#465055')))
    suave = QColor(color)
    suave.setAlpha(RELLENO_ALPHA)

    pluma = QPen(color, TRAZO)
    pluma.setJoinStyle(Qt.RoundJoin)
    pluma.setCapStyle(Qt.RoundCap)

    painter.save()
    painter.setRenderHint(QPainter.Antialiasing, True)
    painter.translate(rect.left(), rect.top())
    painter.scale(rect.width() / VIEWBOX, rect.height() / VIEWBOX)
    painter.setPen(pluma)

    if tipo == 'raster':
        _pintar_raster(painter, suave)
    elif tipo == 'point':
        _pintar_vertices(painter, tipo, color)
    else:
        painter.setBrush(suave if tipo == 'polygon' else Qt.NoBrush)
        painter.drawPath(_camino(tipo, tipo == 'polygon'))
        _pintar_vertices(painter, tipo, color)

    painter.restore()
