from __future__ import annotations

import threading
from collections import defaultdict
from typing import Optional

_counters: dict[tuple[str, tuple[tuple[str, str], ...]], int] = defaultdict(int)
_histograms: dict[tuple[str, tuple[tuple[str, str], ...]], dict] = defaultdict(
    lambda: {'sum': 0.0, 'count': 0, 'buckets': defaultdict(int)}
)
_lock = threading.Lock()

_DEFAULT_BUCKETS_MS = (50, 100, 250, 500, 1000, 2000, 4000, 8000, 16000)

COUNTER_TREE_REQUESTS = 'mapalab_tree_requests_total'
COUNTER_TREE_CACHE_HITS = 'mapalab_tree_cache_hits_total'
COUNTER_TREE_REFRESH = 'mapalab_tree_refresh_total'
COUNTER_SEARCH_REQUESTS = 'mapalab_search_requests_total'
COUNTER_DOWNLOAD_REQUESTS = 'mapalab_download_requests_total'
COUNTER_SHARES_CREATED = 'mapalab_shares_created_total'
COUNTER_SHARES_ACCESSED = 'mapalab_shares_accessed_total'
COUNTER_SHARES_PINNED = 'mapalab_shares_pinned_total'
COUNTER_EMBED_REQUESTS = 'mapalab_embed_requests_total'
COUNTER_EMBED_DENIED = 'mapalab_embed_denied_total'
COUNTER_EMBED_QUOTA_EXCEEDED = 'mapalab_embed_quota_exceeded_total'
COUNTER_EMBED_WMS_PROXY = 'mapalab_embed_wms_proxy_total'
COUNTER_EMBED_TELEMETRY = 'mapalab_embed_telemetry_total'
COUNTER_EMBED_JS_ERRORS = 'mapalab_embed_js_errors_total'
HISTOGRAM_EMBED_VITAL = 'mapalab_embed_vital_ms'
COUNTER_MCP_CALLS = 'mapalab_mcp_calls_total'
HISTOGRAM_MCP_LATENCY = 'mapalab_mcp_latency_ms'


def incr(name: str, labels: Optional[dict] = None, amount: int = 1) -> None:
    label_key = tuple(sorted((labels or {}).items()))
    with _lock:
        _counters[(name, label_key)] += amount


def observe(name: str, value: float, labels: Optional[dict] = None, buckets: tuple = _DEFAULT_BUCKETS_MS) -> None:
    if value is None:
        return
    try:
        v = float(value)
    except (TypeError, ValueError):
        return
    label_key = tuple(sorted((labels or {}).items()))
    with _lock:
        entry = _histograms[(name, label_key)]
        entry['sum'] += v
        entry['count'] += 1
        placed = False
        for bound in buckets:
            if v <= bound:
                entry['buckets'][bound] += 1
                placed = True
                break
        if not placed:
            entry['buckets']['+Inf'] += 1
        entry.setdefault('_buckets_def', tuple(buckets))


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
