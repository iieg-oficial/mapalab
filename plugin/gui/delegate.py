from typing import Any, Optional

from qgis.PyQt.QtCore import QModelIndex, QPointF, QRect, QRectF, QSize, Qt
from qgis.PyQt.QtGui import QColor, QFont, QPainter, QPalette, QPen
from qgis.PyQt.QtWidgets import QStyle, QStyledItemDelegate, QStyleOptionViewItem

from ..layers.proyecto import nodo_cargado
from ..model.tree import es_categoria, es_etiqueta
from ..theme import color_de_rol
from .glifos import GEOM_COLORS, pintar_geometria

BADGE_COLORS: dict[str, str] = {
    'new': '#2e7d32',
    'updated': '#2e4372',
    'soon': '#8a6d1f',
}

BADGE_LABELS: dict[str, str] = {
    'new': 'Nueva',
    'updated': 'Actualizada',
    'soon': 'Próximamente',
}

BADGE_PADDING: int = 6
BADGE_GAP: int = 8
GEOM_SIZE: int = 16

TENUE_REDUCCION: float = 1.0

BADGE_REDUCCION: float = 2.0

PX_MINIMO: int = 10

PT_MINIMO: float = 7.0

CHEVRON_SIZE: int = 9

CHEVRON_GAP: int = 7

CHEVRON_TRAZO: float = 1.6

CERRAR_SIZE: int = 10

CERRAR_GAP: int = 7

CERRAR_TRAZO: float = 1.6

GEOM_GAP: int = 8

ACCENT_COLOR: str = '#FF8300'

ACCENT_BAR_WIDTH: int = 6

ACCENT_BAR_GAP: int = 10

ACCENT_BAR_RATIO: float = 0.5

ROOT_HEIGHT: int = 52
ITEM_HEIGHT: int = 30

def badge_of(node: Optional[dict[str, Any]]) -> Optional[tuple[str, QColor]]:
    if not isinstance(node, dict):
        return None
    badge = node.get('badge')
    if not isinstance(badge, dict) or not badge.get('enabled', True):
        return None

    variant = str(badge.get('variant') or 'new')
    label = str(badge.get('label') or BADGE_LABELS.get(variant) or variant)
    color = QColor(str(badge.get('color') or BADGE_COLORS.get(variant) or '#465055'))
    if not color.isValid():
        color = QColor('#465055')
    return label, color


def geometry_of(node: Optional[dict[str, Any]]) -> Optional[str]:
    if not isinstance(node, dict):
        return None
    tipo = node.get('geometryType')
    return tipo if tipo in GEOM_COLORS else None


class LayerItemDelegate(QStyledItemDelegate):

    def __init__(self, node_role: int, parent: Optional[Any] = None) -> None:
        super().__init__(parent)
        self._node_role = node_role

    def _es_raiz(self, index: QModelIndex) -> bool:
        return not index.parent().isValid()

    def initStyleOption(self, option: QStyleOptionViewItem, index: QModelIndex) -> None:
        super().initStyleOption(option, index)
        if self._es_raiz(index):
            option.font.setBold(True)
            return

        node = index.data(self._node_role)
        if es_etiqueta(node):
            option.font.setBold(True)
            self._tenue(option, color_de_rol('title', 'color', '#5C2472'))
        elif es_categoria(node):
            self._tenue(option, color_de_rol('quiet', 'color', '#465055'))
            self._sin_fondo(option)

    def _encoger(self, fuente: QFont, cantidad: float) -> None:
        if fuente.pixelSize() > 0:
            fuente.setPixelSize(max(PX_MINIMO, fuente.pixelSize() - int(cantidad)))
        else:
            fuente.setPointSizeF(max(PT_MINIMO, fuente.pointSizeF() - cantidad))

    def _tenue(self, option: QStyleOptionViewItem, color: str) -> None:
        self._encoger(option.font, TENUE_REDUCCION)
        tinta = QColor(color)
        option.palette.setColor(QPalette.Text, tinta)
        option.palette.setColor(QPalette.HighlightedText, tinta)

    def _sin_fondo(self, option: QStyleOptionViewItem) -> None:
        realzada = bool(option.state & (QStyle.State_MouseOver | QStyle.State_Selected))
        option.state &= ~QStyle.State_MouseOver
        option.state &= ~QStyle.State_Selected
        if realzada:
            option.font.setBold(True)

    def rect_cerrar(self, rect: QRect) -> QRect:
        top = rect.top() + (rect.height() - CERRAR_SIZE) // 2
        return QRect(rect.left() + CERRAR_GAP, top, CERRAR_SIZE, CERRAR_SIZE)

    def hay_cerrar(self, node: Any) -> bool:
        if not isinstance(node, dict) or not node.get('wmsConfig'):
            return False
        return nodo_cargado(str(node.get('id') or ''))

    def _pintar_cerrar(self, painter: QPainter, rect: QRect) -> None:
        pluma = QPen(QColor(color_de_rol('quiet', 'color', '#465055')), CERRAR_TRAZO)
        pluma.setCapStyle(Qt.RoundCap)

        painter.save()
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setPen(pluma)
        painter.drawLine(rect.topLeft(), rect.bottomRight())
        painter.drawLine(rect.topRight(), rect.bottomLeft())
        painter.restore()

    def _rect_chevron(self, rect: QRect) -> QRect:
        top = rect.top() + (rect.height() - CHEVRON_SIZE) // 2
        return QRect(rect.right() - CHEVRON_GAP - CHEVRON_SIZE, top,
                     CHEVRON_SIZE, CHEVRON_SIZE)

    def _pintar_chevron(self, painter: QPainter, rect: QRect, abierto: bool) -> None:
        pluma = QPen(QColor(color_de_rol('quiet', 'color', '#465055')), CHEVRON_TRAZO)
        pluma.setCapStyle(Qt.RoundCap)
        pluma.setJoinStyle(Qt.RoundJoin)

        painter.save()
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setPen(pluma)
        painter.setBrush(Qt.NoBrush)
        if abierto:
            painter.drawPolyline(QPointF(rect.left(), rect.top() + 2.0),
                                 QPointF(rect.center().x(), rect.bottom() - 1.0),
                                 QPointF(rect.right(), rect.top() + 2.0))
        else:
            painter.drawPolyline(QPointF(rect.left() + 2.0, rect.top()),
                                 QPointF(rect.right() - 1.0, rect.center().y()),
                                 QPointF(rect.left() + 2.0, rect.bottom()))
        painter.restore()

    def _hay_chevron(self, option: QStyleOptionViewItem, node: Any) -> bool:
        return bool(option.state & QStyle.State_Children) and not es_etiqueta(node)

    def _fuente_menor(self, option: QStyleOptionViewItem) -> QFont:
        font = QFont(option.font)
        font.setBold(False)
        self._encoger(font, BADGE_REDUCCION)
        return font

    def _ancho(self, option: QStyleOptionViewItem, texto: str, fuente: QFont) -> int:
        from qgis.PyQt.QtGui import QFontMetrics
        return QFontMetrics(fuente).horizontalAdvance(texto)

    def _pintar_pildora(self, painter: QPainter, rect: QRect, texto: str,
                        color: QColor, fuente: QFont) -> None:
        painter.save()
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setPen(Qt.NoPen)
        painter.setBrush(color)
        radio = rect.height() / 2.0
        painter.drawRoundedRect(QRectF(rect), radio, radio)
        painter.setPen(QColor('#FFFFFF'))
        painter.setFont(fuente)
        painter.drawText(rect, int(Qt.AlignCenter), texto)
        painter.restore()

    def _pintar_barra_tema(self, painter: QPainter, option: QStyleOptionViewItem) -> None:
        alto = max(12, int(option.rect.height() * ACCENT_BAR_RATIO))
        top = option.rect.top() + (option.rect.height() - alto) // 2
        rect = QRect(option.rect.left(), top, ACCENT_BAR_WIDTH, alto)
        painter.save()
        painter.setPen(Qt.NoPen)
        painter.setBrush(QColor(ACCENT_COLOR))
        painter.drawRoundedRect(rect, ACCENT_BAR_WIDTH // 2, ACCENT_BAR_WIDTH // 2)
        painter.restore()

    def _tema_abierto(self, option: QStyleOptionViewItem, index: QModelIndex) -> bool:
        return self._es_raiz(index) and bool(option.state & QStyle.State_Open)

    def _medir_adornos(self, opcion: QStyleOptionViewItem, rect: QRect,
                       badge: Optional[tuple[str, QColor]], tipo: Optional[str],
                       fuente: QFont) -> tuple[Optional[QRect], Optional[QRect], int]:
        derecha = rect.right() - BADGE_GAP
        rect_badge: Optional[QRect] = None
        rect_geom: Optional[QRect] = None

        if badge is not None:
            ancho = self._ancho(opcion, badge[0], fuente) + BADGE_PADDING * 2
            rect_badge = QRect(derecha - ancho, rect.top() + 3, ancho, rect.height() - 6)
            derecha = rect_badge.left() - BADGE_GAP

        if tipo is not None:
            top = rect.top() + (rect.height() - GEOM_SIZE) // 2
            rect_geom = QRect(derecha - GEOM_SIZE, top, GEOM_SIZE, GEOM_SIZE)
            derecha = rect_geom.left() - GEOM_GAP

        return rect_badge, rect_geom, derecha

    def _pintar_adornos(self, painter: QPainter, rect_badge: Optional[QRect],
                        rect_geom: Optional[QRect], badge: Optional[tuple[str, QColor]],
                        tipo: Optional[str], fuente: QFont) -> None:
        if rect_badge is not None and badge is not None:
            self._pintar_pildora(painter, rect_badge, badge[0], badge[1], fuente)
        if rect_geom is not None and tipo is not None:
            pintar_geometria(painter, rect_geom, tipo)

    def paint(self, painter: QPainter, option: QStyleOptionViewItem,
              index: QModelIndex) -> None:
        node = index.data(self._node_role)
        badge = badge_of(node)
        tipo = geometry_of(node)
        chevron = self._hay_chevron(option, node)
        cerrar = self.hay_cerrar(node)

        opcion = QStyleOptionViewItem(option)
        self.initStyleOption(opcion, index)
        fuente_menor = self._fuente_menor(opcion)
        medible = QRect(option.rect)
        if chevron:
            medible.setRight(self._rect_chevron(option.rect).left() - CHEVRON_GAP)
        if cerrar:
            medible.setLeft(self.rect_cerrar(option.rect).right() + CERRAR_GAP)
        rect_badge, rect_geom, limite = self._medir_adornos(
            opcion, medible, badge, tipo, fuente_menor)

        if self._tema_abierto(option, index):
            desplazada = QStyleOptionViewItem(option)
            desplazada.rect = QRect(option.rect)
            desplazada.rect.setLeft(option.rect.left() + ACCENT_BAR_WIDTH + ACCENT_BAR_GAP)
            super().paint(painter, desplazada, index)
            self._pintar_barra_tema(painter, option)
            self._pintar_adornos(painter, rect_badge, rect_geom, badge, tipo, fuente_menor)
            self._pintar_chevron(painter, self._rect_chevron(option.rect), True)
            return

        if badge is None and tipo is None and not chevron and not cerrar:
            super().paint(painter, option, index)
            return

        recortada = QStyleOptionViewItem(opcion)
        recortada.rect = QRect(option.rect)
        recortada.rect.setRight(max(option.rect.left(), limite))
        if cerrar:
            recortada.rect.setLeft(medible.left())
        super().paint(painter, recortada, index)

        self._pintar_adornos(painter, rect_badge, rect_geom, badge, tipo, fuente_menor)
        if chevron:
            self._pintar_chevron(painter, self._rect_chevron(option.rect),
                                 bool(option.state & QStyle.State_Open))
        elif cerrar:
            self._pintar_cerrar(painter, self.rect_cerrar(option.rect))

    def sizeHint(self, option: QStyleOptionViewItem, index: QModelIndex) -> QSize:
        size = super().sizeHint(option, index)
        minimo = ROOT_HEIGHT if self._es_raiz(index) else ITEM_HEIGHT
        return QSize(size.width(), max(size.height(), minimo))
