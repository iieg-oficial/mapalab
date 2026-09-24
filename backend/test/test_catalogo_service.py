from app.services.catalogo_service import _serialize


def _fila(**extra):
    base = {
        'id': 1,
        'slug': 'escuelas',
        'nombre': 'Escuelas',
        'workspace_alias': 'educacion',
        'geoserver_workspace': 'educacion',
        'geoserver_layer': 'centros_educativos',
        'search_tags': None,
        'infobox_config': None,
        'infobox_propia': False,
        'institucion_slug': None,
        'institucion_nombre': None,
    }
    base.update(extra)
    return base


def test_la_capa_expone_su_layer_key_de_hexbin():
    assert _serialize(_fila(hexbin_layer_key='centros_educativos'))['hexbinLayerKey'] == 'centros_educativos'


def test_sin_par_en_el_visor_el_layer_key_es_nulo():
    assert _serialize(_fila())['hexbinLayerKey'] is None


def test_la_capa_expone_su_campo_de_municipio():
    capa = _serialize(_fila(municipio_field='municipio', municipio_field_type='nombre'))
    assert capa['municipioField'] == 'municipio'
    assert capa['municipioFieldType'] == 'nombre'


def test_sin_tipo_declarado_el_campo_se_lee_como_clave():
    assert _serialize(_fila(municipio_field='clave_geo'))['municipioFieldType'] == 'clave'


def test_sin_campo_de_municipio_no_hay_filtro():
    capa = _serialize(_fila())
    assert capa['municipioField'] is None
    assert capa['municipioFieldType'] is None
