import os
from typing import Any, Optional

from qgis.PyQt.QtCore import QCoreApplication, Qt
from qgis.PyQt.QtGui import QCursor
from qgis.PyQt.QtWidgets import QApplication, QFileDialog, QWidget

from ..api.client import MapaLabClient, MapaLabError
from ..layers.metadata import apply_metadata
from ..layers.vector import add_vector_layer, download_vector
from ..layers.wms import add_wms_layer
from ..model.tree import (
    clean_label,
    has_wfs,
    is_downloadable,
    workspace_and_layer,
)


class LayerActions:

    def __init__(self, iface: Any, client: MapaLabClient) -> None:
        self._iface = iface
        self._client = client

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

    def add_as_wms(self, node: dict[str, Any], keep_filter: bool) -> str:
        label = clean_label(node.get('label') or '')
        self._busy(True)
        try:
            layer, reason = add_wms_layer(node, apply_node_filter=keep_filter)
            if layer is None:
                return f'No se pudo agregar «{label}»: {reason}'
            self._attach_metadata(layer, node)
        finally:
            self._busy(False)

        suffix = ' con el filtro del visor' if keep_filter else ' completa'
        return f'«{label}» agregada como WMS{suffix}.'

    def _target_dir(self, parent: Optional[QWidget]) -> str:
        return QFileDialog.getExistingDirectory(
            parent, 'Dónde guardar el GeoPackage', os.path.expanduser('~'))

    def download_as_vector(self, node: dict[str, Any], keep_filter: bool,
                           parent: Optional[QWidget] = None) -> str:
        label = clean_label(node.get('label') or '')

        if not has_wfs(node):
            return f'«{label}» no está publicada como vectorial.'
        if not is_downloadable(node):
            return f'«{label}» no es descargable.'

        target_dir = self._target_dir(parent)
        if not target_dir:
            return 'Descarga cancelada.'

        self._busy(True)
        try:
            path, error = download_vector(
                node, self._client, target_dir, apply_node_filter=keep_filter)
            if path is None:
                return f'No se pudo descargar «{label}»: {error}'

            layer = add_vector_layer(path, node)
            if layer is None:
                return f'Se descargó en {path}, pero QGIS no pudo abrirlo.'
            self._attach_metadata(layer, node)
        finally:
            self._busy(False)

        size_mb = os.path.getsize(path) / (1024 * 1024)
        return f'«{label}» descargada ({size_mb:.1f} MB) y agregada desde {path}.'
