from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response

from app.auth.internal_token import require_internal_token
from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.metrics import (
    COUNTER_SEARCH_REQUESTS,
    COUNTER_TREE_CACHE_HITS,
    COUNTER_TREE_REFRESH,
    COUNTER_TREE_REQUESTS,
    incr,
)
from app.repositories.layers_repository import LayersRepository
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


@router.get('/tree', responses=api_responses(500))
def get_layer_tree(
    response: Response,
    if_none_match: Optional[str] = Header(default=None),
):
    incr(COUNTER_TREE_REQUESTS)
    state = get_cached_state()
    etag = state['etag']

    if if_none_match and if_none_match == etag:
        incr(COUNTER_TREE_CACHE_HITS)
        response.status_code = 304
        response.headers['ETag'] = etag
        response.headers['Cache-Control'] = 'no-cache, must-revalidate'
        return None

    response.headers['ETag'] = etag
    response.headers['Cache-Control'] = 'no-cache, must-revalidate'
    return state['tree']


@router.get('/initial-order', responses=api_responses(500))
def get_initial_order():
    state = get_cached_state()
    return state['initial_order']


@router.get('/workspaces', responses=api_responses(500))
def get_workspaces():
    state = get_cached_state()
    return state['workspaces']


@router.post('/refresh-cache', responses=api_responses(401, 500), dependencies=[Depends(require_internal_token)])
def refresh_cache_endpoint():
    incr(COUNTER_TREE_REFRESH)
    result = refresh_cache()
    return {
        'ok': True,
        'etag': result['etag'],
        'layer_count': result['layer_count'],
    }


@router.post('/invalidate-cache', responses=api_responses(401, 500), dependencies=[Depends(require_internal_token)])
def invalidate_cache_endpoint():
    invalidate_memory_cache()
    return {'ok': True}


@router.get('/search', responses=api_responses(500))
def search_layers(
    q: str = Query(min_length=1, description='Texto a buscar (label, tags, id)'),
    limit: int = Query(default=50, ge=1, le=200),
):
    incr(COUNTER_SEARCH_REQUESTS)
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


@router.get('/resolve', responses=api_responses(404, 500))
def resolve_layer_ref(
    ref: str = Query(min_length=1, description='slug o alias publico'),
):
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer = LayersRepository.find_layer_by_slug_or_alias(session, ref)
        if layer is None:
            raise HTTPException(status_code=404, detail=f"No existe capa para ref '{ref}'")
        return {
            'id': layer.id,
            'slug': layer.slug,
            'label': layer.label,
            'workspace': layer.workspace_alias,
        }
