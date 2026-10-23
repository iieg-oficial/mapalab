import pytest

import servers.layers as layers

NODO = {'id': 'bachillerato', 'wmsConfig': {
    'workspace': 'educacion', 'geoserverWorkspace': 'educacion', 'geoserverLayer': 'centros_educativos',
    'cqlFilter': "nivel_educativo ILIKE 'Bachillerato'",
}}


@pytest.fixture
def arbol(monkeypatch):
    nodo = {'id': NODO['id'], 'wmsConfig': dict(NODO['wmsConfig'])}
    monkeypatch.setattr(layers, 'get_cached_state', lambda: {'tree': [nodo], 'workspaces': []})
    monkeypatch.setattr(layers, 'resolver_capa', lambda ref: {'id': nodo['id'], 'node': nodo})
    monkeypatch.setattr(layers, 'filtro_de_fecha', lambda node, year, month=None: f"(fecha >= '{year}-01-01')" if year else None)
    return nodo


def test_aplica_el_filtro_base_de_la_capa(arbol):
    _, workspace, capa, partes = layers.resolver_consulta('bachillerato', year='2024')
    assert (workspace, capa) == ('educacion', 'educacion:centros_educativos')
    assert partes[0] == "(nivel_educativo ILIKE 'Bachillerato')"
    assert len(partes) == 2


def test_prefiere_el_nombre_wfs_de_la_capa(arbol):
    arbol['wmsConfig']['wfsLayerName'] = 'educacion:centros_wfs'
    assert layers.resolver_consulta('bachillerato')[2] == 'educacion:centros_wfs'


def test_rechaza_capas_sin_wfs(arbol):
    arbol['wmsConfig']['wfsAvailable'] = False
    with pytest.raises(ValueError, match='no publica'):
        layers.resolver_consulta('bachillerato')


def test_rechaza_nombres_de_capa_que_no_son_de_geoserver(arbol):
    arbol['wmsConfig']['wfsLayerName'] = 'x" onload="y'
    with pytest.raises(ValueError, match='WFS'):
        layers.resolver_consulta('bachillerato')


def test_rechaza_municipio_en_capa_sin_municipio(arbol, monkeypatch):
    monkeypatch.setattr(layers, 'resolver_municipio', lambda texto: {'clave': '14039', 'nombre': 'Guadalajara'})
    with pytest.raises(ValueError, match='no soporta filtro por municipio'):
        layers.resolver_consulta('bachillerato', municipio='Guadalajara')


def test_filtra_por_municipio_con_el_campo_de_la_capa(arbol, monkeypatch):
    arbol['searchMeta'] = {'hasMunicipio': True, 'municipioField': 'clave_municipio'}
    monkeypatch.setattr(layers, 'resolver_municipio', lambda texto: {'clave': '14039', 'nombre': 'Guadalajara'})
    assert layers.resolver_consulta('bachillerato', municipio='gdl')[3][-1] == "clave_municipio = '14039'"


def test_rechaza_rasteres_aunque_digan_tener_wfs(arbol):
    arbol['geometryType'] = 'raster'
    with pytest.raises(ValueError, match='es ráster'):
        layers.resolver_consulta('bachillerato')
    assert layers._capabilities_from_node(arbol)['consultableWfs'] is False
