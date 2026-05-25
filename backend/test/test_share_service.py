import pytest

from app.services.share_service import validate_payload


def _envelope(kind: str, payload: dict, version: int = 1) -> dict:
    return {'version': version, 'kind': kind, 'payload': payload}


class TestSingle:
    def test_acepta_single_minimo(self):
        kind, payload = validate_payload(_envelope('single', {'layers': []}))
        assert kind == 'single'
        assert payload == {'layers': []}

    def test_acepta_single_con_view_y_layers(self):
        env = _envelope('single', {
            'view': {'zoom': 8.2, 'lat': 20.6, 'lon': -103.4},
            'layers': [{'slug': 'seguridad:tasa_homicidio_doloso', 'opacity': 0.5}],
        })
        kind, _ = validate_payload(env)
        assert kind == 'single'

    def test_rechaza_opacity_fuera_de_rango(self):
        env = _envelope('single', {'layers': [{'slug': 'x:y', 'opacity': 1.5}]})
        with pytest.raises(ValueError, match='opacity'):
            validate_payload(env)

    def test_rechaza_zoom_fuera_de_rango(self):
        env = _envelope('single', {'layers': [], 'view': {'zoom': 30}})
        with pytest.raises(ValueError, match='zoom'):
            validate_payload(env)


class TestSwipe:
    def _swipe_payload(self, **overrides):
        base = {
            'shared': {'view': {'zoom': 8}, 'basemap': 'osm', 'selected': None},
            'paneA': {'label': 'A', 'layers': [{'slug': 'seguridad:tasa_homicidio_doloso'}]},
            'paneB': {'label': 'B', 'layers': [{'slug': 'demografia:poblacion'}]},
            'activeSlot': 'A',
            'position': 0.5,
        }
        base.update(overrides)
        return base

    def test_acepta_swipe_completo(self):
        kind, _ = validate_payload(_envelope('swipe', self._swipe_payload()))
        assert kind == 'swipe'

    def test_rechaza_active_slot_invalido(self):
        env = _envelope('swipe', self._swipe_payload(activeSlot='X'))
        with pytest.raises(ValueError, match='activeSlot'):
            validate_payload(env)

    def test_rechaza_position_fuera_de_rango(self):
        env = _envelope('swipe', self._swipe_payload(position=2))
        with pytest.raises(ValueError, match='position'):
            validate_payload(env)

    def test_rechaza_pane_sin_layers(self):
        env = _envelope('swipe', self._swipe_payload(paneB={'label': 'B'}))
        with pytest.raises(ValueError, match='layers'):
            validate_payload(env)

    def test_rechaza_sin_shared(self):
        payload = self._swipe_payload()
        del payload['shared']
        with pytest.raises(ValueError, match='shared'):
            validate_payload(_envelope('swipe', payload))


class TestKindRechazado:
    def test_compare_legacy_rechazado(self):
        with pytest.raises(ValueError, match='kind invalido: compare'):
            validate_payload(_envelope('compare', {}))

    def test_kind_arbitrario_rechazado(self):
        with pytest.raises(ValueError, match='kind invalido: foo'):
            validate_payload(_envelope('foo', {}))

    def test_version_desconocida_rechazada(self):
        with pytest.raises(ValueError, match='version desconocida'):
            validate_payload(_envelope('single', {'layers': []}, version=99))
