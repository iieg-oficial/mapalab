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

ROOT_HEIGHT: int = 52
ITEM_HEIGHT: int = 26

WORKSPACE_ALPHA: int = 130


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


def workspace_of(node: Optional[dict[str, Any]]) -> str:
    if not isinstance(node, dict):
        return ''
    wms_config = node.get('wmsConfig') or {}
    return str(wms_config.get('workspace') or '')


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

    def _pintar_workspace(self, painter: QPainter, rect: QRect, texto: str,
                          option: QStyleOptionViewItem, fuente: QFont) -> None:
        color = QColor(option.palette.text().color())
        color.setAlpha(WORKSPACE_ALPHA)
        painter.save()
        painter.setFont(fuente)
        painter.setPen(color)
        painter.drawText(rect, int(Qt.AlignVCenter | Qt.AlignRight), texto)
        painter.restore()

    def paint(self, painter: QPainter, option: QStyleOptionViewItem,
              index: QModelIndex) -> None:
        node = index.data(self._node_role)
        badge = badge_of(node)
        workspace = workspace_of(node) if not self._es_raiz(index) else ''

        if badge is None and not workspace:
            super().paint(painter, option, index)
            return

        opcion = QStyleOptionViewItem(option)
        self.initStyleOption(opcion, index)
        fuente_menor = self._fuente_menor(opcion)

        derecha = option.rect.right()
        rect_badge: Optional[QRect] = None
        rect_workspace: Optional[QRect] = None

        if badge is not None:
            ancho = self._ancho(opcion, badge[0], fuente_menor) + BADGE_PADDING * 2
            rect_badge = QRect(derecha - ancho - BADGE_GAP, option.rect.top() + 3,
                               ancho, option.rect.height() - 6)
            derecha = rect_badge.left()

        if workspace:
            ancho = self._ancho(opcion, workspace, fuente_menor) + BADGE_PADDING
            rect_workspace = QRect(derecha - ancho - BADGE_GAP, option.rect.top(),
                                   ancho, option.rect.height())
            derecha = rect_workspace.left()

        recortada = QStyleOptionViewItem(opcion)
        recortada.rect = QRect(option.rect)
        recortada.rect.setRight(max(option.rect.left(), derecha - BADGE_GAP))
        super().paint(painter, recortada, index)

        if rect_workspace is not None:
            self._pintar_workspace(painter, rect_workspace, workspace, opcion, fuente_menor)
        if rect_badge is not None and badge is not None:
            self._pintar_pildora(painter, rect_badge, badge[0], badge[1], fuente_menor)

    def sizeHint(self, option: QStyleOptionViewItem, index: QModelIndex) -> QSize:
        size = super().sizeHint(option, index)
        minimo = ROOT_HEIGHT if self._es_raiz(index) else ITEM_HEIGHT
        return QSize(size.width(), max(size.height(), minimo))
