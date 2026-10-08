from datetime import date
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import embed
from app.routers import embed_telemetria as rutas_telemetria
from app.services import access_logger, embed_telemetria
from app.services.api_key_quota import QuotaTracker
from app.services.api_key_validator import ValidationResult
from app.services.embed_telemetria import AgregadorTelemetria, cubeta, payload_rendimiento, payload_sitios

LLAVE = 'mk_pub_abcdVALIDA'
SITIO = 'https://sitio.mx'


@pytest.mark.parametrize('metrica, valor, esperada', [
    ('LCP', 2500, 'buenas'),
    ('LCP', 2501, 'regulares'),
    ('LCP', 4001, 'malas'),
    ('CLS', 0.1, 'buenas'),
    ('CLS', 0.2, 'regulares'),
    ('INP', 600, 'malas'),
    ('LISTO', 5000, 'regulares'),
    ('SERVIDOR_CONFIG', 120, 'buenas'),
    ('SERVIDOR_WMS', 3500, 'malas'),
    ('OTRA', 1, None),
])
def test_cubetas(metrica, valor, esperada):
    assert cubeta(metrica, valor) == esperada


def test_agrega_por_llave_dia_origen_y_metrica():
    agregador = AgregadorTelemetria()
    for valor in (1000, 3000, 5000):
        agregador.registrar_metrica(1, SITIO, 'LCP', valor)
    agregador.registrar_metrica(1, '', 'LCP', 1000)
    agregador.sumar(1, SITIO, 'cargas')
    agregador.sumar(1, SITIO, 'cargas')
    agregador.sumar(1, SITIO, 'timeouts', 0)
    rendimiento, sitios = agregador.drenar()
    hoy = embed_telemetria._hoy().isoformat()
    filas = sorted(payload_rendimiento(rendimiento), key=lambda f: f['origen'])
    assert filas[1] == {
        'keyId': 1, 'dia': hoy, 'origen': SITIO, 'metrica': 'LCP',
        'muestras': 3, 'suma': 9000.0, 'buenas': 1, 'regulares': 1, 'malas': 1,
    }
    assert filas[0]['origen'] == '' and filas[0]['muestras'] == 1
    assert payload_sitios(sitios) == [{
        'keyId': 1, 'dia': hoy, 'origen': SITIO, 'cargas': 2,
        'listos': 0, 'erroresJs': 0, 'denegados': 0, 'timeouts': 0,
    }]
    assert agregador.drenar() == ({}, {})


def test_si_mariachi_falla_conserva_y_no_crece_sin_limite(monkeypatch):
    monkeypatch.setattr(embed_telemetria.settings, 'MARIACHI_BACKEND_URL', 'http://mariachi')
    monkeypatch.setattr(embed_telemetria.settings, 'MAPALAB_INTERNAL_TOKEN', 'token')
    enviados = []
    respuesta = {'ok': False}

    def enviar(ruta, items):
        enviados.append((ruta, items))
        return respuesta['ok']

    monkeypatch.setattr(embed_telemetria, '_enviar', enviar)
    agregador = AgregadorTelemetria(max_filas=2)
    agregador.registrar_metrica(1, SITIO, 'LCP', 100)
    agregador.sumar(1, SITIO, 'listos')
    assert embed_telemetria.flush_to_mariachi(agregador) == 0
    agregador.registrar_metrica(1, SITIO, 'LCP', 100)
    agregador.registrar_metrica(2, SITIO, 'LCP', 100)
    assert not agregador.registrar_metrica(3, SITIO, 'LCP', 100)
    respuesta['ok'] = True
    assert embed_telemetria.flush_to_mariachi(agregador) == 3
    ultimo = {ruta: items for ruta, items in enviados[-2:]}
    llave_uno = next(f for f in ultimo['rendimiento'] if f['keyId'] == 1)
    assert llave_uno['muestras'] == 2
    assert ultimo['sitios'][0]['listos'] == 1


def test_devolver_suma_sobre_lo_nuevo():
    agregador = AgregadorTelemetria()
    agregador.sumar(1, SITIO, 'cargas')
    _, sitios = agregador.drenar()
    agregador.sumar(1, SITIO, 'cargas')
    agregador.devolver_sitios(sitios)
    _, sitios = agregador.drenar()
    assert payload_sitios(sitios)[0]['cargas'] == 2


@pytest.fixture
def entorno(monkeypatch):
    agregador = AgregadorTelemetria()
    accesos = access_logger._AccessLogger()
    errores = []

    def validar(llave, origin=None, ip=None, requested_layers=None):
        if llave == LLAVE and origin == SITIO:
            return ValidationResult(valid=True, key_id=7, dominios_permitidos=['sitio.mx'])
        if llave == LLAVE:
            return ValidationResult(valid=False, key_id=7, reason='origin_blocked')
        return ValidationResult(valid=False, reason='invalid_key')

    monkeypatch.setattr(embed, 'validate_api_key', validar)
    monkeypatch.setattr(embed, 'get_agregador', lambda: agregador)
    monkeypatch.setattr(rutas_telemetria, 'get_agregador', lambda: agregador)
    monkeypatch.setattr(embed, 'get_access_logger', lambda: accesos)
    monkeypatch.setattr(embed, 'get_tracker', lambda: QuotaTracker())
    monkeypatch.setattr(rutas_telemetria, 'record_client_error', errores.append)
    app = FastAPI()
    app.include_router(embed.router)
    app.include_router(rutas_telemetria.router)
    return SimpleNamespace(cliente=TestClient(app), agregador=agregador, accesos=accesos, errores=errores)


def _sitio(agregador):
    _, sitios = agregador.drenar()
    return payload_sitios(sitios)


def test_config_cuenta_la_carga_y_mide_al_servidor(entorno):
    r = entorno.cliente.get('/embed/config', params={'key': LLAVE}, headers={'origin': SITIO})
    assert r.status_code == 200
    rendimiento, sitios = entorno.agregador.drenar()
    assert payload_sitios(sitios)[0]['cargas'] == 1
    assert payload_rendimiento(rendimiento)[0]['metrica'] == 'SERVIDOR_CONFIG'
    assert [a.endpoint for a in entorno.accesos.drain()] == ['config']


def test_telemetria_del_iframe_cuenta_listos_errores_y_vitals(entorno):
    cuerpo = {
        'vitals': [{'name': 'IFRAME_READY', 'value': 2000}, {'name': 'LCP', 'value': 4500}, {'name': 'RARA', 'value': 1}],
        'errors': [{'message': 'boom'}],
    }
    r = entorno.cliente.post(
        '/embed/telemetry',
        params={'key': LLAVE, 'parent': f'{SITIO}/pagina'},
        json=cuerpo,
        headers={'host': 'iieg.jalisco.gob.mx', 'referer': 'https://iieg.jalisco.gob.mx/mapalab/embed'},
    )
    assert r.status_code == 200
    rendimiento, sitios = entorno.agregador.drenar()
    metricas = {f['metrica']: f for f in payload_rendimiento(rendimiento)}
    assert set(metricas) == {'LISTO', 'LCP'}
    assert metricas['LCP']['malas'] == 1 and metricas['LISTO']['origen'] == SITIO
    fila = payload_sitios(sitios)[0]
    assert (fila['listos'], fila['erroresJs'], fila['timeouts']) == (1, 1, 0)
    assert entorno.errores == ['embed_js']
    assert entorno.accesos.drain() == []


def test_el_beacon_del_widget_en_texto_plano_cuenta_timeouts(entorno):
    r = entorno.cliente.post(
        '/embed/telemetry',
        params={'key': LLAVE},
        content='{"eventos":[{"tipo":"timeout"},{"tipo":"error"}]}',
        headers={'origin': SITIO, 'content-type': 'text/plain;charset=UTF-8'},
    )
    assert r.status_code == 200
    assert r.headers['access-control-allow-origin'] == SITIO
    fila = _sitio(entorno.agregador)[0]
    assert (fila['timeouts'], fila['erroresJs']) == (1, 1)
    assert entorno.errores == []


def test_telemetria_invalida_responde_422(entorno):
    r = entorno.cliente.post('/embed/telemetry', params={'key': LLAVE}, content='{"eventos":[{"tipo":"x"}]}', headers={'origin': SITIO})
    assert r.status_code == 422
    r = entorno.cliente.post('/embed/telemetry', params={'key': LLAVE}, content='no es json', headers={'origin': SITIO})
    assert r.status_code == 422


def test_denegacion_con_llave_conocida_suma_denegados(entorno):
    r = entorno.cliente.get('/embed/config', params={'key': LLAVE}, headers={'origin': 'https://ajeno.mx'})
    assert r.status_code == 403
    fila = _sitio(entorno.agregador)[0]
    assert (fila['origen'], fila['denegados'], fila['cargas']) == ('https://ajeno.mx', 1, 0)
    acceso = entorno.accesos.drain()[0]
    assert acceso.resultado == 'denied' and acceso.api_key_id == 7


def test_llave_inexistente_deja_fila_con_prefijo(entorno):
    r = entorno.cliente.post('/embed/telemetry', params={'key': 'mk_pub_noexiste123'}, json={}, headers={'origin': SITIO})
    assert r.status_code == 403
    [acceso] = entorno.accesos.drain()
    payload = acceso.to_payload()
    assert payload['apiKeyId'] is None and payload['keyPrefix'] == 'mk_pub_noex'
    assert payload['motivo'] == 'invalid_key' and payload['endpoint'] == 'telemetry'
    assert entorno.agregador.drenar() == ({}, {})


class _Upstream:
    status_code = 200
    content = b'png'
    headers = {'content-type': 'image/png'}


class _ClienteFalso:
    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def get(self, url):
        return _Upstream()


def test_wms_mide_al_upstream_y_no_deja_fila(entorno, monkeypatch):
    monkeypatch.setattr(embed.settings, 'GEOSERVER_URL', 'http://geoserver')
    monkeypatch.setattr(embed, 'known_workspaces', lambda: {'economia'})
    monkeypatch.setattr(embed.httpx, 'Client', _ClienteFalso)
    r = entorno.cliente.get('/embed/wms-proxy', params={'key': LLAVE, 'layers': 'economia:a', 'request': 'GetMap'}, headers={'origin': SITIO})
    assert r.status_code == 200
    rendimiento, _ = entorno.agregador.drenar()
    assert payload_rendimiento(rendimiento)[0]['metrica'] == 'SERVIDOR_WMS'
    assert entorno.accesos.drain() == []


def test_el_logger_sigue_registrando_config_tree_y_denegaciones():
    accesos = access_logger._AccessLogger()
    for endpoint in ('config', 'tree', 'wms', 'telemetry'):
        accesos.record(api_key_id=1, endpoint=endpoint, resultado='allowed')
    accesos.record(api_key_id=1, endpoint='wms', resultado='quota_exceeded')
    accesos.record(api_key_id=None, endpoint='wms', resultado='denied', key_prefix='mk_pub_abcd')
    accesos.record(api_key_id=None, endpoint='config', resultado='denied')
    filas = [(a.endpoint, a.resultado) for a in accesos.drain()]
    assert filas == [('config', 'allowed'), ('tree', 'allowed'), ('wms', 'quota_exceeded'), ('wms', 'denied')]


def test_el_dia_va_en_iso():
    filas = payload_sitios({(1, date(2026, 10, 5), ''): embed_telemetria._Sitio(cargas=1)})
    assert filas[0]['dia'] == '2026-10-05' and filas[0]['origen'] == ''


def test_el_prefijo_es_el_visible_que_compara_mariachi():
    assert embed.prefijo_visible('mk_pub_abcdVALIDA') == 'mk_pub_abcd'
    assert embed.prefijo_visible('mk_priv_wxyzSECRETO') == 'mk_priv_wxyz'
    assert embed.prefijo_visible('') == ''
