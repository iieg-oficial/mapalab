from types import SimpleNamespace
from urllib.parse import parse_qs, urlsplit

import pytest

import servers.tabla as tabla
from servers.blindaje import Techo

CAMPOS = {'geom': 'multipolygon', 'nombre': 'string', 'nivel': 'string', 'matricula': 'int', 'fecha': 'date', 'interno': 'string'}
CONFIGURACION = [
    {'columna': 'matricula', 'alias': 'Matrícula', 'orden': 1, 'visible': True, 'formato': None},
    {'columna': 'nombre', 'alias': 'Escuela', 'orden': 0, 'visible': True, 'formato': None},
    {'columna': 'fecha', 'alias': 'Año', 'orden': 2, 'visible': True, 'formato': 'anio'},
    {'columna': 'interno', 'alias': None, 'orden': 9, 'visible': False, 'formato': None},
]
RESPUESTA = {'numberMatched': 130, 'features': [
    {'properties': {'nombre': "Benito O'Juárez", 'matricula': 412, 'fecha': '2024-01-01', 'nivel': 'Primaria'},
     'geometry': {'type': 'Polygon', 'coordinates': [[[-103.4, 20.6], [-103.2, 20.6], [-103.2, 20.8], [-103.4, 20.6]]]}},
]}


@pytest.fixture
def geoserver(monkeypatch):
    urls = []

    def pedir(metodo, url, **kwargs):
        urls.append(url)
        return SimpleNamespace(json=lambda: RESPUESTA)

    tabla._campos_cache.clear()
    monkeypatch.setattr(tabla, '_pedir', pedir)
    monkeypatch.setattr(tabla, 'campos_de_capa', lambda *a: dict(CAMPOS))
    monkeypatch.setattr(tabla, 'techo_tabla', Techo(por_minuto=10, por_dia=100))
    monkeypatch.setattr(tabla, 'configuracion_columnas', lambda resuelta: CONFIGURACION)
    monkeypatch.setattr(tabla, '_resolve_layer_fuzzy', lambda layer: {'id': 'escuelas', 'label': 'Escuelas', 'workspace': 'educacion', 'node': {}})
    monkeypatch.setattr(tabla, 'resolver_consulta', lambda layer, workspace, municipio, year, month: (
        {}, 'educacion', 'educacion:escuelas', ["municipio = '120'"] if municipio else [],
    ))

    def params():
        return {k: v[0] for k, v in parse_qs(urlsplit(urls[-1]).query).items()}

    return SimpleNamespace(urls=urls, params=params)


def test_columnas_legibles_en_el_orden_del_visor_y_sin_las_ocultas(geoserver):
    resultado = tabla.layer_table('escuelas')
    assert [c['etiqueta'] for c in resultado['columnas']] == ['Escuela', 'nivel', 'Matrícula', 'Año']
    assert resultado['filas'] == [{'Escuela': "Benito O'Juárez", 'nivel': 'Primaria', 'Matrícula': 412, 'Año': 2024}]
    assert geoserver.params()['propertyName'] == 'nombre,nivel,matricula,fecha'
    assert resultado['total'] == 130 and resultado['paginas'] == 7


def test_paginacion_y_orden_van_a_geoserver(geoserver):
    resultado = tabla.layer_table('escuelas', orden='matricula', descendente=True, pagina=3, por_pagina=10)
    params = geoserver.params()
    assert params['startIndex'] == '20' and params['count'] == '10'
    assert params['sortBy'] == 'matricula D'
    assert resultado['orden'] == {'campo': 'matricula', 'descendente': True}


def test_los_filtros_se_arman_con_valores_escapados(geoserver):
    tabla.layer_table('escuelas', municipio='Zapopan', filtros=[
        {'campo': 'nombre', 'op': 'contiene', 'valor': "O'J"},
        {'campo': 'matricula', 'op': '>=', 'valor': '100'},
        {'campo': 'nivel', 'op': '!=', 'valor': 2024.0},
    ])
    assert geoserver.params()['CQL_FILTER'] == (
        "municipio = '120' AND nombre ILIKE '%O''J%' AND matricula >= 100 AND nivel <> '2024'"
    )


@pytest.mark.parametrize('filtro,mensaje', [
    ({'campo': 'geom', 'op': '=', 'valor': 'x'}, 'no tiene el campo'),
    ({'campo': 'nombre) OR (1=1', 'op': '=', 'valor': 'x'}, 'no tiene el campo'),
    ({'campo': 'matricula', 'op': '=', 'valor': '1 OR 1=1'}, 'no es un número'),
    ({'campo': 'matricula', 'op': 'contiene', 'valor': '1'}, 'es numérico'),
    ({'campo': 'nombre', 'op': 'LIKE', 'valor': 'x'}, 'Operador no válido'),
    ({'campo': 'nombre', 'op': '=', 'valor': 'x' * 101}, '100 caracteres'),
])
def test_rechaza_filtros_que_no_son_de_la_capa(geoserver, filtro, mensaje):
    with pytest.raises(ValueError, match=mensaje):
        tabla.layer_table('escuelas', filtros=[filtro])
    assert geoserver.urls == []


def test_coordenadas_en_metros_convertidas_a_lat_lon(geoserver, monkeypatch):
    centros = []
    monkeypatch.setattr(tabla, 'a_lat_lon', lambda c: centros.extend(c) or [{'lat': 20.7, 'lon': -103.3}])
    resultado = tabla.layer_table('escuelas', columnas=['nombre'], coordenadas=True)
    assert geoserver.params()['srsName'] == 'EPSG:6368'
    assert geoserver.params()['propertyName'] == 'nombre,geom'
    assert centros[0] == pytest.approx((-103.3, 20.7))
    assert resultado['filas'][0]['coordenadas'] == {'lat': 20.7, 'lon': -103.3}


def test_sin_orden_pagina_estable_por_la_primera_columna(geoserver):
    tabla.layer_table('escuelas', pagina=2)
    assert geoserver.params()['sortBy'] == 'nombre A'


def test_no_deja_recorrer_la_capa_completa(geoserver):
    with pytest.raises(ValueError, match='5000'):
        tabla.layer_table('escuelas', pagina=101, por_pagina=50)


def test_el_techo_corta_antes_de_pedir(geoserver, monkeypatch):
    monkeypatch.setattr(tabla, 'techo_tabla', Techo(por_minuto=0, por_dia=0))
    with pytest.raises(ValueError, match='límite'):
        tabla.layer_table('escuelas')
    assert geoserver.urls == []
