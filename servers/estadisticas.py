from __future__ import annotations

import re
import threading
import time
from typing import Any, Optional
from urllib.parse import quote, urlencode

import httpx

from app.config import settings
from app.utils.logger import Logger

from servers.blindaje import Techo
from servers.layers import resolver_consulta

TIPOS_NUMERICOS = frozenset({'number', 'decimal', 'double', 'float', 'int', 'integer', 'long', 'short'})
TIPOS_TEXTO = frozenset({'string'})
TTL_CACHE_S = 600.0
MAX_CACHE = 500
_TIMEOUT = 60.0

techo_wps = Techo(por_minuto=20, por_dia=500)

_cache: dict[tuple, tuple[float, dict]] = {}
_candado_cache = threading.Lock()


def _auth() -> Optional[tuple[str, str]]:
    if settings.GEOSERVER_USER and settings.GEOSERVER_PASSWORD:
        return (settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD)
    return None


def _pedir(metodo: str, url: str, **kwargs: Any) -> httpx.Response:
    try:
        with httpx.Client(timeout=_TIMEOUT, verify=settings.GEOSERVER_VERIFY_SSL) as cliente:
            respuesta = cliente.request(metodo, url, auth=_auth(), **kwargs)
        respuesta.raise_for_status()
        return respuesta
    except httpx.HTTPStatusError as exc:
        Logger.warning(f"layer_stats.geoserver_status status={exc.response.status_code}")
        raise ValueError(f"GeoServer respondió {exc.response.status_code}")
    except httpx.RequestError as exc:
        Logger.warning(f"layer_stats.geoserver_unreachable {exc}")
        raise ValueError('No se pudo conectar a GeoServer')


def tipo_local(propiedad: dict) -> str:
    tipo = propiedad.get('localType') or (propiedad.get('type') or '').split(':')[-1]
    return str(tipo).lower()


def campos_de_capa(base: str, gs_workspace: str, gs_layer: str) -> dict[str, str]:
    params = {
        'service': 'WFS', 'version': '2.0.0', 'request': 'DescribeFeatureType',
        'typeNames': gs_layer, 'outputFormat': 'application/json',
    }
    datos = _pedir('GET', f"{base}/{gs_workspace}/ows?{urlencode(params)}").json()
    propiedades = (datos.get('featureTypes') or [{}])[0].get('properties') or []
    return {p['name']: tipo_local(p) for p in propiedades if p.get('name')}


def validar_campo(nombre: Optional[str], campos: dict[str, str], tipos: frozenset, rol: str) -> Optional[str]:
    if not nombre:
        return None
    if campos.get(nombre) not in tipos:
        disponibles = sorted(c for c, t in campos.items() if t in tipos)
        raise ValueError(f"'{nombre}' no sirve como {rol}. Campos posibles: {', '.join(disponibles) or 'ninguno'}.")
    return nombre


def leer_numero_coincidencias(xml: str) -> Optional[int]:
    encontrado = re.search(r'numberMatched="(\d+)"', xml or '')
    return int(encontrado.group(1)) if encontrado else None


def contar(base: str, gs_workspace: str, gs_layer: str, cql: Optional[str]) -> Optional[int]:
    params = {'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature', 'typeNames': gs_layer, 'resultType': 'hits'}
    if cql:
        params['CQL_FILTER'] = cql
    return leer_numero_coincidencias(_pedir('GET', f"{base}/{gs_workspace}/ows?{urlencode(params)}").text)


def construir_agregado(gs_layer: str, campo: str, cql: Optional[str], agrupar: Optional[str]) -> str:
    href = f"http://geoserver/wfs?service=WFS&amp;version=1.0.0&amp;request=GetFeature&amp;typeName={gs_layer}"
    if cql:
        href += f"&amp;CQL_FILTER={quote(cql, safe='')}"
    literal = lambda clave, valor: (
        f'<wps:Input><ows:Identifier>{clave}</ows:Identifier>'
        f'<wps:Data><wps:LiteralData>{valor}</wps:LiteralData></wps:Data></wps:Input>'
    )
    funciones = ['Count'] if agrupar and agrupar == campo else ['Count', 'Sum', 'Average']
    entradas = ''.join(literal('function', f) for f in funciones)
    if agrupar:
        entradas += literal('groupByAttributes', agrupar)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<wps:Execute version="1.0.0" service="WPS" xmlns:wps="http://www.opengis.net/wps/1.0.0" '
        'xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">'
        '<ows:Identifier>gs:Aggregate</ows:Identifier><wps:DataInputs>'
        '<wps:Input><ows:Identifier>features</ows:Identifier>'
        f'<wps:Reference mimeType="text/xml; subtype=wfs-collection/1.0" xlink:href="{href}" method="GET"/></wps:Input>'
        f'{literal("aggregationAttribute", campo)}{entradas}{literal("singlePass", "true")}'
        '</wps:DataInputs><wps:ResponseForm><wps:RawDataOutput mimeType="application/json">'
        '<ows:Identifier>result</ows:Identifier></wps:RawDataOutput></wps:ResponseForm></wps:Execute>'
    )


def _numero(valor: Any) -> Optional[float]:
    return round(float(valor), 4) if isinstance(valor, (int, float)) and not isinstance(valor, bool) else None


def leer_agregado(datos: dict, agrupado: bool, top: int) -> dict:
    funciones = [f.lower() for f in datos.get('AggregationFunctions') or []]
    filas = datos.get('AggregationResults') or []
    nombres = {'count': 'conteo', 'sum': 'suma', 'average': 'promedio'}
    desplazamiento = 1 if agrupado else 0

    def fila_a_dict(fila: list) -> dict:
        salida = {}
        for indice, funcion in enumerate(funciones):
            valor = fila[indice + desplazamiento] if len(fila) > indice + desplazamiento else None
            salida[nombres.get(funcion, funcion)] = _numero(valor)
        return salida

    if not agrupado:
        return fila_a_dict(filas[0]) if filas else {}

    clases = [{'clase': str(fila[0]), **fila_a_dict(fila)} for fila in filas if fila and fila[0] is not None]
    clases.sort(key=lambda c: c.get('conteo') or 0, reverse=True)
    resto = clases[top:]
    return {
        'clases': clases[:top],
        'otras': {'clases': len(resto), 'conteo': sum(c.get('conteo') or 0 for c in resto)} if resto else None,
    }


def _desde_cache(clave: tuple) -> Optional[dict]:
    with _candado_cache:
        guardado = _cache.get(clave)
        if guardado and time.monotonic() - guardado[0] < TTL_CACHE_S:
            return guardado[1]
    return None


def _a_cache(clave: tuple, valor: dict) -> None:
    with _candado_cache:
        if len(_cache) >= MAX_CACHE:
            _cache.pop(next(iter(_cache)))
        _cache[clave] = (time.monotonic(), valor)


def layer_stats(
    layer: str,
    field: Optional[str] = None,
    group_by: Optional[str] = None,
    municipio: Optional[str] = None,
    year: Optional[str] = None,
    top: int = 10,
) -> dict:
    node, gs_workspace, gs_layer, partes = resolver_consulta(layer, municipio=municipio, year=year)
    cql = ' AND '.join(partes) if partes else None
    clave = (gs_layer, field, group_by, cql, top)
    guardado = _desde_cache(clave)
    if guardado is not None:
        return guardado

    base = settings.GEOSERVER_URL.rstrip('/')
    resultado: dict[str, Any] = {
        'layer': {'id': node.get('id') or layer, 'label': node.get('label')},
        'filtros': {k: v for k, v in (('municipio', municipio), ('year', year)) if v},
    }

    if field or group_by:
        campos = campos_de_capa(base, gs_workspace, gs_layer)
        campo = validar_campo(field, campos, TIPOS_NUMERICOS, 'campo numérico (field)')
        agrupar = validar_campo(group_by, campos, TIPOS_TEXTO, 'campo de clase (group_by)')
        if not techo_wps.consumir():
            raise ValueError('Se alcanzó el límite de cálculos por ahora. Intenta en unos minutos o pide solo el conteo.')
        cuerpo = construir_agregado(gs_layer, campo or agrupar, cql, agrupar)
        datos = _pedir('POST', f"{base}/ows", content=cuerpo.encode('utf-8'), headers={'Content-Type': 'text/xml'}).json()
        agregado = leer_agregado(datos, agrupado=bool(agrupar), top=top)
        if campo:
            resultado['campo'] = campo
        if agrupar:
            resultado['agrupado_por'] = agrupar
        resultado.update(agregado)

    if 'conteo' not in resultado:
        resultado['conteo'] = contar(base, gs_workspace, gs_layer, cql)

    _a_cache(clave, resultado)
    return resultado
