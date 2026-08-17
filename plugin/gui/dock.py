from typing import Any, Optional

from qgis.core import QgsProject
from qgis.PyQt.QtWidgets import (
    QDockWidget,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
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
from ..layers.grupos import es_grupo, quitar_grupo
from ..layers.limites import modo_actual
from ..model.tree import filter_tree
from ..theme import apply_theme, set_role
from .actions import LayerActions
from .arbol import ArbolCatalogo
from .consulta import HerramientaConsulta
from ..tasks import CargarArbolTask, Coordinador
from .icons import boton_de_recarga
from .filas import fila_acciones, fila_limpieza, fila_servidor
from .switch import SwitchModoBase
from .titlebar import montar_footer, montar_titulo

TEXTO_CAPA: str = 'Agregar al mapa'

TEXTO_GRUPO: str = 'Agregar grupo completo'


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
        self._consulta_tool: Optional[HerramientaConsulta] = None
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

        self._url_row, self._url_input = fila_servidor(self._on_save_url)
        layout.addWidget(self._url_row)

        self._search = QLineEdit()
        self._search.setPlaceholderText('Buscar capa…')
        self._search.textChanged.connect(self._on_search)
        set_role(self._search, 'search')

        search_row = QHBoxLayout()
        search_row.setContentsMargins(0, 0, 0, 0)
        search_row.setSpacing(8)
        self._reload_button = boton_de_recarga(
            self._client, lambda: self.load_tree(force=True))
        search_row.addWidget(self._search)
        search_row.addWidget(self._reload_button)
        layout.addLayout(search_row)

        self._widget_tree = ArbolCatalogo(
            self._client, self._on_add, self._alternar_grupo, self._cerrar_nodo,
            self._agregar)
        self._widget_tree.itemSelectionChanged.connect(self._actualizar_add)
        layout.addWidget(self._widget_tree)

        buttons, self._add_button, self._download_button = fila_acciones(
            self._on_add, self._on_download, TEXTO_CAPA)
        layout.addLayout(buttons)
        layout.addLayout(fila_limpieza(self._on_clear_seleccion))

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

        apply_theme(container)
        montar_titulo(self, self._client, self._switch)
        montar_footer(self._footer, self._footer_layout, self._client, FOOTER_LOGO_HEIGHT)

    def _conectar_proyecto(self) -> None:
        proyecto = QgsProject.instance()
        proyecto.layersAdded.connect(self._sincronizar_switch)
        proyecto.layersRemoved.connect(self._sincronizar_switch)
        self._sincronizar_switch()

    def _sincronizar_switch(self, *args: Any) -> None:
        self._switch.mostrar(modo_actual())
        self._widget_tree.sincronizar()

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
        if value:
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

    def _actualizar_add(self) -> None:
        node = self._widget_tree.nodo_actual()
        self._add_button.setText(TEXTO_GRUPO if es_grupo(node) else TEXTO_CAPA)

    def _cerrar_nodo(self, node: dict[str, Any]) -> None:
        self._actions.remove_node(str(node.get('id') or ''))

    def _alternar_grupo(self, node: dict[str, Any], marcado: bool) -> None:
        if marcado:
            self._agregar(node)
        else:
            quitar_grupo(str(node.get('id') or ''))

    def _require_layer_node(self, permitir_grupo: bool = False) -> Optional[dict[str, Any]]:
        node = self._widget_tree.nodo_actual()
        if node is None:
            QMessageBox.information(self, 'MapaLab', 'Selecciona una capa del árbol.')
            return None
        if permitir_grupo and es_grupo(node):
            return node
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

    def _agregar(self, node: dict[str, Any], completa: bool = False,
                 descargar: bool = False) -> None:
        if descargar:
            self._descargar(node, completa)
            return
        self._reportar(self._actions.add_as_wms(node, completa))

    def _on_clear_seleccion(self) -> None:
        quitadas = self._actions.clear_selections()
        self._mensaje('' if quitadas else 'No hay capas de selección en el proyecto.')

    def _on_add(self) -> None:
        node = self._require_layer_node(permitir_grupo=True)
        if node is not None:
            self._agregar(node)

    def _activar_consulta(self) -> None:
        canvas = self._iface.mapCanvas() if self._iface is not None else None
        if canvas is None:
            return
        if self._consulta_tool is None:
            self._consulta_tool = HerramientaConsulta(
                canvas, self._client, self._widget_tree.nodo_actual, self._al_consultar)
        canvas.setMapTool(self._consulta_tool)

    def _desactivar_consulta(self) -> None:
        canvas = self._iface.mapCanvas() if self._iface is not None else None
        if canvas is not None and self._consulta_tool is not None:
            canvas.unsetMapTool(self._consulta_tool)

    def _al_consultar(self, datos: Optional[tuple], aviso: str) -> None:
        if datos is None:
            self._mensaje(aviso)
            return
        self._reportar(self._actions.abrir_feature(datos))

    def showEvent(self, evento: Any) -> None:
        super().showEvent(evento)
        self._activar_consulta()

    def hideEvent(self, evento: Any) -> None:
        super().hideEvent(evento)
        self._desactivar_consulta()

    def _on_download(self) -> None:
        node = self._require_layer_node()
        if node is not None:
            self._descargar(node, False)

    def _descargar(self, node: dict[str, Any], completa: bool) -> None:
        if self._tareas.ocupado('descarga'):
            self._mensaje('Ya hay una descarga en curso.')
            return

        tarea, error = self._actions.download_as_vector(node, self, completa)
        if tarea is None:
            self._mensaje(error)
            return

        self._mensaje('Descargando… puedes seguir trabajando.')
        self._tareas.lanzar('descarga', tarea, self._descarga_lista, self._mensaje)

    def _descarga_lista(self, path: str) -> None:
        self._mensaje('')

    def closeEvent(self, evento: Any) -> None:
        self._desactivar_consulta()
        self._tareas.cancelar_todo()
        super().closeEvent(evento)
