from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import settings
from app.utils.logger import Logger

_TIMEOUT_SECONDS = 4.0
_CACHE_MAX_ENTRIES = 1024


@dataclass
class ValidationResult:
    valid: bool
    key_id: Optional[int] = None
    visibility: Optional[str] = None
    capas_permitidas: list[str] = None
    dominios_permitidos: list[str] = None
    cuota_diaria: Optional[int] = None
    cuota_mensual: Optional[int] = None
    institucion_nombre: Optional[str] = None
    reason: Optional[str] = None
    cached_at: float = 0.0

    def __post_init__(self) -> None:
        if self.capas_permitidas is None:
            self.capas_permitidas = []
        if self.dominios_permitidos is None:
            self.dominios_permitidos = []


class _ValidatorCache:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._store: dict[tuple, ValidationResult] = {}

    def get(self, cache_key: tuple) -> Optional[ValidationResult]:
        with self._lock:
            entry = self._store.get(cache_key)
        if entry is None:
            return None
        if time.time() - entry.cached_at > settings.EMBED_KEY_CACHE_TTL_SECONDS:
            self.invalidate(cache_key)
            return None
        return entry

    def set(self, cache_key: tuple, result: ValidationResult) -> None:
        result.cached_at = time.time()
        with self._lock:
            if len(self._store) >= _CACHE_MAX_ENTRIES:
                self._store.pop(next(iter(self._store)))
            self._store[cache_key] = result

    def invalidate(self, cache_key: tuple) -> None:
        with self._lock:
            self._store.pop(cache_key, None)

    def invalidate_prefix(self, key_prefix: str) -> int:
        removed = 0
        with self._lock:
            for ck in list(self._store.keys()):
                if ck and ck[0] == key_prefix:
                    self._store.pop(ck, None)
                    removed += 1
        return removed

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


_cache = _ValidatorCache()


_PUBLIC_PREFIX = 'mk_pub_'
_PRIVATE_PREFIX = 'mk_priv_'


def _visible_prefix(plain_key: str) -> str:
    if plain_key.startswith(_PUBLIC_PREFIX):
        return plain_key[: len(_PUBLIC_PREFIX) + 4]
    if plain_key.startswith(_PRIVATE_PREFIX):
        return plain_key[: len(_PRIVATE_PREFIX) + 4]
    return plain_key[:12] if plain_key else ''


def _build_cache_key(plain_key: str, origin: Optional[str], requested_layers: list[str]) -> tuple:
    return (
        _visible_prefix(plain_key),
        origin or '',
        tuple(sorted(requested_layers or [])),
    )


def _validate_remote(
    plain_key: str,
    origin: Optional[str],
    ip: Optional[str],
    requested_layers: list[str],
) -> ValidationResult:
    if not settings.MARIACHI_BACKEND_URL:
        Logger.error('embed.validate.missing_mariachi_url')
        return ValidationResult(valid=False, reason='mariachi_url_missing')
    if not settings.MAPALAB_INTERNAL_TOKEN:
        Logger.error('embed.validate.missing_internal_token')
        return ValidationResult(valid=False, reason='internal_token_missing')

    url = f"{settings.MARIACHI_BACKEND_URL.rstrip('/')}/api/administrador/internal/mapalab/keys/validate"
    payload = {
        'key': plain_key,
        'origin': origin,
        'ip': ip,
        'requestedLayers': requested_layers,
    }
    try:
        with httpx.Client(timeout=_TIMEOUT_SECONDS) as client:
            response = client.post(
                url,
                json=payload,
                headers={'X-Internal-Token': settings.MAPALAB_INTERNAL_TOKEN},
            )
        if response.status_code != 200:
            Logger.warning(
                f"embed.validate.unexpected_status status={response.status_code} body={response.text[:200]}"
            )
            return ValidationResult(valid=False, reason=f"mariachi_status_{response.status_code}")
        body = response.json()
        return ValidationResult(
            valid=bool(body.get('valid', False)),
            key_id=body.get('keyId'),
            visibility=body.get('visibility'),
            capas_permitidas=body.get('capasPermitidas') or [],
            dominios_permitidos=body.get('dominiosPermitidos') or [],
            cuota_diaria=body.get('cuotaDiaria'),
            cuota_mensual=body.get('cuotaMensual'),
            institucion_nombre=body.get('institucionNombre'),
            reason=body.get('reason'),
        )
    except httpx.RequestError as exc:
        Logger.error(f"embed.validate.request_error {exc}")
        return ValidationResult(valid=False, reason='mariachi_unreachable')


def validate_api_key(
    plain_key: str,
    origin: Optional[str] = None,
    ip: Optional[str] = None,
    requested_layers: Optional[list[str]] = None,
    bypass_cache: bool = False,
) -> ValidationResult:
    requested = requested_layers or []
    cache_key = _build_cache_key(plain_key, origin, requested)
    if not bypass_cache:
        cached = _cache.get(cache_key)
        if cached is not None:
            return cached
    result = _validate_remote(plain_key, origin, ip, requested)
    if result.valid:
        _cache.set(cache_key, result)
    return result


def invalidate_cache_for_prefix(key_prefix: str) -> int:
    return _cache.invalidate_prefix(key_prefix)


def clear_cache() -> None:
    _cache.clear()
