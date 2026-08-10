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

ACCENT_COLOR: str = '#FF8300'

ACCENT_BAR_WIDTH: int = 4

ROOT_HEIGHT: int = 52
ITEM_HEIGHT: int = 26

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
        rect = QRect(option.rect.left(), option.rect.top() + 4,
                     ACCENT_BAR_WIDTH, option.rect.height() - 8)
        painter.save()
        painter.setPen(Qt.NoPen)
        painter.setBrush(QColor(ACCENT_COLOR))
        painter.drawRoundedRect(rect, 2, 2)
        painter.restore()

    def _tema_abierto(self, option: QStyleOptionViewItem, index: QModelIndex) -> bool:
        return self._es_raiz(index) and bool(option.state & QStyle.State_Open)

    def paint(self, painter: QPainter, option: QStyleOptionViewItem,
              index: QModelIndex) -> None:
        badge = badge_of(index.data(self._node_role))
        if self._tema_abierto(option, index):
            super().paint(painter, option, index)
            self._pintar_barra_tema(painter, option)
            if badge is not None:
                opcion = QStyleOptionViewItem(option)
                self.initStyleOption(opcion, index)
                fuente = self._fuente_menor(opcion)
                ancho = self._ancho(opcion, badge[0], fuente) + BADGE_PADDING * 2
                rect = QRect(option.rect.right() - ancho - BADGE_GAP, option.rect.top() + 3,
                             ancho, option.rect.height() - 6)
                self._pintar_pildora(painter, rect, badge[0], badge[1], fuente)
            return

        if badge is None:
            super().paint(painter, option, index)
            return

        opcion = QStyleOptionViewItem(option)
        self.initStyleOption(opcion, index)
        fuente_menor = self._fuente_menor(opcion)

        ancho = self._ancho(opcion, badge[0], fuente_menor) + BADGE_PADDING * 2
        rect_badge = QRect(option.rect.right() - ancho - BADGE_GAP, option.rect.top() + 3,
                           ancho, option.rect.height() - 6)

        recortada = QStyleOptionViewItem(opcion)
        recortada.rect = QRect(option.rect)
        recortada.rect.setRight(max(option.rect.left(), rect_badge.left() - BADGE_GAP))
        super().paint(painter, recortada, index)

        self._pintar_pildora(painter, rect_badge, badge[0], badge[1], fuente_menor)

    def sizeHint(self, option: QStyleOptionViewItem, index: QModelIndex) -> QSize:
        size = super().sizeHint(option, index)
        minimo = ROOT_HEIGHT if self._es_raiz(index) else ITEM_HEIGHT
        return QSize(size.width(), max(size.height(), minimo))
