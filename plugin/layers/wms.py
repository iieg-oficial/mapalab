from typing import Any, Optional
from urllib.parse import urlencode

from qgis.core import QgsDataSourceUri, QgsProject, QgsRasterLayer

from ..config import DATA_CRS, TILE_SIZE
from ..model.tree import clean_label


def _base_url_with_params(wms_config: dict[str, Any], cql_filter: str,
                          time_value: Optional[str]) -> str:
    base_url = wms_config.get('baseUrl') or ''
    extra: dict[str, str] = {}

    if cql_filter:
        extra['CQL_FILTER'] = cql_filter
    if time_value:
        extra['TIME'] = time_value

    if not extra:
        return base_url

    separator = '&' if '?' in base_url else '?'
    return f'{base_url}{separator}{urlencode(extra)}'


def build_wms_uri(wms_config: dict[str, Any], cql_filter: str = '',
                  time_value: Optional[str] = None) -> str:
    uri = QgsDataSourceUri()
    uri.setParam('url', _base_url_with_params(wms_config, cql_filter, time_value))
    uri.setParam('layers', wms_config.get('layerName') or '')
    uri.setParam('styles', wms_config.get('styles') or '')
    uri.setParam('format', wms_config.get('format') or 'image/png')
    uri.setParam('crs', wms_config.get('crs') or DATA_CRS)
    uri.setParam('maxWidth', str(TILE_SIZE))
    uri.setParam('maxHeight', str(TILE_SIZE))
    uri.setParam('dpiMode', '7')
    uri.setParam('contextualWMSLegend', '0')
    return bytes(uri.encodedUri()).decode('utf-8')


def _failure_reason(layer: QgsRasterLayer) -> str:
    error = layer.error()
    summary = error.summary() if error else ''
    if not summary:
        provider = layer.dataProvider()
        provider_error = provider.error() if provider else None
        summary = provider_error.summary() if provider_error else ''
    summary = summary.strip()
    if not summary or summary.lower().startswith('provider is not valid'):
        return ('el proveedor WMS no pudo construirse. El detalle está en '
                'Ver → Paneles → Mensajes de registro, pestaña WMS.')
    return summary


def add_wms_layer(node: dict[str, Any], apply_node_filter: bool = False,
                  time_value: Optional[str] = None) -> tuple[Optional[QgsRasterLayer], str]:
    wms_config = node.get('wmsConfig')
    if not wms_config:
        return None, 'La capa no trae configuración WMS.'

    cql_filter = (wms_config.get('cqlFilter') or '') if apply_node_filter else ''
    uri = build_wms_uri(wms_config, cql_filter, time_value)
    name = clean_label(node.get('label') or wms_config.get('layerName') or 'MapaLab')

    layer = QgsRasterLayer(uri, name, 'wms')
    if not layer.isValid():
        return None, _failure_reason(layer)

    QgsProject.instance().addMapLayer(layer)
    return layer, ''
