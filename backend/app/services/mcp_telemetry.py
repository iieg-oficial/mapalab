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
class McpEventRecord:
    timestamp: datetime
    method: str
    tool: Optional[str]
    status: str
    error_code: Optional[int] = None
    duration_ms: Optional[int] = None
    bytes_out: Optional[int] = None
    session_hash: Optional[str] = None
    ip_hash: Optional[str] = None
    client_name: Optional[str] = None
    client_version: Optional[str] = None

    def to_payload(self) -> dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'method': self.method,
            'tool': self.tool,
            'status': self.status,
            'errorCode': self.error_code,
            'durationMs': self.duration_ms,
            'bytesOut': self.bytes_out,
            'sessionHash': self.session_hash,
            'ipHash': self.ip_hash,
            'clientName': self.client_name,
            'clientVersion': self.client_version,
        }


def _hash_with_salt(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    salt = settings.MAPALAB_INTERNAL_TOKEN or 'mapalab'
    return hashlib.sha256(f"{salt}|{value}".encode('utf-8')).hexdigest()


def hash_session(session_id: Optional[str]) -> Optional[str]:
    return _hash_with_salt(session_id)


def hash_ip(ip: Optional[str]) -> Optional[str]:
    return _hash_with_salt(ip)


class _McpTelemetryLogger:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._buffer: deque[McpEventRecord] = deque(maxlen=_MAX_BUFFER_SIZE)

    def record(
        self,
        *,
        method: str,
        tool: Optional[str],
        status: str,
        error_code: Optional[int] = None,
        duration_ms: Optional[int] = None,
        bytes_out: Optional[int] = None,
        session_id: Optional[str] = None,
        ip: Optional[str] = None,
        client_name: Optional[str] = None,
        client_version: Optional[str] = None,
    ) -> None:
        with self._lock:
            self._buffer.append(McpEventRecord(
                timestamp=datetime.now(timezone.utc),
                method=method,
                tool=tool,
                status=status,
                error_code=error_code,
                duration_ms=duration_ms,
                bytes_out=bytes_out,
                session_hash=hash_session(session_id),
                ip_hash=hash_ip(ip),
                client_name=client_name,
                client_version=client_version,
            ))

    def drain(self) -> list[McpEventRecord]:
        with self._lock:
            items = list(self._buffer)
            self._buffer.clear()
        return items


_instance: Optional[_McpTelemetryLogger] = None


def get_logger() -> _McpTelemetryLogger:
    global _instance
    if _instance is None:
        _instance = _McpTelemetryLogger()
    return _instance


def _flush_sync(records: list[McpEventRecord]) -> None:
    if not records:
        return
    if not settings.MARIACHI_BACKEND_URL or not settings.MAPALAB_INTERNAL_TOKEN:
        Logger.warning('mcp_telemetry.skip reason=no_config records=%d', len(records))
        return
    url = f"{settings.MARIACHI_BACKEND_URL.rstrip('/')}/api/administrador/internal/mapalab/mcp/events"
    headers = {'X-Internal-Token': settings.MAPALAB_INTERNAL_TOKEN}
    body = {'items': [r.to_payload() for r in records]}
    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT) as client:
            response = client.post(url, json=body, headers=headers)
        if response.status_code >= 400:
            Logger.warning(
                f"mcp_telemetry.flush.bad_status status={response.status_code} body={response.text[:200]}"
            )
    except httpx.RequestError as exc:
        Logger.warning(f"mcp_telemetry.flush.error error={exc} records={len(records)}")


async def mcp_telemetry_flush_loop() -> None:
    logger = get_logger()
    while True:
        await asyncio.sleep(_FLUSH_INTERVAL_SECONDS)
        records = logger.drain()
        if not records:
            continue
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _flush_sync, records)
