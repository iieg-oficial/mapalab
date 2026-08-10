import json
import os
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
        if etag:
            request.setRawHeader(b'If-None-Match', etag.encode('utf-8'))

        blocking = QgsBlockingNetworkRequest()
        blocking.setTimeout(timeout_ms)
        error = blocking.get(request, forceRefresh=True)
        reply = blocking.reply()
        status = reply.attribute(QNetworkRequest.HttpStatusCodeAttribute) or 0

        if error != QgsBlockingNetworkRequest.NoError and status != 304:
            raise MapaLabError(blocking.errorMessage() or 'Error de red')

        raw_etag = reply.rawHeader(b'ETag')
        new_etag = bytes(raw_etag).decode('utf-8') if raw_etag else None
        return int(status), bytes(reply.content()), new_etag

    def _get_json(self, path: str) -> Any:
        _, content, _ = self._request(api_url(path))
        if not content:
            return None
        try:
            return json.loads(content.decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise MapaLabError(f'Respuesta inválida de {path}') from exc

    def fetch_tree(self, force: bool = False) -> list[dict[str, Any]]:
        if self._tree is not None and not force:
            return self._tree

        cached_etag = _read_cache(ETAG_CACHE_FILE)
        cached_tree = _read_cache(TREE_CACHE_FILE)

        try:
            status, content, etag = self._request(api_url('/layers/tree'), etag=cached_etag)
        except MapaLabError:
            if cached_tree:
                self._tree = json.loads(cached_tree)
                return self._tree
            raise

        if status == 304 and cached_tree:
            self._tree = json.loads(cached_tree)
            return self._tree

        text = content.decode('utf-8')
        self._tree = json.loads(text)
        _write_cache(TREE_CACHE_FILE, text)
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
