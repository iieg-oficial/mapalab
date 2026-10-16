from __future__ import annotations

import functools
import inspect
from typing import Any, Callable, Literal, Optional

from pydantic import Field

from servers.blindaje import ES_BETA, MAX_ETIQUETA_LADO, Vista3d
from servers.resolve import MAX_REFERENCIA
from servers.servidor import ESCRITURA, TIMEOUT_TOOL_S, como_error_de_tool, mcp
from servers.shares import create_map as _create_map, create_swipe as _create_swipe

Basemap = Literal['voyager', 'position', 'sin_mapalab']

DESCRIPCION_MAPA = """Crea un mapa interactivo de MapaLab y devuelve {id, kind, url, layer?}. Es la tool para ENTREGAR un mapa.

Dos modos, uno u otro:
- Búsqueda: `query` (o `theme`) elige la mejor capa.
- Directo: `layers` con ids de search_layers (una o varias capas, hasta 60).

Modificadores: `municipio` filtra las capas que lo soportan y encuadra; `year` y `month` filtran las capas
temporales y se validan contra su periodicidad; `annotations`, `view`, `basemap`, `selected`.
Repetir la misma llamada devuelve el mismo id.

Ejemplos:
1) Búsqueda:          create_map(query="homicidio doloso", municipio="Guadalajara", year="2024")
2) Por tema:          create_map(theme="educacion", municipio="Zapopan")
3) Capas explícitas:  create_map(layers=["homicidio_doloso", "tasa_poblacion_total"])
4) Con anotación:     create_map(layers=["homicidio_doloso"], annotations=[{"id": "a1", "type": "Text", "geometry": {"type": "Point", "coordinates": [-103.35, 20.67]}, "textLabel": "Centro"}])"""

EXTRA_BETA = """

Solo en este entorno (BETA): `vista_3d` abre el mapa en 3D con relieve y la respuesta trae `embed_html`, un
snippet del widget que necesita la llave pública que mariachi emite para el sitio donde se inserta.
5) En 3D:  create_map(layers=["tasa_poblacion_total"], municipio="Zapopan", vista_3d={"inclinacion": 60, "extruir": ["tasa_poblacion_total"]})"""

DESCRIPCION_SWIPE = """Crea un comparador A|B (swipe) y devuelve {id, kind, url, embed_html}. Solo en entornos BETA.

Dos modos, uno u otro:
- Una capa en dos años: `layer` + `year_a` + `year_b` (años distintos, validados contra la periodicidad).
- Dos capas: `pane_a_layers` + `pane_b_layers`; opcionalmente `year_a` filtra el lado A y `year_b` el B.

`municipio` filtra y encuadra ambos lados. Las anotaciones son globales.

Ejemplos:
1) Una capa, dos años:  create_swipe(layer="homicidio_doloso", year_a="2025", year_b="2024")
2) En municipio:        create_swipe(layer="homicidio_doloso", year_a="2025", year_b="2024", municipio="Guadalajara")
3) Dos capas:           create_swipe(pane_a_layers=["tasa_poblacion_total"], pane_b_layers=["homicidio_doloso"], label_a="Población", label_b="Homicidio")"""


def _sin_parametros(fn: Callable[..., dict], *nombres: str) -> Callable[..., dict]:
    firma = inspect.signature(fn)

    @functools.wraps(fn)
    def envuelta(**kwargs: Any) -> dict:
        return fn(**kwargs, **{nombre: None for nombre in nombres})

    envuelta.__signature__ = firma.replace(parameters=[p for p in firma.parameters.values() if p.name not in nombres])
    del envuelta.__wrapped__
    return envuelta


def create_map(
    query: str = Field(default='', max_length=MAX_REFERENCIA, description="Modo búsqueda: texto para elegir la mejor capa. Ej: 'homicidio doloso'. Usa esto O 'layers'."),
    layers: Optional[list[Any]] = Field(default=None, max_length=60, description="Modo directo: ids de capa (texto) u objetos {slug, opacity?, visible?}. Usa esto O 'query'."),
    municipio: Optional[str] = Field(default=None, max_length=80, description="Nombre o clave del municipio: filtra las capas que lo soportan y encuadra. Ej: 'Guadalajara'."),
    year: Optional[str] = Field(default=None, max_length=4, description="Año de 4 dígitos para las capas temporales. Ej: '2024'."),
    month: Optional[int] = Field(default=None, ge=1, le=12, description="Mes (1-12) para capas mensuales. Solo vale con 'year'."),
    theme: str = Field(default='', max_length=80, description="Modo búsqueda alternativo: área temática. Ej: 'seguridad'."),
    view: Optional[dict[str, float]] = Field(default=None, description='Vista inicial {zoom, lat, lon, rotation?} dentro de Jalisco. Sin ella se encuadra al municipio o a Jalisco.'),
    basemap: Optional[Basemap] = Field(default=None, description="Mapa base: 'voyager' (recomendado), 'position' o 'sin_mapalab'. NO existe 'osm'."),
    selected: Optional[str] = Field(default=None, max_length=MAX_REFERENCIA, description='Id de la capa del mapa cuya simbología se muestra.'),
    annotations: Optional[list[dict[str, Any]]] = Field(default=None, max_length=200, description="Anotaciones GeoJSON EPSG:4326: {id, type ('LineString'|'Polygon'|'Text'|'Emoji'), geometry, label?, value?, unit?, textLabel?, rotation?}."),
    vista_3d: Optional[Vista3d] = Field(default=None, description='Abre el mapa en 3D con relieve: {inclinacion?, rumbo?, exageracion?, extruir?: [ids de capas del mapa]}.'),
) -> dict:
    with como_error_de_tool():
        return _create_map(
            query=query, layers=layers, municipio=municipio, year=year, month=month, theme=theme, view=view,
            basemap=basemap, selected=selected, annotations=annotations, vista_3d=vista_3d,
        )


def create_swipe(
    layer: str = Field(default='', max_length=MAX_REFERENCIA, description="Modo una capa: id de la capa a comparar entre dos años. Ej: 'homicidio_doloso'."),
    year_a: Optional[str] = Field(default=None, max_length=4, description="Año del lado A. Ej: '2025'."),
    year_b: Optional[str] = Field(default=None, max_length=4, description="Año del lado B. Ej: '2024'."),
    pane_a_layers: Optional[list[Any]] = Field(default=None, max_length=60, description='Modo dos capas: capas del lado A (ids u objetos {slug, opacity?, visible?}).'),
    pane_b_layers: Optional[list[Any]] = Field(default=None, max_length=60, description='Modo dos capas: capas del lado B.'),
    municipio: Optional[str] = Field(default=None, max_length=80, description="Municipio para filtrar ambos lados y encuadrar. Ej: 'Guadalajara'."),
    position: float = Field(default=0.5, ge=0.05, le=0.95, description='Posición inicial del separador (0 = todo B, 1 = todo A).'),
    view: Optional[dict[str, float]] = Field(default=None, description='Vista compartida {zoom, lat, lon}. Sin ella se encuadra sola.'),
    basemap: Basemap = Field(default='voyager', description="Mapa base: 'voyager', 'position' o 'sin_mapalab'."),
    label_a: str = Field(default='A', max_length=MAX_ETIQUETA_LADO, description='Etiqueta del lado A (modo dos capas).'),
    label_b: str = Field(default='B', max_length=MAX_ETIQUETA_LADO, description='Etiqueta del lado B (modo dos capas).'),
    annotations: Optional[list[dict[str, Any]]] = Field(default=None, max_length=200, description='Anotaciones globales, visibles en ambos lados. GeoJSON EPSG:4326.'),
    vista_3d: Optional[Vista3d] = Field(default=None, description='Abre el comparador en 3D, con la cámara igual en los dos lados.'),
) -> dict:
    with como_error_de_tool():
        return _create_swipe(
            layer=layer or None, year_a=year_a, year_b=year_b, pane_a_layers=pane_a_layers,
            pane_b_layers=pane_b_layers, municipio=municipio, position=position, view=view, basemap=basemap,
            label_a=label_a, label_b=label_b, annotations=annotations, vista_3d=vista_3d,
        )


if ES_BETA:
    mcp.tool(create_map, title='Crear mapa', description=DESCRIPCION_MAPA + EXTRA_BETA, annotations=ESCRITURA, timeout=TIMEOUT_TOOL_S)
    mcp.tool(create_swipe, title='Crear comparador', description=DESCRIPCION_SWIPE, annotations=ESCRITURA, timeout=TIMEOUT_TOOL_S)
else:
    mcp.tool(
        _sin_parametros(create_map, 'vista_3d'),
        name='create_map', title='Crear mapa', description=DESCRIPCION_MAPA, annotations=ESCRITURA, timeout=TIMEOUT_TOOL_S,
    )
