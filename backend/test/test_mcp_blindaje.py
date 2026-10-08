import pytest

from servers.blindaje import (
    MAX_ETIQUETA_LADO,
    MAX_TEXTO_ANOTACION,
    Techo,
    limpiar_anotaciones,
    limpiar_capas,
    validar_etiqueta,
    validar_vista,
)


class TestCapas:
    def test_descarta_los_filtros_de_quien_llama(self):
        capas = limpiar_capas([{'slug': 'homicidio', 'opacity': 0.5, 'filters': {'cql': "1=1 OR 1=1"}}])
        assert capas == [{'slug': 'homicidio', 'opacity': 0.5}]

    def test_acepta_ids_de_texto(self):
        assert limpiar_capas(['poblacion']) == [{'slug': 'poblacion'}]

    @pytest.mark.parametrize('capa', [{'opacity': 1}, {'slug': ''}, {'slug': 'x', 'opacity': 2}, {'slug': 'x', 'visible': 'si'}, 42])
    def test_rechaza_capas_mal_formadas(self, capa):
        with pytest.raises(ValueError):
            limpiar_capas([capa])


class TestVista:
    def test_deja_solo_los_campos_conocidos(self):
        assert validar_vista({'zoom': 9, 'lat': 20.6, 'lon': -103.3, 'extra': 'x'}) == {'zoom': 9, 'lat': 20.6, 'lon': -103.3}

    @pytest.mark.parametrize('vista', [
        {'zoom': 9, 'lat': 60, 'lon': -103},
        {'zoom': 9, 'lat': 20, 'lon': 10},
        {'zoom': 99, 'lat': 20, 'lon': -103},
        {'zoom': 9, 'lat': float('nan'), 'lon': -103},
        {'zoom': 9, 'lat': 20},
        {'zoom': True, 'lat': 20, 'lon': -103},
    ])
    def test_rechaza_vistas_fuera_de_jalisco_o_incompletas(self, vista):
        with pytest.raises(ValueError):
            validar_vista(vista)

    def test_sin_vista_se_auto_encuadra(self):
        assert validar_vista(None) is None


class TestTextos:
    def test_etiqueta_larga_se_rechaza(self):
        with pytest.raises(ValueError):
            validar_etiqueta('x' * (MAX_ETIQUETA_LADO + 1), 'label_a')

    def test_anotacion_pierde_campos_desconocidos(self):
        limpias = limpiar_anotaciones([{'id': 'a', 'type': 'Text', 'geometry': {}, 'label': 'Sede', 'onclick': 'x'}])
        assert limpias == [{'id': 'a', 'type': 'Text', 'geometry': {}, 'label': 'Sede'}]

    def test_texto_de_anotacion_largo_se_rechaza(self):
        with pytest.raises(ValueError):
            limpiar_anotaciones([{'id': 'a', 'type': 'Text', 'label': 'x' * (MAX_TEXTO_ANOTACION + 1)}])

    def test_texto_de_anotacion_debe_ser_texto(self):
        with pytest.raises(ValueError):
            limpiar_anotaciones([{'id': 'a', 'type': 'Text', 'label': {'html': '<b>'}}])


class TestTecho:
    def test_corta_al_llegar_al_tope_del_minuto_y_se_libera(self):
        ahora = [0.0]
        techo = Techo(por_minuto=2, por_dia=10, reloj=lambda: ahora[0])
        assert techo.consumir() and techo.consumir()
        assert not techo.consumir()
        ahora[0] = 61
        assert techo.consumir()

    def test_el_tope_diario_manda_aunque_pase_el_minuto(self):
        ahora = [0.0]
        techo = Techo(por_minuto=100, por_dia=3, reloj=lambda: ahora[0])
        for _ in range(3):
            assert techo.consumir()
        ahora[0] = 120
        assert not techo.consumir()
