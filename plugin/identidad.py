import json
import os
from typing import Any, Optional

from qgis.core import QgsApplication

from .config import (
    ICONO_ARCHIVO,
    ICONO_CACHE,
    ICONOS_PATH,
    LOGOS,
    LOGOS_PATH,
    REFRESH_ARCHIVO,
    TEMAS_PATH,
    get_base_url,
)

IDENTIDAD_FILE: str = 'identidad.json'


def _datos() -> dict[str, Any]:
    path = os.path.join(os.path.dirname(__file__), IDENTIDAD_FILE)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, 'r', encoding='utf-8') as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return {}


def _url_servidor(archivo: str) -> str:
    base = get_base_url()
    return f'{base}{LOGOS_PATH}/{archivo}' if base and archivo else ''


def _url_catalogo(marca: str, oscuro: bool) -> str:
    logos = (_datos().get('logos') or {}).get(marca) or {}
    clave = 'oscuro' if oscuro else 'claro'
    return str(logos.get(clave) or logos.get('claro') or '')


def logo_urls(marca: str, oscuro: bool) -> list[str]:
    archivo = LOGOS.get(marca, ('', ''))[1 if oscuro else 0]
    return [_url_servidor(archivo), _url_catalogo(marca, oscuro)]


def icono_urls() -> list[str]:
    catalogo = _url_catalogo('mapalab', False)
    remoto = catalogo.rsplit('/', 1)[0] + f'/{ICONO_ARCHIVO}' if catalogo else ''
    return [_url_servidor(ICONO_ARCHIVO), remoto]


def tema_icono_urls(alias: str, hover: bool = False) -> list[str]:
    if not alias:
        return []
    archivo = f'{alias}_hover.svg' if hover else f'{alias}.svg'
    base = get_base_url()
    propio = f'{base}{TEMAS_PATH}/{archivo}' if base else ''
    catalogo = _url_catalogo('iieg', False)
    raiz = catalogo.split('/acervo/')[0] if '/acervo/' in catalogo else ''
    respaldo = f'{raiz}{TEMAS_PATH}/{archivo}' if raiz else ''
    return [propio, respaldo]


def refrescar_urls() -> list[str]:
    base = get_base_url()
    propio = f'{base}{ICONOS_PATH}/{REFRESH_ARCHIVO}' if base else ''
    catalogo = _url_catalogo('iieg', False)
    raiz = catalogo.split('/acervo/')[0] if '/acervo/' in catalogo else ''
    respaldo = f'{raiz}{ICONOS_PATH}/{REFRESH_ARCHIVO}' if raiz else ''
    return [propio, respaldo]


def icono_cache_path() -> str:
    carpeta = os.path.join(QgsApplication.qgisSettingsDirPath(), 'mapalab')
    os.makedirs(carpeta, exist_ok=True)
    return os.path.join(carpeta, ICONO_CACHE)


def icono_guardado() -> Optional[str]:
    path = icono_cache_path()
    return path if os.path.exists(path) else None


def guardar_icono(datos: bytes) -> None:
    try:
        with open(icono_cache_path(), 'wb') as handle:
            handle.write(datos)
    except OSError:
        pass
