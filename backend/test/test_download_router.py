from contextlib import nullcontext
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.routers.download as download
from app.exceptions.common_exceptions import BaseAppException, NotFoundException
from app.handlers.handle_exceptions import app_exception_handler


@pytest.fixture
def repo(monkeypatch):
    llamadas = {'tabla': [], 'cache': []}
    conexion = SimpleNamespace(get_session=lambda: nullcontext(object()))
    monkeypatch.setattr(download.DatabaseFactory, 'get_connection', lambda _: conexion)
    monkeypatch.setattr(download.DownloadRepository, 'resolve_downloadable', lambda s, ws, capa: None)

    def tabla(session, schema, table):
        llamadas['tabla'].append((schema, table))
        return True

    def cache(session, key, ttl):
        llamadas['cache'].append(key)
        return None

    monkeypatch.setattr(download.DownloadRepository, 'validate_table_exists', tabla)
    monkeypatch.setattr(download.DownloadRepository, 'find_fresh_cache', cache)
    return llamadas


@pytest.mark.parametrize('workspace,capa', [('mapalab', 'map_shares'), ('pg_catalog', 'pg_roles')])
def test_sin_metadatos_no_hay_respaldo_a_la_tabla(repo, workspace, capa):
    with pytest.raises(NotFoundException):
        download._prepare_download(workspace, capa, False)
    assert repo['tabla'] == [] and repo['cache'] == []


def test_la_cache_se_busca_con_la_llave_del_metadato(repo, monkeypatch):
    monkeypatch.setattr(
        download.DownloadRepository, 'resolve_downloadable',
        lambda s, ws, capa: ('general:regiones', 'mapa_base', 'regiones'),
    )
    kind, nombre, schema, table = download._prepare_download('general', 'regiones', False)
    assert (kind, nombre, schema, table) == ('table', 'regiones', 'mapa_base', 'regiones')
    assert repo['cache'] == ['general:regiones']
    assert repo['tabla'] == [('mapa_base', 'regiones')]


def test_el_resolutor_solo_acepta_capas_descargables_de_un_workspace_conocido():
    capturado = {}

    class Sesion:
        def execute(self, sql, params):
            capturado['sql'] = str(sql)
            capturado['params'] = params
            return SimpleNamespace(first=lambda: None)

    assert download.DownloadRepository.resolve_downloadable(Sesion(), 'pg_catalog', 'pg_roles') is None
    assert 'mapalab.workspaces w' in capturado['sql']
    assert 'm.downloadable' in capturado['sql']
    assert capturado['params'] == {'alias': 'pg_catalog', 'layer': 'pg_roles'}


@pytest.fixture
def cliente():
    app = FastAPI()
    app.add_exception_handler(BaseAppException, app_exception_handler)
    app.include_router(download.router)
    return TestClient(app)


@pytest.mark.parametrize('ruta', ['/download/Mapalab/x', '/download/mapalab/tabla-rara', '/download/ws/a%22b'])
def test_rechaza_nombres_fuera_de_patron(cliente, ruta, monkeypatch):
    monkeypatch.setattr(download, '_prepare_download', lambda *a: pytest.fail('no debe consultar'))
    assert cliente.get(ruta).status_code == 404


@pytest.mark.parametrize('ruta', ['/download/mapalab/map_shares', '/download/pg_catalog/pg_roles'])
def test_tablas_fuera_del_catalogo_responden_404(cliente, repo, ruta):
    assert cliente.get(ruta).status_code == 404
    assert repo['tabla'] == []


def test_capa_del_catalogo_se_descarga(cliente, repo, monkeypatch):
    monkeypatch.setattr(
        download.DownloadRepository, 'resolve_downloadable',
        lambda s, ws, capa: ('economia:unidades', 'economia', 'unidades'),
    )

    async def pool():
        return object()

    async def csv(p, schema, table, date_from, date_to):
        yield f'{schema}.{table}\n'.encode()

    monkeypatch.setattr(download, 'get_pool', pool)
    monkeypatch.setattr(download.DownloadRepository, 'stream_csv', csv)
    respuesta = cliente.get('/download/economia/unidades')
    assert respuesta.status_code == 200
    assert respuesta.text == 'economia.unidades\n'
    assert 'filename="unidades.csv"' in respuesta.headers['content-disposition']
    assert repo['cache'] == ['economia:unidades']
