from __future__ import annotations

import math
import os
import re
import threading
import time
from collections import deque
from typing import Any, Callable, Optional

from pydantic import BaseModel, Field, ValidationError

from app.services.share_service import MAX_CAPAS, MAX_COORDINATES_PER_GEOMETRY, RANGO_LAT, RANGO_LON

ES_BETA = os.environ.get('MAPALAB_APP_ENV', 'prod') in {'dev', 'beta'}

MAX_TEXTO_ANOTACION = 200
MAX_ETIQUETA_LADO = 60
MAX_SLUG = 200
MAX_ANOTACIONES = 200

CAMPOS_ANOTACION = frozenset({'id', 'type', 'geometry', 'label', 'value', 'unit', 'textLabel', 'rotation'})
TEXTOS_ANOTACION = ('id', 'label', 'unit', 'textLabel')

_CONTACTOS = (
    ('páginas web', re.compile(
        r'(https?://|www\.|\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|net|org|info|biz|mx|gob|edu|io|co|me|app|site|online|link|ly|xyz|top|club|shop|store|tk|ru|cn)\b)',
        re.IGNORECASE,
    )),
    ('correos', re.compile(r'[\w.+-]+\s*(@|\(at\)|\[at\])\s*[\w-]+\s*\.\s*\w+', re.IGNORECASE)),
    ('teléfonos', re.compile(r'(\+\s*\d[\d\s().-]{6,}\d|\(?\d{2,3}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}\b)')),
)

RANGOS_VISTA = {
    'lat': (17.0, 24.5),
    'lon': (-107.5, -99.5),
    'zoom': (1.0, 20.0),
    'rotation': (-360.0, 360.0),
}


class Vista3d(BaseModel):
    inclinacion: int = Field(default=55, ge=0, le=80, description='Inclinacion de la camara en grados: 0 mira desde arriba, 80 casi al horizonte.')
    rumbo: float = Field(default=0, ge=-180, le=180, description='Hacia donde mira la camara, en grados desde el norte.')
    exageracion: float = Field(default=1.5, ge=1, le=5, description='Exageracion vertical del relieve.')
    extruir: list[str] = Field(default_factory=list, max_length=10, description='Ids de capas del mapa que se levantan en columnas.')


def _es_numero(valor: Any) -> bool:
    return isinstance(valor, (int, float)) and not isinstance(valor, bool) and math.isfinite(valor)


def por_proceso(total: int) -> int:
    try:
        procesos = max(1, int(os.environ.get('MCP_WORKERS') or 1))
    except ValueError:
        procesos = 1
    return max(1, total // procesos)


def limpiar_capas(items: Optional[list]) -> list[dict]:
    if items is not None and not isinstance(items, list):
        raise ValueError('Las capas deben ir en una lista.')
    if len(items or []) > MAX_CAPAS:
        raise ValueError(f'Un mapa admite hasta {MAX_CAPAS} capas.')
    capas: list[dict] = []
    for crudo in items or []:
        entrada = {'slug': crudo} if isinstance(crudo, str) else crudo
        if not isinstance(entrada, dict):
            raise ValueError('Cada capa debe ser un id (texto) o un objeto {slug, opacity?, visible?}.')
        slug = entrada.get('slug')
        if not isinstance(slug, str) or not slug.strip() or len(slug) > MAX_SLUG:
            raise ValueError('Cada capa necesita un slug de texto no vacío.')
        capa: dict[str, Any] = {'slug': slug.strip()}
        if 'opacity' in entrada:
            opacidad = entrada['opacity']
            if not _es_numero(opacidad) or not 0 <= opacidad <= 1:
                raise ValueError(f"opacity de '{slug}' debe estar entre 0 y 1.")
            capa['opacity'] = opacidad
        if 'visible' in entrada:
            if not isinstance(entrada['visible'], bool):
                raise ValueError(f"visible de '{slug}' debe ser true o false.")
            capa['visible'] = entrada['visible']
        capas.append(capa)
    return capas


def validar_vista(vista: Optional[dict]) -> Optional[dict]:
    if vista is None:
        return None
    if not isinstance(vista, dict):
        raise ValueError('view debe ser un objeto {zoom, lat, lon, rotation?}.')
    limpia: dict[str, float] = {}
    for campo in ('zoom', 'lat', 'lon', 'rotation'):
        if campo not in vista:
            continue
        valor = vista[campo]
        minimo, maximo = RANGOS_VISTA[campo]
        if not _es_numero(valor) or not minimo <= valor <= maximo:
            raise ValueError(f'view.{campo} debe ser un número entre {minimo} y {maximo}.')
        limpia[campo] = valor
    if not {'zoom', 'lat', 'lon'} <= limpia.keys():
        raise ValueError('view necesita zoom, lat y lon.')
    return limpia


def rechazar_contactos(texto: str, campo: str) -> None:
    for tipo, patron in _CONTACTOS:
        if patron.search(texto or ''):
            raise ValueError(f'{campo} no puede llevar {tipo}: los mapas del MCP no publican datos de contacto ni enlaces.')


def validar_etiqueta(texto: str, campo: str) -> str:
    limpio = (texto or '').strip()
    if len(limpio) > MAX_ETIQUETA_LADO:
        raise ValueError(f'{campo} admite hasta {MAX_ETIQUETA_LADO} caracteres.')
    rechazar_contactos(limpio, campo)
    return limpio


def _validar_geometria(geometria: Any, indice: int) -> None:
    if geometria is None:
        return
    if not isinstance(geometria, dict) or not isinstance(geometria.get('type'), str):
        raise ValueError(f'annotations[{indice}].geometry debe ser un objeto GeoJSON con type y coordinates.')
    pila, puntos = [geometria.get('coordinates')], 0
    while pila:
        actual = pila.pop()
        if isinstance(actual, list) and len(actual) in (2, 3) and all(_es_numero(v) for v in actual):
            lon, lat = actual[0], actual[1]
            if not (RANGO_LON[0] <= lon <= RANGO_LON[1] and RANGO_LAT[0] <= lat <= RANGO_LAT[1]):
                raise ValueError(f'annotations[{indice}].geometry tiene coordenadas fuera de la región (EPSG:4326, lon/lat).')
            puntos += 1
        elif isinstance(actual, list) and actual:
            pila.extend(actual)
        else:
            raise ValueError(f'annotations[{indice}].geometry tiene coordenadas inválidas.')
        if puntos > MAX_COORDINATES_PER_GEOMETRY:
            raise ValueError(f'annotations[{indice}].geometry pasa de {MAX_COORDINATES_PER_GEOMETRY} vértices.')


def limpiar_anotaciones(items: Optional[list]) -> Optional[list]:
    if items is None:
        return None
    if not isinstance(items, list):
        raise ValueError('annotations debe ser una lista.')
    if len(items) > MAX_ANOTACIONES:
        raise ValueError(f'annotations admite hasta {MAX_ANOTACIONES} elementos.')
    limpias = []
    for indice, crudo in enumerate(items):
        if not isinstance(crudo, dict):
            raise ValueError(f'annotations[{indice}] debe ser un objeto.')
        anotacion = {campo: valor for campo, valor in crudo.items() if campo in CAMPOS_ANOTACION}
        for campo in TEXTOS_ANOTACION:
            valor = anotacion.get(campo)
            if valor is None:
                continue
            if not isinstance(valor, str) or len(valor) > MAX_TEXTO_ANOTACION:
                raise ValueError(f'annotations[{indice}].{campo} debe ser texto de hasta {MAX_TEXTO_ANOTACION} caracteres.')
            rechazar_contactos(valor, f'annotations[{indice}].{campo}')
        valor = anotacion.get('value')
        if valor is not None and not _es_numero(valor) and not (isinstance(valor, str) and len(valor) <= MAX_TEXTO_ANOTACION):
            raise ValueError(f'annotations[{indice}].value debe ser número o texto corto.')
        if isinstance(valor, str):
            rechazar_contactos(valor, f'annotations[{indice}].value')
        rotacion = anotacion.get('rotation')
        if rotacion is not None and (not _es_numero(rotacion) or not -360 <= rotacion <= 360):
            raise ValueError(f'annotations[{indice}].rotation debe ser un número entre -360 y 360.')
        _validar_geometria(anotacion.get('geometry'), indice)
        limpias.append(anotacion)
    return limpias


class Techo:
    def __init__(self, por_minuto: int, por_dia: int, reloj: Callable[[], float] = time.monotonic) -> None:
        self._ventanas = ((60.0, por_minuto, deque()), (86400.0, por_dia, deque()))
        self._reloj = reloj
        self._candado = threading.Lock()

    def consumir(self) -> bool:
        ahora = self._reloj()
        with self._candado:
            for duracion, _, marcas in self._ventanas:
                while marcas and ahora - marcas[0] >= duracion:
                    marcas.popleft()
            if any(len(marcas) >= tope for _, tope, marcas in self._ventanas):
                return False
            for _, _, marcas in self._ventanas:
                marcas.append(ahora)
            return True


techo_compartidos = Techo(por_minuto=por_proceso(30), por_dia=por_proceso(2000))


def vista3d_a_payload(vista: Any, capas_del_mapa: set[str], resolver: Callable[[str], Optional[dict]]) -> Optional[dict]:
    if vista is None:
        return None
    try:
        modelo = vista if isinstance(vista, Vista3d) else Vista3d.model_validate(vista)
    except ValidationError as exc:
        raise ValueError(f"vista_3d inválida: {exc.errors()[0]['msg']}")
    extruir: list[str] = []
    for crudo in modelo.extruir:
        resuelta = resolver(crudo[:MAX_SLUG])
        if not resuelta or resuelta['id'] not in capas_del_mapa:
            raise ValueError(f"'{crudo}' en vista_3d.extruir debe ser una de las capas del mapa.")
        extruir.append(resuelta['id'])
    return {
        'pitch': modelo.inclinacion,
        'bearing': round(modelo.rumbo, 1),
        'exaggeration': round(modelo.exageracion, 1),
        'extruir': list(dict.fromkeys(extruir)),
    }
