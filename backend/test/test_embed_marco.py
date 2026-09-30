from types import SimpleNamespace

import pytest

from app.routers import embed_marco
from app.services import embed_origen as origen
from app.services.api_key_validator import ValidationResult


def peticion(headers: dict, params: dict | None = None) -> SimpleNamespace:
    return SimpleNamespace(headers=headers, query_params=params or {})


def test_desde_el_iframe_propio_la_llave_se_compara_contra_el_padre():
    p = peticion({'host': 'iieg.jalisco.gob.mx', 'referer': 'https://iieg.jalisco.gob.mx/mapalab/embed?key=x'}, {'parent': 'https://sitio.ejemplo.mx/pagina'})
    assert origen.origen_para_llave(p) == 'https://sitio.ejemplo.mx'


def test_desde_otro_sitio_el_parametro_parent_no_cuenta():
    p = peticion({'host': 'iieg.jalisco.gob.mx', 'origin': 'https://ajeno.mx'}, {'parent': 'https://sitio.ejemplo.mx'})
    assert origen.origen_para_llave(p) == 'https://ajeno.mx'


def test_un_parent_que_no_es_origen_se_ignora():
    p = peticion({'host': 'iieg.jalisco.gob.mx', 'referer': 'https://iieg.jalisco.gob.mx/mapalab/embed'}, {'parent': 'javascript:alert(1)'})
    assert origen.origen_para_llave(p) == 'https://iieg.jalisco.gob.mx'


def test_la_politica_de_marco_sale_de_los_dominios():
    assert origen.politica_de_marco(['sitio.mx', '*.iieg.gob.mx', 'https://otro.mx/']) == (
        "frame-ancestors 'self' https://sitio.mx https://*.iieg.gob.mx https://otro.mx"
    )
    assert origen.politica_de_marco(['*']) == 'frame-ancestors *'


def test_la_llave_sale_de_la_uri_original():
    assert origen.llave_de_uri('/mapalab/embed?layers=a&key=mk_pub_abcd123') == 'mk_pub_abcd123'
    assert origen.llave_de_uri('/mapalab/embed') == ''


@pytest.fixture
def validar(monkeypatch):
    llamadas = []

    def falso(llave, origin=None, ip=None, requested_layers=None, bypass_cache=False):
        llamadas.append(origin)
        valida = origin == 'https://sitio.mx'
        return ValidationResult(valid=valida, reason=None if valida else 'origin_blocked', dominios_permitidos=['sitio.mx'])

    monkeypatch.setattr(embed_marco, 'validate_api_key', falso)
    return llamadas


def test_el_marco_deja_incrustar_solo_en_los_dominios_de_la_llave(validar):
    p = peticion({'x-original-uri': '/embed?key=mk_pub_abcd123', 'referer': 'https://sitio.mx/mapa', 'x-real-ip': '1.1.1.1'})
    respuesta = embed_marco.marco_del_embed(p)
    assert respuesta.status_code == 204
    assert respuesta.headers[embed_marco.CABECERA] == "frame-ancestors 'self' https://sitio.mx"


def test_un_sitio_fuera_de_la_lista_no_puede_incrustarlo(validar):
    p = peticion({'x-original-uri': '/embed?key=mk_pub_abcd123', 'referer': 'https://ajeno.mx/', 'x-real-ip': '1.1.1.1'})
    assert embed_marco.marco_del_embed(p).headers[embed_marco.CABECERA] == "frame-ancestors 'none'"


def test_sin_llave_solo_el_propio_sitio(validar):
    p = peticion({'x-real-ip': '1.1.1.1'})
    assert embed_marco.marco_del_embed(p).headers[embed_marco.CABECERA] == "frame-ancestors 'self'"
    assert validar == []
