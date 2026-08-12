import os
import re
from typing import Optional

from qgis.PyQt.QtCore import QEvent, QObject, Qt
from qgis.PyQt.QtGui import QColor, QIcon
from qgis.PyQt.QtWidgets import QGraphicsDropShadowEffect, QWidget

from .config import FONT_SCALE_PX

THEME_FILE: str = 'theme.qss'

ASSETS_DIR: str = 'assets'

REFRESH_ICON: str = 'refrescar.svg'

BRAND_ROLE: str = 'brandRole'

BASE_FONT_RE = re.compile(r'(font-size:\s*)(\d+)(px)')


def _theme_path() -> str:
    return os.path.join(os.path.dirname(__file__), THEME_FILE)


def load_stylesheet() -> str:
    path = _theme_path()
    if not os.path.exists(path):
        return ''
    try:
        with open(path, 'r', encoding='utf-8') as handle:
            return handle.read()
    except OSError:
        return ''


SHADOW_BLUR: float = 14.0

SHADOW_OFFSET: float = 2.0

SHADOW_ALPHA: int = 90


def sombra(widget: QWidget, blur: float = SHADOW_BLUR,
           offset: float = SHADOW_OFFSET) -> QGraphicsDropShadowEffect:
    efecto = QGraphicsDropShadowEffect(widget)
    efecto.setBlurRadius(blur)
    efecto.setOffset(0, offset)
    efecto.setColor(QColor(0, 0, 0, SHADOW_ALPHA))
    efecto.setEnabled(False)
    widget.setGraphicsEffect(efecto)
    return efecto


class _SombraEnHover(QObject):

    def __init__(self, widget: QWidget) -> None:
        super().__init__(widget)
        self._efecto = sombra(widget)
        widget.installEventFilter(self)

    def eventFilter(self, objeto: QObject, evento) -> bool:
        if evento.type() == QEvent.Enter:
            self._efecto.setEnabled(True)
        elif evento.type() == QEvent.Leave:
            self._efecto.setEnabled(False)
        return False


def sombra_en_hover(widget: QWidget) -> None:
    _SombraEnHover(widget)


def icono_refrescar() -> QIcon:
    ruta = os.path.join(os.path.dirname(__file__), ASSETS_DIR, REFRESH_ICON)
    return QIcon(ruta) if os.path.exists(ruta) else QIcon()


def _escalar_fuentes(stylesheet: str) -> str:
    def subir(coincidencia: re.Match) -> str:
        tamano = int(coincidencia.group(2)) + FONT_SCALE_PX
        return f'{coincidencia.group(1)}{tamano}{coincidencia.group(3)}'

    return BASE_FONT_RE.sub(subir, stylesheet)


def _bloque_de_rol(rol: str) -> str:
    patron = r'\[brandRole="' + re.escape(rol) + r'"\]\s*\{([^}]*)\}'
    encontrado = re.search(patron, load_stylesheet())
    return encontrado.group(1) if encontrado else ''


def color_de_rol(rol: str, propiedad: str, respaldo: str) -> str:
    patron = r'(?:^|[;{\s])' + re.escape(propiedad) + r'\s*:\s*([^;]+);'
    valor = re.search(patron, _bloque_de_rol(rol))
    return valor.group(1).strip() if valor else respaldo


def _reglas_locales() -> str:
    return (
        '\nQTreeView::branch, QTreeWidget::branch {\n'
        '    image: none;\n'
        '}\n'
    )


def build_stylesheet() -> str:
    stylesheet = load_stylesheet()
    if not stylesheet:
        return ''
    return _escalar_fuentes(stylesheet) + _reglas_locales()


def apply_theme(widget: QWidget) -> bool:
    stylesheet = build_stylesheet()
    if not stylesheet:
        return False
    widget.setStyleSheet(stylesheet)
    return True


def set_role(widget: QWidget, role: Optional[str]) -> None:
    widget.setProperty(BRAND_ROLE, role)
    widget.setAttribute(Qt.WA_StyledBackground, True)
    style = widget.style()
    if style is not None:
        style.unpolish(widget)
        style.polish(widget)
