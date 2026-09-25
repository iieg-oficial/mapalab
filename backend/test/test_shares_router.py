from contextlib import nullcontext
from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import app.routers.shares as router

ARBOL = [{'id': 'seguridad', 'children': [
    {'id': 'homicidio_doloso', 'slug': 'Seguridad:Homicidio', 'aliases': ['homicidios']},
]}]


@pytest.fixture
def entorno(monkeypatch):
    guardados = []
    monkeypatch.setattr(router, 'get_cached_state', lambda: {'tree': ARBOL})
    monkeypatch.setattr(router, '_get_session', lambda: nullcontext(SimpleNamespace(commit=lambda: None)))
    monkeypatch.setattr(router, '_create_rate_limiter', router.RateLimiter(3, 60))
    monkeypatch.setattr(router, '_create_daily_limiter', router.RateLimiter(100, 86400))

    def upsert(**kwargs):
        guardados.append(kwargs)
        return SimpleNamespace(id=kwargs['share_id'], kind=kwargs['kind'], created_at=datetime(2026, 9, 24), pinned_until=None)

    monkeypatch.setattr(router.ShareRepository, 'upsert', upsert)
    return guardados


def _peticion(**encabezados):
    return SimpleNamespace(headers=encabezados, client=SimpleNamespace(host='10.0.0.2'))


def _envelope(*slugs):
    return router.ShareEnvelope(version=2, kind='single', payload={'layers': [{'slug': s} for s in slugs]})


def test_acepta_capas_por_id_slug_o_alias(entorno):
    router.create_share(_envelope('homicidio_doloso', 'seguridad:homicidio', 'homicidios'), _peticion())
    assert len(entorno) == 1


def test_rechaza_capas_fuera_del_catalogo(entorno):
    with pytest.raises(HTTPException) as error:
        router.create_share(_envelope('tabla_interna'), _peticion())
    assert error.value.status_code == 400 and 'catalogo' in error.value.detail
    assert entorno == []


def test_sin_catalogo_no_bloquea_los_enlaces(entorno, monkeypatch):
    monkeypatch.setattr(router, 'get_cached_state', lambda: (_ for _ in ()).throw(RuntimeError('sin bd')))
    router.create_share(_envelope('cualquiera'), _peticion())
    assert len(entorno) == 1


def test_el_techo_es_por_ip_real_aunque_cambie_x_forwarded_for(entorno):
    for i in range(3):
        router.create_share(_envelope('homicidio_doloso'), _peticion(**{'x-real-ip': '8.8.8.8', 'x-forwarded-for': f'1.1.1.{i}'}))
    with pytest.raises(HTTPException) as error:
        router.create_share(_envelope('homicidio_doloso'), _peticion(**{'x-real-ip': '8.8.8.8', 'x-forwarded-for': '9.9.9.9'}))
    assert error.value.status_code == 429
    router.create_share(_envelope('homicidio_doloso'), _peticion(**{'x-real-ip': '7.7.7.7'}))
    assert len(entorno) == 4


def test_el_techo_diario_es_de_todo_el_sitio(entorno, monkeypatch):
    monkeypatch.setattr(router, '_create_daily_limiter', router.RateLimiter(2, 86400))
    for ip in ('1.1.1.1', '2.2.2.2'):
        router.create_share(_envelope('homicidio_doloso'), _peticion(**{'x-real-ip': ip}))
    with pytest.raises(HTTPException) as error:
        router.create_share(_envelope('homicidio_doloso'), _peticion(**{'x-real-ip': '3.3.3.3'}))
    assert error.value.status_code == 429


def test_un_payload_invalido_no_gasta_el_techo(entorno):
    for _ in range(5):
        with pytest.raises(HTTPException):
            router.create_share(_envelope('tabla_interna'), _peticion())
    router.create_share(_envelope('homicidio_doloso'), _peticion())
    assert len(entorno) == 1


def test_el_hash_de_ip_sale_de_x_real_ip_y_no_del_cliente(entorno, monkeypatch):
    monkeypatch.setattr(router.settings, 'MAPALAB_SHARE_IP_HASH_SECRET', 'secreto')
    router.create_share(_envelope('homicidio_doloso'), _peticion(**{'x-real-ip': '172.18.0.5', 'x-forwarded-for': '6.6.6.6'}))
    assert entorno[0]['created_ip_hash'] == router.hash_ip('172.18.0.5')


def test_despinear_exige_token_interno(monkeypatch):
    from fastapi.testclient import TestClient
    from fastapi import FastAPI

    monkeypatch.setattr(router.settings, 'MAPALAB_INTERNAL_TOKEN', 'interno')
    compartido = SimpleNamespace(pinned_until=datetime(2027, 1, 1))
    monkeypatch.setattr(router, '_get_session', lambda: nullcontext(SimpleNamespace(commit=lambda: None)))
    monkeypatch.setattr(router.ShareRepository, 'get', lambda session, share_id: compartido)
    monkeypatch.setattr(router.ShareRepository, 'unpin', lambda session, share: setattr(share, 'pinned_until', None))
    app = FastAPI()
    app.include_router(router.router)
    cliente = TestClient(app)

    assert cliente.delete('/shares/abc/pin').status_code == 401
    assert cliente.delete('/shares/abc/pin', headers={'X-Internal-Token': 'otro'}).status_code == 401
    assert compartido.pinned_until is not None
    assert cliente.delete('/shares/abc/pin', headers={'X-Internal-Token': 'interno'}).status_code == 204
    assert compartido.pinned_until is None


def test_pinear_no_rebaja_un_pin_permanente(monkeypatch):
    compartido = SimpleNamespace(pinned_until=router.PERMANENT_SENTINEL)
    monkeypatch.setattr(router, '_get_session', lambda: nullcontext(SimpleNamespace(commit=lambda: None)))
    monkeypatch.setattr(router.ShareRepository, 'get', lambda session, share_id: compartido)
    monkeypatch.setattr(router.ShareRepository, 'pin', lambda *a: pytest.fail('no debe tocar el pin'))
    assert router.pin_share('abc')['permanent'] is True
    assert compartido.pinned_until == router.PERMANENT_SENTINEL
