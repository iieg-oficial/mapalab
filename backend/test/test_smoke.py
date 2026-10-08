from unittest.mock import patch


def test_health(client):
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json() == {'message': 'ok'}


def test_root(client):
    r = client.get('/')
    assert r.status_code == 200


class TestLayersTree:
    def test_tree_returns_cached_state(self, client):
        mock_state = {
            'etag': 'W/"abc"',
            'tree': [{'id': 'seguridad', 'label': 'Seguridad', 'children': []}],
            'initial_order': ['limite_iieg'],
            'workspaces': [{'alias': 'seguridad', 'geoserverWorkspace': 'seg', 'dbSchema': 'seg', 'label': 'Seg'}],
        }
        with patch('app.routers.layers.get_cached_state', return_value=mock_state):
            r = client.get('/layers/tree')
        assert r.status_code == 200
        assert r.headers['etag'] == 'W/"abc"'
        assert r.json() == mock_state['tree']

    def test_tree_returns_304_on_matching_etag(self, client):
        mock_state = {'etag': 'W/"abc"', 'tree': [], 'initial_order': [], 'workspaces': []}
        with patch('app.routers.layers.get_cached_state', return_value=mock_state):
            r = client.get('/layers/tree', headers={'if-none-match': 'W/"abc"'})
        assert r.status_code == 304

    def test_initial_order(self, client):
        mock_state = {'etag': 'x', 'tree': [], 'initial_order': ['a', 'b'], 'workspaces': []}
        with patch('app.routers.layers.get_cached_state', return_value=mock_state):
            r = client.get('/layers/initial-order')
        assert r.json() == ['a', 'b']

    def test_workspaces(self, client):
        mock_state = {
            'etag': 'x', 'tree': [], 'initial_order': [],
            'workspaces': [{'alias': 'seg', 'geoserverWorkspace': 'seg', 'dbSchema': 'seg', 'label': 'Seg'}],
        }
        with patch('app.routers.layers.get_cached_state', return_value=mock_state):
            r = client.get('/layers/workspaces')
        assert len(r.json()) == 1
        assert r.json()[0]['alias'] == 'seg'


class TestLayersAdminAuth:
    def test_refresh_cache_rejects_without_token(self, client):
        from app.config import settings
        original = settings.MAPALAB_INTERNAL_TOKEN
        settings.MAPALAB_INTERNAL_TOKEN = 'expected-token'
        try:
            r = client.post('/layers/refresh-cache')
            assert r.status_code == 401
        finally:
            settings.MAPALAB_INTERNAL_TOKEN = original

    def test_refresh_cache_rejects_with_wrong_token(self, client):
        from app.config import settings
        original = settings.MAPALAB_INTERNAL_TOKEN
        settings.MAPALAB_INTERNAL_TOKEN = 'expected-token'
        try:
            r = client.post('/layers/refresh-cache', headers={'X-Internal-Token': 'wrong'})
            assert r.status_code == 401
        finally:
            settings.MAPALAB_INTERNAL_TOKEN = original

    def test_refresh_cache_503_when_token_not_configured(self, client):
        from app.config import settings
        original = settings.MAPALAB_INTERNAL_TOKEN
        settings.MAPALAB_INTERNAL_TOKEN = None
        try:
            r = client.post('/layers/refresh-cache', headers={'X-Internal-Token': 'whatever'})
            assert r.status_code == 503
        finally:
            settings.MAPALAB_INTERNAL_TOKEN = original

    def test_refresh_cache_accepts_correct_token(self, client):
        from app.config import settings
        original = settings.MAPALAB_INTERNAL_TOKEN
        settings.MAPALAB_INTERNAL_TOKEN = 'expected-token'
        try:
            mock_result = {'etag': 'W/"x"', 'layer_count': 0}
            with patch('app.routers.layers.refresh_cache', return_value=mock_result):
                r = client.post('/layers/refresh-cache', headers={'X-Internal-Token': 'expected-token'})
            assert r.status_code == 200
            assert r.json()['ok'] is True
        finally:
            settings.MAPALAB_INTERNAL_TOKEN = original

    def test_invalidate_cache_rejects_without_token(self, client):
        from app.config import settings
        original = settings.MAPALAB_INTERNAL_TOKEN
        settings.MAPALAB_INTERNAL_TOKEN = 'expected-token'
        try:
            r = client.post('/layers/invalidate-cache')
            assert r.status_code == 401
        finally:
            settings.MAPALAB_INTERNAL_TOKEN = original


class TestSearchValidation:
    def test_search_requires_q(self, client):
        r = client.get('/layers/search')
        assert r.status_code == 422

    def test_search_rejects_empty_q(self, client):
        r = client.get('/layers/search?q=')
        assert r.status_code == 422
