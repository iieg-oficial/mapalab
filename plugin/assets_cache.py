import hashlib
import os
from typing import Optional

from qgis.core import QgsApplication

from .api.client import MapaLabClient, MapaLabError

CACHE_DIR: str = 'assets'


def _cache_dir() -> str:
    carpeta = os.path.join(QgsApplication.qgisSettingsDirPath(), 'mapalab', CACHE_DIR)
    os.makedirs(carpeta, exist_ok=True)
    return carpeta


def _cache_name(url: str) -> str:
    digest = hashlib.sha1(url.encode('utf-8')).hexdigest()[:16]
    extension = os.path.splitext(url.split('?')[0])[1][:6] or '.bin'
    return f'{digest}{extension}'


def _leer(nombre: str) -> Optional[bytes]:
    path = os.path.join(_cache_dir(), nombre)
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'rb') as handle:
            return handle.read() or None
    except OSError:
        return None


def _escribir(nombre: str, datos: bytes) -> None:
    try:
        with open(os.path.join(_cache_dir(), nombre), 'wb') as handle:
            handle.write(datos)
    except OSError:
        pass


def _descargar(client: MapaLabClient, url: str) -> Optional[bytes]:
    try:
        status, content, _ = client._request(url)
    except MapaLabError:
        return None
    if (status and status >= 400) or not content:
        return None
    return content


def fetch_asset(client: MapaLabClient, urls: list[str]) -> Optional[bytes]:
    candidatas = [url for url in urls if url]
    if not candidatas:
        return None

    for url in candidatas:
        cacheado = _leer(_cache_name(url))
        if cacheado:
            return cacheado

    for url in candidatas:
        datos = _descargar(client, url)
        if datos:
            _escribir(_cache_name(url), datos)
            return datos

    return None
