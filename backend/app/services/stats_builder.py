from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.stats_engine import (
    FILTER_OPS,
    MAX_FILTERS,
    MUNICIPIO_FIELD_TOKEN,
    OPERATIONS_WITHOUT_FIELD,
    _is_identifier,
    bind_layer_fields,
    build_query,
    build_receta,
    format_stat_value,
    load_layer_binding,
)

MAX_VALORES = 50
OPERACIONES_PUBLICAS = {
    'count': {'nombre': 'Contar registros', 'requiere_campo': False, 'tipos': None},
    'count_distinct': {'nombre': 'Contar valores distintos', 'requiere_campo': True, 'tipos': {'texto', 'numero', 'fecha'}},
    'sum': {'nombre': 'Sumar', 'requiere_campo': True, 'tipos': {'numero'}},
    'avg': {'nombre': 'Promediar', 'requiere_campo': True, 'tipos': {'numero'}},
    'min': {'nombre': 'Valor mínimo', 'requiere_campo': True, 'tipos': {'numero', 'fecha'}},
    'max': {'nombre': 'Valor máximo', 'requiere_campo': True, 'tipos': {'numero', 'fecha'}},
}
TIPOS_TEXTO = ('character varying', 'text', 'character', 'name')
TIPOS_NUMERO = ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision')
TIPOS_FECHA = ('date', 'timestamp')
PREFIJOS_COORDENADA = ('x_', 'y_', 'lat', 'lon', 'lng', 'coord')

_SQL_COLUMNAS = """
    SELECT a.attname,
           format_type(a.atttypid, a.atttypmod) AS tipo,
           COALESCE(s.n_distinct, 0) AS distintos,
           COALESCE(c.reltuples, 0) AS filas
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    LEFT JOIN pg_stats s ON s.schemaname = n.nspname AND s.tablename = c.relname AND s.attname = a.attname
    WHERE n.nspname = :esquema AND c.relname = :tabla AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY a.attnum
"""


def _familia(tipo: str) -> str | None:
    if tipo.startswith(TIPOS_TEXTO):
        return 'texto'
    if tipo.startswith(TIPOS_NUMERO):
        return 'numero'
    if tipo.startswith(TIPOS_FECHA):
        return 'fecha'
    return None


def _cardinalidad(distintos: float, filas: float) -> float:
    if distintos < 0:
        return abs(distintos) * max(filas, 0)
    return distintos


def _valores_de(session: Session, esquema: str, tabla: str, campo: str) -> list[str]:
    sql = (
        f'SELECT DISTINCT "{campo}" AS v FROM "{esquema}"."{tabla}" '
        f'WHERE "{campo}" IS NOT NULL ORDER BY 1 LIMIT {MAX_VALORES + 1}'
    )
    savepoint = session.begin_nested()
    try:
        filas = session.execute(text(sql)).fetchall()
        savepoint.commit()
    except Exception:
        savepoint.rollback()
        return []
    if len(filas) > MAX_VALORES:
        return []
    return [str(fila[0]) for fila in filas]


def _origen(stats_config: list | None) -> tuple[str, str] | None:
    for cfg in stats_config or []:
        if not isinstance(cfg, dict):
            continue
        esquema = cfg.get('schema')
        tabla = cfg.get('table')
        if _is_identifier(esquema) and _is_identifier(tabla):
            return esquema, tabla
    return None


def catalogo_de_capa(session: Session, layer_key: str, stats_config: list | None) -> dict | None:
    origen = _origen(stats_config)
    if origen is None:
        return None
    esquema, tabla = origen

    binding = load_layer_binding(session, layer_key) or {}
    campo_municipio = binding.get('municipio_field')

    campos = []
    for nombre, tipo, distintos, filas in session.execute(
        text(_SQL_COLUMNAS), {'esquema': esquema, 'tabla': tabla}
    ).fetchall():
        familia = _familia(tipo)
        if familia is None or nombre == campo_municipio:
            continue
        if nombre.lower().startswith(PREFIJOS_COORDENADA):
            continue
        item: dict[str, Any] = {'nombre': nombre, 'tipo': familia}
        if familia == 'texto':
            if _cardinalidad(float(distintos), float(filas)) > MAX_VALORES:
                continue
            item['valores'] = _valores_de(session, esquema, tabla, nombre)
            if len(item['valores']) < 2:
                continue
        campos.append(item)

    return {
        'esquema': esquema,
        'tabla': tabla,
        'campos': campos,
        'operaciones': [
            {'clave': clave, 'nombre': meta['nombre'], 'requiereCampo': meta['requiere_campo']}
            for clave, meta in OPERACIONES_PUBLICAS.items()
        ],
    }


def _filtros_validos(crudos: Any, por_nombre: dict) -> list[dict] | None:
    if not isinstance(crudos, list) or len(crudos) > MAX_FILTERS:
        return None
    limpios = []
    for item in crudos:
        if not isinstance(item, dict):
            return None
        campo = item.get('field')
        operador = item.get('op')
        if campo not in por_nombre or operador not in FILTER_OPS:
            return None
        limpios.append({'field': campo, 'op': operador, 'value': item.get('value')})
    return limpios


def calcular_personalizada(
    session: Session,
    layer_key: str,
    stats_config: list | None,
    definicion: dict,
    context: dict | None,
) -> dict | None:
    catalogo = catalogo_de_capa(session, layer_key, stats_config)
    if catalogo is None:
        return None

    operacion = definicion.get('operation')
    meta = OPERACIONES_PUBLICAS.get(operacion)
    if meta is None:
        return None

    por_nombre = {campo['nombre']: campo for campo in catalogo['campos']}
    campo = definicion.get('field')
    if meta['requiere_campo']:
        if campo not in por_nombre or por_nombre[campo]['tipo'] not in meta['tipos']:
            return None
    elif operacion in OPERATIONS_WITHOUT_FIELD:
        campo = None

    filtros = _filtros_validos(definicion.get('filters') or [], por_nombre)
    if filtros is None:
        return None

    cfg = {
        'operation': operacion,
        'schema': catalogo['esquema'],
        'table': catalogo['tabla'],
        'field': campo,
        'format': 'integer' if operacion.startswith('count') else 'decimal_2',
        'filters': [
            {'field': MUNICIPIO_FIELD_TOKEN, 'op': 'in', 'value': '{{municipio}}'},
            *filtros,
        ],
    }

    binding = load_layer_binding(session, layer_key)
    ligado = bind_layer_fields([cfg], binding)[0]

    construido = build_query(ligado, context)
    if construido is None:
        return None

    sql, params = construido
    savepoint = session.begin_nested()
    try:
        crudo = session.execute(text(sql), params).scalar()
        savepoint.commit()
    except Exception:
        savepoint.rollback()
        return None

    return {
        'valor': format_stat_value(crudo, ligado.get('format')),
        'nombre': definicion.get('label') or 'Mi estadística',
        'simbolo': definicion.get('symbol'),
        'receta': build_receta(ligado, context, session),
    }
