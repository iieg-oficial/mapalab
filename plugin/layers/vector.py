import os
import re
from typing import Any, Callable, Optional
from urllib.parse import urlencode

from qgis.core import QgsFeedback, QgsProject, QgsVectorLayer

from ..api.client import MapaLabClient, MapaLabError
from ..config import DOWNLOAD_CRS, DOWNLOAD_TIMEOUT_MS
from ..model.tree import clean_label, typename

GPKG_FORMAT: str = 'geopackage'


def _safe_name(value: str) -> str:
    cleaned = re.sub(r'[^A-Za-z0-9_.-]+', '_', value)
    return cleaned.strip('_') or 'capa'


def build_wfs_url(wms_config: dict[str, Any], type_name: str, cql_filter: str = '') -> str:
    params: dict[str, str] = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeNames': type_name,
        'outputFormat': GPKG_FORMAT,
        'srsName': DOWNLOAD_CRS,
    }
    if cql_filter:
        params['CQL_FILTER'] = cql_filter
    return f"{wms_config.get('wfsUrl') or ''}?{urlencode(params)}"


def download_vector(node: dict[str, Any], client: MapaLabClient, target_dir: str,
                    apply_node_filter: bool = False,
                    extra_cql: str = '',
                    feedback: Optional[QgsFeedback] = None,
                    on_progress: Optional[Callable[[int, int], None]] = None,
                    ) -> tuple[Optional[str], str]:
    wms_config = node.get('wmsConfig') or {}
    type_name = typename(node)
    if not type_name:
        return None, 'La capa no tiene nombre WFS.'

    filters: list[str] = []
    if apply_node_filter and wms_config.get('cqlFilter'):
        filters.append(wms_config['cqlFilter'])
    if extra_cql:
        filters.append(extra_cql)

    if len(filters) == 1:
        cql_filter = filters[0]
    elif filters:
        cql_filter = ' AND '.join(f'({item})' for item in filters)
    else:
        cql_filter = ''

    url = build_wfs_url(wms_config, type_name, cql_filter)
    nombre = _safe_name(type_name)
    if apply_node_filter and wms_config.get('cqlFilter'):
        nombre = f"{nombre}_{_safe_name(str(node.get('id') or ''))}"
    destination = os.path.join(target_dir, f'{nombre}.gpkg')

    try:
        written = client.download(
            url, destination, DOWNLOAD_TIMEOUT_MS, feedback=feedback, on_progress=on_progress)
    except MapaLabError as exc:
        return None, str(exc)

    if written == 0:
        return None, 'El servidor devolvió una respuesta vacía.'

    with open(destination, 'rb') as handle:
        if handle.read(15) != b'SQLite format 3':
            os.remove(destination)
            return None, 'El servidor no devolvió un GeoPackage.'

    return destination, ''


def add_vector_layer(path: str, node: dict[str, Any]) -> Optional[QgsVectorLayer]:
    name = clean_label(node.get('label') or 'MapaLab')
    layer = QgsVectorLayer(path, name, 'ogr')
    if not layer.isValid():
        return None

    QgsProject.instance().addMapLayer(layer)
    return layer
