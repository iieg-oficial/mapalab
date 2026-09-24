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

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.services.access_logger import (
    access_flush_loop,
    get_logger as get_access_logger,
    _flush_sync as _flush_accesos,
)
from app.repositories.layers_repository import LayersRepository
from app.services.layer_tree_service import get_cached_state
from app.utils.logger import Logger

from servers.resolve import (
    list_municipios as _list_municipios,
    resolve_municipios as _resolve_municipios,
    search_by_theme as _search_by_theme,
)
from servers.layers import describe_layer as _describe_layer
from servers.tabla import FiltroTabla, layer_table as _layer_table
from servers.estadisticas import layer_stats as _layer_stats
from servers.shares import (
    create_map as _create_map,
    create_swipe as _create_swipe,
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
3. FLUJO TIPICO: search_layers -> describe_layer -> (municipios) -> create_map / create_swipe.
4. BASEMAPS: voyager, position, sin_mapalab. NO existe 'osm'.
5. FILTROS DE FECHA en shares: usa create_swipe en modo anios (layer + year_a + year_b) o el parametro `year` de create_map. Los anios disponibles de una capa salen en describe_layer.periodicidad.
6. COORDENADAS: no las inventes. Usa layer_table con coordenadas=True y por_pagina bajo para obtener puntos reales.
7. Para modelos chicos: usa describe_layer para todo lo de una capa (cualidades + metadata + numeralia + periodicidad en una llamada) y create_map para entregas rapidas.
8. CIFRAS: para contar, sumar, promediar o repartir por clase usa layer_stats; no pagines layer_table para calcular."""
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
    campo `id` en describe_layer, layer_table, layer_stats, create_map y create_swipe.

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
def layer_table(
    layer: str = Field(description="Id de la capa (el que devuelve search_layers). Ej: 'homicidio_doloso'."),
    municipio: Optional[str] = Field(default=None, description="Nombre o clave de municipio. Ej: 'Guadalajara' o '14039'. Usa municipios() para buscar."),
    year: Optional[str] = Field(default=None, description="Anio de 4 digitos. Ej: '2024'."),
    month: Optional[int] = Field(default=None, ge=1, le=12, description="Mes (1-12). Solo vale con 'year'."),
    filtros: Optional[list[FiltroTabla]] = Field(default=None, max_length=5, description="Hasta 5 condiciones sobre campos de la capa, unidas con AND."),
    columnas: Optional[list[str]] = Field(default=None, max_length=20, description="Campos a mostrar, por su nombre crudo. Vacio = las columnas configuradas del visor."),
    orden: Optional[str] = Field(default=None, max_length=64, description="Campo por el que se ordena."),
    descendente: bool = Field(default=False, description="Orden de mayor a menor."),
    pagina: int = Field(default=1, ge=1, le=250, description="Pagina a devolver, desde 1."),
    por_pagina: int = Field(default=20, ge=1, le=50, description="Filas por pagina (1-50)."),
    coordenadas: bool = Field(default=False, description="Agrega a cada fila un punto {lat, lon} del elemento."),
):
    """Tabla de datos de una capa: filas con los nombres de columna legibles del visor, filtrables, ordenables y paginadas.

    Devuelve {capa, nombre, total, pagina, paginas, columnas: [{campo, etiqueta}], filas}.
    Las filas usan la `etiqueta` como llave. Filtra con `columnas[].campo`.
    La tabla llega hasta la fila 5000: para totales, sumas o repartos usa layer_stats.

    Ejemplos:
    1) Primeras filas:  layer_table(layer="homicidio_doloso")
    2) Por municipio:   layer_table(layer="escuelas", municipio="Zapopan", year="2024")
    3) Filtro y orden:  layer_table(layer="escuelas", filtros=[{"campo": "nivel", "op": "=", "valor": "Primaria"}], orden="matricula", descendente=True)
    4) Para anotar:     layer_table(layer="hospitales", municipio="Guadalajara", por_pagina=5, coordenadas=True)
    """
    try:
        return _layer_table(
            layer=layer,
            municipio=municipio,
            year=year,
            month=month,
            filtros=[f.model_dump() for f in filtros or []],
            columnas=columnas,
            orden=orden,
            descendente=descendente,
            pagina=pagina,
            por_pagina=por_pagina,
            coordenadas=coordenadas,
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
    create_map(municipio=...) y create_swipe(municipio=...).

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
def create_map(
    query: str = Field(default='', description="Modo busqueda: texto para elegir la mejor capa. Ej: 'homicidios en Guadalajara', 'poblacion'. Usa esto O 'layers', no ambos."),
    layers: Optional[list] = Field(default=None, description="Modo directo: capas ya resueltas. Lista de id (string) u objetos {slug, opacity?, visible?, filters?}. Usa esto O 'query'."),
    municipio: Optional[str] = Field(default=None, description="Nombre del municipio para filtrar y auto-encuadrar. Ej: 'Guadalajara'."),
    year: Optional[str] = Field(default=None, description="Anio de 4 digitos para capas temporales. Ej: '2024'. Se valida contra la periodicidad de la capa."),
    theme: str = Field(default='', description="Modo busqueda alternativo a query: area tematica. Ej: 'seguridad'. Se usa la mejor capa del tema."),
    view: Optional[dict] = Field(default=None, description="Vista inicial {zoom, lat, lon, rotation?}. Si la omites, se auto-encuadra (a los municipios si los das, o a Jalisco)."),
    basemap: Optional[Literal['voyager', 'position', 'sin_mapalab']] = Field(default=None, description="Basemap: 'voyager' (recomendado), 'position', 'sin_mapalab'. NO existe 'osm'."),
    selected: Optional[str] = Field(default=None, description='Id de la capa seleccionada para mostrar su simbologia.'),
    annotations: Optional[list] = Field(default=None, description="Anotaciones GeoJSON EPSG:4326. Cada item: {id, type ('LineString'|'Polygon'|'Text'|'Emoji'), geometry, label?, value?, unit?, textLabel?}."),
):
    """Crea un mapa (un panel) y devuelve {id, kind, url, embed_html, layer?}.

    Es la tool para ENTREGAR un mapa interactivo. El `embed_html` es un snippet
    listo para pegar. Dos modos:
    - Busqueda: pasa `query` (o `theme`) y elige la mejor capa automaticamente.
    - Directo: pasa `layers` con ids ya resueltos (una o varias capas + anotaciones).
    Pasa `query`/`theme` O `layers`, no ambos.

    Modificadores (aplican a cualquier modo): `municipio` (filtra + auto-encuadra),
    `year` (filtro de fecha validado contra la periodicidad; error accionable si
    el anio no existe), `annotations`, `view`, `basemap`, `selected`.

    Ejemplos:
    1) Busqueda rapida:   create_map(query="homicidios en Guadalajara", municipio="Guadalajara", year="2024")
    2) Por tema:          create_map(theme="seguridad", municipio="Zapopan")
    3) Capas explicitas:  create_map(layers=["homicidio_doloso","poblacion"])
    4) Con anotacion:     create_map(layers=["homicidio_doloso"], annotations=[{"id":"a1","type":"Polygon","geometry":{...},"label":"Zona"}])
    """
    try:
        return _create_map(
            query=query,
            layers=layers,
            municipio=municipio,
            year=year,
            theme=theme,
            view=view,
            basemap=basemap,
            selected=selected,
            annotations=annotations,
        )
    except ValueError as exc:
        return {'error': str(exc)}


@mcp.tool()
def create_swipe(
    layer: str = Field(default='', description="Modo una-capa: id de la capa a comparar entre dos anios (con year_a/year_b). Ej: 'homicidio_doloso'."),
    year_a: Optional[str] = Field(default=None, description="Anio (4 digitos) del lado A. Con `layer` = primer anio a comparar; con panes = filtra pane_a_layers. Validado contra la periodicidad. Ej: '2024'."),
    year_b: Optional[str] = Field(default=None, description="Anio (4 digitos) del lado B. Con `layer` = segundo anio; con panes = filtra pane_b_layers. Ej: '2023'."),
    pane_a_layers: Optional[list] = Field(default=None, description="Modo dos-capas: capas del lado A (ids u objetos {slug, filters?}). Opcionalmente filtra con year_a."),
    pane_b_layers: Optional[list] = Field(default=None, description="Modo dos-capas: capas del lado B. Opcionalmente filtra con year_b."),
    municipio: Optional[str] = Field(default=None, description="Nombre del municipio para filtrar ambos lados y auto-encuadrar. Ej: 'Guadalajara'."),
    position: float = Field(default=0.5, ge=0.05, le=0.95, description='Posicion inicial del separador (0=todo B, 1=todo A).'),
    view: Optional[dict] = Field(default=None, description='Vista compartida {zoom, lat, lon}. Si la omites, se auto-encuadra.'),
    basemap: Literal['voyager', 'position', 'sin_mapalab'] = Field(default='voyager', description="Basemap: 'voyager', 'position', 'sin_mapalab'. NO existe 'osm'."),
    label_a: str = Field(default='A', description='Etiqueta del lado A (modo libre).'),
    label_b: str = Field(default='B', description='Etiqueta del lado B (modo libre).'),
    annotations: Optional[list] = Field(default=None, description='Anotaciones globales (visibles en ambos lados). GeoJSON EPSG:4326.'),
):
    """Crea un mapa comparativo A|B (swipe) y devuelve {id, kind, url, embed_html}.

    El visor abre con una barra arrastrable; cada lado renderiza su set de capas.
    Dos modos:
    - Una capa: pasa `layer` + `year_a` + `year_b` para comparar la MISMA capa en
      dos anios.
    - Dos capas: pasa `pane_a_layers` + `pane_b_layers` para comparar capas
      distintas; opcionalmente `year_a` filtra el lado A y `year_b` el lado B.
    Usa un modo O el otro, no ambos.

    En los dos modos el server arma los filtros de fecha y los valida contra la
    periodicidad de la capa (error accionable si el anio no existe); no escribas
    CQL a mano. `municipio` filtra y encuadra ambos lados. Las anotaciones son
    globales.

    Ejemplos:
    1) Una capa, dos anios:  create_swipe(layer="homicidio_doloso", year_a="2024", year_b="2023")
    2) En municipio:         create_swipe(layer="homicidio_doloso", year_a="2024", year_b="2023", municipio="Guadalajara")
    3) Dos capas:            create_swipe(pane_a_layers=["poblacion"], pane_b_layers=["homicidio_doloso"], label_a="Poblacion", label_b="Homicidio")
    4) Dos capas + anios:    create_swipe(pane_a_layers=["robos_casa_habitacion_con_violencia"], pane_b_layers=["homicidio_doloso"], year_a="2026", year_b="2025", basemap="position")
    """
    try:
        return _create_swipe(
            layer=(layer or None),
            year_a=year_a,
            year_b=year_b,
            pane_a_layers=pane_a_layers,
            pane_b_layers=pane_b_layers,
            municipio=municipio,
            position=position,
            view=view,
            basemap=basemap,
            label_a=label_a,
            label_b=label_b,
            annotations=annotations,
        )
    except ValueError as exc:
        return {'error': str(exc)}


@mcp.tool()
def describe_layer(
    layer: str = Field(description="Id de la capa (el que devuelve search_layers). Soporta ids difusos: slug, alias o nombre parcial. Ej: 'homicidio', 'homicidio_doloso'."),
):
    """Retrato completo de una capa en una sola llamada: cualidades, metadata, numeralia y periodicidad.

    Es la tool principal para conocer una capa. Soporta ids difusos (busca por
    slug, alias o nombre parcial, no solo id exacto).

    Devuelve {id, label, path, capabilities, descripcion, fuentes, metodologia,
    frecuencia, fecha_ultima, metadato_archivos, numeralia, pie_numeralia,
    periodicidad}.

    - `capabilities` dice que se puede hacer con la capa: {temporal, hasMunicipio,
      municipioField, descargable, consultableWfs, zoomRange}. Uselo para saber
      si podes filtrar por municipio (layer_table/create_map) o comparar anios
      (create_swipe).
    - `periodicidad` = {años: [...], meses: [...]} resume las fechas disponibles;
      elegí un año de `años` antes de filtrar por fecha.

    Ejemplos:
    1) Todo junto:        describe_layer("homicidio_doloso")
    2) Con id difuso:     describe_layer("homicidio")
    3) Anios disponibles: describe_layer("homicidio_doloso")["periodicidad"]["años"]
    """
    return _describe_layer(layer=layer)


@mcp.tool()
def layer_stats(
    layer: str = Field(description="Id de la capa (de search_layers). Ej: 'escuelas', 'homicidio_doloso'."),
    field: Optional[str] = Field(default=None, description="Campo numerico para suma y promedio. Si la capa no lo tiene, el error lista los campos posibles."),
    group_by: Optional[str] = Field(default=None, description="Campo de texto para contar por clase (ej. tipo de cultivo, nivel escolar). Con `field`, tambien suma y promedio por clase."),
    municipio: Optional[str] = Field(default=None, description="Nombre del municipio para acotar. Ej: 'Zapopan'. La capa debe soportar filtro por municipio."),
    year: Optional[str] = Field(default=None, description="Anio de 4 digitos para capas temporales. Ej: '2024'."),
    top: int = Field(default=10, ge=1, le=25, description='Cuantas clases devolver con group_by; el resto se junta en `otras`.'),
):
    """Cifras de una capa sin descargar sus elementos: conteo, suma, promedio y reparto por clase.

    Devuelve {layer, filtros, conteo, campo?, suma?, promedio?, agrupado_por?, clases?, otras?}.
    Lo calcula GeoServer; los resultados se guardan 10 minutos.

    Ejemplos:
    1) Cuantos hay:          layer_stats(layer="escuelas", municipio="Zapopan")
    2) Suma y promedio:      layer_stats(layer="brecha_salarial", field="salario_promedio_diario_mujeres")
    3) Reparto por clase:    layer_stats(layer="cultivos", group_by="cultivo", top=5)
    4) Por clase con suma:   layer_stats(layer="cultivos", group_by="cultivo", field="superficie")
    """
    try:
        return _layer_stats(layer=layer, field=field, group_by=group_by, municipio=municipio, year=year, top=top)
    except ValueError as exc:
        return {'error': str(exc)}


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
    access_task = asyncio.create_task(access_flush_loop())
    try:
        yield
    finally:
        for task in (flush_task, access_task):
            task.cancel()
        for task in (flush_task, access_task):
            try:
                await task
            except asyncio.CancelledError:
                pass
        try:
            await asyncio.to_thread(telemetry_flush_pending_sync)
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


mcp_app = mcp.http_app(path='/mcp', stateless_http=True)


app = FastAPI(
    title='MapaLab MCP Server',
    routes=[*_admin_app.routes, *mcp_app.routes],
    lifespan=combine_lifespans(lifespan, mcp_app.lifespan),
)
app.add_middleware(MCPTelemetryMiddleware, path_prefix='/mcp')

if __name__ == "__main__":
    mcp.run()
