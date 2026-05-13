from __future__ import annotations

import threading
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Response

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

    hist_by_name: dict[str, list[tuple[tuple[tuple[str, str], ...], dict]]] = defaultdict(list)
    for (name, label_key), entry in _histograms.items():
        hist_by_name[name].append((label_key, entry))
    for name in sorted(hist_by_name.keys()):
        lines.append(f'# TYPE {name} histogram')
        for label_key, entry in sorted(hist_by_name[name], key=lambda x: x[0]):
            buckets = entry.get('_buckets_def', _DEFAULT_BUCKETS_MS)
            cumulative = 0
            for bound in buckets:
                cumulative += entry['buckets'].get(bound, 0)
                base = list(label_key) + [('le', str(bound))]
                lines.append(f'{name}_bucket{_format_labels(tuple(base))} {cumulative}')
            cumulative += entry['buckets'].get('+Inf', 0)
            base_inf = list(label_key) + [('le', '+Inf')]
            lines.append(f'{name}_bucket{_format_labels(tuple(base_inf))} {cumulative}')
            lines.append(f'{name}_sum{_format_labels(label_key)} {entry["sum"]}')
            lines.append(f'{name}_count{_format_labels(label_key)} {entry["count"]}')

    return '\n'.join(lines) + '\n'


router = APIRouter(tags=['metrics'])


@router.get('/metrics', include_in_schema=False)
async def metrics() -> Response:
    return Response(content=_render_prometheus(), media_type='text/plain; version=0.0.4')
