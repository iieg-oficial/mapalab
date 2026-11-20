import asyncio

import pytest

import servers.telemetry as telemetry
from servers.borde import BordeMiddleware, origen_permitido


@pytest.mark.parametrize('origen,permitido', [
    ('http://localhost:6274', True),
    ('https://iieg.jalisco.gob.mx', True),
    ('https://evil.example', False),
    ('null', False),
])
def test_origenes(monkeypatch, origen, permitido):
    monkeypatch.setenv('MAPALAB_PUBLIC_BASE_URL', 'https://iieg.jalisco.gob.mx')
    assert origen_permitido(origen) is permitido


def _llamar(headers):
    enviados, llamado = [], []

    async def app(scope, receive, send):
        llamado.append(True)

    async def send(mensaje):
        enviados.append(mensaje)

    scope = {'type': 'http', 'path': '/mcp', 'method': 'POST', 'headers': [(k.encode(), v.encode()) for k, v in headers.items()]}
    asyncio.run(BordeMiddleware(app)(scope, None, send))
    return enviados, llamado


def test_rechaza_origen_ajeno_y_cuerpo_grande():
    assert _llamar({'origin': 'https://evil.example'})[0][0]['status'] == 403
    assert _llamar({'content-length': str(10 ** 6)})[0][0]['status'] == 413
    assert _llamar({})[1] == [True]


def test_sin_configuracion_la_telemetria_no_truena(monkeypatch):
    monkeypatch.setattr(telemetry.settings, 'MARIACHI_BACKEND_URL', '')
    registro = telemetry.McpEventRecord(timestamp=telemetry.datetime.now(telemetry.timezone.utc), method='x', tool=None, status='ok')
    telemetry._flush_sync([registro])


def test_recorta_los_textos_del_cliente():
    assert telemetry._recortar('x' * 300, 'client_name') == 'x' * 80
    assert telemetry._recortar(None, 'tool') is None
