import os
from typing import Any, Optional

from qgis.PyQt.QtCore import Qt
from qgis.PyQt.QtGui import QIcon
from qgis.PyQt.QtWidgets import QAction

from .gui.dock import MapaLabDock
from .identidad import icono_guardado

MENU_TITLE: str = 'MapaLab'


class MapaLabPlugin:

    def __init__(self, iface: Any) -> None:
        self._iface = iface
        self._action: Optional[QAction] = None
        self._dock: Optional[MapaLabDock] = None

    def _icon(self) -> QIcon:
        oficial = icono_guardado()
        if oficial:
            return QIcon(oficial)
        path = os.path.join(os.path.dirname(__file__), 'icon.svg')
        return QIcon(path) if os.path.exists(path) else QIcon()

    def initGui(self) -> None:
        self._action = QAction(self._icon(), MENU_TITLE, self._iface.mainWindow())
        self._action.setCheckable(True)
        self._action.triggered.connect(self._toggle)

        self._iface.addToolBarIcon(self._action)
        self._iface.addPluginToWebMenu(MENU_TITLE, self._action)

    def _toggle(self, checked: bool) -> None:
        primera_vez = self._dock is None
        if self._dock is None:
            self._dock = MapaLabDock(self._iface, self._iface.mainWindow())
            self._dock.visibilityChanged.connect(self._on_visibility)
            self._iface.addDockWidget(Qt.RightDockWidgetArea, self._dock)

        self._dock.setVisible(checked)

        if primera_vez and self._action is not None:
            self._action.setIcon(self._icon())

    def _on_visibility(self, visible: bool) -> None:
        if self._action is not None:
            self._action.setChecked(visible)

    def unload(self) -> None:
        if self._dock is not None:
            self._iface.removeDockWidget(self._dock)
            self._dock.deleteLater()
            self._dock = None

        if self._action is not None:
            self._iface.removeToolBarIcon(self._action)
            self._iface.removePluginWebMenu(MENU_TITLE, self._action)
            self._action = None
