from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.stats_engine import (
    OPERATIONS_WITHOUT_FIELD,
    PRIMITIVE_OPERATIONS,
    _build_conditions,
    _effective_filters,
    _is_identifier,
    _placeholder_key,
    _valid_filters,
    bind_layer_fields,
    load_layer_binding,
)

AGRUPABLES = {'count', 'count_where', 'count_distinct', 'sum'}
MAX_GRUPOS = 200


def _es_filtro_de_municipio(filtro: dict, campo: str) -> bool:
    if filtro.get('field') == campo:
        return True
    valor = filtro.get('value')
    valores = valor if isinstance(valor, (list, tuple)) else [valor]
    for item in valores:
        clave = _placeholder_key(item)
        if clave and clave.startswith('municipio'):
            return True
    return False


def _sin_municipio(cfg: dict, campo: str) -> dict:
    item = dict(cfg)
    item['filters'] = [f for f in (cfg.get('filters') or []) if not _es_filtro_de_municipio(f, campo)]
    return item


def build_group_query(cfg: dict, campo: str, context: dict | None) -> tuple[str, dict] | None:
    op = cfg.get('operation')
    if op not in AGRUPABLES or op not in PRIMITIVE_OPERATIONS:
        return None

    schema = cfg.get('schema')
    table = cfg.get('table')
    field = cfg.get('field')

    if not (_is_identifier(schema) and _is_identifier(table) and _is_identifier(campo)):
        return None
    if op not in OPERATIONS_WITHOUT_FIELD and not _is_identifier(field):
        return None

    limpio = _sin_municipio(cfg, campo)
    filters = _valid_filters(limpio.get('filters'))
    if filters is None:
        return None

    params: dict = {}
    conditions = _build_conditions(_effective_filters(limpio, filters), context, params)
    conditions.append(f'"{campo}" IS NOT NULL')
    where = f' WHERE {" AND ".join(conditions)}'

    if op in ('count', 'count_where'):
        agregado = 'COUNT(*)'
    elif op == 'count_distinct':
        agregado = f'COUNT(DISTINCT "{field}")'
    else:
        agregado = f'SUM("{field}")'

    fqtn = f'"{schema}"."{table}"'
    sql = (
        f'SELECT "{campo}" AS llave, {agregado} AS valor '
        f'FROM {fqtn}{where} GROUP BY "{campo}" LIMIT {MAX_GRUPOS}'
    )
    return sql, params


def _ejecutar_grupo(session: Session, sql: str, params: dict) -> dict[str, Any]:
    savepoint = session.begin_nested()
    try:
        filas = session.execute(text(sql), params).fetchall()
        savepoint.commit()
    except Exception:
        savepoint.rollback()
        return {}
    return {str(fila[0]): fila[1] for fila in filas if fila[0] is not None}


def compute_ranking(
    session: Session,
    layer_key: str,
    stats_config: list | None,
    context: dict | None,
) -> dict | None:
    binding = load_layer_binding(session, layer_key)
    campo = (binding or {}).get('municipio_field')
    if not campo:
        return None

    slots: list[dict] = []
    series: list[dict[str, Any]] = []

    for cfg in bind_layer_fields(stats_config, binding):
        construido = build_group_query(cfg, campo, context)
        if construido is None:
            continue
        sql, params = construido
        slots.append({
            'posicion': cfg.get('position') or cfg.get('posicion'),
            'nombre': cfg.get('label') or cfg.get('nombre'),
            'simbolo': cfg.get('symbol') or cfg.get('simbolo'),
            'op': cfg.get('operation'),
        })
        series.append(_ejecutar_grupo(session, sql, params))

    if not slots:
        return None

    llaves = sorted({llave for serie in series for llave in serie})
    return {
        'campo': campo,
        'tipo': (binding or {}).get('municipio_field_type') or 'nombre',
        'slots': slots,
        'municipios': [
            {'llave': llave, 'valores': [serie.get(llave) for serie in series]}
            for llave in llaves
        ],
    }
