from unittest.mock import MagicMock

from app.services import columnas_service


def _fila(columna: str, alias: str, orden: int, visible: bool = True, formato=None):
    fila = MagicMock()
    fila.columna = columna
    fila.alias = alias
    fila.orden = orden
    fila.visible = visible
    fila.formato = formato
    return fila


def _encolar(session, filas):
    consulta = session.query.return_value.filter.return_value.order_by.return_value
    consulta.all.return_value = filas


def test_devuelve_las_columnas_configuradas(mock_mapalab_db, monkeypatch):
    monkeypatch.setattr(columnas_service, 'resolve_layer_key', lambda *_: 'educacion:escuelas')
    _encolar(mock_mapalab_db, [
        _fila('p_total', 'Población', 0, True, 'entero'),
        _fila('cve_mun', 'Municipio', 1, False),
    ])

    respuesta = columnas_service.get_columnas_response('educacion', 'escuelas')

    assert respuesta['layerKey'] == 'educacion:escuelas'
    assert [c['columna'] for c in respuesta['columnas']] == ['p_total', 'cve_mun']
    assert respuesta['columnas'][0]['alias'] == 'Población'
    assert respuesta['columnas'][0]['formato'] == 'entero'
    assert respuesta['columnas'][1]['visible'] is False


def test_una_capa_sin_configurar_responde_lista_vacia(mock_mapalab_db, monkeypatch):
    monkeypatch.setattr(columnas_service, 'resolve_layer_key', lambda *_: 'educacion:escuelas')
    _encolar(mock_mapalab_db, [])

    respuesta = columnas_service.get_columnas_response('educacion', 'escuelas')

    assert respuesta['columnas'] == []
