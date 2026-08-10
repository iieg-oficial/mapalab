from typing import Any, Optional

from qgis.PyQt.QtCore import QSize, Qt
from qgis.PyQt.QtWidgets import (
    QDockWidget,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QTreeWidget,
    QTreeWidgetItem,
    QVBoxLayout,
    QWidget,
)

from ..api.client import MapaLabClient, MapaLabError
from ..config import FOOTER_BAR_HEIGHT, FOOTER_LOGO_HEIGHT, get_base_url, set_base_url
from ..model.tree import clean_label, filter_tree, hydrate_tree, is_disabled
from ..theme import apply_theme, set_role
from .actions import LayerActions
from .delegate import LayerItemDelegate
from .icons import TEMA_ICON_SIZE, icono_de_nodo
from .titlebar import TitleBar, es_tema_oscuro, logo_widget

NODE_ROLE: int = int(Qt.UserRole)


class MapaLabDock(QDockWidget):

    def __init__(self, iface: Any, parent: Optional[QWidget] = None) -> None:
        super().__init__('MapaLab', parent)
        self.setObjectName('MapaLabDock')
        self._iface = iface
        self._client = MapaLabClient()
        self._actions = LayerActions(iface, self._client)
        self._tree: list[dict[str, Any]] = []
        self._build_ui()
        self._refresh_url_state()

    def _build_ui(self) -> None:
        container = QWidget()
        layout = QVBoxLayout()
        layout.setContentsMargins(6, 6, 6, 6)

        self._url_row = QWidget()
        url_layout = QHBoxLayout()
        url_layout.setContentsMargins(0, 0, 0, 0)
        self._url_input = QLineEdit()
        self._url_input.setPlaceholderText('https://dominio-del-iieg')
        self._url_button = QPushButton('Guardar')
        self._url_button.clicked.connect(self._on_save_url)
        url_layout.addWidget(QLabel('Servidor:'))
        url_layout.addWidget(self._url_input)
        url_layout.addWidget(self._url_button)
        self._url_row.setLayout(url_layout)
        set_role(self._url_row, 'card')
        layout.addWidget(self._url_row)

        self._search = QLineEdit()
        self._search.setPlaceholderText('Buscar capa…')
        self._search.textChanged.connect(self._on_search)
        set_role(self._search, 'search')
        layout.addWidget(self._search)

        self._widget_tree = QTreeWidget()
        self._widget_tree.setHeaderHidden(True)
        self._widget_tree.setItemDelegate(LayerItemDelegate(NODE_ROLE, self._widget_tree))
        self._widget_tree.setIconSize(QSize(TEMA_ICON_SIZE, TEMA_ICON_SIZE))
        self._widget_tree.itemDoubleClicked.connect(self._on_double_click)
        layout.addWidget(self._widget_tree)

        buttons = QHBoxLayout()
        self._add_button = QPushButton('Agregar al mapa')
        self._add_button.clicked.connect(self._on_add)
        self._download_button = QPushButton('Descargar vectorial')
        self._download_button.clicked.connect(self._on_download)
        buttons.addWidget(self._add_button)
        buttons.addWidget(self._download_button)
        layout.addLayout(buttons)

        self._status = QLabel('')
        self._status.setWordWrap(True)
        self._status.setVisible(False)
        layout.addWidget(self._status)

        self._footer = QWidget()
        self._footer.setFixedHeight(FOOTER_BAR_HEIGHT)
        footer_layout = QHBoxLayout()
        footer_layout.setContentsMargins(10, 6, 10, 6)
        self._footer.setLayout(footer_layout)
        self._footer_layout = footer_layout
        layout.addWidget(self._footer)

        container.setLayout(layout)
        set_role(container, 'panel')
        container.setAutoFillBackground(True)
        self.setWidget(container)

        set_role(self._add_button, 'primary')
        set_role(self._url_button, 'primary')
        set_role(self._download_button, 'secondary')
        apply_theme(container)
        self._montar_titulo()
        self._montar_footer()

    def _montar_titulo(self) -> None:
        barra = TitleBar(self._client, lambda: self.load_tree(force=True), self)
        set_role(barra, 'panel')
        barra.setAutoFillBackground(True)
        apply_theme(barra)
        barra.cargar()
        self.setTitleBarWidget(barra)

    def _montar_footer(self) -> None:
        oscuro = es_tema_oscuro(self._footer)
        iieg = logo_widget(self._client, 'iieg', oscuro, FOOTER_LOGO_HEIGHT)
        jalisco = logo_widget(self._client, 'jalisco', oscuro, FOOTER_LOGO_HEIGHT)

        if iieg is None and jalisco is None:
            self._footer.hide()
            return

        if iieg is not None:
            self._footer_layout.addWidget(iieg, 0, Qt.AlignVCenter)
        self._footer_layout.addStretch(1)
        if jalisco is not None:
            self._footer_layout.addWidget(jalisco, 0, Qt.AlignVCenter)

    def _refresh_url_state(self) -> None:
        base_url = get_base_url()
        self._url_input.setText(base_url)
        configured = bool(base_url)
        self._url_row.setVisible(not configured)
        if configured:
            self.load_tree()
        else:
            self._mensaje('Configura la dirección del servidor para cargar el catálogo.')

    def _on_save_url(self) -> None:
        value = self._url_input.text().strip()
        if not value:
            return
        set_base_url(value)
        self._refresh_url_state()

    def load_tree(self, force: bool = False) -> None:
        self._mensaje('Cargando catálogo…')
        try:
            raw = self._client.fetch_tree(force=force)
        except MapaLabError as exc:
            self._mensaje(f'No se pudo cargar el catálogo: {exc}')
            self._url_row.setVisible(True)
            return

        self._tree = hydrate_tree(raw)
        self._populate(self._tree)
        self._mensaje('')

    def _populate(self, nodes: list[dict[str, Any]]) -> None:
        self._widget_tree.clear()
        for node in nodes:
            self._widget_tree.addTopLevelItem(self._build_item(node, es_raiz=True))

    def _build_item(self, node: dict[str, Any], es_raiz: bool = False) -> QTreeWidgetItem:
        item = QTreeWidgetItem([clean_label(node.get('label') or '')])
        item.setData(0, NODE_ROLE, node)
        if is_disabled(node):
            item.setDisabled(True)

        icono = icono_de_nodo(self._client, node, es_raiz)
        if icono is not None:
            item.setIcon(0, icono)

        for child in node.get('children') or []:
            item.addChild(self._build_item(child))
        return item

    def _on_search(self, text: str) -> None:
        if not self._tree:
            return
        self._populate(filter_tree(self._tree, text.strip()))
        if text.strip():
            self._widget_tree.expandAll()

    def _selected_node(self) -> Optional[dict[str, Any]]:
        item = self._widget_tree.currentItem()
        if item is None:
            return None
        node = item.data(0, NODE_ROLE)
        return node if isinstance(node, dict) else None

    def _require_layer_node(self) -> Optional[dict[str, Any]]:
        node = self._selected_node()
        if node is None:
            QMessageBox.information(self, 'MapaLab', 'Selecciona una capa del árbol.')
            return None
        if not node.get('wmsConfig'):
            QMessageBox.information(
                self, 'MapaLab', 'Ese elemento es una carpeta, no una capa.')
            return None
        return node

    def _on_double_click(self, item: QTreeWidgetItem, column: int) -> None:
        node = item.data(0, NODE_ROLE)
        if isinstance(node, dict) and node.get('wmsConfig'):
            self._on_add()

    def _mensaje(self, texto: str) -> None:
        self._status.setText(texto)
        self._status.setVisible(bool(texto))

    def _reportar(self, resultado: tuple[bool, str]) -> None:
        correcto, mensaje = resultado
        self._mensaje('' if correcto else mensaje)

    def _on_add(self) -> None:
        node = self._require_layer_node()
        if node is None:
            return
        self._reportar(self._actions.add_as_wms(node))

    def _on_download(self) -> None:
        node = self._require_layer_node()
        if node is None:
            return
        self._reportar(self._actions.download_as_vector(node, self))
