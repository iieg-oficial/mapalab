from typing import Any, Optional

from qgis.PyQt.QtCore import QModelIndex, QRect, QSize, Qt
from qgis.PyQt.QtGui import QColor, QFont, QPainter
from qgis.PyQt.QtWidgets import QStyle, QStyledItemDelegate, QStyleOptionViewItem

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
BADGE_RADIUS: int = 7

GEOM_SIZE: int = 11

GEOM_GAP: int = 8

GEOM_COLORS: dict[str, str] = {
    'point': '#2e4372',
    'line': '#2e7d32',
    'polygon': '#5C2472',
    'raster': '#9E5200',
}

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

    def _fuente_menor(self, option: QStyleOptionViewItem) -> QFont:
        font = QFont(option.font)
        font.setBold(False)
        font.setPointSizeF(max(6.0, option.font.pointSizeF() - 1.5))
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
        painter.drawRoundedRect(rect, BADGE_RADIUS, BADGE_RADIUS)
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

    def _pintar_geometria(self, painter: QPainter, rect: QRect, tipo: str) -> None:
        color = QColor(GEOM_COLORS.get(tipo, '#465055'))
        painter.save()
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setPen(Qt.NoPen)
        painter.setBrush(color)
        centro = rect.center()
        if tipo == 'point':
            painter.drawEllipse(centro, GEOM_SIZE // 3, GEOM_SIZE // 3)
        elif tipo == 'line':
            painter.setPen(color)
            painter.drawLine(rect.left(), rect.bottom() - 2, rect.right(), rect.top() + 2)
        elif tipo == 'raster':
            paso = GEOM_SIZE // 2
            for fila in range(2):
                for col in range(2):
                    if (fila + col) % 2 == 0:
                        painter.drawRect(rect.left() + col * paso, rect.top() + fila * paso,
                                         paso - 1, paso - 1)
        else:
            painter.drawRoundedRect(rect.adjusted(0, 2, 0, -2), 2, 2)
        painter.restore()

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
            self._pintar_geometria(painter, rect_geom, tipo)

    def paint(self, painter: QPainter, option: QStyleOptionViewItem,
              index: QModelIndex) -> None:
        node = index.data(self._node_role)
        badge = badge_of(node)
        tipo = geometry_of(node)

        opcion = QStyleOptionViewItem(option)
        self.initStyleOption(opcion, index)
        fuente_menor = self._fuente_menor(opcion)
        rect_badge, rect_geom, limite = self._medir_adornos(
            opcion, option.rect, badge, tipo, fuente_menor)

        if self._tema_abierto(option, index):
            desplazada = QStyleOptionViewItem(option)
            desplazada.rect = QRect(option.rect)
            desplazada.rect.setLeft(option.rect.left() + ACCENT_BAR_WIDTH + ACCENT_BAR_GAP)
            super().paint(painter, desplazada, index)
            self._pintar_barra_tema(painter, option)
            self._pintar_adornos(painter, rect_badge, rect_geom, badge, tipo, fuente_menor)
            return

        if badge is None and tipo is None:
            super().paint(painter, option, index)
            return

        recortada = QStyleOptionViewItem(opcion)
        recortada.rect = QRect(option.rect)
        recortada.rect.setRight(max(option.rect.left(), limite))
        super().paint(painter, recortada, index)

        self._pintar_adornos(painter, rect_badge, rect_geom, badge, tipo, fuente_menor)

    def sizeHint(self, option: QStyleOptionViewItem, index: QModelIndex) -> QSize:
        size = super().sizeHint(option, index)
        minimo = ROOT_HEIGHT if self._es_raiz(index) else ITEM_HEIGHT
        return QSize(size.width(), max(size.height(), minimo))
