from typing import Any, Callable, Optional

from qgis.PyQt.QtCore import QEvent, QSize, Qt
from qgis.PyQt.QtWidgets import QTreeWidget, QTreeWidgetItem, QWidget

from ..api.client import MapaLabClient
from ..layers.grupos import es_grupo, grupo_cargado
from ..model.tree import clean_label, is_disabled
from .delegate import LayerItemDelegate
from .icons import TEMA_ICON_SIZE, icono_de_nodo

NODE_ROLE: int = int(Qt.UserRole)


class ArbolCatalogo(QTreeWidget):

    def __init__(self, client: MapaLabClient, al_activar: Callable[[], None],
                 al_alternar: Optional[Callable[[dict[str, Any], bool], None]] = None,
                 parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self._client = client
        self._al_activar = al_activar
        self._al_alternar = al_alternar
        self._hover_item: Optional[QTreeWidgetItem] = None
        self._silencio = False

        self.setHeaderHidden(True)
        self.header().setStretchLastSection(True)
        self.setUniformRowHeights(False)
        self.setMouseTracking(True)
        self.viewport().installEventFilter(self)
        self.setExpandsOnDoubleClick(False)
        self.setItemDelegate(LayerItemDelegate(NODE_ROLE, self))
        self.setIconSize(QSize(TEMA_ICON_SIZE, TEMA_ICON_SIZE))
        self.itemDoubleClicked.connect(self._on_double_click)
        self.itemClicked.connect(self._on_click)
        self.itemEntered.connect(self._on_entered)
        self.itemExpanded.connect(self._on_expandido)
        self.itemCollapsed.connect(self._on_colapsado)
        self.itemChanged.connect(self._on_marcado)

    def poblar(self, nodes: list[dict[str, Any]]) -> None:
        self._hover_item = None
        self.clear()
        for node in nodes:
            self.addTopLevelItem(self._build_item(node, es_raiz=True))

    def nodo_actual(self) -> Optional[dict[str, Any]]:
        item = self.currentItem()
        if item is None:
            return None
        node = item.data(0, NODE_ROLE)
        return node if isinstance(node, dict) else None

    def _build_item(self, node: dict[str, Any], es_raiz: bool = False) -> QTreeWidgetItem:
        item = QTreeWidgetItem([clean_label(node.get('label') or '')])
        item.setData(0, NODE_ROLE, node)
        if is_disabled(node):
            item.setDisabled(True)
        if es_grupo(node):
            item.setToolTip(0, 'Marca para traer el tema completo')
            item.setCheckState(0, self._estado(node))

        icono = icono_de_nodo(self._client, node, es_raiz)
        if icono is not None:
            item.setIcon(0, icono)

        for child in node.get('children') or []:
            item.addChild(self._build_item(child))
        return item

    def _estado(self, node: dict[str, Any]) -> Qt.CheckState:
        cargado = grupo_cargado(str(node.get('id') or ''))
        return Qt.Checked if cargado else Qt.Unchecked

    def _on_marcado(self, item: QTreeWidgetItem, column: int) -> None:
        node = item.data(0, NODE_ROLE)
        if self._silencio or self._al_alternar is None or not isinstance(node, dict):
            return
        if es_grupo(node):
            self._al_alternar(node, item.checkState(0) == Qt.Checked)

    def sincronizar(self, item: Optional[QTreeWidgetItem] = None) -> None:
        self._silencio = True
        try:
            hijos = ([self.topLevelItem(i) for i in range(self.topLevelItemCount())]
                     if item is None else [item.child(i) for i in range(item.childCount())])
            for hijo in hijos:
                node = hijo.data(0, NODE_ROLE)
                if isinstance(node, dict) and es_grupo(node):
                    hijo.setCheckState(0, self._estado(node))
                self.sincronizar(hijo)
        finally:
            if item is None:
                self._silencio = False

    def _actualizar_icono(self, item: QTreeWidgetItem, hover: bool) -> None:
        if item.parent() is not None:
            return
        node = item.data(0, NODE_ROLE)
        if not isinstance(node, dict):
            return
        icono = icono_de_nodo(self._client, node, es_raiz=True, hover=hover)
        if icono is not None:
            item.setIcon(0, icono)

    def eventFilter(self, objeto: Any, evento: Any) -> bool:
        if evento.type() == QEvent.Leave:
            self._limpiar_hover()
        elif evento.type() == QEvent.MouseButtonPress:
            if self.itemAt(evento.pos()) is None:
                self.clearSelection()
                self.setCurrentItem(None)
        return False

    def _limpiar_hover(self) -> None:
        if self._hover_item is None:
            return
        item, self._hover_item = self._hover_item, None
        if not item.isExpanded():
            self._actualizar_icono(item, False)

    def _on_entered(self, item: QTreeWidgetItem, column: int) -> None:
        if item is self._hover_item:
            return
        self._limpiar_hover()
        self._hover_item = item
        self._actualizar_icono(item, True)

    def _on_expandido(self, item: QTreeWidgetItem) -> None:
        self._actualizar_icono(item, True)

    def _on_colapsado(self, item: QTreeWidgetItem) -> None:
        self._actualizar_icono(item, False)

    def _on_click(self, item: QTreeWidgetItem, column: int) -> None:
        if item.childCount():
            item.setExpanded(not item.isExpanded())

    def _on_double_click(self, item: QTreeWidgetItem, column: int) -> None:
        node = item.data(0, NODE_ROLE)
        if isinstance(node, dict) and node.get('wmsConfig'):
            self._al_activar()
