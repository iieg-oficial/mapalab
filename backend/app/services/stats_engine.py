from __future__ import annotations

import re
from hashlib import sha1
from json import dumps
from threading import Lock
from time import monotonic
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

PRIMITIVE_OPERATIONS = {'count', 'count_distinct', 'count_where', 'sum', 'avg', 'min', 'max', 'latest'}
OPERATIONS_WITHOUT_FIELD = {'count', 'count_where'}
FILTER_OPS = {'eq', 'in', 'gte', 'lte', 'between', 'is_not_null'}
CONTEXT_KEYS = {'municipio', 'municipio.claves', 'municipio.nombres', 'fecha.inicio', 'fecha.fin'}
SQL_COMPARATORS = {'eq': '=', 'gte': '>=', 'lte': '<='}
MUNICIPIO_FIELD_TOKEN = '@municipio'
MUNICIPIO_CONTEXT_BY_TYPE = {'clave': '{{municipio.claves}}', 'nombre': '{{municipio.nombres}}'}
MAX_FILTERS = 6
MAX_CACHE_ENTRIES = 256

_PLACEHOLDER = re.compile(r'^\{\{([a-z_.]+)\}\}$')
_LAYER_BINDING_SQL = """
    WITH RECURSIVE cadena AS (
        SELECT l.id, l.parent_id, l.municipio_field, l.municipio_field_type
        FROM mapalab.layers l
        JOIN mapalab.workspaces w ON w.alias = l.workspace_alias
        WHERE w.geoserver_workspace || ':' || l.geoserver_layer = :layer_key
          AND l.deleted_at IS NULL
        UNION ALL
        SELECT p.id, p.parent_id, p.municipio_field, p.municipio_field_type
        FROM mapalab.layers p
        JOIN cadena c ON c.parent_id = p.id
        WHERE p.deleted_at IS NULL
    )
    SELECT municipio_field, municipio_field_type
    FROM cadena
    WHERE municipio_field IS NOT NULL
    LIMIT 1
"""

_cache: dict[str, tuple[float, list]] = {}
_cache_lock = Lock()


def _is_identifier(value: Any) -> bool:
    if not value or not isinstance(value, str) or len(value) > 100:
        return False
    return all(c.isalnum() or c == '_' for c in value)


def _placeholder_key(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    match = _PLACEHOLDER.match(value.strip())
    return match.group(1) if match else None


def _resolve_context(value: Any, context: dict | None) -> tuple[Any, bool]:
    key = _placeholder_key(value)
    if key is None:
        return value, True
    if key not in CONTEXT_KEYS:
        return None, False
    resolved = (context or {}).get(key)
    if resolved is None:
        return None, False
    if isinstance(resolved, (list, tuple)) and not resolved:
        return None, False
    return resolved, True


def _valid_filters(raw: Any) -> list[dict] | None:
    if raw is None:
        return []
    if not isinstance(raw, list) or len(raw) > MAX_FILTERS:
        return None
    for item in raw:
        if not isinstance(item, dict):
            return None
        field = item.get('field')
        if field != MUNICIPIO_FIELD_TOKEN and not _is_identifier(field):
            return None
        if item.get('op') not in FILTER_OPS:
            return None
    return raw


def _build_conditions(filters: list[dict], context: dict | None, params: dict) -> list[str]:
    conditions: list[str] = []
    for i, item in enumerate(filters):
        field = item['field']
        op = item['op']
        if op == 'is_not_null':
            conditions.append(f'"{field}" IS NOT NULL')
            continue

        value = item.get('value')
        if value is None:
            continue

        if op == 'between':
            bounds = value if isinstance(value, list) else [value]
            resolved = [_resolve_context(v, context) for v in bounds]
            if len(resolved) != 2 or not all(ok for _, ok in resolved):
                continue
            low, high = f'f{i}_lo', f'f{i}_hi'
            params[low], params[high] = resolved[0][0], resolved[1][0]
            conditions.append(f'"{field}" BETWEEN :{low} AND :{high}')
            continue

        if op == 'in':
            raw = value if isinstance(value, list) else [value]
            expanded: list[Any] = []
            for entry in raw:
                item_value, ok = _resolve_context(entry, context)
                if not ok:
                    continue
                if isinstance(item_value, (list, tuple)):
                    expanded.extend(item_value)
                else:
                    expanded.append(item_value)
            if not expanded:
                continue
            names = []
            for j, entry in enumerate(expanded):
                name = f'f{i}_{j}'
                params[name] = entry
                names.append(f':{name}')
            conditions.append(f'"{field}" IN ({", ".join(names)})')
            continue

        resolved, ok = _resolve_context(value, context)
        if not ok:
            continue
        name = item.get('param') or f'f{i}'
        params[name] = resolved
        conditions.append(f'"{field}" {SQL_COMPARATORS[op]} :{name}')
    return conditions


def _effective_filters(cfg: dict, filters: list[dict]) -> list[dict]:
    where_field = cfg.get('where_field')
    where_value = cfg.get('where_value')
    if where_field and where_value is not None:
        legacy = {'field': where_field, 'op': 'eq', 'value': where_value, 'param': 'where_value'}
        return [legacy] + filters
    return filters


def build_query(cfg: dict, context: dict | None = None) -> tuple[str, dict] | None:
    op = cfg.get('operation')
    if op not in PRIMITIVE_OPERATIONS:
        return None
    schema = cfg.get('schema')
    table = cfg.get('table')
    if not (_is_identifier(schema) and _is_identifier(table)):
        return None

    field = cfg.get('field')
    where_field = cfg.get('where_field')
    where_value = cfg.get('where_value')
    order_field = cfg.get('order_field')

    if op not in OPERATIONS_WITHOUT_FIELD and not _is_identifier(field):
        return None
    if field is not None and not _is_identifier(field):
        return None
    if where_field and not _is_identifier(where_field):
        return None
    if order_field and not _is_identifier(order_field):
        return None

    filters = _valid_filters(cfg.get('filters'))
    if filters is None:
        return None
    if op == 'count_where' and not filters and (not where_field or where_value is None):
        return None
    if op == 'latest' and not order_field:
        return None

    fqtn = f'"{schema}"."{table}"'
    params: dict = {}
    conditions = _build_conditions(_effective_filters(cfg, filters), context, params)
    where = f' WHERE {" AND ".join(conditions)}' if conditions else ''

    if op in ('count', 'count_where'):
        sql = f'SELECT COUNT(*) FROM {fqtn}{where}'
    elif op == 'count_distinct':
        sql = f'SELECT COUNT(DISTINCT "{field}") FROM {fqtn}{where}'
    elif op in ('sum', 'avg', 'min', 'max'):
        sql = f'SELECT {op.upper()}("{field}") FROM {fqtn}{where}'
    elif op == 'latest':
        sql = f'SELECT "{field}" FROM {fqtn}{where} ORDER BY "{order_field}" DESC LIMIT 1'
    else:
        return None
    return sql, params


def load_layer_binding(session: Session, layer_key: str) -> dict | None:
    row = session.execute(text(_LAYER_BINDING_SQL), {'layer_key': layer_key}).first()
    if not row:
        return None
    return {'municipio_field': row[0], 'municipio_field_type': row[1]}


def _bind_filter(item: dict, binding: dict | None) -> dict | None:
    bound = dict(item)
    if bound.get('field') == MUNICIPIO_FIELD_TOKEN:
        field = (binding or {}).get('municipio_field')
        if not field:
            return None
        bound['field'] = field
    if _placeholder_key(bound.get('value')) == 'municipio':
        replacement = MUNICIPIO_CONTEXT_BY_TYPE.get((binding or {}).get('municipio_field_type'))
        if not replacement:
            return None
        bound['value'] = replacement
    return bound


def _bind_expression(expr: dict, binding: dict | None) -> dict:
    bound = dict(expr)
    if bound.get('filters'):
        bound['filters'] = [
            f for f in (_bind_filter(f, binding) for f in bound['filters']) if f is not None
        ]
    for side in ('left', 'right'):
        if isinstance(bound.get(side), dict):
            bound[side] = _bind_expression(bound[side], binding)
    return bound


def bind_layer_fields(stats_config: list | None, binding: dict | None) -> list:
    bound_config = []
    for cfg in stats_config or []:
        if not isinstance(cfg, dict):
            continue
        item = dict(cfg)
        if item.get('filters'):
            item['filters'] = [
                f for f in (_bind_filter(f, binding) for f in item['filters']) if f is not None
            ]
        if item.get('operation') == 'formula' and isinstance(item.get('expression'), dict):
            item['expression'] = _bind_expression(item['expression'], binding)
        bound_config.append(item)
    return bound_config


def _to_number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def format_stat_value(value: Any, fmt: str | None) -> str | None:
    if value is None:
        return None
    if not fmt:
        return str(value)
    number = _to_number(value)
    if number is None:
        return str(value)
    if fmt == 'integer':
        return str(int(round(number)))
    if fmt in ('decimal_2', 'currency_mxn'):
        return f'{number:.2f}'
    if fmt == 'percentage':
        return f'{number:.1f}'
    if fmt == 'compact':
        for threshold, suffix in ((1_000_000_000, 'B'), (1_000_000, 'M'), (1_000, 'K')):
            if abs(number) >= threshold:
                return f'{number / threshold:.1f}{suffix}'
        return str(int(number)) if number == int(number) else f'{number:.1f}'
    return str(value)


def _evaluate_expression(session: Session, expr: dict, context: dict | None) -> Any:
    if 'literal' in expr:
        return expr['literal']
    if expr.get('operation') in PRIMITIVE_OPERATIONS:
        return _execute_primitive(session, expr, context)
    op = expr.get('op')
    left = _to_number(_evaluate_expression(session, expr.get('left') or {}, context))
    right = _to_number(_evaluate_expression(session, expr.get('right') or {}, context))
    if left is None or right is None:
        return None
    if op == 'add':
        return left + right
    if op == 'sub':
        return left - right
    if op == 'mul':
        return left * right
    if op == 'div':
        return left / right if right != 0 else None
    if op == 'percent':
        return (left / right) * 100 if right != 0 else None
    if op == 'percent_change':
        return ((left - right) / right) * 100 if right != 0 else None
    return None


def _execute_primitive(session: Session, cfg: dict, context: dict | None) -> Any:
    built = build_query(cfg, context)
    if built is None:
        return None
    sql, params = built
    return session.execute(text(sql), params).scalar()


def _execute_stat(session: Session, cfg: dict, context: dict | None) -> Any:
    op = cfg.get('operation')
    if op == 'static':
        return cfg.get('value') if 'value' in cfg else cfg.get('valor')
    if op == 'formula':
        return _evaluate_expression(session, cfg.get('expression') or {}, context)
    return _execute_primitive(session, cfg, context)


def context_cache_key(layer_key: str, context: dict, stats_config: list | None = None) -> str:
    parts = []
    for key in sorted(context):
        value = context[key]
        if isinstance(value, (list, tuple)):
            value = ','.join(sorted(str(v) for v in value))
        parts.append(f'{key}={value}')
    parts.append('cfg=' + dumps(stats_config or [], sort_keys=True, default=str))
    digest = sha1('|'.join(parts).encode('utf-8')).hexdigest()[:16]
    return f'{layer_key}#{digest}'


def _cache_get(key: str) -> list | None:
    with _cache_lock:
        entry = _cache.get(key)
        if not entry:
            return None
        expires_at, values = entry
        if monotonic() >= expires_at:
            _cache.pop(key, None)
            return None
        return values


def _cache_put(key: str, values: list, ttl_seconds: float) -> None:
    with _cache_lock:
        if len(_cache) >= MAX_CACHE_ENTRIES:
            for stale in [k for k, (exp, _) in _cache.items() if monotonic() >= exp]:
                _cache.pop(stale, None)
            if len(_cache) >= MAX_CACHE_ENTRIES:
                _cache.pop(next(iter(_cache)), None)
        _cache[key] = (monotonic() + ttl_seconds, values)


OPERACION_LEGIBLE = {
    'count': 'Contar registros',
    'count_where': 'Contar registros',
    'count_distinct': 'Contar valores distintos',
    'sum': 'Sumar',
    'avg': 'Promediar',
    'min': 'Valor mínimo',
    'max': 'Valor máximo',
    'latest': 'Último valor',
}

OPERADOR_LEGIBLE = {
    'eq': '=',
    'in': 'en',
    'gte': '≥',
    'lte': '≤',
    'between': 'entre',
    'is_not_null': 'tiene dato',
}


def _valor_legible(value: Any, context: dict | None) -> tuple[str, bool]:
    key = _placeholder_key(value)
    if key is None:
        if isinstance(value, (list, tuple)):
            return ', '.join(str(v) for v in value), False
        return str(value), False
    resolved, ok = _resolve_context(value, context)
    if not ok:
        return 'sin filtrar', True
    if isinstance(resolved, (list, tuple)):
        return ', '.join(str(v) for v in resolved), True
    return str(resolved), True


def _filtro_legible(item: dict, context: dict | None) -> dict:
    op = item.get('op')
    if op == 'is_not_null':
        return {'campo': item.get('field'), 'operador': OPERADOR_LEGIBLE[op], 'valor': None, 'delContexto': False}
    value = item.get('value')
    if op == 'between' and isinstance(value, list) and len(value) == 2:
        inicio, ctx_a = _valor_legible(value[0], context)
        fin, ctx_b = _valor_legible(value[1], context)
        if ctx_a and inicio == 'sin filtrar':
            return {'campo': item.get('field'), 'operador': OPERADOR_LEGIBLE[op], 'valor': 'sin filtrar', 'delContexto': True}
        return {
            'campo': item.get('field'),
            'operador': OPERADOR_LEGIBLE[op],
            'valor': f'{inicio} y {fin}',
            'delContexto': ctx_a or ctx_b,
        }
    legible, del_contexto = _valor_legible(value, context)
    return {
        'campo': item.get('field'),
        'operador': OPERADOR_LEGIBLE.get(op, op),
        'valor': legible,
        'delContexto': del_contexto,
    }


def _conteo_acumulado(session: Session, cfg: dict, filtros: list[dict], context: dict | None) -> int | None:
    parcial = {
        'operation': 'count',
        'schema': cfg.get('schema'),
        'table': cfg.get('table'),
        'filters': filtros,
    }
    built = build_query(parcial, context)
    if built is None:
        return None
    sql, params = built
    savepoint = session.begin_nested()
    try:
        total = session.execute(text(sql), params).scalar()
        savepoint.commit()
        return total
    except Exception:
        savepoint.rollback()
        return None


def build_receta(cfg: dict, context: dict | None, session: Session | None = None) -> dict:
    operacion = cfg.get('operation')

    if operacion == 'static':
        return {'tipo': 'static', 'operacion': 'Valor capturado a mano', 'pasos': []}

    if operacion == 'formula':
        return {'tipo': 'formula', 'operacion': 'Combinación de otras cifras', 'pasos': []}

    crudos = _effective_filters(cfg, cfg.get('filters') or [])
    legibles = [_filtro_legible(f, context) for f in crudos]
    omitidos = [legible['campo'] for legible in legibles if legible['valor'] == 'sin filtrar']

    pasos = []
    if session is not None:
        total = _conteo_acumulado(session, cfg, [], context)
        pasos.append({
            'signo': None,
            'concepto': f"{cfg.get('schema')}.{cfg.get('table')}",
            'detalle': 'registros en la tabla',
            'valor': total,
            'delContexto': False,
        })
        acumulados = []
        for filtro, legible in zip(crudos, legibles):
            if legible['valor'] == 'sin filtrar':
                pasos.append({
                    'signo': legible['operador'],
                    'concepto': legible['campo'],
                    'detalle': 'sin seleccionar en el visor',
                    'valor': None,
                    'delContexto': True,
                    'inactivo': True,
                })
                continue
            acumulados.append(filtro)
            pasos.append({
                'signo': legible['operador'],
                'concepto': legible['campo'],
                'detalle': legible['valor'],
                'valor': _conteo_acumulado(session, cfg, acumulados, context),
                'delContexto': legible['delContexto'],
                'inactivo': False,
            })

    return {
        'tipo': 'primitiva',
        'origen': f"{cfg.get('schema')}.{cfg.get('table')}",
        'operacion': OPERACION_LEGIBLE.get(operacion, operacion),
        'columna': cfg.get('field') if operacion not in OPERATIONS_WITHOUT_FIELD else None,
        'pasos': pasos,
        'omitidos': omitidos,
    }


def build_recetas(session: Session, layer_key: str, stats_config: list | None, context: dict | None) -> dict:
    binding = load_layer_binding(session, layer_key)
    recetas = {}
    for cfg in bind_layer_fields(stats_config, binding):
        position = cfg.get('position') or cfg.get('posicion')
        if isinstance(position, int):
            recetas[position] = build_receta(cfg, context, session)
    return recetas


def compute_numeralia(
    session: Session,
    layer_key: str,
    stats_config: list,
    context: dict,
    ttl_minutes: int = 1440,
) -> list:
    key = context_cache_key(layer_key, context, stats_config)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    binding = load_layer_binding(session, layer_key)
    values = []
    for cfg in bind_layer_fields(stats_config, binding):
        position = cfg.get('position') or cfg.get('posicion')
        savepoint = session.begin_nested()
        try:
            raw = _execute_stat(session, cfg, context)
            savepoint.commit()
        except Exception:
            savepoint.rollback()
            continue
        values.append({
            'posicion': position,
            'valor': format_stat_value(raw, cfg.get('format')),
            'nombre': cfg.get('label') or cfg.get('nombre'),
            'simbolo': cfg.get('symbol') or cfg.get('simbolo'),
            'receta': build_receta(cfg, context, session),
        })

    values.sort(key=lambda item: item['posicion'] if isinstance(item['posicion'], int) else 99)
    _cache_put(key, values, max(ttl_minutes, 1) * 60)
    return values
