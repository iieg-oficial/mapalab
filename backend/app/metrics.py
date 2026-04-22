from __future__ import annotations

import threading
from collections import defaultdict

from fastapi import APIRouter, Response

_counters: dict[str, int] = defaultdict(int)
_lock = threading.Lock()

COUNTER_TREE_REQUESTS = 'mapalab_tree_requests_total'
COUNTER_TREE_CACHE_HITS = 'mapalab_tree_cache_hits_total'
COUNTER_TREE_REFRESH = 'mapalab_tree_refresh_total'
COUNTER_SEARCH_REQUESTS = 'mapalab_search_requests_total'
COUNTER_DOWNLOAD_REQUESTS = 'mapalab_download_requests_total'


def incr(name: str, amount: int = 1) -> None:
    with _lock:
        _counters[name] += amount


def _render_prometheus() -> str:
    lines: list[str] = []
    for name, value in sorted(_counters.items()):
        lines.append(f'# TYPE {name} counter')
        lines.append(f'{name} {value}')
    return '\n'.join(lines) + '\n'


router = APIRouter(tags=['metrics'])


@router.get('/metrics', include_in_schema=False)
async def metrics() -> Response:
    return Response(content=_render_prometheus(), media_type='text/plain; version=0.0.4')
