import json
from typing import Any
from urllib.parse import urlencode

from qgis.core import QgsFeature, QgsJsonUtils, QgsRectangle

from ..config import FEATURE_COUNT

INFO_VERSION: str = '1.1.1'

INFO_MIME: str = 'application/json'


def url_de_consulta(wms_config: dict[str, Any], extent: QgsRectangle, ancho: int,
                    alto: int, crs_authid: str, x: int, y: int) -> str:
    base_url = wms_config.get('baseUrl') or ''
    capa = wms_config.get('layerName') or ''
    if not base_url or not capa:
        return ''

    params: dict[str, str] = {
        'SERVICE': 'WMS',
        'VERSION': INFO_VERSION,
        'REQUEST': 'GetFeatureInfo',
        'LAYERS': capa,
        'QUERY_LAYERS': capa,
        'SRS': crs_authid,
        'BBOX': (f'{extent.xMinimum()},{extent.yMinimum()},'
                 f'{extent.xMaximum()},{extent.yMaximum()}'),
        'WIDTH': str(ancho),
        'HEIGHT': str(alto),
        'X': str(x),
        'Y': str(y),
        'INFO_FORMAT': INFO_MIME,
        'FEATURE_COUNT': str(FEATURE_COUNT),
    }

    cql = wms_config.get('cqlFilter') or ''
    if cql:
        params['CQL_FILTER'] = cql

    separador = '&' if '?' in base_url else '?'
    return f'{base_url}{separador}{urlencode(params)}'


def marca_de_id(bruto: Any) -> str:
    return str(bruto or '').split('.')[-1]


def features_de_json(texto: str) -> list[tuple[QgsFeature, str]]:
    try:
        payload = json.loads(texto)
    except (TypeError, ValueError):
        return []

    crudos = payload.get('features') if isinstance(payload, dict) else None
    if not crudos:
        return []

    features = QgsJsonUtils.stringToFeatureList(texto, QgsJsonUtils.stringToFields(texto))
    return [(feature, marca_de_id(crudo.get('id')))
            for feature, crudo in zip(features, crudos) if feature.hasGeometry()]
