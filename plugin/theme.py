import os
import re
from typing import Optional

from qgis.PyQt.QtCore import Qt
from qgis.PyQt.QtWidgets import QWidget

from .config import FONT_SCALE_PX

THEME_FILE: str = 'theme.qss'

ASSETS_DIR: str = 'assets'

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


def _asset_url(nombre: str) -> str:
    ruta = os.path.join(os.path.dirname(__file__), ASSETS_DIR, nombre)
    return ruta.replace(os.sep, '/')


def _escalar_fuentes(stylesheet: str) -> str:
    def subir(coincidencia: re.Match) -> str:
        tamano = int(coincidencia.group(2)) + FONT_SCALE_PX
        return f'{coincidencia.group(1)}{tamano}{coincidencia.group(3)}'

    return BASE_FONT_RE.sub(subir, stylesheet)


def _reglas_locales() -> str:
    cerrado = _asset_url('chevron-right.svg')
    abierto = _asset_url('chevron-down.svg')
    return (
        '\nQTreeView::branch:has-children:closed,\n'
        'QTreeWidget::branch:has-children:closed {\n'
        f'    image: url("{cerrado}");\n'
        '}\n\n'
        'QTreeView::branch:has-children:open,\n'
        'QTreeWidget::branch:has-children:open {\n'
        f'    image: url("{abierto}");\n'
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
