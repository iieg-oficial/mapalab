from __future__ import annotations

import fcntl
import json
import os
import time
from typing import Any, Callable

_MAX_EVENTS = 500


class VentanaEventos:
    """Cuenta eventos de los ultimos N minutos en un archivo compartido.

    El backend corre con varios workers, asi que un contador en memoria solo
    veria el trafico de su propio proceso. El archivo con `flock` lo comparten
    todos, y la poda por ventana permite comparar contra un umbral sin que el
    acumulado crezca para siempre.
    """

    def __init__(self, path: str, window_minutes: Callable[[], int], max_events: int = _MAX_EVENTS):
        self._path = path
        self._window_minutes = window_minutes
        self._max_events = max_events

    def _window_seconds(self) -> int:
        return max(self._window_minutes(), 1) * 60

    def _read_locked(self, handle) -> list[dict[str, Any]]:
        handle.seek(0)
        raw = handle.read()
        if not raw:
            return []
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return []
        return data if isinstance(data, list) else []

    def _prune(self, events: list[dict[str, Any]], now: float) -> list[dict[str, Any]]:
        cutoff = now - self._window_seconds()
        fresh = [e for e in events if isinstance(e, dict) and float(e.get('ts', 0)) >= cutoff]
        return fresh[-self._max_events:]

    def record(self, tipo: str) -> None:
        now = time.time()
        try:
            with open(self._path, 'a+') as handle:
                fcntl.flock(handle, fcntl.LOCK_EX)
                try:
                    events = self._prune(self._read_locked(handle), now)
                    events.append({'ts': now, 'type': tipo})
                    handle.seek(0)
                    handle.truncate()
                    json.dump(events, handle)
                finally:
                    fcntl.flock(handle, fcntl.LOCK_UN)
        except OSError:
            return

    def por_tipo(self) -> tuple[int, dict[str, int]]:
        now = time.time()
        events: list[dict[str, Any]] = []
        try:
            if os.path.exists(self._path):
                with open(self._path, 'r') as handle:
                    fcntl.flock(handle, fcntl.LOCK_SH)
                    try:
                        events = self._prune(self._read_locked(handle), now)
                    finally:
                        fcntl.flock(handle, fcntl.LOCK_UN)
        except OSError:
            events = []

        by_type: dict[str, int] = {}
        for event in events:
            key = str(event.get('type') or 'unknown')
            by_type[key] = by_type.get(key, 0) + 1
        return len(events), by_type
