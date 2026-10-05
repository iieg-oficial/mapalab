from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response

from app.auth.internal_token import require_internal_token
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.layers_repository import LayersRepository
from app.routers.sesion import usuario_actual
from app.services import acceso_capas, arbol_privado
from app.services.layer_tree_service import get_cached_state, invalidate_memory_cache, refresh_cache
from app.utils.api_responses import api_responses

router = APIRouter(prefix='/layers', tags=['Layers'])


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


@router.get(
    '/tree',
    responses=api_responses(500),
    operation_id='get_layer_tree',
    summary='Árbol jerárquico completo de capas del visor',
    description=(
        "Devuelve el árbol jerárquico completo del visor: temas raíz → categorías "
        "expandibles → labels de sección → capas hoja con `wmsConfig`. Es el catálogo "
        "de referencia para resolver IDs, construir UI y entender la estructura del "
        "visor. Soporta `If-None-Match` y responde 304 cuando el ETag coincide con la "
        "versión cacheada (la cache materializada se refresca diariamente a las 04:00)."
    ),
)
def get_layer_tree(
    response: Response,
    if_none_match: Optional[str] = Header(default=None),
):
    state = get_cached_state()
    etag = state['etag']

    if if_none_match and if_none_match == etag:
        response.status_code = 304
        response.headers['ETag'] = etag
        response.headers['Cache-Control'] = 'no-cache, must-revalidate'
        return None

    response.headers['ETag'] = etag
    response.headers['Cache-Control'] = 'no-cache, must-revalidate'
    return state['tree']


@router.get(
    '/initial-order',
    responses=api_responses(500),
    operation_id='get_initial_order',
    summary='IDs de las capas activas al cargar el visor',
    description=(
        "Devuelve la lista ordenada de IDs de capas que se activan automáticamente "
        "cuando el visor se abre sin parámetros en la URL (vista por defecto)."
    ),
)
def get_initial_order():
    state = get_cached_state()
    return state['initial_order']


@router.get(
    '/workspaces',
    responses=api_responses(500),
    operation_id='get_workspaces',
    summary='Workspaces de GeoServer con sus alias',
    description=(
        "Devuelve la lista de workspaces con su `alias` público, el `geoserver_workspace` "
        "real y el `db_schema` correspondiente en DataEngine. Útil para traducir entre "
        "el alias corto (p. ej. 'seguridad') y el nombre completo de GeoServer "
        "('seguridad_y_proteccion_ciudadana')."
    ),
)
def get_workspaces():
    state = get_cached_state()
    return state['workspaces']


@router.post(
    '/refresh-cache',
    responses=api_responses(401, 500),
    dependencies=[Depends(require_internal_token)],
    operation_id='refresh_layer_tree_cache',
    summary='Regenera la cache materializada del árbol (token interno)',
    description=(
        "Reconstruye `mapalab.layer_tree_cache` a partir de `mapalab.layers` e invalida "
        "la cache en memoria de todos los workers. Lo invoca mariachi-api tras "
        "aprobar borradores o editar capas. Requiere el header `X-Internal-Token`; "
        "el gateway también bloquea este endpoint desde fuera de la red interna. "
        "Devuelve `{ok, etag, layer_count}`."
    ),
)
def refresh_cache_endpoint():
    result = refresh_cache()
    acceso_capas.olvidar_cache()
    arbol_privado.olvidar_cache()
    return {
        'ok': True,
        'etag': result['etag'],
        'layer_count': result['layer_count'],
    }


@router.post(
    '/invalidate-cache',
    responses=api_responses(401, 500),
    dependencies=[Depends(require_internal_token)],
    operation_id='invalidate_layer_tree_memory_cache',
    summary='Invalida solo la cache en memoria del worker (token interno)',
    description=(
        "Invalida la cache en memoria del proceso actual (no toca la cache materializada "
        "en BD). Útil cuando el árbol fue regenerado fuera de banda y se quiere forzar "
        "una relectura sin pagar el costo de reconstruirla. Requiere `X-Internal-Token`."
    ),
)
def invalidate_cache_endpoint():
    invalidate_memory_cache()
    acceso_capas.olvidar_cache()
    arbol_privado.olvidar_cache()
    return {'ok': True}


@router.get(
    '/search',
    responses=api_responses(500),
    operation_id='search_layers',
    summary='Buscar capas por nombre, etiquetas o ID',
    description=(
        "Búsqueda flat de capas por texto en `label` (nombre visible), `tags` o `id`. "
        "Devuelve hasta `limit` resultados ordenados por relevancia. "
        "**Cada resultado incluye el `label` (nombre que ve el usuario en el menú), "
        "el `path` jerárquico ('Tema > Categoría > Subcategoría') para ubicar la capa "
        "en el árbol, `id`, `slug`, `workspace`, `wmsConfig` y `searchMeta`.** "
        "Es el punto de entrada recomendado para resolver el ID de una capa a partir "
        "del nombre que conoce el usuario antes de llamar a /metadata o /periodicity."
    ),
)
def search_layers(
    q: str = Query(min_length=1, description='Texto a buscar en label, tags o id de la capa'),
    limit: int = Query(default=50, ge=1, le=200, description='Máximo de resultados (1-200, default 50)'),
):
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


@router.get(
    '/resolve',
    responses=api_responses(404, 500),
    operation_id='resolve_layer_ref',
    summary='Resuelve un slug o alias público a una capa concreta',
    description=(
        "Dado un slug o alias público estable, devuelve la capa correspondiente "
        "(`id`, `slug`, `label`, `workspace`). Pensado para resolver URLs cortas y "
        "referencias externas sin tener que cargar el árbol completo. 404 si no existe."
    ),
)
def resolve_layer_ref(
    request: Request,
    ref: str = Query(min_length=1, description='slug o alias publico'),
):
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer = LayersRepository.find_layer_by_slug_or_alias(session, ref)
        usuario = usuario_actual(request)
        if layer is None or not acceso_capas.puede_ver(layer.id, usuario['uid'] if usuario else None):
            raise HTTPException(status_code=404, detail=f"No existe capa para ref '{ref}'")
        return {
            'id': layer.id,
            'slug': layer.slug,
            'label': layer.label,
            'workspace': layer.workspace_alias,
        }
