import os
from typing import Any, Optional

from qgis.PyQt.QtCore import QCoreApplication, Qt
from qgis.PyQt.QtGui import QCursor
from qgis.PyQt.QtWidgets import QApplication, QFileDialog, QWidget

from ..api.client import MapaLabClient, MapaLabError
from ..layers.grupos import add_group_layers, es_grupo
from ..layers.limites import aplicar_modo, modo_actual
from ..layers.metadata import apply_metadata
from ..layers.seleccion import agregar
from ..layers.wms import add_wms_layer
from ..model.tree import (
    clean_label,
    has_wfs,
    is_downloadable,
    workspace_and_layer,
)
from ..tasks import DescargarVectorTask
from .ficha import abrir_ficha


class LayerActions:

    def __init__(self, iface: Any, client: MapaLabClient) -> None:
        self._iface = iface
        self._client = client
        self._ficha: Any = None
        self._ficha_feature: Any = None

    def _busy(self, active: bool) -> None:
        if active:
            QApplication.setOverrideCursor(QCursor(Qt.WaitCursor))
        else:
            QApplication.restoreOverrideCursor()
        QCoreApplication.processEvents()

    def _attach_metadata(self, layer: Any, node: dict[str, Any]) -> None:
        workspace, layer_name = workspace_and_layer(node)
        if not workspace or not layer_name:
            return
        try:
            payload = self._client.fetch_metadata(workspace, layer_name)
        except MapaLabError:
            return
        apply_metadata(layer, payload, node)

    def add_group(self, node: dict[str, Any]) -> tuple[bool, str]:
        label = clean_label(node.get('label') or '')
        self._busy(True)
        try:
            agregadas, razon = add_group_layers(node, modo_actual())
        finally:
            self._busy(False)

        if agregadas == 0:
            return False, f'No se pudo agregar «{label}»: {razon}'
        return True, ''

    def add_as_wms(self, node: dict[str, Any]) -> tuple[bool, str]:
        if es_grupo(node):
            return self.add_group(node)

        label = clean_label(node.get('label') or '')
        self._busy(True)
        try:
            layer, reason = add_wms_layer(node, apply_node_filter=True,
                                          modo=modo_actual())
            if layer is None:
                return False, f'No se pudo agregar «{label}»: {reason}'
            self._attach_metadata(layer, node)
            if self._iface is not None:
                self._iface.setActiveLayer(layer)
        finally:
            self._busy(False)

        return True, ''

    def abrir_feature(self, datos: tuple) -> tuple[bool, str]:
        node_id, nombre, crs, elementos = datos
        capa: Any = None
        fids: list[int] = []
        fallo = ''

        for feature, marca in elementos:
            destino, fid, error = agregar(node_id, nombre, crs, feature, marca)
            if destino is None:
                fallo = error
                continue
            capa = destino
            fids.append(fid)

        if capa is None or not fids:
            return False, fallo or 'No se pudo consultar ese elemento.'

        capa.selectByIds(fids)
        if self._iface is not None:
            self._ficha_feature = capa.getFeature(fids[0])
            self._ficha = abrir_ficha(capa, self._ficha_feature, self._iface.mainWindow())
        return True, ''

    def set_base_mode(self, arbol: list[dict[str, Any]], modo: str) -> tuple[bool, str]:
        self._busy(True)
        try:
            return aplicar_modo(arbol, modo)
        finally:
            self._busy(False)

    def _target_dir(self, parent: Optional[QWidget]) -> str:
        return QFileDialog.getExistingDirectory(
            parent, 'Dónde guardar el GeoPackage', os.path.expanduser('~'))

    def download_as_vector(self, node: dict[str, Any], parent: Optional[QWidget] = None,
                           ) -> tuple[Optional[DescargarVectorTask], str]:
        label = clean_label(node.get('label') or '')

        if not has_wfs(node):
            return None, f'«{label}» no está publicada como vectorial.'
        if not is_downloadable(node):
            return None, f'«{label}» no es descargable.'

        target_dir = self._target_dir(parent)
        if not target_dir:
            return None, ''

        return DescargarVectorTask(self._client, node, target_dir), ''
