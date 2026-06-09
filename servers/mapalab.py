"""MapaLab MCP Server — servidor dedicado.

Servidor MCP del catalogo de capas geoespaciales del IIEG Jalisco. Sigue el
patron estandar de los servers MCP del ecosistema agent: FastMCP con tools
manuales decorados con @mcp.tool(), combined_app con health + /mcp,
stateless_http=True.

Reutiliza los servicios y repositorios del backend principal de MapaLab
(montados en /app/app/) en lugar de duplicar logica.

Convencion de identificadores: todos los tools que reciben una capa usan el
`id` del visor (el que devuelve search_layers). El workspace se resuelve solo
desde el arbol; nunca hace falta pasarlo.
"""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Literal, Optional

from fastapi import FastAPI
from fastmcp import FastMCP
from fastmcp.utilities.lifespan import combine_lifespans
from pydantic import Field

from app import metrics as metrics_module
from app.config import settings
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.services.access_logger import (
    access_flush_loop,
    get_logger as get_access_logger,
    _flush_sync as _flush_accesos,
)
from app.repositories.layers_repository import LayersRepository
from app.services import layer_metadata_service
from app.services.layer_tree_service import get_cached_state
from app.services.periodicity_service import PeriodicityService
from app.utils.logger import Logger

from servers.share_tools import (
    _acervo_base,
    _default_view,
    _resolve_layer_fuzzy,
    compare_years as _compare_years,
    create_single_share as _create_single_share,
    create_swipe_share as _create_swipe_share,
    describe_layer as _describe_layer,
    get_layer_stats as _get_layer_stats,
    list_municipios as _list_municipios,
    make_map as _make_map,
    measure_geometry as _measure_geometry,
    query_wfs as _query_wfs,
    resolve_municipios as _resolve_municipios,
    search_by_theme as _search_by_theme,
)
from servers.auth import (
    MCPAuthMiddleware,
    quota_flush_loop,
    quota_flush_pending_sync,
)
from servers.telemetry import (
    MCPTelemetryMiddleware,
    flush_loop as telemetry_flush_loop,
    flush_pending_sync as telemetry_flush_pending_sync,
)


mcp = FastMCP(
    name="mapalab",
    instructions="""Reglas del servidor MapaLab MCP:
1. IDENTIFICADORES: usa el `id` que devuelve search_layers. No inventes ids, slugs ni claves de municipio.
2. WORKSPACE: nunca lo pases; se resuelve solo desde el arbol.
3. FLUJO TIPICO: search_layers -> get_metadata / get_periodicity -> (municipios) -> create_single_share.
4. BASEMAPS: voyager, position, sin_mapalab. NO existe 'osm'.
5. FILTROS DE FECHA en shares: usa compare_years (capas temporales, dos anios) o el parametro `year`/`month` de query_wfs/get_layer_stats.
6. COORDENADAS: no las inventes. Usa query_wfs (limit bajo) para obtener geometrias reales.
7. Para modelos chicos: evita get_layer_tree (muy grande). Prefiere describe_layer en vez de 3 llamadas separadas. Usa make_map para entregas rapidas."""
)


def _flatten_tree(tree: list[dict]) -> dict[str, dict]:
    index: dict[str, dict] = {}

    def walk(nodes: list[dict], parent_path: list[str]) -> None:
        for node in nodes:
            path = parent_path + [node['label']]
            index[node['id']] = {'node': node, 'path': path}
            children = node.get('children') or []
            if children:
                walk(children, path)

    walk(tree, [])
    return index


def _resolve_layer(layer_id: str) -> Optional[dict]:
    entry = _flatten_tree(get_cached_state()['tree']).get(layer_id)
    if not entry:
        return None
    node = entry['node']
    wms = node.get('wmsConfig') or {}
    return {
        'id': layer_id,
        'label': node.get('label'),
        'workspace': wms.get('workspace'),
        'geoserver_workspace': wms.get('geoserverWorkspace'),
        'geoserver_layer': wms.get('geoserverLayer'),
        'path': ' > '.join(entry['path'][:-1]) if entry['path'][:-1] else None,
        'node': node,
    }


def _to_layer_keys(layers: str) -> list[str]:
    keys: list[str] = []
    for token in (layers or '').split(','):
        token = token.strip()
        if not token:
            continue
        if ':' in token:
            keys.append(token)
            continue
        info = _resolve_layer(token)
        if info and info.get('workspace'):
            keys.append(f"{info['workspace']}:{token}")
        elif info:
            fuzzy = _resolve_layer_fuzzy(token)
            if fuzzy and fuzzy.get('id'):
                ws = fuzzy.get('geoserver_workspace') or fuzzy.get('workspace') or ''
                if ws:
                    keys.append(f"{ws}:{fuzzy['id']}")
                else:
                    keys.append(fuzzy['id'])
            else:
                keys.append(token)
        else:
            fuzzy = _resolve_layer_fuzzy(token)
            if fuzzy and fuzzy.get('id'):
                ws = fuzzy.get('geoserver_workspace') or fuzzy.get('workspace') or ''
                if ws:
                    keys.append(f"{ws}:{fuzzy['id']}")
                else:
                    keys.append(fuzzy['id'])
            else:
                keys.append(token)
    return list(dict.fromkeys(keys))


@mcp.tool()
def search_layers(
    query: str = Field(default='', description="Texto, id o slug a buscar. Ej: 'homicidio', 'poblacion', 'tasa_homicidio_doloso'. Dejar vacio si solo se filtra por theme."),
    theme: str = Field(default='', description="Area tematica del visor para listar todas sus capas. Ej: 'seguridad', 'salud', 'economia', 'demografia'. Dejar vacio para buscar en todos los temas."),
    limit: int = Field(default=20, ge=1, le=200, description='Maximo de resultados a devolver.'),
):
    """Encuentra capas del visor. SIEMPRE empieza por aqui: casi todos los demas tools necesitan el `id` que este devuelve.

    Acepta tres modos (combinables):
    - por texto/id/slug en `query`
    - por area tematica completa en `theme`
    - ambos: filtra las capas del tema por el texto

    Devuelve una lista de objetos {id, label, slug, workspace, path}. Usa el
    campo `id` en get_metadata, get_periodicity, query_wfs, get_layer_stats,
    create_single_share, create_swipe_share y compare_years.

    Ejemplos:
    1) Por nombre:        search_layers(query="homicidio")
    2) Tema completo:     search_layers(theme="seguridad")
    3) Tema + filtro:     search_layers(theme="salud", query="mortalidad")
    """
    q = (query or '').strip()
    th = (theme or '').strip()
    if not q and not th:
        return {'error': "Pasa 'query' (texto o id) o 'theme' (area). Ej: search_layers(query=\"homicidio\") o search_layers(theme=\"seguridad\")."}

    index = _flatten_tree(get_cached_state()['tree'])
    results: list[dict] = []
    seen: set[str] = set()

    def add(layer_id: str) -> None:
        if layer_id in seen:
            return
        entry = index.get(layer_id)
        if not entry:
            return
        node = entry['node']
        wms = node.get('wmsConfig') or {}
        path = entry['path'][:-1]
        seen.add(layer_id)
        results.append({
            'id': layer_id,
            'label': node.get('label'),
            'slug': node.get('slug'),
            'workspace': wms.get('workspace'),
            'path': ' > '.join(path) if path else None,
        })

    if th:
        needle = q.lower()
        for item in _search_by_theme(theme=th, limit=200):
            haystack = f"{item.get('label', '')} {item.get('id', '')}".lower()
            if not needle or needle in haystack:
                add(item['id'])
    else:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            for row in LayersRepository.search_layers(session, q, limit=limit):
                add(row.id)
            ref = LayersRepository.find_layer_by_slug_or_alias(session, q)
            if ref is not None:
                add(ref.id)

    return results[:limit]


@mcp.tool()
def get_layer_tree():
    """Devuelve el catalogo completo del visor: el arbol jerarquico y la lista de workspaces.

    Usalo cuando necesites la estructura entera (temas -> categorias -> capas
    hoja con `wmsConfig`) o el mapeo alias<->workspace, no para buscar una capa
    suelta (para eso usa search_layers).

    Si tu modelo es chico, NO uses este tool: la respuesta es muy grande.
    Usa search_layers (query o theme), que devuelve solo lo necesario.

    Devuelve {tree, workspaces, etag}. La cache se refresca a diario (04:00);
    el `etag` sirve para detectar cambios.

    Ejemplos:
    1) Arbol completo:      get_layer_tree()
    2) Ver workspaces:      get_layer_tree() -> campo "workspaces"
    3) Cache-busting:       comparar el "etag" entre dos llamadas
    """
    state = get_cached_state()
    return {'tree': state['tree'], 'workspaces': state['workspaces'], 'etag': state['etag']}


@mcp.tool()
def get_initial_order():
    """Devuelve los `id` de las capas que el visor activa al cargar sin parametros.

    Sirve para reproducir la vista por defecto del visor.

    Ejemplos:
    1) Capas iniciales:     get_initial_order()
    2) Cuantas hay:         len(get_initial_order())
    3) Primera capa activa: get_initial_order()[0]
    """
    return get_cached_state()['initial_order']


@mcp.tool()
def get_metadata(
    layer: str = Field(description="Id de la capa (el que devuelve search_layers). Ej: 'homicidio_doloso'. Si tu modelo es chico, usa describe_layer en vez de este + get_periodicity + get_layer_stats."),
    workspace: str = Field(default='', description='Opcional. Solo si quieres forzar un workspace distinto al del arbol; normalmente se deja vacio.'),
):
    """Devuelve la metadata completa de una capa: descripcion, metodologia, fuentes, periodicidad, si es descargable y URLs de archivos en Acervo.

    Pasa solo el `id` de search_layers; el workspace se resuelve solo.
    Se aceptan ids difusos (slug, alias, nombre parcial), no solo el id exacto.

    Ejemplos:
    1) Metadata de una capa:   get_metadata(layer="homicidio_doloso")
    2) Tras buscar:            search_layers(query="poblacion") -> get_metadata(layer="poblacion")
    3) Forzar workspace:       get_metadata(layer="homicidio_doloso", workspace="seguridad")
    """
    ws = (workspace or '').strip()
    info = _resolve_layer(layer)
    if not info:
        fuzzy = _resolve_layer_fuzzy(layer)
        if fuzzy:
            info = fuzzy
            layer = fuzzy['id']
    if not ws and info and info.get('workspace'):
        ws = info['workspace']
    if not ws:
        return {'error': f"No encontre la capa '{layer}'. Usa search_layers para obtener un id valido."}
    modern = layer_metadata_service.get_metadata_response(ws, layer, _acervo_base())
    return [modern] if modern else []


@mcp.tool()
def get_sources_batch(
    layers: str = Field(description="Uno o varios id de capa separados por coma. Ej: 'homicidio_doloso,poblacion'. Si tu modelo es chico, pide lotes de pocas capas a la vez."),
):
    """Devuelve las fuentes (organismo, anio, URL) de varias capas en una sola llamada.

    Mas eficiente que llamar get_metadata por cada capa cuando solo necesitas
    la atribucion. Para modelos chicos, pide pocas capas por llamada (1-3).

    Ejemplos:
    1) Una capa:     get_sources_batch(layers="homicidio_doloso")
    2) Varias:       get_sources_batch(layers="homicidio_doloso,poblacion,tasa_violacion")
    3) Atribucion de las capas activas: get_sources_batch(layers=",".join(get_initial_order()))
    """
    keys = _to_layer_keys(layers)
    try:
        return layer_metadata_service.get_sources_batch(keys)
    except Exception as exc:
        Logger.error(f'get_sources_batch.error {exc}')
        return []


@mcp.tool()
def get_periodicity(
    layers: str = Field(description="Uno o varios id de capa separados por coma. Ej: 'homicidio_doloso' o 'homicidio_doloso,tasa_feminicidio'."),
):
    """Devuelve las fechas disponibles de capas temporales, agrupadas year/month/day.

    Devuelve {periodicity: {id_capa: {year: {month: [day, ...]}}}}. Si una capa
    no tiene dimension temporal, su entrada va vacia ({}).

    Para usar un anio en un share, arma el filtro CQL asi y pasalo en `filters`:
      {"date": "(fecha >= 'AAAA-01-01' AND fecha < 'AAAA+1-01-01')"}

    Ejemplos:
    1) Una capa:    get_periodicity(layers="homicidio_doloso")
    2) Varias:      get_periodicity(layers="homicidio_doloso,tasa_feminicidio")
    3) Antes de un share temporal: get_periodicity(layers="precipitacion") para saber que meses existen
    """
    keys = _to_layer_keys(layers)
    if not keys:
        return {'error': "Pasa al menos un id de capa. Ej: get_periodicity(layers=\"homicidio_doloso\")."}
    raw = PeriodicityService.get_periodicities_batch(keys)
    out = {}
    for key, value in (raw or {}).items():
        short = key.split(':')[-1]
        out[short] = value
    return {'periodicity': out}


@mcp.tool()
def measure_geometry(
    geometry: dict = Field(description="Geometria GeoJSON en EPSG:4326 (lon,lat). type: LineString, Polygon o MultiPolygon. Maximo 2000 coordenadas."),
):
    """Calcula la longitud (LineString) o el area (Polygon/MultiPolygon) geodesica real sobre el elipsoide WGS84.

    Usa PostGIS ::geography, asi los metros / metros cuadrados son reales (no
    proyectados). Devuelve {type, metric, value, unit, value_km|value_km2}.

    Ejemplos:
    1) Distancia entre 2 puntos: measure_geometry(geometry={"type":"LineString","coordinates":[[-103.35,20.67],[-103.41,20.72]]})
    2) Area de un poligono:      measure_geometry(geometry={"type":"Polygon","coordinates":[[[-103.4,20.6],[-103.3,20.6],[-103.3,20.7],[-103.4,20.7],[-103.4,20.6]]]})
    3) Area multi:               measure_geometry(geometry={"type":"MultiPolygon","coordinates":[...]})
    """
    try:
        return _measure_geometry(geometry)
    except ValueError as exc:
        return {'error': str(exc)}


@mcp.tool()
def query_wfs(
    layer: str = Field(description="Id de la capa (el que devuelve search_layers). Ej: 'homicidio_doloso'."),
    cql_filter: Optional[str] = Field(default=None, description="Filtro CQL avanzado. No combines con municipio/year/month; usa uno u otro."),
    limit: int = Field(default=1000, ge=1, le=10000, description='Maximo de features a devolver (1-10000). Para modelos chicos usa limit bajo (ej. 10).'),
    srs_name: Optional[Literal['EPSG:4326', 'EPSG:6368']] = Field(default=None, description="SRS de salida. 'EPSG:4326'=lat/lon, 'EPSG:6368'=metros (CRS nativo)."),
    workspace: str = Field(default='', description='Opcional. Normalmente se deja vacio; se resuelve desde el arbol.'),
    municipio: Optional[str] = Field(default=None, description="Nombre o clave de municipio para filtrar. Ej: 'Guadalajara' o '14039'. Usa municipios() para buscar."),
    year: Optional[str] = Field(default=None, description="Anio de 4 digitos para filtrar por fecha. Ej: '2024'."),
    month: Optional[int] = Field(default=None, ge=1, le=12, description="Mes (1-12) para afinar el filtro de fecha. Solo vale si tambien pasas 'year'."),
):
    """Consulta los features (registros geograficos) reales de una capa del visor via WFS.

    Devuelve GeoJSON con todas las propiedades de cada feature. Con `limit`
    alto la respuesta es grande; si tu modelo es chico, usa `limit` bajo
    (p. ej. 10) o get_layer_stats para un resumen en vez de los features
    crudos.

    Ahora podes filtrar sin escribir CQL: usa `municipio` (nombre/clave),
    `year` y `month`. El servidor arma el CQL por vos. Si pasas `cql_filter`,
    no combines con estos parametros.

    Ejemplos:
    1) Pocos features:        query_wfs(layer="homicidio_doloso", limit=5)
    2) Filtrado por municipio: query_wfs(layer="homicidio_doloso", municipio="Guadalajara")
    3) Filtrado por anio:     query_wfs(layer="homicidio_doloso", year="2024", limit=10)
    4) Con mes:               query_wfs(layer="precipitacion", year="2024", month=6, limit=10)
    5) En lat/lon:            query_wfs(layer="homicidio_doloso", limit=10, srs_name="EPSG:4326")
    """
    try:
        return _query_wfs(
            layer=layer,
            cql_filter=cql_filter,
            limit=limit,
            srs_name=srs_name,
            workspace=(workspace or None),
            municipio=municipio,
            year=year,
            month=month,
        )
    except ValueError as exc:
        return {'error': str(exc)}


@mcp.tool()
def municipios(
    query: str = Field(default='', description="Texto o clave parcial a buscar. Ej: 'guadalajara', 'zapopan', '14'. Vacio = devuelve los 125 municipios."),
    limit: int = Field(default=50, ge=1, le=200, description='Maximo de resultados cuando hay query.'),
):
    """Lista o busca municipios de Jalisco con su clave INEGI de 5 digitos.

    Vacio devuelve los 125 municipios; con texto filtra por nombre o clave
    (case-insensitive, substring). Las claves se usan en
    create_single_share(municipios=...) y create_swipe_share(municipios=...).

    Devuelve {items: [{clave, nombre, region, areaKm2, areaHa}], count}.

    Ejemplos:
    1) Todos:           municipios()
    2) Por nombre:      municipios(query="guadalajara")
    3) Por prefijo INEGI: municipios(query="140")
    """
    q = (query or '').strip()
    if not q:
        return _list_municipios()
    matches = _resolve_municipios(query=q, limit=limit)
    return {'items': matches, 'count': len(matches)}


@mcp.tool()
def create_single_share(
    layers: list = Field(description="Capas a mostrar. Lista de id (string) u objetos {slug, opacity?, visible?, filters?}. El 'slug' es el id de search_layers."),
    view: Optional[dict] = Field(default=None, description="Vista inicial: {zoom, lat, lon, rotation?}. Si no la pasas, se calcula una por defecto (auto-encuadre)."),
    basemap: Optional[Literal['voyager', 'position', 'sin_mapalab']] = Field(default=None, description="Basemap inicial: 'voyager' (recomendado), 'position', 'sin_mapalab'. NO existe 'osm'."),
    selected: Optional[str] = Field(default=None, description='Id de la capa seleccionada para mostrar su simbologia.'),
    annotations: Optional[list] = Field(default=None, description="Anotaciones GeoJSON EPSG:4326. Cada item: {id, type ('LineString'|'Polygon'|'Text'|'Emoji'), geometry, label?, value?, unit?, textLabel?, size?, fillColor?, strokeColor?}."),
    municipios: Optional[dict] = Field(default=None, description="Modo Vista por municipio: {source: 'iieg'|'inegi', selected: ['14039', ...]}. Las claves vienen del tool municipios. Si pasas esto y no pasas view, se auto-encuadra a esos municipios."),
):
    """Crea un mapa compartible (share) del visor y devuelve {id, kind, url, embed_html}.

    Es el camino recomendado para ENTREGAR un mapa interactivo al usuario en
    vez de solo describirlo. El `embed_html` es un snippet listo para pegar.
    Si no pasas `view`, se auto-encuadra (Jalisco por defecto; o a los
    municipios seleccionados si los pasaste).

    Para filtrar por fecha, agrega `filters` al objeto de la capa:
      {"slug": "homicidio_doloso", "filters": {"date": "(fecha >= '2025-01-01' AND fecha < '2026-01-01')"}}
    (usa get_periodicity primero para saber que anios hay).

    Ejemplos:
    1) Una capa (auto-vista):  create_single_share(layers=["homicidio_doloso"])
    2) Vista explicita:        create_single_share(layers=["homicidio_doloso"], view={"zoom":9,"lat":20.6,"lon":-103.4})
    3) Por municipio:          create_single_share(layers=["homicidio_doloso"], municipios={"source":"iieg","selected":["14039","14120"]})
    4) Con anotacion:          create_single_share(layers=["homicidio_doloso"], annotations=[{"id":"a1","type":"Polygon","geometry":{...},"label":"Zona"}])
    """
    return _create_single_share(
        layers=layers,
        view=view,
        basemap=basemap,
        selected=selected,
        annotations=annotations,
        municipios=municipios,
    )


@mcp.tool()
def create_swipe_share(
    pane_a_layers: list = Field(description='Capas del lado A (lista de id u objetos {slug, opacity?, filters?}).'),
    pane_b_layers: list = Field(description='Capas del lado B (lista de id u objetos {slug, opacity?, filters?}).'),
    position: float = Field(default=0.5, ge=0.05, le=0.95, description='Posicion inicial del separador (0=todo B, 1=todo A).'),
    view: Optional[dict] = Field(default=None, description='Vista compartida: {zoom, lat, lon}. Si no la pasas, se auto-encuadra.'),
    basemap: Optional[Literal['voyager', 'position', 'sin_mapalab']] = Field(default=None, description="Basemap compartido: 'voyager' (recomendado), 'position', 'sin_mapalab'. NO existe 'osm'."),
    label_a: str = Field(default='A', description='Etiqueta del lado A.'),
    label_b: str = Field(default='B', description='Etiqueta del lado B.'),
    annotations: Optional[list] = Field(default=None, description='Anotaciones globales (visibles en ambos lados). GeoJSON EPSG:4326.'),
    municipios: Optional[dict] = Field(default=None, description="Modo Vista por municipio compartido: {source, selected}. Si no pasas view, se auto-encuadra."),
):
    """Crea un mapa comparativo A|B (swipe) y devuelve {id, kind, url, embed_html}.

    El visor abre con una barra arrastrable: cada lado renderiza su set de
    capas. Util para comparar dos fenomenos o dos estados. Las anotaciones y el
    modo municipio son globales (se aplican a ambos lados).

    Para comparar la MISMA capa en dos anios, usa mejor compare_years.

    Ejemplos:
    1) Dos capas:       create_swipe_share(pane_a_layers=["homicidio_doloso"], pane_b_layers=["poblacion"], label_a="Homicidio", label_b="Poblacion")
    2) Separador a 30%: create_swipe_share(pane_a_layers=["a"], pane_b_layers=["b"], position=0.3)
    3) Por municipio:   create_swipe_share(pane_a_layers=["a"], pane_b_layers=["b"], municipios={"source":"iieg","selected":["14039"]})
    """
    return _create_swipe_share(
        pane_a_layers=pane_a_layers,
        pane_b_layers=pane_b_layers,
        position=position,
        view=view,
        basemap=basemap,
        label_a=label_a,
        label_b=label_b,
        annotations=annotations,
        municipios=municipios,
    )


@mcp.tool()
def compare_years(
    layer: str = Field(description="Id de la capa (el que devuelve search_layers). Ej: 'homicidio_doloso'. Se aceptan ids difusos (slug, alias, nombre parcial)."),
    year_a: str = Field(description="Primer anio, 4 digitos. Ej: '2025'."),
    year_b: str = Field(description="Segundo anio, 4 digitos. Ej: '2024'."),
    municipio: Optional[str] = Field(default=None, description="Nombre del municipio para filtrar ambos lados (opcional). Ej: 'Guadalajara'."),
    view: Optional[dict] = Field(default=None, description="Vista inicial: {zoom, lat, lon}. Si no la pasas, se auto-encuadra."),
    basemap: Literal['voyager', 'position', 'sin_mapalab'] = Field(default='voyager', description="Basemap: 'voyager', 'position' o 'sin_mapalab'. NO existe 'osm'."),
):
    """Atajo: crea un swipe A|B de UNA capa comparando dos anios y devuelve {id, kind, url, embed_html}.

    Arma solo los filtros de fecha (que el agente suele equivocar) y, si das
    `municipio`, lo resuelve y filtra ambos lados. Equivale a get_periodicity +
    create_swipe_share pero en un paso.

    Ejemplos:
    1) Dos anios:        compare_years(layer="homicidio_doloso", year_a="2024", year_b="2023")
    2) En un municipio:  compare_years(layer="homicidio_doloso", year_a="2024", year_b="2023", municipio="Guadalajara")
    3) Vista fijada:     compare_years(layer="homicidio_doloso", year_a="2025", year_b="2024", view={"zoom":8,"lat":20.6,"lon":-103.4})
    """
    try:
        return _compare_years(
            layer=layer,
            year_a=year_a,
            year_b=year_b,
            municipio=municipio,
            view=view,
            basemap=basemap,
        )
    except ValueError as exc:
        return {'error': str(exc)}


@mcp.tool()
def get_layer_stats(
    layer: str = Field(description="Id de la capa (el que devuelve search_layers). Ej: 'homicidio_doloso'. Se aceptan ids difusos (slug, alias, nombre parcial)."),
):
    """Devuelve la numeralia precalculada de una capa: totales, promedios, ranking.

    Los datos vienen de mapalab.layer_stats (refresco diario). Devuelve
    {layer_id, label, stats: [{label, value, unit?}]}. Si no hay datos, stats
    es lista vacia.

    Ejemplos:
    1) Numeralia:       get_layer_stats(layer="homicidio_doloso")
    2) Tras buscar:     search_layers(query="poblacion") -> get_layer_stats(layer="poblacion")
    3) Solo totales:    get_layer_stats(layer="homicidio_doloso")["stats"]
    """
    try:
        return _get_layer_stats(layer=layer)
    except ValueError as exc:
        return {'error': str(exc)}


@mcp.tool()
def describe_layer(
    layer: str = Field(description="Id de la capa (el que devuelve search_layers). Soporta ids difusos: slug, alias o nombre parcial. Ej: 'homicidio', 'homicidio_doloso'."),
):
    """Macro: devuelve metadata + stats + periodicity de una capa en una sola llamada.

    Ideal para modelos chicos: combina get_metadata + get_layer_stats +
    get_periodicity en un solo round-trip. Soporta ids difusos (busca por slug,
    alias o nombre parcial, no solo id exacto).

    Devuelve {id, label, metadata, stats, periodicity}.

    Ejemplos:
    1) Todo junto:        describe_layer("homicidio_doloso")
    2) Con id difuso:     describe_layer("homicidio")
    3) Solo stats:        describe_layer("homicidio_doloso")["stats"]
    """
    return _describe_layer(layer=layer)


@mcp.tool()
def make_map(
    query: str = Field(description="Texto para buscar la capa. Ej: 'homicidios en Guadalajara', 'poblacion', 'carencia'. Requerido a menos que pases theme."),
    municipio: Optional[str] = Field(default=None, description="Nombre del municipio para filtrar. Ej: 'Guadalajara', 'Zapopan'. El mapa se auto-encuadra a este municipio."),
    year: Optional[str] = Field(default=None, description="Anio de 4 digitos para filtrar capas temporales. Ej: '2024'."),
    theme: str = Field(default='', description="Area tematica alternativa a query. Ej: 'seguridad', 'salud'. Se usa la mejor capa del tema."),
):
    """Macro: busca una capa y crea un share en un solo paso. Devuelve {id, url, embed_html, layer}.

    Flujo interno: search_layers(query) -> mejor capa -> create_single_share
    con filtros opcionales (municipio/year) y auto-encuadre. Error accionable
    si no encuentra capa.

    Ideal para entregas rapidas: el usuario pide un mapa de algo y este tool
    lo resuelve completo sin pasos intermedios.

    Ejemplos:
    1) Con query:              make_map(query="homicidios en Guadalajara 2024")
    2) Con municipio + anio:   make_map(query="homicidio_doloso", municipio="Guadalajara", year="2024")
    3) Por tema:               make_map(theme="seguridad", municipio="Zapopan")
    """
    return _make_map(query=query, municipio=municipio, year=year, theme=theme)


@asynccontextmanager
async def lifespan(server_app: FastAPI):
    try:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            from sqlalchemy import text as _text
            session.execute(_text('SELECT 1'))
        Logger.info('mapalab-mcp database pool warmed up')
    except Exception as exc:
        Logger.warning(f'mapalab-mcp warmup_error {exc}')

    flush_task = asyncio.create_task(telemetry_flush_loop())
    quota_task = asyncio.create_task(quota_flush_loop())
    access_task = asyncio.create_task(access_flush_loop())
    try:
        yield
    finally:
        for task in (flush_task, quota_task, access_task):
            task.cancel()
        for task in (flush_task, quota_task, access_task):
            try:
                await task
            except asyncio.CancelledError:
                pass
        try:
            await asyncio.to_thread(telemetry_flush_pending_sync)
        except Exception:
            pass
        try:
            await asyncio.to_thread(quota_flush_pending_sync)
        except Exception:
            pass
        try:
            await asyncio.to_thread(_flush_accesos, get_access_logger().drain())
        except Exception:
            pass


_admin_app = FastAPI(title='MapaLab MCP Server')


@_admin_app.get('/')
def root():
    return {'service': 'MapaLab MCP Server', 'mcp': '/mcp'}


@_admin_app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@_admin_app.get('/metrics', include_in_schema=False)
async def metrics():
    return await metrics_module.metrics()


mcp_app = mcp.http_app(path='/mcp', stateless_http=True)


app = FastAPI(
    title='MapaLab MCP Server',
    routes=[*_admin_app.routes, *mcp_app.routes],
    lifespan=combine_lifespans(lifespan, mcp_app.lifespan),
)
app.add_middleware(MCPTelemetryMiddleware, path_prefix='/mcp')
app.add_middleware(MCPAuthMiddleware, path_prefix='/mcp')

if __name__ == "__main__":
    mcp.run()
