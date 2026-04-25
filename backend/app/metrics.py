from __future__ import annotations

import threading
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Response

_counters: dict[tuple[str, tuple[tuple[str, str], ...]], int] = defaultdict(int)
_lock = threading.Lock()

COUNTER_TREE_REQUESTS = 'mapalab_tree_requests_total'
COUNTER_TREE_CACHE_HITS = 'mapalab_tree_cache_hits_total'
COUNTER_TREE_REFRESH = 'mapalab_tree_refresh_total'
COUNTER_SEARCH_REQUESTS = 'mapalab_search_requests_total'
COUNTER_DOWNLOAD_REQUESTS = 'mapalab_download_requests_total'
COUNTER_SHARES_CREATED = 'mapalab_shares_created_total'
COUNTER_SHARES_ACCESSED = 'mapalab_shares_accessed_total'
COUNTER_SHARES_PINNED = 'mapalab_shares_pinned_total'


def incr(name: str, labels: Optional[dict] = None, amount: int = 1) -> None:
    label_key = tuple(sorted((labels or {}).items()))
    with _lock:
        _counters[(name, label_key)] += amount


def _format_labels(label_key: tuple[tuple[str, str], ...]) -> str:
    if not label_key:
        return ''
    parts = ','.join(f'{k}="{v}"' for k, v in label_key)
    return '{' + parts + '}'


def _render_prometheus() -> str:
    by_name: dict[str, list[tuple[tuple[tuple[str, str], ...], int]]] = defaultdict(list)
    for (name, label_key), value in _counters.items():
        by_name[name].append((label_key, value))

    lines: list[str] = []
    for name in sorted(by_name.keys()):
        lines.append(f'# TYPE {name} counter')
        for label_key, value in sorted(by_name[name]):
            lines.append(f'{name}{_format_labels(label_key)} {value}')
    return '\n'.join(lines) + '\n'


router = APIRouter(tags=['metrics'])


@router.get('/metrics', include_in_schema=False)
async def metrics() -> Response:
    return Response(content=_render_prometheus(), media_type='text/plain; version=0.0.4')
