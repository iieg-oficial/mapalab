from typing import Any, Callable, Optional

from qgis.PyQt.QtCore import pyqtSignal
from qgis.core import QgsApplication, QgsFeedback, QgsTask

from .api.client import MapaLabCancelado, MapaLabClient, MapaLabError
from .assets_cache import fetch_asset
from .identidad import tema_icono_urls
from .layers.metadata import apply_metadata
from .layers.vector import add_vector_layer, download_vector
from .model.tree import alias_de_tema, clean_label, hydrate_tree, workspace_and_layer

PESO_CATALOGO: float = 40.0


class _TareaMapaLab(QgsTask):

    def __init__(self, descripcion: str) -> None:
        super().__init__(descripcion, QgsTask.CanCancel)
        self._feedback = QgsFeedback()
        self._error: str = ''

    def cancel(self) -> None:
        self._feedback.cancel()
        super().cancel()


class CargarArbolTask(_TareaMapaLab):

    listo = pyqtSignal(list)
    fallo = pyqtSignal(str)

    def __init__(self, client: MapaLabClient, force: bool = False) -> None:
        super().__init__('MapaLab: catálogo de capas')
        self._client = client
        self._force = force
        self._arbol: list[dict[str, Any]] = []

    def run(self) -> bool:
        try:
            crudo = self._client.fetch_tree(force=self._force, feedback=self._feedback)
        except MapaLabCancelado:
            return False
        except MapaLabError as exc:
            self._error = str(exc)
            return False

        self.setProgress(PESO_CATALOGO)
        self._arbol = hydrate_tree(crudo)
        self._precargar_iconos()
        return not self.isCanceled()

    def _precargar_iconos(self) -> None:
        total = len(self._arbol) or 1
        for indice, nodo in enumerate(self._arbol):
            if self.isCanceled():
                return
            alias = alias_de_tema(nodo)
            if alias:
                try:
                    fetch_asset(self._client, tema_icono_urls(alias), self._feedback)
                    fetch_asset(self._client, tema_icono_urls(alias, True), self._feedback)
                except MapaLabCancelado:
                    return
            avance = (100.0 - PESO_CATALOGO) * (indice + 1) / total
            self.setProgress(PESO_CATALOGO + avance)

    def finished(self, result: bool) -> None:
        if self.isCanceled():
            return
        if result:
            self.listo.emit(self._arbol)
        else:
            self.fallo.emit(self._error or 'El servidor no respondió.')


class DescargarVectorTask(_TareaMapaLab):

    listo = pyqtSignal(str)
    fallo = pyqtSignal(str)

    def __init__(self, client: MapaLabClient, node: dict[str, Any], target_dir: str) -> None:
        etiqueta = clean_label(node.get('label') or 'capa')
        super().__init__(f'MapaLab: descargando «{etiqueta}»')
        self._client = client
        self._node = node
        self._target_dir = target_dir
        self._etiqueta = etiqueta
        self._path: Optional[str] = None
        self._metadata: Any = None

    def _progreso(self, recibido: int, total: int) -> None:
        if total > 0:
            self.setProgress(min(99.0, recibido * 100.0 / total))

    def _metadata_remota(self) -> Any:
        workspace, layer = workspace_and_layer(self._node)
        if not workspace or not layer:
            return None
        try:
            return self._client.fetch_metadata(workspace, layer, feedback=self._feedback)
        except MapaLabError:
            return None

    def run(self) -> bool:
        path, error = download_vector(
            self._node, self._client, self._target_dir, apply_node_filter=True,
            feedback=self._feedback, on_progress=self._progreso)

        if self.isCanceled():
            return False
        if path is None:
            self._error = f'No se pudo descargar «{self._etiqueta}»: {error}'
            return False

        self._path = path
        self._metadata = self._metadata_remota()
        self.setProgress(100.0)
        return not self.isCanceled()

    def finished(self, result: bool) -> None:
        if self.isCanceled():
            return
        if not result or self._path is None:
            self.fallo.emit(self._error or f'No se pudo descargar «{self._etiqueta}».')
            return

        capa = add_vector_layer(self._path, self._node)
        if capa is None:
            self.fallo.emit(f'Se descargó en {self._path}, pero QGIS no pudo abrirlo.')
            return

        if self._metadata is not None:
            apply_metadata(capa, self._metadata, self._node)
        self.listo.emit(self._path)


class Coordinador:

    def __init__(self) -> None:
        self._activas: dict[str, _TareaMapaLab] = {}

    def ocupado(self, clave: str) -> bool:
        return clave in self._activas

    def lanzar(self, clave: str, tarea: _TareaMapaLab,
               al_terminar: Callable[[Any], None],
               al_fallar: Callable[[str], None]) -> None:
        tarea.listo.connect(al_terminar)
        tarea.fallo.connect(al_fallar)
        tarea.taskCompleted.connect(lambda: self._liberar(clave))
        tarea.taskTerminated.connect(lambda: self._liberar(clave))
        self._activas[clave] = tarea
        QgsApplication.taskManager().addTask(tarea)

    def _liberar(self, clave: str) -> None:
        self._activas.pop(clave, None)

    def cancelar_todo(self) -> None:
        for tarea in list(self._activas.values()):
            try:
                tarea.cancel()
            except RuntimeError:
                pass
        self._activas.clear()
