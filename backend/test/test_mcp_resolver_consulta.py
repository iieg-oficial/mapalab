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
    monkeypatch.setattr(layers, '_find_node_in_tree', lambda tree, layer: tree[0])
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
