from types import SimpleNamespace

import httpx
import pytest

from app.services import token_servicio
from app.services.token_servicio import (
    AuthTokenServicio,
    ErrorTokenServicio,
    ProveedorTokenServicio,
    auth_geoserver,
)


def _minerva(respuestas, pedidos):
    def handler(request):
        pedidos.append(request)
        return respuestas.pop(0)

    return httpx.MockTransport(handler)


def _token(valor, expira=900):
    return httpx.Response(200, json={'access_token': valor, 'token_type': 'bearer', 'expires_in': expira})


def _proveedor(transport):
    return ProveedorTokenServicio('http://minerva:3000/', 'cid', 'secreto', 'sextante', transport=transport)


def test_pide_el_token_con_client_credentials_y_audience():
    pedidos = []
    proveedor = _proveedor(_minerva([_token('t1')], pedidos))
    assert proveedor.token() == 't1'
    assert str(pedidos[0].url) == 'http://minerva:3000/auth/token'
    assert dict(httpx.QueryParams(pedidos[0].content.decode())) == {
        'grant_type': 'client_credentials', 'client_id': 'cid', 'client_secret': 'secreto', 'audience': 'sextante',
    }


def test_reusa_y_renueva_antes_de_vencer(monkeypatch):
    pedidos = []
    proveedor = _proveedor(_minerva([_token('t1'), _token('t2')], pedidos))
    reloj = [1000.0]
    monkeypatch.setattr(token_servicio.time, 'monotonic', lambda: reloj[0])
    assert proveedor.token() == 't1'
    assert proveedor.token() == 't1'
    reloj[0] += 900 - token_servicio.MARGEN_RENOVACION
    assert proveedor.token() == 't2'
    assert len(pedidos) == 2


def test_un_rechazo_de_minerva_da_error_claro():
    proveedor = _proveedor(_minerva([httpx.Response(400, json={'error_description': 'sin roles'})], []))
    with pytest.raises(ErrorTokenServicio, match='sin roles'):
        proveedor.token()


def test_la_auth_reintenta_una_vez_con_401():
    proveedor = _proveedor(_minerva([_token('viejo'), _token('nuevo')], []))
    vistos = []

    def geoserver(request):
        vistos.append(request.headers['Authorization'])
        return httpx.Response(401 if len(vistos) == 1 else 200)

    with httpx.Client(auth=AuthTokenServicio(proveedor), transport=httpx.MockTransport(geoserver)) as cliente:
        assert cliente.get('http://sextante/sextante/salud/wms').status_code == 200
    assert vistos == ['Bearer viejo', 'Bearer nuevo']


def _settings(**kw):
    base = dict(GEOSERVER_AUTH_MODE='basic', GEOSERVER_USER='', GEOSERVER_PASSWORD='', MINERVA_ISSUER_URL=None,
                MINERVA_CLIENT_ID=None, MINERVA_CLIENT_SECRET=None, GEOSERVER_MINERVA_AUDIENCE='sextante')
    base.update(kw)
    return SimpleNamespace(**base)


def test_modo_basic_usa_usuario_y_contrasena():
    assert auth_geoserver(_settings(GEOSERVER_USER='iieg', GEOSERVER_PASSWORD='x')) == ('iieg', 'x')
    assert auth_geoserver(_settings()) is None


def test_modo_minerva_usa_el_token_y_exige_credenciales():
    auth = auth_geoserver(_settings(GEOSERVER_AUTH_MODE='minerva', MINERVA_ISSUER_URL='http://m:3000',
                                    MINERVA_CLIENT_ID='cid', MINERVA_CLIENT_SECRET='s'))
    assert isinstance(auth, AuthTokenServicio)
    with pytest.raises(ErrorTokenServicio, match='MINERVA_CLIENT_ID'):
        auth_geoserver(_settings(GEOSERVER_AUTH_MODE='minerva'))
