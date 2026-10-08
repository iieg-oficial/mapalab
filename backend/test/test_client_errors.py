from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.routers.client_errors as client_errors
from app.utils.rate_limiter import RateLimiter


def _cliente(monkeypatch, maximo=20):
    registrados = []
    monkeypatch.setattr(client_errors, 'record', registrados.append)
    monkeypatch.setattr(client_errors, '_por_ip', RateLimiter(maximo, 60))
    monkeypatch.setattr(client_errors, '_repetidos', RateLimiter(1, 300))
    app = FastAPI()
    app.include_router(client_errors.router)
    return TestClient(app), registrados


def test_los_errores_repetidos_cuentan_una_vez(monkeypatch):
    cliente, registrados = _cliente(monkeypatch)
    cuerpo = {'type': 'chunk', 'url': '/a.js', 'message': 'fallo'}
    for _ in range(3):
        assert cliente.post('/log/client-error', json=cuerpo, headers={'X-Real-IP': '1.1.1.1'}).status_code == 200
    cliente.post('/log/client-error', json=cuerpo, headers={'X-Real-IP': '2.2.2.2'})
    assert registrados == ['chunk', 'chunk']


def test_limite_por_ip(monkeypatch):
    cliente, registrados = _cliente(monkeypatch, maximo=2)
    for i in range(2):
        cliente.post('/log/client-error', json={'type': 'x', 'message': str(i)}, headers={'X-Real-IP': '1.1.1.1'})
    bloqueado = cliente.post('/log/client-error', json={'type': 'x', 'message': 'z'}, headers={'X-Real-IP': '1.1.1.1'})
    otra = cliente.post('/log/client-error', json={'type': 'x', 'message': 'z'}, headers={'X-Real-IP': '3.3.3.3'})
    assert bloqueado.status_code == 429 and otra.status_code == 200
    assert len(registrados) == 3
