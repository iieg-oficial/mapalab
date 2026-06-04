from __future__ import annotations

import threading
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional

import httpx

from app.config import settings
from app.utils.logger import Logger


@dataclass
class _DailyEntry:
    requests: int = 0
    errors: int = 0
    bytes_out: int = 0


@dataclass
class _KeyUsage:
    requests_today: int = 0
    requests_this_month: int = 0
    last_reset_day: Optional[date] = None
    last_reset_month: Optional[tuple[int, int]] = None
    daily_buffer: dict[date, _DailyEntry] = field(default_factory=lambda: defaultdict(_DailyEntry))


class QuotaTracker:
    """Counter en memoria de uso por API key + buffer para flush periódico a mariachi."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._usage: dict[int, _KeyUsage] = {}

    def _ensure_period(self, entry: _KeyUsage, today: date) -> None:
        if entry.last_reset_day != today:
            entry.requests_today = 0
            entry.last_reset_day = today
        month_key = (today.year, today.month)
        if entry.last_reset_month != month_key:
            entry.requests_this_month = 0
            entry.last_reset_month = month_key

    def can_consume(
        self,
        key_id: int,
        cuota_diaria: Optional[int],
        cuota_mensual: Optional[int],
    ) -> bool:
        today = datetime.now(timezone.utc).date()
        with self._lock:
            entry = self._usage.setdefault(key_id, _KeyUsage())
            self._ensure_period(entry, today)
            if cuota_diaria is not None and entry.requests_today >= cuota_diaria:
                return False
            if cuota_mensual is not None and entry.requests_this_month >= cuota_mensual:
                return False
        return True

    def record(self, key_id: int, *, error: bool = False, bytes_out: int = 0) -> None:
        today = datetime.now(timezone.utc).date()
        with self._lock:
            entry = self._usage.setdefault(key_id, _KeyUsage())
            self._ensure_period(entry, today)
            entry.requests_today += 1
            entry.requests_this_month += 1
            buf = entry.daily_buffer[today]
            buf.requests += 1
            if error:
                buf.errors += 1
            if bytes_out:
                buf.bytes_out += bytes_out

    def drain_buffer(self) -> dict[int, dict[date, _DailyEntry]]:
        """Saca y limpia el buffer para flush. Conserva el counter en memoria de día/mes."""
        with self._lock:
            out: dict[int, dict[date, _DailyEntry]] = {}
            for key_id, entry in self._usage.items():
                if not entry.daily_buffer:
                    continue
                out[key_id] = dict(entry.daily_buffer)
                entry.daily_buffer.clear()
            return out


_tracker = QuotaTracker()


def get_tracker() -> QuotaTracker:
    return _tracker


def flush_to_mariachi() -> int:
    """Envía el buffer acumulado a mariachi. Devuelve el número de filas enviadas.

    Idempotente: si el endpoint upserta, repetir no daña.
    """
    if not settings.MARIACHI_BACKEND_URL or not settings.MAPALAB_INTERNAL_TOKEN:
        return 0
    buffer = _tracker.drain_buffer()
    if not buffer:
        return 0

    payload_items: list[dict] = []
    for key_id, daily in buffer.items():
        for d, entry in daily.items():
            payload_items.append({
                'keyId': key_id,
                'dia': d.isoformat(),
                'requests': entry.requests,
                'errores': entry.errors,
                'bytesOut': entry.bytes_out,
            })
    if not payload_items:
        return 0

    url = f"{settings.MARIACHI_BACKEND_URL.rstrip('/')}/api/administrador/internal/mapalab/keys/usage"
    try:
        with httpx.Client(timeout=8.0, verify=settings.MARIACHI_VERIFY_SSL) as client:
            response = client.post(
                url,
                json={'items': payload_items},
                headers={'X-Internal-Token': settings.MAPALAB_INTERNAL_TOKEN},
            )
        if response.status_code != 200:
            Logger.warning(f"quota.flush.unexpected_status status={response.status_code}")
            return 0
        return len(payload_items)
    except httpx.RequestError as exc:
        Logger.error(f"quota.flush.request_error {exc}")
        return 0
