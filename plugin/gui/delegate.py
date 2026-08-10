from typing import Any, Optional

from qgis.PyQt.QtCore import QModelIndex, QRect, QSize, Qt
from qgis.PyQt.QtGui import QColor, QFont, QPainter
from qgis.PyQt.QtWidgets import QStyledItemDelegate, QStyleOptionViewItem

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

    def _badge_font(self, option: QStyleOptionViewItem) -> QFont:
        font = QFont(option.font)
        font.setPointSizeF(max(6.0, option.font.pointSizeF() - 1.5))
        return font

    def _badge_rect(self, option: QStyleOptionViewItem, label: str) -> QRect:
        metrics = option.fontMetrics
        width = metrics.horizontalAdvance(label) + BADGE_PADDING * 2
        height = option.rect.height() - 6
        left = option.rect.right() - width - BADGE_GAP
        top = option.rect.top() + 3
        return QRect(left, top, width, height)

    def paint(self, painter: QPainter, option: QStyleOptionViewItem,
              index: QModelIndex) -> None:
        badge = badge_of(index.data(self._node_role))
        if badge is None:
            super().paint(painter, option, index)
            return

        label, color = badge
        trimmed = QStyleOptionViewItem(option)
        rect = self._badge_rect(option, label)
        trimmed.rect = QRect(option.rect)
        trimmed.rect.setRight(rect.left() - BADGE_GAP)
        super().paint(painter, trimmed, index)

        painter.save()
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setPen(Qt.NoPen)
        painter.setBrush(color)
        painter.drawRoundedRect(rect, BADGE_RADIUS, BADGE_RADIUS)
        painter.setPen(QColor('#FFFFFF'))
        painter.setFont(self._badge_font(option))
        painter.drawText(rect, int(Qt.AlignCenter), label)
        painter.restore()

    def sizeHint(self, option: QStyleOptionViewItem, index: QModelIndex) -> QSize:
        size = super().sizeHint(option, index)
        return QSize(size.width(), max(size.height(), 22))
