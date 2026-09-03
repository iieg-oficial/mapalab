from types import SimpleNamespace

from app.services.layer_tree_service import _inherit_little_card


def _capa(id_, node_type, parent_id=None, infobox_config=None):
    return SimpleNamespace(
        id=id_, node_type=node_type, parent_id=parent_id, infobox_config=infobox_config
    )


TARJETA_GRUPO = {'headerField': 'nombre'}
TARJETA_PROPIA = {'headerField': 'otro'}


def _nodos(capas):
    return {
        c.id: {
            'id': c.id,
            'nodeType': c.node_type,
            **({'littleCard': c.infobox_config} if c.infobox_config is not None else {}),
        }
        for c in capas
    }


def test_una_propiedad_sin_tarjeta_hereda_la_del_grupo():
    capas = [
        _capa('salud', 'group', infobox_config=TARJETA_GRUPO),
        _capa('salud.primer_nivel', 'leaf', parent_id='salud'),
    ]
    nodos = _nodos(capas)
    _inherit_little_card(nodos, capas)
    hija = nodos['salud.primer_nivel']
    assert hija['littleCard'] == TARJETA_GRUPO
    assert hija['inheritedFrom'] == 'salud'


def test_una_propiedad_con_tarjeta_propia_no_se_pisa():
    capas = [
        _capa('salud', 'group', infobox_config=TARJETA_GRUPO),
        _capa('salud.hospitales', 'leaf', parent_id='salud', infobox_config=TARJETA_PROPIA),
    ]
    nodos = _nodos(capas)
    _inherit_little_card(nodos, capas)
    hija = nodos['salud.hospitales']
    assert hija['littleCard'] == TARJETA_PROPIA
    assert 'inheritedFrom' not in hija


def test_solo_hereda_de_un_grupo_no_de_un_tema():
    capas = [
        _capa('tema', 'tema', infobox_config=TARJETA_GRUPO),
        _capa('tema.capa', 'leaf', parent_id='tema'),
    ]
    nodos = _nodos(capas)
    _inherit_little_card(nodos, capas)
    assert 'littleCard' not in nodos['tema.capa']


def test_salta_los_niveles_intermedios_hasta_el_grupo():
    capas = [
        _capa('salud', 'group', infobox_config=TARJETA_GRUPO),
        _capa('salud.etiqueta', 'label', parent_id='salud'),
        _capa('salud.etiqueta.hoja', 'leaf', parent_id='salud.etiqueta'),
    ]
    nodos = _nodos(capas)
    _inherit_little_card(nodos, capas)
    assert nodos['salud.etiqueta.hoja']['inheritedFrom'] == 'salud'
    assert 'littleCard' not in nodos['salud.etiqueta']


def test_sin_grupo_con_tarjeta_no_hereda_nada():
    capas = [
        _capa('salud', 'group'),
        _capa('salud.hoja', 'leaf', parent_id='salud'),
    ]
    nodos = _nodos(capas)
    _inherit_little_card(nodos, capas)
    assert 'littleCard' not in nodos['salud.hoja']


def test_el_grupo_mas_cercano_gana():
    capas = [
        _capa('lejano', 'group', infobox_config=TARJETA_GRUPO),
        _capa('cercano', 'group', parent_id='lejano', infobox_config=TARJETA_PROPIA),
        _capa('cercano.hoja', 'leaf', parent_id='cercano'),
    ]
    nodos = _nodos(capas)
    _inherit_little_card(nodos, capas)
    assert nodos['cercano.hoja']['littleCard'] == TARJETA_PROPIA
    assert nodos['cercano.hoja']['inheritedFrom'] == 'cercano'
