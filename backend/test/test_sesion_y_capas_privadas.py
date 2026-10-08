from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.config import settings
from app.routers import privado, sesion
from app.services import acceso_capas, arbol_privado, sesion_firma, sesion_oidc
from app.services.layer_tree_service import _build_tree_from_rows


@pytest.fixture
def secreto(monkeypatch):
    monkeypatch.setattr(settings, 'MAPALAB_SESSION_SECRET', 'secreto-de-prueba')


def _capa(id_, parent_id=None, privada=False, node_type='leaf'):
    campos = {c: None for c in (
        'slug', 'workspace_alias', 'geoserver_layer', 'wms_group', 'wfs_layer_name', 'metadata_layer',
        'default_date', 'default_zoom', 'zoom_range', 'raster_periodicity', 'search_tags', 'searchable_fields',
        'municipio_field', 'municipio_field_type', 'direccion_field', 'infobox_config', 'icon_url',
        'icon_overrides', 'notice', 'badge', 'highlight_color', 'highlight_shape', 'geometry_type',
        'time_style_pattern',
    )}
    return SimpleNamespace(
        id=id_, parent_id=parent_id, privada=privada, node_type=node_type, label=id_, sort_order=0,
        disabled=False, hidden_in_menu=False, downloadable=True, hide_periodicity=False,
        has_municipio=False, has_direccion=False, **campos,
    )


class TestFirma:
    def test_ida_y_vuelta(self, secreto):
        valor = sesion_firma.firmar('sesion', {'uid': 7}, 60)
        assert sesion_firma.leer('sesion', valor)['uid'] == 7

    def test_otro_proposito_no_vale(self, secreto):
        valor = sesion_firma.firmar('tx', {'uid': 7}, 60)
        assert sesion_firma.leer('sesion', valor) is None

    def test_alterada_no_vale(self, secreto):
        carga, firma = sesion_firma.firmar('sesion', {'uid': 7}, 60).rsplit('.', 1)
        otra = sesion_firma._b64(b'{"uid":1,"exp":9999999999}')
        assert sesion_firma.leer('sesion', f'{otra}.{firma}') is None

    def test_vencida_no_vale(self, secreto):
        assert sesion_firma.leer('sesion', sesion_firma.firmar('sesion', {'uid': 7}, -1)) is None

    def test_sin_secreto_no_hay_sesion(self, monkeypatch):
        monkeypatch.setattr(settings, 'MAPALAB_SESSION_SECRET', 'a')
        valor = sesion_firma.firmar('sesion', {'uid': 7}, 60)
        monkeypatch.setattr(settings, 'MAPALAB_SESSION_SECRET', None)
        assert sesion_firma.leer('sesion', valor) is None


class TestCompuertas:
    def test_una_carpeta_privada_arrastra_a_sus_descendientes(self):
        filas = [('tema', None, False), ('carpeta', 'tema', True), ('capa', 'carpeta', False), ('otra', 'tema', False)]
        compuertas = acceso_capas._calcular_compuertas(filas)
        assert compuertas == {'carpeta': ('carpeta',), 'capa': ('carpeta',)}

    def test_privadas_anidadas_piden_las_dos(self):
        filas = [('a', None, True), ('b', 'a', True)]
        assert acceso_capas._calcular_compuertas(filas)['b'] == ('b', 'a')

    def test_un_ciclo_no_cuelga(self):
        assert acceso_capas._calcular_compuertas([('a', 'b', True), ('b', 'a', False)])['b'] == ('a',)


class TestArbolPublico:
    def test_sin_privadas_ni_descendientes(self):
        capas = [_capa('tema', node_type='tema'), _capa('privada', 'tema', privada=True), _capa('hija', 'privada'), _capa('publica', 'tema')]
        arbol = _build_tree_from_rows(capas, {}, {})
        assert [h['id'] for h in arbol[0]['children']] == ['publica']

    def test_completo_las_incluye(self):
        capas = [_capa('tema', node_type='tema'), _capa('privada', 'tema', privada=True), _capa('hija', 'privada')]
        arbol = _build_tree_from_rows(capas, {}, {}, incluir_privadas=True)
        assert arbol[0]['children'][0]['children'][0]['id'] == 'hija'


@pytest.fixture
def estructura(monkeypatch):
    compuertas = {'carpeta': ('carpeta',), 'capa': ('carpeta',), 'secreta': ('secreta', 'carpeta')}
    nodos = {
        'tema': {'id': 'tema', 'children': []},
        'carpeta': {'id': 'carpeta', 'nodeType': 'category', 'children': [
            {'id': 'capa', 'nodeType': 'leaf', 'children': [], 'wmsConfig': {'geoserverWorkspace': 'ws', 'geoserverLayer': 'capa'}},
            {'id': 'secreta', 'nodeType': 'leaf', 'children': [], 'wmsConfig': {'geoserverWorkspace': 'ws', 'geoserverLayer': 'secreta'}},
        ]},
    }
    nodos['capa'] = nodos['carpeta']['children'][0]
    nodos['secreta'] = nodos['carpeta']['children'][1]
    nodos['publica'] = {'id': 'publica', 'nodeType': 'leaf', 'children': [], 'wmsConfig': {'geoserverWorkspace': 'ws', 'geoserverLayer': 'publica'}}
    padres = {'tema': None, 'carpeta': 'tema', 'capa': 'carpeta', 'secreta': 'carpeta', 'publica': 'tema'}
    concedidas = {1: frozenset({'carpeta'}), 2: frozenset({'carpeta', 'secreta'})}
    monkeypatch.setattr(acceso_capas, 'compuertas', lambda: compuertas)
    monkeypatch.setattr(acceso_capas, 'concedidas', lambda uid: concedidas.get(uid, frozenset()))
    monkeypatch.setattr(arbol_privado, '_arbol_completo', lambda: (nodos, padres))


class TestComplemento:
    def test_sin_sesion_nada(self, estructura):
        assert arbol_privado.complemento(None) == []

    def test_cuelga_de_su_padre_publico_y_poda_lo_no_concedido(self, estructura):
        resultado = arbol_privado.complemento(1)
        assert len(resultado) == 1
        assert resultado[0]['parentId'] == 'tema'
        assert [h['id'] for h in resultado[0]['node']['children']] == ['capa']
        assert resultado[0]['node']['privada'] is True

    def test_con_todo_concedido(self, estructura):
        hijos = arbol_privado.complemento(2)[0]['node']['children']
        assert {h['id'] for h in hijos} == {'capa', 'secreta'}

    def test_cuenta_solo_capas(self, estructura):
        assert arbol_privado.contar_capas(1) == 1
        assert arbol_privado.contar_capas(2) == 2


class TestAutorizarProxy:
    def test_concedida(self, estructura):
        privado._autorizar(['ws:capa'], 'ws', 1)

    def test_nombre_sin_workspace(self, estructura):
        privado._autorizar(['capa'], 'ws', 1)

    def test_no_concedida(self, estructura):
        with pytest.raises(HTTPException) as exc:
            privado._autorizar(['ws:secreta'], 'ws', 1)
        assert exc.value.status_code == 403

    def test_una_publica_no_pasa_con_credencial_de_admin(self, estructura):
        with pytest.raises(HTTPException):
            privado._autorizar(['ws:publica'], 'ws', 2)

    def test_una_desconocida_no_pasa(self, estructura):
        with pytest.raises(HTTPException):
            privado._autorizar(['ws:cualquiera'], 'ws', 2)

    def test_sin_capa(self, estructura):
        with pytest.raises(HTTPException) as exc:
            privado._autorizar([], 'ws', 2)
        assert exc.value.status_code == 400


class TestRutas:
    def test_estado_sin_sesion(self, client):
        resp = client.get('/sesion')
        assert resp.status_code == 200
        assert resp.json()['usuario'] is None
        assert 'no-store' in resp.headers['cache-control']

    def test_entrar_deshabilitado(self, client, monkeypatch):
        monkeypatch.setattr(settings, 'MINERVA_CLIENT_ID', None)
        assert client.get('/sesion/entrar', follow_redirects=False).status_code == 503

    def test_capas_sin_sesion(self, client):
        assert client.get('/sesion/capas').json() == []

    def test_proxy_sin_sesion(self, client):
        assert client.get('/privado/ws/wms?request=GetMap&layers=ws:capa').status_code == 401

    def test_callback_denegado_avisa_al_mapa(self, client, monkeypatch, secreto):
        for clave in ('MINERVA_ISSUER_URL', 'MINERVA_CLIENT_ID', 'MINERVA_CLIENT_SECRET', 'MAPALAB_PUBLIC_BASE_URL'):
            monkeypatch.setattr(settings, clave, 'x')
        tx = sesion_firma.firmar('tx', {'estado': 'e', 'verificador': 'v', 'modo': 'popup', 'siguiente': '/mapalab/'}, 60)
        client.cookies.set(sesion.COOKIE_TX, tx)
        resp = client.get('/sesion/callback?error=access_denied&state=e')
        assert 'sin_acceso' in resp.text
        assert 'BroadcastChannel' in resp.text


@pytest.mark.parametrize('valor, esperado', [
    ('/mapalab/?capas=a', '/mapalab/?capas=a'),
    ('https://otro.com', '/mapalab/'),
    ('//otro.com/mapalab', '/mapalab/'),
    ('/mariachi/', '/mapalab/'),
    (None, '/mapalab/'),
])
def test_siguiente_seguro(valor, esperado):
    assert sesion._siguiente_seguro(valor) == esperado


class TestCapaVisible:
    def _peticion(self, uid=None):
        cookies = {}
        if uid is not None:
            cookies[sesion.COOKIE_SESION] = sesion_firma.firmar('sesion', {'uid': uid, 'nombre': 'A', 'correo': 'a@b'}, 60)
        return SimpleNamespace(cookies=cookies)

    def test_publica_siempre(self, estructura, secreto):
        from app.auth.capa_visible import capa_visible
        assert capa_visible(self._peticion(), 'ws', 'publica')

    def test_privada_sin_sesion_no(self, estructura, secreto):
        from app.auth.capa_visible import capa_visible
        assert not capa_visible(self._peticion(), 'ws', 'capa')

    def test_privada_concedida(self, estructura, secreto):
        from app.auth.capa_visible import capa_visible
        assert capa_visible(self._peticion(1), 'ws', 'capa')
        assert not capa_visible(self._peticion(1), 'ws', 'secreta')

    def test_claves_en_lote(self, estructura, secreto):
        from app.auth.capa_visible import claves_visibles
        assert claves_visibles(self._peticion(1), ['ws:publica', 'ws:secreta', 'ws:capa', 'mal']) == ['ws:publica', 'ws:capa']

    def test_catalogo_sin_privadas(self, estructura):
        from app.auth.capa_visible import es_publica
        assert es_publica('ws', 'publica')
        assert es_publica('ws', 'desconocida')
        assert not es_publica('ws', 'capa')


class TestPendientes:
    def test_cuenta_las_privadas_que_no_ve(self, estructura):
        assert arbol_privado.privadas_no_visibles(['capa', 'secreta', 'publica', 'nada'], None) == 2
        assert arbol_privado.privadas_no_visibles(['capa', 'secreta'], 1) == 1
        assert arbol_privado.privadas_no_visibles(['CAPA'], 2) == 0


class TestArbolCompletoParaElAdmin:
    def test_marca_las_privadas(self):
        arbol = [{'id': 't', 'children': [{'id': 'p', 'children': [{'id': 'h', 'children': []}]}, {'id': 'x', 'children': []}]}]
        marcado = arbol_privado._marcar(arbol, {'p': ('p',), 'h': ('p',)})
        assert 'privada' not in marcado[0]
        assert marcado[0]['children'][0]['privada'] is True
        assert marcado[0]['children'][0]['children'][0]['privada'] is True
        assert 'privada' not in marcado[0]['children'][1]

    def test_pide_token(self, client):
        assert client.get('/layers/tree/completo').status_code in (401, 503)


class TestBasePublica:
    def _req(self, headers, scheme='http'):
        return SimpleNamespace(headers=headers, url=SimpleNamespace(scheme=scheme))

    def test_usa_el_host_y_el_protocolo_del_gateway(self):
        req = self._req({'x-forwarded-proto': 'https', 'host': 'canario.iieg'})
        assert sesion._base_publica(req) == 'https://canario.iieg'

    def test_prefiere_x_forwarded_host(self):
        req = self._req({'x-forwarded-proto': 'https', 'x-forwarded-host': 'iieg.jalisco.gob.mx', 'host': 'backend:8000'})
        assert sesion._base_publica(req) == 'https://iieg.jalisco.gob.mx'

    def test_un_host_raro_cae_en_la_url_configurada(self, monkeypatch):
        monkeypatch.setattr(settings, 'MAPALAB_PUBLIC_BASE_URL', 'https://iieg.jalisco.gob.mx/')
        req = self._req({'host': 'evil.com/x@'})
        assert sesion._base_publica(req) == 'https://iieg.jalisco.gob.mx'

    def test_el_redirect_lleva_la_ruta_del_callback(self):
        assert sesion_oidc.redirect_uri('https://canario.iieg') == 'https://canario.iieg/mapalab/api/sesion/callback'
