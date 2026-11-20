import pytest

from servers.busqueda import buscar, indice_de_capas


def capa(id_, label, tags=()):
    return {'id': id_, 'label': label, 'wmsConfig': {'workspace': 'x'}, 'searchMeta': {'tags': list(tags)}}


ARBOL = [
    {'id': 'educacion', 'label': 'Educación', 'children': [
        {'id': 'centros', 'label': 'Centros educativos', 'children': [
            capa('preescolar', 'Preescolar', ['educacion', 'escuela', 'kinder']),
            capa('primaria', 'Primaria', ['educacion', 'escuela', 'primaria']),
        ]},
    ]},
    {'id': 'demografia', 'label': 'Demografía', 'children': [
        capa('tasa_poblacion_total', 'Población estimada', ['habitantes']),
        capa('tasa_dependencia', 'Razón de dependencia total'),
    ]},
    {'id': 'salud', 'label': 'Salud', 'children': [capa('imss_1', 'IMSS', ['salud', 'primer_nivel'])]},
    {'id': 'agro', 'label': 'Agricultura', 'children': [capa('aguacate', 'Aguacate')]},
    {'id': 'recursos', 'label': 'Recursos', 'children': [capa('cuerpo_de_agua', 'Cuerpo de agua', ['agua'])]},
]


@pytest.fixture
def indice():
    return indice_de_capas(ARBOL)


@pytest.mark.parametrize('consulta,esperado', [
    ('escuelas primarias', ['primaria']),
    ('escuelas', ['preescolar', 'primaria']),
    ('poblacion total', ['tasa_poblacion_total']),
    ('Población', ['tasa_poblacion_total']),
    ('hospitales', ['imss_1']),
    ('agua', ['cuerpo_de_agua']),
])
def test_busca_por_palabras_sin_acentos_ni_plurales(indice, consulta, esperado):
    assert buscar(indice, consulta)[:len(esperado)] == esperado


def test_la_etiqueta_exacta_va_primero(indice):
    assert buscar(indice, 'Razón de dependencia total')[0] == 'tasa_dependencia'


def test_solo_quedan_las_que_cubren_mas_palabras(indice):
    assert buscar(indice, 'poblacion total') == ['tasa_poblacion_total']


def test_filtra_dentro_de_los_permitidos(indice):
    assert buscar(indice, 'escuela', permitidos=['primaria', 'imss_1']) == ['primaria']


def test_nada_que_buscar(indice):
    assert buscar(indice, 'de la') == [] and buscar(indice, 'xyzqwe') == []
