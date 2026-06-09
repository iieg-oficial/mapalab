from __future__ import annotations

import asyncio
import hashlib
import threading
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import settings
from app.utils.logger import Logger


_FLUSH_INTERVAL_SECONDS = 30.0
_MAX_BUFFER_SIZE = 5000
_HTTP_TIMEOUT = 6.0


@dataclass
class AccessRecord:
    api_key_id: int
    timestamp: datetime
    endpoint: str
    resultado: str
    motivo: Optional[str] = None
    origin: Optional[str] = None
    ip_hash: Optional[str] = None
    layers: Optional[list[str]] = None
    request_id: Optional[str] = None

    def to_payload(self) -> dict:
        return {
            'apiKeyId': self.api_key_id,
            'timestamp': self.timestamp.isoformat(),
            'endpoint': self.endpoint,
            'resultado': self.resultado,
            'motivo': self.motivo,
            'origin': self.origin,
            'ipHash': self.ip_hash,
            'layers': list(self.layers or []),
            'requestId': self.request_id,
        }


def hash_ip(ip: Optional[str]) -> Optional[str]:
    if not ip:
        return None
    salt = settings.MAPALAB_INTERNAL_TOKEN or 'mapalab'
    return hashlib.sha256(f"{salt}|{ip}".encode('utf-8')).hexdigest()


class _AccessLogger:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._buffer: deque[AccessRecord] = deque(maxlen=_MAX_BUFFER_SIZE)

    def record(
        self,
        *,
        api_key_id: Optional[int],
        endpoint: str,
        resultado: str,
        motivo: Optional[str] = None,
        origin: Optional[str] = None,
        ip: Optional[str] = None,
        layers: Optional[list[str]] = None,
        request_id: Optional[str] = None,
    ) -> None:
        if api_key_id is None:
            return
        with self._lock:
            self._buffer.append(AccessRecord(
                api_key_id=api_key_id,
                timestamp=datetime.now(timezone.utc),
                endpoint=endpoint,
                resultado=resultado,
                motivo=motivo,
                origin=origin,
                ip_hash=hash_ip(ip),
                layers=list(layers or []),
                request_id=request_id,
            ))

    def drain(self) -> list[AccessRecord]:
        with self._lock:
            items = list(self._buffer)
            self._buffer.clear()
        return items


_instance: Optional[_AccessLogger] = None


def get_logger() -> _AccessLogger:
    global _instance
    if _instance is None:
        _instance = _AccessLogger()
    return _instance


def _flush_sync(records: list[AccessRecord]) -> None:
    if not records:
        return
    if not settings.MARIACHI_BACKEND_URL or not settings.MAPALAB_INTERNAL_TOKEN:
        Logger.warning('access_logger.skip reason=no_config records=%d', len(records))
        return
    url = f"{settings.MARIACHI_BACKEND_URL.rstrip('/')}/api/administrador/internal/mapalab/keys/accesos"
    headers = {'X-Internal-Token': settings.MAPALAB_INTERNAL_TOKEN}
    body = {'items': [r.to_payload() for r in records]}
    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT, verify=settings.MARIACHI_VERIFY_SSL) as client:
            response = client.post(url, json=body, headers=headers)
        if response.status_code >= 400:
            Logger.warning(
                f"access_logger.flush.bad_status status={response.status_code} body={response.text[:200]}"
            )
    except httpx.RequestError as exc:
        Logger.warning(f"access_logger.flush.error error={exc} records={len(records)}")


async def access_flush_loop() -> None:
    logger = get_logger()
    while True:
        await asyncio.sleep(_FLUSH_INTERVAL_SECONDS)
        records = logger.drain()
        if not records:
            continue
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _flush_sync, records)
