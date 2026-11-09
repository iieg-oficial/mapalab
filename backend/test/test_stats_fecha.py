from app.services.stats_engine import (
    bind_layer_fields,
    build_query,
    contexto_con_fecha,
    rango_de_fecha_defecto,
    usa_fecha,
)

CONFIG_CON_FECHA = [{
    'position': 1,
    'operation': 'sum',
    'schema': 'demografia',
    'table': 'poblacion',
    'field': 'poblacion_total',
    'filters': [
        {'field': '@municipio', 'op': 'in', 'value': '{{municipio}}'},
        {'field': '@fecha', 'op': 'between', 'value': ['{{fecha.inicio}}', '{{fecha.fin}}']},
    ],
}]
BINDING = {
    'municipio_field': 'nombre',
    'municipio_field_type': 'nombre',
    'date_column': 'fecha',
    'default_date': {'year': 2026},
}


def test_rango_por_anio_mes_y_dia() -> None:
    assert rango_de_fecha_defecto({'year': 2026}) == ('2026-01-01', '2026-12-31')
    assert rango_de_fecha_defecto({'year': [2020, 2024]}) == ('2024-01-01', '2024-12-31')
    assert rango_de_fecha_defecto({'year': 2024, 'month': 2}) == ('2024-02-01', '2024-02-29')
    assert rango_de_fecha_defecto({'year': 2025, 'month': 3, 'day': 7}) == ('2025-03-07', '2025-03-07')
    assert rango_de_fecha_defecto(None) is None
    assert rango_de_fecha_defecto({'month': 3}) is None


def test_usa_fecha_solo_con_el_token() -> None:
    assert usa_fecha(CONFIG_CON_FECHA)
    assert not usa_fecha([{'operation': 'count', 'filters': [{'field': 'fecha', 'op': 'is_not_null'}]}])
    assert not usa_fecha(None)


def test_contexto_toma_la_fecha_por_defecto() -> None:
    contexto = contexto_con_fecha(BINDING, CONFIG_CON_FECHA, {'municipio.claves': ['039']})
    assert contexto == {'municipio.claves': ['039'], 'fecha.inicio': '2026-01-01', 'fecha.fin': '2026-12-31'}


def test_contexto_respeta_la_fecha_pedida() -> None:
    pedido = {'fecha.inicio': '2020-01-01', 'fecha.fin': '2020-12-31'}
    assert contexto_con_fecha(BINDING, CONFIG_CON_FECHA, pedido) is pedido


def test_contexto_sin_fecha_en_la_config_descarta_la_pedida() -> None:
    config = [{'operation': 'count'}]
    assert contexto_con_fecha(BINDING, config, None) is None
    assert contexto_con_fecha(BINDING, config, {'fecha.inicio': '2020-01-01'}) is None
    pedido = {'municipio.claves': ['039'], 'fecha.inicio': '2020-01-01', 'fecha.fin': '2020-12-31'}
    assert contexto_con_fecha(BINDING, config, pedido) == {'municipio.claves': ['039']}


def test_placeholder_de_fecha_tambien_cuenta() -> None:
    assert usa_fecha([{'filters': [{'field': 'fecha', 'op': 'gte', 'value': '{{fecha.inicio}}'}]}])


def test_fecha_se_liga_a_la_columna_de_la_capa() -> None:
    ligado = bind_layer_fields(CONFIG_CON_FECHA, {**BINDING, 'date_column': 'periodo'})[0]
    sql, params = build_query(ligado, {'fecha.inicio': '2020-01-01', 'fecha.fin': '2020-12-31'})
    assert '"periodo" BETWEEN :f1_lo AND :f1_hi' in sql
    assert params == {'f1_lo': '2020-01-01', 'f1_hi': '2020-12-31'}


def test_sin_binding_la_columna_es_fecha() -> None:
    ligado = bind_layer_fields(CONFIG_CON_FECHA, None)[0]
    assert ligado['filters'][0]['field'] == 'fecha'


def test_ranking_agrupa_promedios_con_su_peso() -> None:
    from app.services.stats_ranking import build_group_query
    cfg = {**CONFIG_CON_FECHA[0], 'operation': 'avg'}
    ligado = bind_layer_fields([cfg], BINDING)[0]
    sql, _ = build_group_query(ligado, 'nombre', {'fecha.inicio': '2020-01-01', 'fecha.fin': '2020-12-31'})
    assert 'AVG("poblacion_total") AS valor' in sql
    assert 'COUNT("poblacion_total") AS peso' in sql
    suma = build_group_query({**ligado, 'operation': 'sum'}, 'nombre', None)[0]
    assert 'NULL AS peso' in suma
