from __future__ import annotations

import math
import threading
import time
from typing import Any, Literal, Optional, Union
from urllib.parse import urlencode

from pydantic import BaseModel, Field
from sqlalchemy import text

from app.config import settings
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.utils.logger import Logger

from servers.blindaje import Techo
from servers.estadisticas import TIPOS_NUMERICOS, _pedir, campos_de_capa
from servers.layers import resolver_consulta
from servers.resolve import _resolve_layer_fuzzy

GEOMETRIAS = ('geometry', 'point', 'linestring', 'polygon', 'curve', 'surface')
OPERADORES = {'=': '=', '!=': '<>', '>': '>', '>=': '>=', '<': '<', '<=': '<=', 'contiene': 'ILIKE'}
MAX_POR_PAGINA = 50
MAX_FILAS_ALCANZABLES = 5000
MAX_FILTROS = 5
MAX_COLUMNAS = 20
MAX_VALOR = 100
TTL_CAMPOS_S = 600.0

techo_tabla = Techo(por_minuto=60, por_dia=5000)


class FiltroTabla(BaseModel):
    campo: str = Field(max_length=64, description="Nombre crudo del campo, el de `columnas[].campo`.")
    op: Literal['=', '!=', '>', '>=', '<', '<=', 'contiene'] = Field(description="Comparación. 'contiene' busca texto sin distinguir mayúsculas.")
    valor: Union[float, str] = Field(description="Valor a comparar. Número para campos numéricos.")


_campos_cache: dict[str, tuple[float, dict[str, str]]] = {}
_candado = threading.Lock()


def es_geometria(tipo: str) -> bool:
    return any(g in tipo for g in GEOMETRIAS)


def campos_cacheados(base: str, gs_workspace: str, gs_layer: str) -> dict[str, str]:
    ahora = time.monotonic()
    with _candado:
        guardado = _campos_cache.get(gs_layer)
        if guardado and ahora - guardado[0] < TTL_CAMPOS_S:
            return guardado[1]
    campos = campos_de_capa(base, gs_workspace, gs_layer)
    with _candado:
        _campos_cache[gs_layer] = (ahora, campos)
    return campos


def texto_escapado(valor: Any) -> str:
    texto = str(int(valor)) if isinstance(valor, float) and valor.is_integer() else str(valor)
    if len(texto) > MAX_VALOR:
        raise ValueError(f"Un valor de filtro no puede pasar de {MAX_VALOR} caracteres.")
    return texto.replace("'", "''")


def literal(valor: Any, numerico: bool) -> str:
    if not numerico:
        return f"'{texto_escapado(valor)}'"
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        raise ValueError(f"'{valor}' no es un número.")
    if not math.isfinite(numero):
        raise ValueError(f"'{valor}' no es un número.")
    return str(int(numero)) if numero.is_integer() else repr(numero)


def validar_atributo(nombre: str, atributos: dict[str, str]) -> str:
    if nombre not in atributos:
        raise ValueError(f"La capa no tiene el campo '{nombre}'. Campos: {', '.join(sorted(atributos))}.")
    return nombre


def construir_filtros(filtros: list[dict], atributos: dict[str, str]) -> list[str]:
    if len(filtros) > MAX_FILTROS:
        raise ValueError(f"Máximo {MAX_FILTROS} filtros por consulta.")
    partes = []
    for filtro in filtros:
        campo = validar_atributo(filtro.get('campo') or '', atributos)
        op = filtro.get('op')
        if op not in OPERADORES:
            raise ValueError(f"Operador no válido: '{op}'. Usa uno de {', '.join(OPERADORES)}.")
        numerico = atributos[campo] in TIPOS_NUMERICOS
        if op == 'contiene':
            if numerico:
                raise ValueError(f"'contiene' solo aplica a campos de texto y '{campo}' es numérico.")
            patron = texto_escapado(filtro.get('valor'))
            partes.append(f"{campo} ILIKE '%{patron}%'")
        else:
            partes.append(f"{campo} {OPERADORES[op]} {literal(filtro.get('valor'), numerico)}")
    return partes


def configuracion_columnas(resuelta: dict) -> list[dict]:
    from app.services import columnas_service

    wms = resuelta['node'].get('wmsConfig') or {}
    capa = wms.get('metadataLayer') or resuelta['id']
    try:
        respuesta = columnas_service.get_columnas_response(resuelta.get('workspace') or '', capa)
    except Exception as exc:
        Logger.warning(f"layer_table.columnas_error layer={capa} {exc}")
        return []
    return (respuesta or {}).get('columnas') or []


def elegir_columnas(atributos: dict[str, str], configuracion: list[dict], pedidas: Optional[list[str]]) -> tuple[list[dict], int]:
    por_campo = {c.get('columna'): c for c in configuracion}
    if pedidas:
        nombres = [validar_atributo(n, atributos) for n in dict.fromkeys(pedidas)]
    else:
        visibles = [n for n in atributos if (por_campo.get(n) or {}).get('visible', True) is not False]
        indice = {n: i for i, n in enumerate(atributos)}
        nombres = sorted(visibles, key=lambda n: (por_campo.get(n) or {}).get('orden', indice[n]))
    omitidas = max(0, len(nombres) - MAX_COLUMNAS)
    columnas, vistas = [], set()
    for nombre in nombres[:MAX_COLUMNAS]:
        config = por_campo.get(nombre) or {}
        etiqueta = config.get('alias') or nombre
        if etiqueta in vistas:
            etiqueta = f"{etiqueta} ({nombre})"
        vistas.add(etiqueta)
        columnas.append({'campo': nombre, 'etiqueta': etiqueta, 'formato': config.get('formato')})
    return columnas, omitidas


def _coordenadas(geometria: Any) -> list:
    if not isinstance(geometria, dict):
        return []
    pila, puntos = [geometria.get('coordinates')], []
    while pila:
        actual = pila.pop()
        if isinstance(actual, list) and len(actual) >= 2 and all(isinstance(v, (int, float)) for v in actual[:2]):
            puntos.append(actual[:2])
        elif isinstance(actual, list):
            pila.extend(actual)
    return puntos


def centro(geometria: Any) -> Optional[tuple[float, float]]:
    puntos = _coordenadas(geometria)
    if not puntos:
        return None
    xs, ys = [p[0] for p in puntos], [p[1] for p in puntos]
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2


def a_lat_lon(centros: list[Optional[tuple[float, float]]]) -> list[Optional[dict]]:
    validos = [c for c in centros if c]
    if not validos:
        return [None] * len(centros)
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        filas = session.execute(text(
            "SELECT ST_Y(p) AS lat, ST_X(p) AS lon FROM ("
            "SELECT ord, ST_Transform(ST_SetSRID(ST_MakePoint(x, y), 6368), 4326) AS p "
            "FROM unnest(CAST(:xs AS float8[]), CAST(:ys AS float8[])) WITH ORDINALITY AS t(x, y, ord)"
            ") q ORDER BY ord"
        ), {'xs': [c[0] for c in validos], 'ys': [c[1] for c in validos]}).fetchall()
    convertidos = iter({'lat': round(f.lat, 5), 'lon': round(f.lon, 5)} for f in filas)
    return [next(convertidos) if c else None for c in centros]


def valor_de_celda(valor: Any, formato: Optional[str]) -> Any:
    if formato == 'anio' and isinstance(valor, str) and len(valor) >= 4 and valor[:4].isdigit():
        return int(valor[:4])
    return valor


def leer_filas(datos: dict, columnas: list[dict], con_coordenadas: bool) -> list[dict]:
    features = datos.get('features') or []
    filas = []
    for feature in features:
        propiedades = feature.get('properties') or {}
        filas.append({c['etiqueta']: valor_de_celda(propiedades.get(c['campo']), c['formato']) for c in columnas})
    if con_coordenadas:
        for fila, punto in zip(filas, a_lat_lon([centro(f.get('geometry')) for f in features])):
            fila['coordenadas'] = punto
    return filas


def _total(datos: dict) -> Optional[int]:
    for clave in ('numberMatched', 'totalFeatures'):
        if isinstance(datos.get(clave), int):
            return datos[clave]
    return None


def layer_table(
    layer: str,
    municipio: Optional[str] = None,
    year: Optional[str] = None,
    month: Optional[int] = None,
    filtros: Optional[list[dict]] = None,
    columnas: Optional[list[str]] = None,
    orden: Optional[str] = None,
    descendente: bool = False,
    pagina: int = 1,
    por_pagina: int = 20,
    coordenadas: bool = False,
) -> dict:
    por_pagina = max(1, min(por_pagina, MAX_POR_PAGINA))
    pagina = max(1, pagina)
    inicio = (pagina - 1) * por_pagina
    if inicio >= MAX_FILAS_ALCANZABLES:
        raise ValueError(f"La tabla solo llega a la fila {MAX_FILAS_ALCANZABLES}. Afina con filtros o cambia el orden.")

    resuelta = _resolve_layer_fuzzy(layer)
    if not resuelta:
        raise ValueError(f"No encontré la capa '{layer}'. Usa search_layers para ver ids válidos.")
    _, gs_workspace, gs_layer, partes = resolver_consulta(resuelta['id'], None, municipio, year, month)

    base = settings.GEOSERVER_URL.rstrip('/')
    campos = campos_cacheados(base, gs_workspace, gs_layer)
    atributos = {c: t for c, t in campos.items() if not es_geometria(t)}
    geometria = next((c for c, t in campos.items() if es_geometria(t)), None)
    partes = partes + construir_filtros(filtros or [], atributos)
    elegidas, omitidas = elegir_columnas(atributos, configuracion_columnas(resuelta), columnas)
    if not elegidas:
        raise ValueError(f"La capa '{resuelta['id']}' no tiene columnas de datos.")
    if orden:
        validar_atributo(orden, atributos)

    if not techo_tabla.consumir():
        raise ValueError('Se alcanzó el límite de consultas de tabla del sitio. Intenta en un minuto.')

    propiedades = [c['campo'] for c in elegidas]
    con_coordenadas = bool(coordenadas and geometria)
    if con_coordenadas:
        propiedades.append(geometria)
    params = {
        'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature', 'typeNames': gs_layer,
        'outputFormat': 'application/json', 'count': str(por_pagina), 'startIndex': str(inicio),
        'propertyName': ','.join(propiedades),
    }
    if con_coordenadas:
        params['srsName'] = 'EPSG:6368'
    params['sortBy'] = f"{orden or propiedades[0]} {'D' if orden and descendente else 'A'}"
    if partes:
        params['CQL_FILTER'] = ' AND '.join(partes)

    datos = _pedir('GET', f"{base}/{gs_workspace}/ows?{urlencode(params)}").json()
    total = _total(datos)
    alcanzables = min(total, MAX_FILAS_ALCANZABLES) if total is not None else None
    resultado = {
        'capa': resuelta['id'],
        'nombre': resuelta.get('label') or resuelta['id'],
        'total': total,
        'pagina': pagina,
        'paginas': math.ceil(alcanzables / por_pagina) if alcanzables else 0,
        'columnas': [{'campo': c['campo'], 'etiqueta': c['etiqueta']} for c in elegidas],
        'filas': leer_filas(datos, elegidas, con_coordenadas),
    }
    if omitidas:
        resultado['columnas_omitidas'] = omitidas
    if orden:
        resultado['orden'] = {'campo': orden, 'descendente': descendente}
    return resultado
