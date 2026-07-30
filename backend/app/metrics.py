from __future__ import annotations

import threading
from collections import defaultdict
from typing import Optional

_counters: dict[tuple[str, tuple[tuple[str, str], ...]], int] = defaultdict(int)
_lock = threading.Lock()

COUNTER_TREE_REQUESTS = 'mapalab_tree_requests_total'
COUNTER_TREE_CACHE_HITS = 'mapalab_tree_cache_hits_total'
COUNTER_TREE_REFRESH = 'mapalab_tree_refresh_total'
COUNTER_SEARCH_REQUESTS = 'mapalab_search_requests_total'
COUNTER_DOWNLOAD_REQUESTS = 'mapalab_download_requests_total'
COUNTER_EMBED_REQUESTS = 'mapalab_embed_requests_total'
COUNTER_EMBED_DENIED = 'mapalab_embed_denied_total'
COUNTER_EMBED_QUOTA_EXCEEDED = 'mapalab_embed_quota_exceeded_total'
COUNTER_EMBED_JS_ERRORS = 'mapalab_embed_js_errors_total'
COUNTER_MCP_CALLS = 'mapalab_mcp_calls_total'


def incr(name: str, labels: Optional[dict] = None, amount: int = 1) -> None:
    label_key = tuple(sorted((labels or {}).items()))
    with _lock:
        _counters[(name, label_key)] += amount


ONTOY_COUNTERS: tuple[str, ...] = (
    COUNTER_TREE_REQUESTS,
    COUNTER_TREE_CACHE_HITS,
    COUNTER_TREE_REFRESH,
    COUNTER_SEARCH_REQUESTS,
    COUNTER_DOWNLOAD_REQUESTS,
    COUNTER_EMBED_REQUESTS,
    COUNTER_EMBED_DENIED,
    COUNTER_EMBED_QUOTA_EXCEEDED,
    COUNTER_EMBED_JS_ERRORS,
    COUNTER_MCP_CALLS,
)


def snapshot() -> dict[str, int]:
    totales = {name: 0 for name in ONTOY_COUNTERS}
    with _lock:
        for (name, _label_key), value in _counters.items():
            if name in totales:
                totales[name] += value
    return totales
