import json
import os
import re
from typing import Any, Optional

from qgis.PyQt.QtCore import QUrl
from qgis.PyQt.QtNetwork import QNetworkRequest
from qgis.core import QgsApplication, QgsBlockingNetworkRequest

from ..config import (
    CLIENT_HEADER,
    CLIENT_VALUE,
    ETAG_CACHE_FILE,
    REQUEST_TIMEOUT_MS,
    TREE_CACHE_FILE,
    api_url,
    get_base_url,
)


class MapaLabError(Exception):
    pass


def _describe(content: bytes) -> str:
    text = content[:400].decode('utf-8', errors='replace').strip()
    if not text:
        return 'Respuesta vacía.'
    if text.lstrip().lower().startswith(('<!doctype', '<html')):
        title = re.search(r'<title[^>]*>(.*?)</title>', text, re.IGNORECASE | re.DOTALL)
        detail = title.group(1).strip() if title else 'sin título'
        return f'Llegó una página HTML ({detail}), no la API.'
    return f'Empieza con: {text[:120]!r}'


def _cache_dir() -> str:
    path = os.path.join(QgsApplication.qgisSettingsDirPath(), 'mapalab')
    os.makedirs(path, exist_ok=True)
    return path


def _read_cache(name: str) -> Optional[str]:
    path = os.path.join(_cache_dir(), name)
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r', encoding='utf-8') as handle:
            return handle.read()
    except OSError:
        return None


def _write_cache(name: str, content: str) -> None:
    try:
        with open(os.path.join(_cache_dir(), name), 'w', encoding='utf-8') as handle:
            handle.write(content)
    except OSError:
        pass


class MapaLabClient:

    def __init__(self) -> None:
        self._tree: Optional[list[dict[str, Any]]] = None

    def _request(self, url: str, etag: Optional[str] = None,
                 timeout_ms: int = REQUEST_TIMEOUT_MS) -> tuple[int, bytes, Optional[str]]:
        if not get_base_url():
            raise MapaLabError('Falta configurar la dirección de MapaLab.')

        request = QNetworkRequest(QUrl(url))
        request.setRawHeader(CLIENT_HEADER, CLIENT_VALUE)
        request.setTransferTimeout(timeout_ms)
        if etag:
            request.setRawHeader(b'If-None-Match', etag.encode('utf-8'))

        blocking = QgsBlockingNetworkRequest()
        error = blocking.get(request, forceRefresh=True)
        reply = blocking.reply()
        status = reply.attribute(QNetworkRequest.HttpStatusCodeAttribute) or 0

        if error != QgsBlockingNetworkRequest.NoError and status != 304:
            raise MapaLabError(blocking.errorMessage() or 'Error de red')

        raw_etag = reply.rawHeader(b'ETag')
        new_etag = bytes(raw_etag).decode('utf-8') if raw_etag else None
        return int(status), bytes(reply.content()), new_etag

    def _decode_json(self, status: int, content: bytes, label: str) -> Any:
        if status and status >= 400:
            raise MapaLabError(f'{label}: el servidor respondió {status}. {_describe(content)}')
        if not content.strip():
            raise MapaLabError(
                f'{label}: el servidor respondió {status or "sin estado"} y sin contenido. '
                'Revisa la dirección y que el certificado esté aceptado.')
        try:
            return json.loads(content.decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise MapaLabError(
                f'{label}: la respuesta no es JSON ({status}). {_describe(content)}') from exc

    def _get_json(self, path: str) -> Any:
        status, content, _ = self._request(api_url(path))
        return self._decode_json(status, content, path)

    def fetch_tree(self, force: bool = False) -> list[dict[str, Any]]:
        if self._tree is not None and not force:
            return self._tree

        cached_etag = _read_cache(ETAG_CACHE_FILE)
        cached_tree = _read_cache(TREE_CACHE_FILE)
        url = api_url('/layers/tree')

        try:
            status, content, etag = self._request(url, etag=cached_etag)
            if status == 304 and not cached_tree:
                status, content, etag = self._request(url)
        except MapaLabError:
            if cached_tree:
                self._tree = json.loads(cached_tree)
                return self._tree
            raise

        if status == 304 and cached_tree:
            self._tree = json.loads(cached_tree)
            return self._tree

        self._tree = self._decode_json(status, content, 'Catálogo de capas')
        _write_cache(TREE_CACHE_FILE, content.decode('utf-8'))
        if etag:
            _write_cache(ETAG_CACHE_FILE, etag)
        return self._tree

    def fetch_metadata(self, workspace: str, layer: str) -> Any:
        return self._get_json(f'/metadata/?workspace={workspace}&layer={layer}')

    def fetch_periodicity(self, workspace: str, layer: str) -> dict[str, Any]:
        payload = self._get_json(f'/periodicity/?workspace={workspace}&layer={layer}')
        if isinstance(payload, dict):
            return payload.get('periodicity') or {}
        return {}

    def fetch_municipios(self) -> list[dict[str, Any]]:
        payload = self._get_json('/municipios/')
        if isinstance(payload, dict):
            return payload.get('items') or []
        return []

    def download(self, url: str, destination: str, timeout_ms: int) -> int:
        _, content, _ = self._request(url, timeout_ms=timeout_ms)
        with open(destination, 'wb') as handle:
            handle.write(content)
        return len(content)
