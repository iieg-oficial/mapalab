from types import SimpleNamespace

import pytest

import servers.resolve as resolve

ARBOL = [
    {'id': 'seguridad', 'label': 'Seguridad', 'children': [
        {'id': 'robos', 'label': 'Robos', 'children': [
            {'id': 'robo_bancos', 'label': 'Robo a bancos', 'wmsConfig': {'workspace': 'seguridad'}},
            {'id': 'robo_negocio', 'label': 'Robo a negocio', 'wmsConfig': {'workspace': 'seguridad'}},
        ]},
        {'id': 'homicidio_doloso', 'label': 'Homicidio doloso', 'wmsConfig': {'workspace': 'seguridad'}},
    ]},
]
MUNICIPIOS = [
    {'clave': '14039', 'nombre': 'Guadalajara'},
    {'clave': '14101', 'nombre': 'Tonalá'},
    {'clave': '14023', 'nombre': 'Zapotlán el Grande'},
    {'clave': '14124', 'nombre': 'Zapotlanejo'},
]


@pytest.fixture
def catalogo(mock_mapalab_db, monkeypatch):
    busqueda = {'filas': []}
    monkeypatch.setattr(resolve, 'get_cached_state', lambda: {'tree': ARBOL})
    monkeypatch.setattr(resolve.LayersRepository, 'find_layer_by_slug_or_alias', lambda session, ref: None)
    monkeypatch.setattr(resolve.LayersRepository, 'search_layers', lambda session, ref, limit=50: busqueda['filas'])
    resolve._municipios_cache.clear()
    monkeypatch.setattr(resolve, '_todos_los_municipios', lambda: MUNICIPIOS)
    return busqueda


def filas(*ids):
    return [SimpleNamespace(id=i) for i in ids]


def test_el_id_exacto_resuelve_sin_aviso(catalogo):
    resuelta = resolve.resolver_capa('homicidio_doloso')
    assert resuelta['id'] == 'homicidio_doloso' and 'resuelto_de' not in resuelta


def test_un_grupo_no_es_una_capa(catalogo):
    with pytest.raises(ValueError, match='es un grupo.*robo_bancos, robo_negocio'):
        resolve.resolver_capa('robos')


def test_texto_ambiguo_lista_las_opciones(catalogo):
    catalogo['filas'] = filas('robo_bancos', 'robo_negocio')
    with pytest.raises(ValueError, match='varias capas: robo_bancos, robo_negocio'):
        resolve.resolver_capa('robo')


def test_texto_con_una_sola_capa_avisa_de_donde_salio(catalogo):
    catalogo['filas'] = filas('robos', 'homicidio_doloso')
    resuelta = resolve.resolver_capa('homicidio')
    assert resuelta['id'] == 'homicidio_doloso' and resuelta['resuelto_de'] == 'homicidio'


def test_la_etiqueta_exacta_desempata(catalogo):
    catalogo['filas'] = filas('robo_bancos', 'robo_negocio')
    assert resolve.resolver_capa('robo a negocio')['id'] == 'robo_negocio'


def test_capa_inexistente(catalogo):
    with pytest.raises(ValueError, match='No encontré'):
        resolve.resolver_capa('tabla_secreta')


@pytest.mark.parametrize('texto,clave', [('Tonala', '14101'), ('guadalajara', '14039'), ('14124', '14124'), ('zapotlán el grande', '14023')])
def test_municipio_sin_acentos_y_por_clave(catalogo, texto, clave):
    assert resolve.resolver_municipio(texto)['clave'] == clave


def test_municipio_ambiguo_lista_las_opciones(catalogo):
    with pytest.raises(ValueError, match='varios municipios: Zapotlán el Grande'):
        resolve.resolver_municipio('Zapotlan')


@pytest.fixture
def periodicidad(monkeypatch):
    monkeypatch.setattr(resolve.PeriodicityService, 'get_periodicities_batch',
                        lambda llaves: {llaves[0]: {'2023': {'1': 1, '2': 1}, '2024': {'1': 1}}})
    monkeypatch.setattr(resolve.PeriodicityService, 'get_date_column', lambda ws, capa: 'fecha_hecho')
    return {'id': 'homicidio_doloso', 'wmsConfig': {'workspace': 'seguridad'}}


def test_fecha_usa_la_columna_de_la_capa(periodicidad):
    assert resolve.filtro_de_fecha(periodicidad, '2024') == "(fecha_hecho >= '2024-01-01' AND fecha_hecho < '2025-01-01')"


@pytest.mark.parametrize('year,month,mensaje', [
    ('1990', None, 'Años disponibles: 2023–2024'),
    ('2024', 2, 'Meses de 2024: 1'),
    (None, 3, "solo vale junto con 'year'"),
    ('24', None, '4 dígitos'),
])
def test_fecha_se_valida_contra_la_periodicidad(periodicidad, year, month, mensaje):
    with pytest.raises(ValueError, match=mensaje):
        resolve.filtro_de_fecha(periodicidad, year, month)


def test_capa_sin_periodicidad_no_acepta_year(monkeypatch):
    monkeypatch.setattr(resolve.PeriodicityService, 'get_periodicities_batch', lambda llaves: {})
    with pytest.raises(ValueError, match='no tiene periodicidad'):
        resolve.filtro_de_fecha({'id': 'cuerpos_de_agua', 'wmsConfig': {}}, '2024')
