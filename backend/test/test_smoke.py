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


class TestSearchValidation:
    def test_search_requires_q(self, client):
        r = client.get('/layers/search')
        assert r.status_code == 422

    def test_search_rejects_empty_q(self, client):
        r = client.get('/layers/search?q=')
        assert r.status_code == 422


class TestMetrics:
    def test_metrics_endpoint_is_plaintext(self, client):
        r = client.get('/metrics')
        assert r.status_code == 200
        assert 'text/plain' in r.headers['content-type']
        assert r.text.endswith('\n')

    def test_metrics_increment_on_tree_request(self, client):
        mock_state = {'etag': 'x', 'tree': [], 'initial_order': [], 'workspaces': []}
        with patch('app.routers.layers.get_cached_state', return_value=mock_state):
            r_before = client.get('/metrics').text
            client.get('/layers/tree')
            r_after = client.get('/metrics').text

        def count(text, name):
            for line in text.splitlines():
                if line.startswith(name + ' '):
                    return int(line.split(' ', 1)[1])
            return 0

        before = count(r_before, 'mapalab_tree_requests_total')
        after = count(r_after, 'mapalab_tree_requests_total')
        assert after - before == 1

    def test_metrics_tree_cache_hit_on_304(self, client):
        mock_state = {'etag': 'W/"abc"', 'tree': [], 'initial_order': [], 'workspaces': []}
        with patch('app.routers.layers.get_cached_state', return_value=mock_state):
            r_before = client.get('/metrics').text
            client.get('/layers/tree', headers={'if-none-match': 'W/"abc"'})
            r_after = client.get('/metrics').text

        def count(text, name):
            for line in text.splitlines():
                if line.startswith(name + ' '):
                    return int(line.split(' ', 1)[1])
            return 0

        before = count(r_before, 'mapalab_tree_cache_hits_total')
        after = count(r_after, 'mapalab_tree_cache_hits_total')
        assert after - before == 1
