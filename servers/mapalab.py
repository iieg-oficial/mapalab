"""MapaLab MCP Server — servidor dedicado.

Servidor MCP del catalogo de capas geoespaciales del IIEG Jalisco. Sigue el
patron estandar de los servers MCP del ecosistema agent: FastMCP con tools
manuales decorados con @mcp.tool(), combined_app con health + /mcp,
stateless_http=True.

Reutiliza los servicios y repositorios del backend principal de MapaLab
(montados en /app/app/) en lugar de duplicar logica.
"""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastmcp import FastMCP
from fastmcp.utilities.lifespan import combine_lifespans
from pydantic import Field

from app import metrics as metrics_module
from app.config import settings
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.services import layer_metadata_service
from app.services.layer_tree_service import get_cached_state
from app.services.periodicity_service import PeriodicityService
from app.utils.logger import Logger

from servers.share_tools import (
    create_single_share as _create_single_share,
    create_swipe_share as _create_swipe_share,
    list_municipios as _list_municipios,
    measure_geometry as _measure_geometry,
    resolve_municipios as _resolve_municipios,
)
from servers.telemetry import (
    MCPTelemetryMiddleware,
    flush_loop as telemetry_flush_loop,
    flush_pending_sync as telemetry_flush_pending_sync,
)


mcp = FastMCP(name="mapalab")


def _acervo_base() -> str:
    return settings.ACERVO_PUBLIC_URL.rstrip('/') if settings.ACERVO_PUBLIC_URL else ''


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
    q: str = Field(description='Texto a buscar en label, tags o id de la capa'),
    limit: int = Field(default=50, ge=1, le=200, description='Maximo de resultados (1-200)'),
):
    """Busca capas por texto en label, tags o id.

    Devuelve hasta `limit` resultados ordenados por relevancia. Cada resultado
    incluye el `label` (nombre que ve el usuario en el menu), el `path`
    jerarquico ('Tema > Categoria > Subcategoria') para ubicar la capa en el
    arbol, `id`, `slug`, `workspace`, `wmsConfig` y `searchMeta`.

    Es el punto de entrada recomendado para resolver el ID de una capa a partir
    del nombre que conoce el usuario antes de llamar a get_metadata o
    get_periodicity.
    """
    state = get_cached_state()
    index = _flatten_tree(state['tree'])

    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        rows = LayersRepository.search_layers(session, q, limit=limit)

    results = []
    for row in rows:
        entry = index.get(row.id)
        if entry is None:
            continue
        node = entry['node']
        path = entry['path'][:-1]
        results.append({
            'id': row.id,
            'slug': row.slug,
            'label': row.label,
            'workspace': row.workspace_alias,
            'path': ' > '.join(path) if path else None,
            'wmsConfig': node.get('wmsConfig'),
            'searchMeta': node.get('searchMeta'),
        })
    return results


@mcp.tool()
def resolve_layer_ref(
    ref: str = Field(description='Slug o alias publico estable de la capa'),
):
    """Resuelve un slug o alias publico a una capa concreta.

    Devuelve `id`, `slug`, `label` y `workspace`. Pensado para resolver URLs
    cortas y referencias externas sin tener que cargar el arbol completo.
    Devuelve None si no existe.
    """
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer = LayersRepository.find_layer_by_slug_or_alias(session, ref)
        if layer is None:
            return None
        return {
            'id': layer.id,
            'slug': layer.slug,
            'label': layer.label,
            'workspace': layer.workspace_alias,
        }


@mcp.tool()
def get_layer_tree():
    """Arbol jerarquico completo de capas del visor.

    Devuelve la estructura completa: temas raiz → categorias expandibles →
    labels de seccion → capas hoja con `wmsConfig`. Es el catalogo de
    referencia para resolver IDs, construir UI y entender la estructura del
    visor.

    La cache materializada se refresca diariamente a las 04:00; la respuesta
    incluye el `etag` para deteccion de cambios.
    """
    state = get_cached_state()
    return {'tree': state['tree'], 'etag': state['etag']}


@mcp.tool()
def get_initial_order():
    """IDs de las capas activas al cargar el visor sin parametros en la URL."""
    state = get_cached_state()
    return state['initial_order']


@mcp.tool()
def get_workspaces():
    """Workspaces de GeoServer con sus alias.

    Devuelve la lista con `alias` publico, `geoserver_workspace` real y
    `db_schema` correspondiente en DataEngine. Util para traducir entre el
    alias corto (p. ej. 'seguridad') y el nombre completo de GeoServer
    ('seguridad_y_proteccion_ciudadana').
    """
    state = get_cached_state()
    return state['workspaces']


@mcp.tool()
def get_metadata(
    workspace: str = Field(description='Alias del workspace (p. ej. seguridad)'),
    layer: str = Field(description='Nombre de la capa dentro del workspace'),
):
    """Metadata completa de una capa.

    Devuelve descripcion, metodologia, fuentes, periodicidad, flag de
    descargable y URLs de los archivos de metadatos en Acervo (TXT/XLSX).
    Usa el alias corto del workspace (p. ej. 'seguridad').
    """
    modern = layer_metadata_service.get_metadata_response(workspace, layer, _acervo_base())
    if modern:
        return [modern]
    return []


@mcp.tool()
def get_sources_batch(
    layers: str = Field(description="Capas separadas por coma en formato 'workspace:layer'"),
):
    """Fuentes (organismo, año, URL) de varias capas en lote.

    Util para construir la atribucion de varias capas activas en una sola
    llamada en lugar de ir una por una a get_metadata.
    """
    layer_keys = list(dict.fromkeys(item.strip() for item in layers.split(',') if item.strip()))
    try:
        return layer_metadata_service.get_sources_batch(layer_keys)
    except Exception as exc:
        Logger.error(f'get_sources_batch.error {exc}')
        return []


@mcp.tool()
def get_periodicity(
    workspace: str = Field(description='Nombre del workspace de GeoServer'),
    layer: str = Field(description='Nombre de la capa dentro del workspace'),
):
    """Fechas disponibles year/month/day de una capa temporal.

    Devuelve la estructura jerarquica `{year: {month: [day, ...]}}`. Si la
    capa no tiene dimension temporal devuelve `{}`.
    """
    result = PeriodicityService.get_periodicity(workspace, layer)
    return {'periodicity': result}


@mcp.tool()
def get_periodicities_batch(
    layers: str = Field(description="Capas separadas por coma en formato 'workspace:layer'"),
):
    """Periodicidad de varias capas en una sola llamada."""
    layer_keys = list(dict.fromkeys(item.strip() for item in layers.split(',') if item.strip()))
    return PeriodicityService.get_periodicities_batch(layer_keys)


@mcp.tool()
def create_single_share(
    layers: list = Field(description='Capas a mostrar. Lista de IDs de capa (string) o de objetos {slug, visible?, opacity?, filters?}.'),
    view: Optional[dict] = Field(default=None, description="Vista inicial del mapa: {zoom, lat, lon, rotation?}."),
    basemap: Optional[str] = Field(default=None, description='Basemap inicial (p. ej. "osm").'),
    selected: Optional[str] = Field(default=None, description='Slug/ID de la capa seleccionada para la simbologia.'),
    annotations: Optional[list] = Field(default=None, description='Anotaciones (mediciones, textos, emojis) en GeoJSON EPSG:4326. Cada item: {id, type, geometry, label?, value?, textLabel?, rotation?}.'),
    municipios: Optional[dict] = Field(default=None, description='Activa el modo Vista por municipio en el share. Formato: {source: "iieg"|"inegi", selected: ["14001", "14039", ...]}. Las claves se obtienen de list_municipios o resolve_municipios. Mascara visual + filtro CQL automatico en capas con municipioField.'),
):
    """Crea un share del visor con capas y opcionalmente anotaciones y filtro por municipio pre-cargados.

    Devuelve `{id, kind, url, embed_html}`. El `embed_html` es un snippet
    `<iieg-mapalab share="...">` listo para pegar en cualquier sitio web que
    cargue el widget de MapaLab. Es el camino recomendado para que un agente
    entregue un mapa interactivo al usuario en lugar de solo describirlo.

    `annotations` permite pre-pintar lineas, poligonos, textos y emojis.
    `municipios` activa el modo Vista por municipio (beta) que oculta el resto
    del estado con una mascara y filtra automaticamente las capas activas que
    soporten filtro por municipio.
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
    pane_a_layers: list = Field(description='Capas del lado A (lista de IDs o {slug, opacity?}).'),
    pane_b_layers: list = Field(description='Capas del lado B (lista de IDs o {slug, opacity?}).'),
    position: float = Field(default=0.5, ge=0.05, le=0.95, description='Posicion inicial del separador swipe (0=todo B, 1=todo A).'),
    view: Optional[dict] = Field(default=None, description='Vista compartida entre los dos lados: {zoom, lat, lon}.'),
    basemap: Optional[str] = Field(default=None, description='Basemap compartido entre A y B.'),
    label_a: str = Field(default='A', description='Etiqueta del lado A (mostrada en la pildora del visor).'),
    label_b: str = Field(default='B', description='Etiqueta del lado B.'),
    annotations: Optional[list] = Field(default=None, description='Anotaciones globales del mapa (no por slot). GeoJSON EPSG:4326.'),
    municipios: Optional[dict] = Field(default=None, description='Modo Vista por municipio compartido entre A y B. {source: "iieg"|"inegi", selected: [claves]}.'),
):
    """Crea un share del visor en modo swipe (comparacion A|B).

    Devuelve `{id, kind, url, embed_html}`. El visor abre con la barra
    divisora arrastrable y cada lado renderiza su set de capas. Util para
    comparar fenomenos lado a lado (p. ej. delitos vs poblacion, antes vs
    despues). `municipios` aplica la mascara visual y el filtro CQL a ambos
    paneles (es estado compartido, no por slot).
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
def list_municipios():
    """Lista los 125 municipios de Jalisco con su clave INEGI y nombre.

    Devuelve `{items: [{clave, nombre, region, areaKm2, areaHa}], count}`. La
    `clave` es el identificador INEGI de 5 digitos (los primeros 2 son '14'
    para Jalisco). Usar como entrada para `create_single_share(municipios=...)`
    o `create_swipe_share(municipios=...)`.
    """
    return _list_municipios()


@mcp.tool()
def resolve_municipios(
    query: str = Field(description='Texto a buscar en el nombre o la clave del municipio (case-insensitive, substring).'),
    limit: int = Field(default=10, ge=1, le=50, description='Maximo de resultados (1-50).'),
):
    """Busca municipios por nombre o clave parcial (case-insensitive substring).

    Util para mapear "Guadalajara y Zapopan" -> [{clave: "14039", nombre: "Guadalajara"}, {clave: "14120", nombre: "Zapopan"}].
    Devuelve hasta `limit` matches del listado completo.
    """
    return _resolve_municipios(query=query, limit=limit)


@mcp.tool()
def measure_geometry(
    geometry: dict = Field(description='Geometria GeoJSON EPSG:4326. type debe ser LineString, Polygon o MultiPolygon.'),
):
    """Calcula longitud (LineString) o area (Polygon/MultiPolygon) geodesica.

    Usa PostGIS `ST_Length`/`ST_Area` sobre `::geography`, asi el resultado es
    en metros / metros cuadrados reales sobre el elipsoide WGS84 (no
    proyectados). Devuelve `{type, metric, value, unit, value_km|value_km2}`.
    """
    return _measure_geometry(geometry)


@asynccontextmanager
async def lifespan(server_app: FastAPI):
    # Warmup del pool de SQLAlchemy
    try:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            from sqlalchemy import text as _text
            session.execute(_text('SELECT 1'))
        Logger.info('mapalab-mcp database pool warmed up')
    except Exception as exc:
        Logger.warning(f'mapalab-mcp warmup_error {exc}')

    flush_task = asyncio.create_task(telemetry_flush_loop())
    try:
        yield
    finally:
        flush_task.cancel()
        try:
            await flush_task
        except asyncio.CancelledError:
            pass
        try:
            await asyncio.to_thread(telemetry_flush_pending_sync)
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
