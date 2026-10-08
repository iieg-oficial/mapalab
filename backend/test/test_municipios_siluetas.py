from contextlib import nullcontext

import app.routers.municipios as router
from fastapi import Response

SILUETAS = {'estado': {'type': 'Polygon', 'coordinates': [[[0, 0], [1, 0], [1, 1], [0, 0]]]}, 'municipios': []}


def test_guarda_las_siluetas_en_memoria_y_responde_304_con_el_etag(monkeypatch):
    llamadas = []
    router._siluetas_cache.clear()
    monkeypatch.setattr(router, '_get_session', lambda: nullcontext(None))
    monkeypatch.setattr(router.MunicipiosRepository, 'get_siluetas', lambda session, src: llamadas.append(src) or SILUETAS)

    respuesta = Response()
    assert router.get_siluetas(respuesta, source='iieg', if_none_match=None) == SILUETAS
    etag = respuesta.headers['ETag']
    segunda = router.get_siluetas(Response(), source='iieg', if_none_match=etag)
    assert segunda.status_code == 304
    assert llamadas == ['iieg']


def test_una_fuente_desconocida_cae_a_iieg(monkeypatch):
    router._siluetas_cache.clear()
    monkeypatch.setattr(router, '_get_session', lambda: nullcontext(None))
    monkeypatch.setattr(router.MunicipiosRepository, 'get_siluetas', lambda session, src: {'fuente': src})
    assert router.get_siluetas(Response(), source='otra', if_none_match=None) == {'fuente': 'iieg'}
