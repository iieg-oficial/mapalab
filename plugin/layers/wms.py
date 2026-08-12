from typing import Any, Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from qgis.core import QgsDataSourceUri, QgsProject, QgsRasterLayer

from ..config import (DATA_CRS, FEATURE_COUNT, IDENTIFY_FORMAT, NODE_ID_PROPERTY,
                      TILE_SIZE, env_de_modo)
from ..model.tree import clean_label


def _base_url_with_params(wms_config: dict[str, Any], cql_filter: str,
                          time_value: Optional[str], modo: Optional[str]) -> str:
    base_url = wms_config.get('baseUrl') or ''
    extra: dict[str, str] = {'ENV': env_de_modo(modo)}

    if cql_filter:
        extra['CQL_FILTER'] = cql_filter
    if time_value:
        extra['TIME'] = time_value

    if not extra:
        return base_url

    separator = '&' if '?' in base_url else '?'
    return f'{base_url}{separator}{urlencode(extra)}'


def build_wms_uri(wms_config: dict[str, Any], cql_filter: str = '',
                  time_value: Optional[str] = None, modo: Optional[str] = None) -> str:
    uri = QgsDataSourceUri()
    uri.setParam('url', _base_url_with_params(wms_config, cql_filter, time_value, modo))
    uri.setParam('layers', wms_config.get('layerName') or '')
    uri.setParam('styles', wms_config.get('styles') or '')
    uri.setParam('format', wms_config.get('format') or 'image/png')
    uri.setParam('crs', wms_config.get('crs') or DATA_CRS)
    uri.setParam('maxWidth', str(TILE_SIZE))
    uri.setParam('maxHeight', str(TILE_SIZE))
    uri.setParam('dpiMode', '7')
    uri.setParam('contextualWMSLegend', '0')
    uri.setParam('featureCount', str(FEATURE_COUNT))
    uri.setParam('IgnoreGetMapUrl', '1')
    uri.setParam('IgnoreGetFeatureInfoUrl', '1')
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


def con_env(uri_actual: str, modo: Optional[str]) -> str:
    uri = QgsDataSourceUri()
    uri.setEncodedUri(uri_actual)
    partes = urlsplit(uri.param('url') or '')
    query = [(clave, valor)
             for clave, valor in parse_qsl(partes.query, keep_blank_values=True)
             if clave.upper() != 'ENV']
    query.append(('ENV', env_de_modo(modo)))

    uri.removeParam('url')
    uri.setParam('url', urlunsplit(
        (partes.scheme, partes.netloc, partes.path, urlencode(query), '')))
    return bytes(uri.encodedUri()).decode('utf-8')


def crear_wms_layer(node: dict[str, Any], cql_filter: str = '',
                    time_value: Optional[str] = None, modo: Optional[str] = None,
                    nombre: str = '') -> tuple[Optional[QgsRasterLayer], str]:
    wms_config = node.get('wmsConfig')
    if not wms_config:
        return None, 'La capa no trae configuración WMS.'

    uri = build_wms_uri(wms_config, cql_filter, time_value, modo)
    name = nombre or clean_label(
        node.get('label') or wms_config.get('layerName') or 'MapaLab')

    layer = QgsRasterLayer(uri, name, 'wms')
    if not layer.isValid():
        return None, _failure_reason(layer)

    layer.setCustomProperty(NODE_ID_PROPERTY, str(node.get('id') or ''))
    layer.setCustomProperty('identify/format', IDENTIFY_FORMAT)
    return layer, ''


def add_wms_layer(node: dict[str, Any], apply_node_filter: bool = False,
                  time_value: Optional[str] = None, al_tope: bool = False,
                  modo: Optional[str] = None) -> tuple[Optional[QgsRasterLayer], str]:
    wms_config = node.get('wmsConfig') or {}
    cql_filter = (wms_config.get('cqlFilter') or '') if apply_node_filter else ''

    layer, razon = crear_wms_layer(node, cql_filter, time_value, modo)
    if layer is None:
        return None, razon

    project = QgsProject.instance()
    if al_tope:
        project.addMapLayer(layer, False)
        project.layerTreeRoot().insertLayer(0, layer)
    else:
        project.addMapLayer(layer)
    return layer, ''
