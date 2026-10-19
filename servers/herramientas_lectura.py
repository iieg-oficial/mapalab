from __future__ import annotations

from typing import Optional

from pydantic import Field

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.services.layer_tree_service import get_cached_state

from servers.estadisticas import layer_stats as _layer_stats
from servers.layers import describe_layer as _describe_layer
from servers.resolve import (
    MAX_REFERENCIA,
    es_capa,
    list_municipios,
    resolve_municipios,
    search_by_theme,
)
from servers.servidor import LECTURA, TIMEOUT_TOOL_S, como_error_de_tool, mcp
from servers.tabla import FiltroTabla, layer_table as _layer_table

ID_CAPA = "Id de la capa (el que devuelve search_layers). Ej: 'homicidio_doloso'."


def _indice_de_capas(tree: list[dict]) -> dict[str, dict]:
    index: dict[str, dict] = {}

    def walk(nodes: list[dict], parent_path: list[str]) -> None:
        for node in nodes:
            path = parent_path + [node['label']]
            if es_capa(node):
                index[node['id']] = {'node': node, 'path': path}
            walk(node.get('children') or [], path)

    walk(tree, [])
    return index


@mcp.tool(title='Buscar capas', annotations=LECTURA, timeout=TIMEOUT_TOOL_S)
def search_layers(
    query: str = Field(default='', max_length=MAX_REFERENCIA, description="Texto, id o slug a buscar. Ej: 'homicidio', 'primaria', 'tasa_brecha_salarial'. Vacío si solo filtras por theme."),
    theme: str = Field(default='', max_length=80, description="Área temática del visor para listar todas sus capas. Ej: 'seguridad', 'salud', 'economia', 'educacion'. Vacío para buscar en todos los temas."),
    limit: int = Field(default=20, ge=1, le=200, description='Máximo de resultados.'),
) -> list[dict]:
    """Encuentra capas del visor. SIEMPRE empieza aquí: los demás tools necesitan el `id` que este devuelve.

    Acepta tres modos combinables: texto/id/slug en `query`, área temática completa en `theme`, o ambos
    (filtra las capas del tema por el texto). Solo devuelve capas, nunca grupos del árbol.

    Devuelve una lista de {id, label, slug, workspace, path}.

    Ejemplos:
    1) Por nombre:     search_layers(query="homicidio")
    2) Tema completo:  search_layers(theme="seguridad")
    3) Tema + filtro:  search_layers(theme="educacion", query="primaria")
    """
    q, th = (query or '').strip(), (theme or '').strip()
    with como_error_de_tool():
        if not q and not th:
            raise ValueError("Pasa 'query' (texto o id) o 'theme' (área). Ej: search_layers(query=\"homicidio\").")
        index = _indice_de_capas(get_cached_state()['tree'])
        if th:
            ids = [item['id'] for item in search_by_theme(theme=th, limit=200)
                   if not q or q.lower() in f"{item.get('label', '')} {item.get('id', '')}".lower()]
        else:
            conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
            with conn.get_session() as session:
                exacta = LayersRepository.find_layer_by_slug_or_alias(session, q)
                ids = ([exacta.id] if exacta is not None else []) + [row.id for row in LayersRepository.search_layers(session, q, limit=limit)]
    results: list[dict] = []
    for layer_id in dict.fromkeys(ids):
        entry = index.get(layer_id)
        if not entry:
            continue
        wms = entry['node'].get('wmsConfig') or {}
        path = entry['path'][:-1]
        results.append({
            'id': layer_id,
            'label': entry['node'].get('label'),
            'slug': entry['node'].get('slug'),
            'workspace': wms.get('workspace'),
            'path': ' > '.join(path) if path else None,
        })
    return results[:limit]


@mcp.tool(title='Municipios de Jalisco', annotations=LECTURA, timeout=TIMEOUT_TOOL_S)
def municipios(
    query: str = Field(default='', max_length=80, description="Texto o clave parcial. Ej: 'guadalajara', 'tonala', '14039'. Sin acentos también funciona. Vacío = los 125."),
    limit: int = Field(default=50, ge=1, le=200, description='Máximo de resultados cuando hay query.'),
) -> dict:
    """Lista o busca municipios de Jalisco con su clave INEGI de 5 dígitos.

    El nombre completo o la clave se aceptan en el parámetro `municipio` de los demás tools.
    Devuelve {items: [{clave, nombre, region, areaKm2, areaHa}], count}.

    Ejemplos:
    1) Todos:      municipios()
    2) Por nombre: municipios(query="zapotlan")
    """
    q = (query or '').strip()
    with como_error_de_tool():
        if not q:
            return list_municipios()
        matches = resolve_municipios(query=q, limit=limit)
    return {'items': matches, 'count': len(matches)}


@mcp.tool(title='Describir capa', annotations=LECTURA, timeout=TIMEOUT_TOOL_S)
def describe_layer(
    layer: str = Field(max_length=MAX_REFERENCIA, description="Id de la capa. También acepta slug, alias o un nombre que solo coincida con una capa. Ej: 'homicidio_doloso'."),
) -> dict:
    """Retrato completo de una capa en una llamada: cualidades, metadatos, numeralia y periodicidad.

    Devuelve {id, label, path, capabilities, descripcion, fuentes, metodologia, frecuencia, fecha_ultima,
    metadato_archivos, numeralia, pie_numeralia, periodicidad, resuelto_de?}.

    - `capabilities` = {temporal, hasMunicipio, municipioField?, descargable, consultableWfs}: dice si se
      puede filtrar por municipio o por año.
    - `periodicidad` = {años, meses}: elige un año de `años` antes de filtrar por fecha.
    - `resuelto_de` aparece cuando lo que pasaste no era el id exacto.

    Ejemplos:
    1) Todo junto:        describe_layer("homicidio_doloso")
    2) Años disponibles:  describe_layer("tasa_brecha_salarial")["periodicidad"]["años"]
    """
    with como_error_de_tool():
        return _describe_layer(layer=layer)


@mcp.tool(title='Tabla de una capa', annotations=LECTURA, timeout=TIMEOUT_TOOL_S)
def layer_table(
    layer: str = Field(max_length=MAX_REFERENCIA, description=ID_CAPA),
    municipio: Optional[str] = Field(default=None, max_length=80, description="Nombre o clave de municipio. Ej: 'Guadalajara' o '14039'."),
    year: Optional[str] = Field(default=None, max_length=4, description="Año de 4 dígitos, validado contra la periodicidad. Ej: '2024'."),
    month: Optional[int] = Field(default=None, ge=1, le=12, description="Mes (1-12). Solo vale con 'year'."),
    filtros: Optional[list[FiltroTabla]] = Field(default=None, max_length=5, description='Hasta 5 condiciones sobre campos de la capa, unidas con AND.'),
    columnas: Optional[list[str]] = Field(default=None, max_length=20, description='Campos a mostrar, por su nombre crudo. Vacío = las columnas configuradas del visor.'),
    orden: Optional[str] = Field(default=None, max_length=64, description='Campo por el que se ordena. Sin él, la primera columna.'),
    descendente: bool = Field(default=False, description='Orden de mayor a menor.'),
    pagina: int = Field(default=1, ge=1, le=5000, description='Página, desde 1. La tabla llega hasta la fila 5000.'),
    por_pagina: int = Field(default=20, ge=1, le=50, description='Filas por página (1-50; hasta 10 con coordenadas).'),
    coordenadas: bool = Field(default=False, description='Agrega a cada fila un punto {lat, lon} del elemento.'),
) -> dict:
    """Filas de una capa con los nombres de columna del visor: filtrables, ordenables y paginadas.

    Devuelve {capa, nombre, total, pagina, paginas, columnas: [{campo, etiqueta}], filas, orden?, resuelto_de?}.
    Las filas usan la `etiqueta` como llave; los filtros usan `columnas[].campo`. Llega hasta la fila 5000:
    para totales, sumas o repartos usa layer_stats.

    Ejemplos:
    1) Primeras filas:  layer_table(layer="homicidio_doloso")
    2) Por municipio:   layer_table(layer="primaria", municipio="Zapopan")
    3) Filtro y orden:  layer_table(layer="secretaria_salud_1", filtros=[{"campo": "nombre_tipologia", "op": "contiene", "valor": "rural"}], orden="nombre_unidad")
    4) Para anotar:     layer_table(layer="secretaria_salud_1", municipio="Guadalajara", por_pagina=5, coordenadas=True)
    """
    with como_error_de_tool():
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


@mcp.tool(title='Cifras de una capa', annotations=LECTURA, timeout=TIMEOUT_TOOL_S)
def layer_stats(
    layer: str = Field(max_length=MAX_REFERENCIA, description=ID_CAPA),
    field: Optional[str] = Field(default=None, max_length=64, description='Campo numérico para suma y promedio. Si no existe, el error lista los posibles.'),
    group_by: Optional[str] = Field(default=None, max_length=64, description='Campo de texto para contar por clase. Con `field`, también suma y promedio por clase.'),
    municipio: Optional[str] = Field(default=None, max_length=80, description="Municipio para acotar. Ej: 'Zapopan'. La capa debe soportarlo."),
    year: Optional[str] = Field(default=None, max_length=4, description="Año de 4 dígitos, validado contra la periodicidad. Ej: '2024'."),
    top: int = Field(default=10, ge=1, le=25, description='Cuántas clases devolver con group_by; el resto va en `otras`.'),
) -> dict:
    """Cifras de una capa sin descargar sus elementos: conteo, suma, promedio y reparto por clase.

    Devuelve {layer, filtros, conteo, campo?, suma?, promedio?, agrupado_por?, clases?, otras?, sin_valor?}.
    Lo calcula GeoServer; los resultados se guardan 10 minutos.

    Ejemplos:
    1) Cuántos hay:         layer_stats(layer="primaria", municipio="Zapopan")
    2) Suma y promedio:     layer_stats(layer="tasa_brecha_salarial", field="salario_promedio_diario_mujeres", year="2024")
    3) Reparto por clase:   layer_stats(layer="secretaria_salud_1", group_by="nombre_tipologia", top=5)
    4) Por municipio:       layer_stats(layer="homicidio_doloso", group_by="municipio", year="2024", top=5)
    """
    with como_error_de_tool():
        return _layer_stats(layer=layer, field=field, group_by=group_by, municipio=municipio, year=year, top=top)
