from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services import api_key_validator as validador
from app.services import embed_wms_params as wms
from app.utils.client_ip import get_client_ip


CONOCIDOS = {'economia', 'seguridad_y_proteccion_ciudadana'}


def test_quita_sld_y_parametros_desconocidos():
    limpio = wms.clean_params([('LAYERS', 'economia:a'), ('sld', 'http://x'), ('SLD_BODY', '<x/>'), ('foo', '1')])
    assert limpio == {'layers': 'economia:a'}


def test_rechaza_parametros_repetidos_con_otra_caja():
    with pytest.raises(HTTPException) as error:
        wms.clean_params([('layers', 'economia:a'), ('Layers', 'interno:b')])
    assert error.value.status_code == 400


@pytest.mark.parametrize('capa', ['sinworkspace', 'Economia:a', '../x:a', 'geoserver:a', 'economia:', 'eco/nomia:a'])
def test_rechaza_workspaces_fuera_de_patron_o_desconocidos(capa):
    with pytest.raises(HTTPException) as error:
        wms.resolve_workspace([capa], CONOCIDOS)
    assert error.value.status_code == 403


def test_un_solo_workspace_va_a_su_ruta_y_varios_a_la_global():
    assert wms.resolve_workspace(['economia:a', 'economia:b'], CONOCIDOS) == 'economia'
    assert wms.resolve_workspace(['economia:a', 'seguridad_y_proteccion_ciudadana:b'], CONOCIDOS) is None


def test_query_layers_se_valida_contra_las_capas_permitidas():
    wms.check_allowed(['economia:a'], ['economia:a'])
    wms.check_allowed(['economia:x'], [])
    with pytest.raises(HTTPException) as error:
        wms.check_allowed(['economia:a', 'economia:secreta'], ['economia:a'])
    assert error.value.status_code == 403


def test_la_ip_sale_de_x_real_ip_y_no_de_x_forwarded_for():
    peticion = SimpleNamespace(headers={'x-forwarded-for': '6.6.6.6', 'x-real-ip': '10.1.1.1'}, client=SimpleNamespace(host='172.18.0.2'))
    assert get_client_ip(peticion) == '10.1.1.1'
    sin_real = SimpleNamespace(headers={'x-forwarded-for': '6.6.6.6'}, client=SimpleNamespace(host='172.18.0.2'))
    assert get_client_ip(sin_real) == '172.18.0.2'


@pytest.fixture
def remoto(monkeypatch):
    validador.clear_cache()
    llamadas = []

    def validar(llave, origin, ip, capas):
        llamadas.append((llave, origin, ip))
        return validador.ValidationResult(valid=llave == 'mk_pub_abcdVALIDA', key_id=1)

    monkeypatch.setattr(validador, '_validate_remote', validar)
    yield llamadas
    validador.clear_cache()


def test_la_cache_distingue_llaves_con_el_mismo_prefijo(remoto):
    assert validador.validate_api_key('mk_pub_abcdVALIDA', 'https://a', '1.1.1.1').valid
    assert not validador.validate_api_key('mk_pub_abcdFALSA', 'https://a', '1.1.1.1').valid
    assert len(remoto) == 2


def test_la_cache_distingue_ip_y_origen(remoto):
    validador.validate_api_key('mk_pub_abcdVALIDA', 'https://a', '1.1.1.1')
    validador.validate_api_key('mk_pub_abcdVALIDA', 'https://a', '2.2.2.2')
    validador.validate_api_key('mk_pub_abcdVALIDA', 'https://b', '1.1.1.1')
    validador.validate_api_key('mk_pub_abcdVALIDA', 'https://a', '1.1.1.1')
    assert len(remoto) == 3


def test_las_denegaciones_se_cachean_poco_tiempo(remoto, monkeypatch):
    for _ in range(3):
        assert not validador.validate_api_key('mk_pub_abcdFALSA', 'https://a', '1.1.1.1').valid
    assert len(remoto) == 1
    reloj = validador.time.time() + validador._DENIED_TTL_SECONDS + 1
    monkeypatch.setattr(validador.time, 'time', lambda: reloj)
    validador.validate_api_key('mk_pub_abcdFALSA', 'https://a', '1.1.1.1')
    assert len(remoto) == 2


def test_invalidar_por_prefijo_sigue_funcionando(remoto):
    validador.validate_api_key('mk_pub_abcdVALIDA', 'https://a', '1.1.1.1')
    assert validador.invalidate_cache_for_prefix('mk_pub_abcd') == 1
    validador.validate_api_key('mk_pub_abcdVALIDA', 'https://a', '1.1.1.1')
    assert len(remoto) == 2
