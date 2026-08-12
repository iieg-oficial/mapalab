from typing import Any, Optional

from qgis.core import QgsProject
from qgis.PyQt.QtCore import QSize
from qgis.PyQt.QtWidgets import (
    QDockWidget,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from ..api.client import MapaLabClient
from ..config import (
    FOOTER_BAR_HEIGHT,
    FOOTER_LOGO_HEIGHT,
    SECTION_GAP,
    get_base_url,
    set_base_url,
)
from ..layers.limites import modo_actual
from ..model.tree import filter_tree
from ..theme import apply_theme, set_role, sombra_en_hover
from .actions import LayerActions
from .arbol import ArbolCatalogo
from ..tasks import CargarArbolTask, Coordinador
from .icons import icono_de_recarga
from .switch import SwitchModoBase
from .titlebar import TitleBar, montar_footer

RELOAD_ICON_SIZE: int = 18

RELOAD_BUTTON_SIZE: int = 34


class MapaLabDock(QDockWidget):

    def __init__(self, iface: Any, parent: Optional[QWidget] = None) -> None:
        super().__init__('MapaLab', parent)
        self.setObjectName('MapaLabDock')
        self._iface = iface
        set_role(self, 'panel')
        self.setAutoFillBackground(True)
        self._client = MapaLabClient()
        self._actions = LayerActions(iface, self._client)
        self._tree: list[dict[str, Any]] = []
        self._tareas = Coordinador()
        self._switch = SwitchModoBase()
        self._switch.setEnabled(False)
        self._switch.cambiado.connect(self._on_cambio_modo)
        self._build_ui()
        apply_theme(self)
        self._conectar_proyecto()
        self._refresh_url_state()

    def _build_ui(self) -> None:
        container = QWidget()
        layout = QVBoxLayout()
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(SECTION_GAP)

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

        search_row = QHBoxLayout()
        search_row.setContentsMargins(0, 0, 0, 0)
        search_row.setSpacing(8)
        self._reload_button = self._boton_recargar()
        search_row.addWidget(self._search)
        search_row.addWidget(self._reload_button)
        layout.addLayout(search_row)

        self._widget_tree = ArbolCatalogo(self._client, self._on_add)
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
        sombra_en_hover(self._add_button)
        set_role(self._url_button, 'primary')
        set_role(self._download_button, 'secondary')
        apply_theme(container)
        self._montar_titulo()
        montar_footer(self._footer, self._footer_layout, self._client, FOOTER_LOGO_HEIGHT)

    def _boton_recargar(self) -> QPushButton:
        boton = QPushButton()
        boton.setIcon(icono_de_recarga(self._client))
        boton.setIconSize(QSize(RELOAD_ICON_SIZE, RELOAD_ICON_SIZE))
        boton.setFixedSize(RELOAD_BUTTON_SIZE, RELOAD_BUTTON_SIZE)
        boton.setToolTip('Recargar catálogo')
        boton.setFlat(True)
        boton.clicked.connect(lambda: self.load_tree(force=True))
        set_role(boton, 'icon')
        return boton

    def _montar_titulo(self) -> None:
        barra = TitleBar(self._client, self._switch, self)
        set_role(barra, 'panel')
        barra.setAutoFillBackground(True)
        apply_theme(barra)
        barra.cargar()
        self.setTitleBarWidget(barra)

    def _conectar_proyecto(self) -> None:
        proyecto = QgsProject.instance()
        proyecto.layersAdded.connect(self._sincronizar_switch)
        proyecto.layersRemoved.connect(self._sincronizar_switch)
        self._sincronizar_switch()

    def _sincronizar_switch(self, *args: Any) -> None:
        self._switch.mostrar(modo_actual())

    def _on_cambio_modo(self, modo: str) -> None:
        if not self._tree:
            self._mensaje('El catálogo aún no carga.')
            self._sincronizar_switch()
            return
        self._reportar(self._actions.set_base_mode(self._tree, modo))
        self._sincronizar_switch()

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
        if self._tareas.ocupado('arbol'):
            return
        self._mensaje('Cargando catálogo…')
        tarea = CargarArbolTask(self._client, force)
        self._tareas.lanzar('arbol', tarea, self._arbol_listo, self._arbol_fallo)

    def _arbol_listo(self, arbol: list[dict[str, Any]]) -> None:
        self._tree = arbol
        self._widget_tree.poblar(self._tree)
        self._switch.setEnabled(True)
        self._sincronizar_switch()
        self._mensaje('')

    def _arbol_fallo(self, detalle: str) -> None:
        self._switch.setEnabled(False)
        self._mensaje(f'No se pudo cargar el catálogo: {detalle}')
        self._url_row.setVisible(True)

    def _on_search(self, text: str) -> None:
        if not self._tree:
            return
        self._widget_tree.poblar(filter_tree(self._tree, text.strip()))
        if text.strip():
            self._widget_tree.expandAll()

    def _require_layer_node(self) -> Optional[dict[str, Any]]:
        node = self._widget_tree.nodo_actual()
        if node is None:
            QMessageBox.information(self, 'MapaLab', 'Selecciona una capa del árbol.')
            return None
        if not node.get('wmsConfig'):
            QMessageBox.information(
                self, 'MapaLab', 'Ese elemento es una carpeta, no una capa.')
            return None
        return node

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
        if self._tareas.ocupado('descarga'):
            self._mensaje('Ya hay una descarga en curso.')
            return

        tarea, error = self._actions.download_as_vector(node, self)
        if tarea is None:
            self._mensaje(error)
            return

        self._mensaje('Descargando… puedes seguir trabajando.')
        self._tareas.lanzar('descarga', tarea, self._descarga_lista, self._mensaje)

    def _descarga_lista(self, path: str) -> None:
        self._mensaje('')

    def closeEvent(self, evento: Any) -> None:
        self._tareas.cancelar_todo()
        super().closeEvent(evento)
