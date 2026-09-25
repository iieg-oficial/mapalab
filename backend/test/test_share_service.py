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


class TestMunicipios:
    def _payload_single(self, municipios):
        return _envelope('single', {'layers': [], 'municipios': municipios}, version=2)

    def test_acepta_municipios_basico(self):
        kind, _ = validate_payload(self._payload_single({'source': 'iieg', 'selected': ['14039', '14120']}))
        assert kind == 'single'

    def test_acepta_source_inegi(self):
        kind, _ = validate_payload(self._payload_single({'source': 'inegi', 'selected': ['14039']}))
        assert kind == 'single'

    def test_rechaza_source_invalido(self):
        with pytest.raises(ValueError, match='source debe ser uno de'):
            validate_payload(self._payload_single({'source': 'foo', 'selected': ['14039']}))

    def test_rechaza_selected_vacio(self):
        with pytest.raises(ValueError, match='selected debe ser lista no vacia'):
            validate_payload(self._payload_single({'source': 'iieg', 'selected': []}))

    def test_rechaza_clave_no_string(self):
        with pytest.raises(ValueError, match='cada clave debe ser string'):
            validate_payload(self._payload_single({'source': 'iieg', 'selected': [14039]}))

    def test_acepta_municipios_en_swipe_shared(self):
        env = _envelope('swipe', {
            'shared': {'view': {'zoom': 8}, 'municipios': {'source': 'iieg', 'selected': ['14039']}},
            'paneA': {'layers': []}, 'paneB': {'layers': []},
            'activeSlot': 'A', 'position': 0.5,
        }, version=2)
        kind, _ = validate_payload(env)
        assert kind == 'swipe'

    def test_acepta_municipios_none(self):
        kind, _ = validate_payload(_envelope('single', {'layers': [], 'municipios': None}, version=2))
        assert kind == 'single'


class TestVersion:
    def test_acepta_version_1_backward_compat(self):
        kind, _ = validate_payload(_envelope('single', {'layers': []}, version=1))
        assert kind == 'single'

    def test_acepta_version_2(self):
        kind, _ = validate_payload(_envelope('single', {'layers': []}, version=2))
        assert kind == 'single'

    def test_rechaza_version_3(self):
        with pytest.raises(ValueError, match='version desconocida'):
            validate_payload(_envelope('single', {'layers': []}, version=3))


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


class TestAnnotations:
    def _annotation(self, **overrides):
        base = {
            'id': 'abc',
            'type': 'Polygon',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[[-103.4, 20.6], [-103.3, 20.6], [-103.3, 20.7], [-103.4, 20.7], [-103.4, 20.6]]],
            },
            'label': 'Zona X',
            'value': 1234.5,
        }
        base.update(overrides)
        return base

    def test_acepta_single_con_annotation_polygon(self):
        env = _envelope('single', {'layers': [], 'annotations': [self._annotation()]})
        kind, _ = validate_payload(env)
        assert kind == 'single'

    def test_acepta_single_con_annotation_linestring(self):
        env = _envelope('single', {'layers': [], 'annotations': [
            self._annotation(type='LineString', geometry={
                'type': 'LineString', 'coordinates': [[-103.4, 20.6], [-103.3, 20.7]],
            }),
        ]})
        kind, _ = validate_payload(env)
        assert kind == 'single'

    def test_acepta_pin_y_select(self):
        env = _envelope('single', {'layers': [], 'annotations': [
            self._annotation(type='Pin', geometry={'type': 'Point', 'coordinates': [-103.4, 20.6]}, pinEtiqueta='Presa'),
            self._annotation(id='sel', type='Select'),
        ]})
        validate_payload(env)

    def test_rechaza_pin_etiqueta_demasiado_larga(self):
        env = _envelope('single', {'layers': [], 'annotations': [
            self._annotation(type='Pin', geometry={'type': 'Point', 'coordinates': [-103.4, 20.6]}, pinEtiqueta='x' * 201),
        ]})
        with pytest.raises(ValueError, match='pinEtiqueta'):
            validate_payload(env)

    def test_acepta_swipe_con_annotations(self):
        env = _envelope('swipe', {
            'shared': {}, 'paneA': {'layers': []}, 'paneB': {'layers': []},
            'activeSlot': 'A', 'position': 0.5,
            'annotations': [self._annotation(type='Text', geometry={'type': 'Point', 'coordinates': [-103.4, 20.6]}, textLabel='Aquí')],
        })
        kind, _ = validate_payload(env)
        assert kind == 'swipe'

    def test_rechaza_type_invalido(self):
        env = _envelope('single', {'layers': [], 'annotations': [self._annotation(type='Foo')]})
        with pytest.raises(ValueError, match='type debe ser uno de'):
            validate_payload(env)

    def test_rechaza_geometry_invalida(self):
        env = _envelope('single', {'layers': [], 'annotations': [self._annotation(geometry={'type': 'Bar', 'coordinates': []})]})
        with pytest.raises(ValueError, match='geometry'):
            validate_payload(env)

    def test_rechaza_sin_id(self):
        a = self._annotation()
        del a['id']
        with pytest.raises(ValueError, match='id requerido'):
            validate_payload(_envelope('single', {'layers': [], 'annotations': [a]}))

    def test_rechaza_demasiadas_annotations(self):
        env = _envelope('single', {'layers': [], 'annotations': [self._annotation(id=f'm{i}') for i in range(201)]})
        with pytest.raises(ValueError, match='excede'):
            validate_payload(env)

    def test_acepta_annotations_none(self):
        env = _envelope('single', {'layers': [], 'annotations': None})
        kind, _ = validate_payload(env)
        assert kind == 'single'

    def test_annotations_no_requeridas(self):
        kind, _ = validate_payload(_envelope('single', {'layers': []}))
        assert kind == 'single'


class TestVista3d:
    VISTA = {'pitch': 55, 'bearing': -20.5, 'exaggeration': 1.5, 'extruir': ['seguridad:homicidio_doloso']}

    def test_acepta_single_y_swipe_con_vista3d(self):
        validate_payload(_envelope('single', {'layers': [], 'vista3d': self.VISTA}))
        validate_payload(_envelope('swipe', {
            'shared': {'vista3d': self.VISTA}, 'paneA': {'layers': []}, 'paneB': {'layers': []}, 'activeSlot': 'A',
        }))

    def test_acepta_ajustes_validos(self):
        ajustes = {'estiloPuntos': 'poste', 'estiloTextos': 'planos', 'agruparPuntos': True, 'escalaSimbolos': 1.2, 'velocidadOrbita': 12}
        validate_payload(_envelope('single', {'layers': [], 'vista3d': {**self.VISTA, 'ajustes': ajustes}}))

    @pytest.mark.parametrize('cambio,mensaje', [
        ({'pitch': 90}, 'pitch'),
        ({'pitch': True}, 'pitch'),
        ({'bearing': 400}, 'bearing'),
        ({'exaggeration': 9}, 'exaggeration'),
        ({'extruir': [f'c{i}' for i in range(11)]}, 'extruir'),
        ({'extruir': [3]}, 'extruir'),
        ({'ajustes': 'x'}, 'ajustes'),
        ({'ajustes': {'terreno': 'si'}}, 'terreno'),
        ({'ajustes': {'escalaSimbolos': 3}}, 'escalaSimbolos'),
        ({'ajustes': {'estiloPuntos': 'globo'}}, 'estiloPuntos'),
        ({'ajustes': {'color': 'rojo'}}, 'color'),
    ])
    def test_rechaza_valores_fuera_de_rango(self, cambio, mensaje):
        env = _envelope('single', {'layers': [], 'vista3d': {**self.VISTA, **cambio}})
        with pytest.raises(ValueError, match=mensaje):
            validate_payload(env)


class TestLimitesDelPayload:
    @pytest.mark.parametrize('payload,mensaje', [
        ({'layers': [], 'view': {'zoom': 8, 'lat': 48.8, 'lon': 2.3}}, 'view.lat'),
        ({'layers': [], 'view': {'zoom': 8, 'lat': 20.6, 'lon': -103.4, 'rotation': 'x'}}, 'rotation'),
        ({'layers': [{'slug': f'c{i}'} for i in range(61)]}, 'excede 60'),
        ({'layers': [{'slug': 'x' * 201}]}, 'slug'),
        ({'layers': [{'slug': 'a', 'filters': {'date': {'$ne': 1}}}]}, 'filters'),
        ({'layers': [{'slug': 'a', 'filters': {f'f{i}': 'x' for i in range(21)}}]}, 'filters'),
        ({'layers': [], 'basemap': 'x' * 201}, 'basemap'),
        ({'layers': [], 'municipios': {'selected': ['1' * 11]}}, 'municipios'),
    ])
    def test_rechaza_single_fuera_de_limites(self, payload, mensaje):
        with pytest.raises(ValueError, match=mensaje):
            validate_payload(_envelope('single', payload))

    def test_rechaza_textos_largos_en_anotaciones(self):
        anotacion = {'id': 'a', 'type': 'Text', 'geometry': {'type': 'Point', 'coordinates': [-103.4, 20.6]}, 'textLabel': 'x' * 201}
        with pytest.raises(ValueError, match='textLabel'):
            validate_payload(_envelope('single', {'layers': [], 'annotations': [anotacion]}))

    def test_rechaza_etiquetas_largas_en_el_comparador(self):
        env = _envelope('swipe', {'shared': {}, 'paneA': {'label': 'x' * 61, 'layers': []}, 'paneB': {'layers': []}, 'activeSlot': 'A'})
        with pytest.raises(ValueError, match='label'):
            validate_payload(env)

    def test_acepta_filtros_cql_largos_como_los_de_la_seleccion(self):
        cql = 'fid IN (' + ','.join(str(i) for i in range(3000)) + ')'
        validate_payload(_envelope('single', {'layers': [{'slug': 'a', 'filters': {'_seleccion': cql, 'date': "fecha >= '2024-01-01'"}}]}))
