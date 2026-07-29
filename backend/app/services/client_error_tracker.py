from __future__ import annotations

import fcntl
import json
import os
import time
from typing import Any

from app.config import settings

_STATE_PATH = os.getenv('CLIENT_ERROR_STATE_PATH', '/tmp/mapalab_client_errors.json')
_MAX_EVENTS = 500


def _window_seconds() -> int:
    return max(settings.CLIENT_ERROR_WINDOW_MINUTES, 1) * 60


def _read_locked(handle) -> list[dict[str, Any]]:
    handle.seek(0)
    raw = handle.read()
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def _prune(events: list[dict[str, Any]], now: float) -> list[dict[str, Any]]:
    cutoff = now - _window_seconds()
    fresh = [e for e in events if isinstance(e, dict) and float(e.get('ts', 0)) >= cutoff]
    return fresh[-_MAX_EVENTS:]


def record(error_type: str) -> None:
    now = time.time()
    try:
        with open(_STATE_PATH, 'a+') as handle:
            fcntl.flock(handle, fcntl.LOCK_EX)
            try:
                events = _prune(_read_locked(handle), now)
                events.append({'ts': now, 'type': error_type})
                handle.seek(0)
                handle.truncate()
                json.dump(events, handle)
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)
    except OSError:
        return


def snapshot() -> dict[str, Any]:
    now = time.time()
    events: list[dict[str, Any]] = []
    try:
        if os.path.exists(_STATE_PATH):
            with open(_STATE_PATH, 'r') as handle:
                fcntl.flock(handle, fcntl.LOCK_SH)
                try:
                    events = _prune(_read_locked(handle), now)
                finally:
                    fcntl.flock(handle, fcntl.LOCK_UN)
    except OSError:
        events = []

    by_type: dict[str, int] = {}
    for event in events:
        key = str(event.get('type') or 'unknown')
        by_type[key] = by_type.get(key, 0) + 1

    total = len(events)
    status = 'degraded' if total >= settings.CLIENT_ERROR_WARN_COUNT else 'ok'
    result: dict[str, Any] = {
        'status': status,
        'count': total,
        'window_minutes': settings.CLIENT_ERROR_WINDOW_MINUTES,
    }
    if by_type:
        result['by_type'] = by_type
    if status == 'degraded':
        dominant = max(by_type, key=by_type.get)
        result['detail'] = (
            f'{total} errores de carga en el navegador en '
            f'{settings.CLIENT_ERROR_WINDOW_MINUTES} min (predomina {dominant})'
        )
    return result
