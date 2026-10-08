from types import SimpleNamespace

import pytest

import servers.shares as shares
from servers.blindaje import Techo

CATALOGO = {'homicidio_doloso', 'poblacion'}


@pytest.fixture(autouse=True)
def catalogo(monkeypatch):
    monkeypatch.setattr(shares, '_resolve_layer_fuzzy', lambda ref: {'id': ref} if ref in CATALOGO else None)
    monkeypatch.setattr(shares, '_resolve_municipio_selection', lambda municipio: None)


@pytest.fixture
def capturado(monkeypatch):
    llamadas = {}

    def falso(**kwargs):
        llamadas.update(kwargs)
        return {'id': 'x', 'kind': 'single', 'url': 'u', 'embed_html': 'e'}

    monkeypatch.setattr(shares, 'create_single_share', falso)
    monkeypatch.setattr(shares, 'create_swipe_share', falso)
    return llamadas


def test_create_map_descarta_filtros_y_resuelve_capas(capturado):
    shares.create_map(layers=[{'slug': 'homicidio_doloso', 'filters': {'cql': 'INCLUDE'}}])
    assert capturado['layers'] == [{'slug': 'homicidio_doloso'}]


def test_create_map_rechaza_capas_que_no_existen(capturado):
    with pytest.raises(ValueError, match='No existe la capa'):
        shares.create_map(layers=['tabla_secreta'])


def test_create_map_rechaza_selected_ajeno(capturado):
    with pytest.raises(ValueError, match='selected'):
        shares.create_map(layers=['poblacion'], selected='homicidio_doloso')


def test_create_map_rechaza_vista_fuera_de_jalisco(capturado):
    with pytest.raises(ValueError, match='view'):
        shares.create_map(layers=['poblacion'], view={'zoom': 8, 'lat': 40, 'lon': -3})


def test_create_swipe_acota_etiquetas_y_resuelve_paneles(capturado):
    shares.create_swipe(pane_a_layers=['poblacion'], pane_b_layers=['homicidio_doloso'], label_a='  Población  ')
    assert capturado['label_a'] == 'Población'
    assert capturado['pane_b_layers'] == [{'slug': 'homicidio_doloso'}]
    with pytest.raises(ValueError, match='label_b'):
        shares.create_swipe(pane_a_layers=['poblacion'], pane_b_layers=['poblacion'], label_b='x' * 61)


def test_el_techo_global_frena_la_escritura(mock_mapalab_db, monkeypatch):
    monkeypatch.setattr(shares, 'techo_compartidos', Techo(por_minuto=1, por_dia=10))
    monkeypatch.setattr(shares.ShareRepository, 'upsert', lambda **kwargs: SimpleNamespace(id=kwargs['share_id'], kind=kwargs['kind']))
    envelope = {'version': 2, 'kind': 'single', 'payload': {'layers': [{'slug': 'poblacion'}]}}
    assert shares._persist_share(envelope)['url']
    with pytest.raises(ValueError, match='límite'):
        shares._persist_share(envelope)


def test_create_map_abre_en_3d_con_capas_del_mapa(capturado):
    shares.create_map(layers=['poblacion'], vista_3d={'inclinacion': 60, 'rumbo': -30.25, 'extruir': ['poblacion', 'poblacion']})
    assert capturado['vista3d'] == {'pitch': 60, 'bearing': -30.2, 'exaggeration': 1.5, 'extruir': ['poblacion']}


@pytest.mark.parametrize('vista,mensaje', [
    ({'extruir': ['homicidio_doloso']}, 'capas del mapa'),
    ({'extruir': ['tabla_secreta']}, 'capas del mapa'),
    ({'inclinacion': 90}, 'vista_3d inválida'),
    ({'exageracion': 0}, 'vista_3d inválida'),
    ({'altura': 3}, None),
])
def test_create_map_valida_la_vista_3d(capturado, vista, mensaje):
    if mensaje is None:
        shares.create_map(layers=['poblacion'], vista_3d=vista)
        assert 'altura' not in capturado['vista3d']
        return
    with pytest.raises(ValueError, match=mensaje):
        shares.create_map(layers=['poblacion'], vista_3d=vista)


def test_create_swipe_acepta_extruir_capas_de_cualquier_lado(capturado):
    shares.create_swipe(pane_a_layers=['poblacion'], pane_b_layers=['homicidio_doloso'], vista_3d={'extruir': ['homicidio_doloso']})
    assert capturado['vista3d']['extruir'] == ['homicidio_doloso']
