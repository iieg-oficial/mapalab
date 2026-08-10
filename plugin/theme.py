import os
from typing import Optional

from qgis.PyQt.QtWidgets import QWidget

THEME_FILE: str = 'theme.qss'

BRAND_ROLE: str = 'brandRole'


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


def apply_theme(widget: QWidget) -> bool:
    stylesheet = load_stylesheet()
    if not stylesheet:
        return False
    widget.setStyleSheet(stylesheet)
    return True


def set_role(widget: QWidget, role: Optional[str]) -> None:
    widget.setProperty(BRAND_ROLE, role)
    style = widget.style()
    if style is not None:
        style.unpolish(widget)
        style.polish(widget)
