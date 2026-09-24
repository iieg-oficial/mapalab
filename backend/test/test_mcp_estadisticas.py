from types import SimpleNamespace

import pytest

import servers.estadisticas as est
from servers.blindaje import Techo

CAMPOS = {'featureTypes': [{'properties': [
    {'name': 'geom', 'type': 'gml:MultiPolygon', 'localType': 'MultiPolygon'},
    {'name': 'cultivo', 'type': 'xsd:string', 'localType': 'string'},
    {'name': 'superficie', 'type': 'xsd:number', 'localType': 'number'},
]}]}


@pytest.fixture
def geoserver(monkeypatch):
    llamadas = []
    respuestas = {}

    def pedir(metodo, url, **kwargs):
        llamadas.append((metodo, url, kwargs.get('content')))
        if 'DescribeFeatureType' in url:
            return SimpleNamespace(json=lambda: CAMPOS)
        if 'resultType=hits' in url:
            return SimpleNamespace(text='<wfs:FeatureCollection numberMatched="208" numberReturned="0"/>')
        return SimpleNamespace(json=lambda: respuestas['wps'])

    est._cache.clear()
    monkeypatch.setattr(est, '_pedir', pedir)
    monkeypatch.setattr(est, 'techo_wps', Techo(por_minuto=5, por_dia=50))
    monkeypatch.setattr(est, 'resolver_consulta', lambda layer, **kw: (
        {'id': layer, 'label': 'Cultivos'}, 'agro', 'agro:cultivos',
        ["municipio = '120'"] if kw.get('municipio') else [],
    ))
    return SimpleNamespace(llamadas=llamadas, respuestas=respuestas)


def test_el_conteo_simple_no_gasta_wps(geoserver):
    resultado = est.layer_stats('cultivos', municipio='Zapopan')
    assert resultado['conteo'] == 208
    assert resultado['filtros'] == {'municipio': 'Zapopan'}
    assert all(metodo == 'GET' for metodo, _, _ in geoserver.llamadas)
    assert 'CQL_FILTER=municipio' in geoserver.llamadas[0][1]


def test_suma_y_promedio_de_un_campo_numerico(geoserver):
    geoserver.respuestas['wps'] = {'AggregationFunctions': ['Average', 'Count', 'Sum'], 'AggregationResults': [[301.82, 4200, 1267644.97]]}
    resultado = est.layer_stats('cultivos', field='superficie')
    assert resultado['conteo'] == 4200 and resultado['suma'] == 1267644.97 and resultado['promedio'] == 301.82
    xml = geoserver.llamadas[-1][2].decode('utf-8')
    assert '<wps:LiteralData>superficie</wps:LiteralData>' in xml and 'Sum' in xml


def test_reparto_por_clase_ordena_y_junta_el_resto(geoserver):
    geoserver.respuestas['wps'] = {'AggregationFunctions': ['Count'], 'AggregationResults': [['Mango', 3], ['Maíz grano', 142], ['Agave', 40], [None, 9]]}
    resultado = est.layer_stats('cultivos', group_by='cultivo', top=2)
    assert resultado['clases'] == [{'clase': 'Maíz grano', 'conteo': 142.0}, {'clase': 'Agave', 'conteo': 40.0}]
    assert resultado['otras'] == {'clases': 1, 'conteo': 3.0}
    assert resultado['conteo'] == 208
    assert 'groupByAttributes' in geoserver.llamadas[1][2].decode('utf-8')


@pytest.mark.parametrize('argumentos,esperado', [
    ({'field': 'cultivo'}, 'superficie'),
    ({'group_by': 'superficie'}, 'cultivo'),
    ({'field': 'no_existe'}, 'superficie'),
])
def test_rechaza_campos_que_no_sirven_y_dice_cuales_si(geoserver, argumentos, esperado):
    with pytest.raises(ValueError, match=esperado):
        est.layer_stats('cultivos', **argumentos)


def test_la_cache_evita_repetir_la_consulta(geoserver):
    est.layer_stats('cultivos')
    est.layer_stats('cultivos')
    assert len(geoserver.llamadas) == 1


def test_el_techo_de_wps_corta_con_un_mensaje_claro(geoserver, monkeypatch):
    monkeypatch.setattr(est, 'techo_wps', Techo(por_minuto=0, por_dia=0))
    with pytest.raises(ValueError, match='solo el conteo'):
        est.layer_stats('cultivos', field='superficie')
