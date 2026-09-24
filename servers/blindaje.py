from __future__ import annotations

import threading
import time
from collections import deque
from typing import Any, Callable, Optional

MAX_TEXTO_ANOTACION = 200
MAX_ETIQUETA_LADO = 60
MAX_SLUG = 200
MAX_ANOTACIONES = 200

CAMPOS_ANOTACION = frozenset({'id', 'type', 'geometry', 'label', 'value', 'unit', 'textLabel', 'rotation'})
TEXTOS_ANOTACION = ('id', 'label', 'unit', 'textLabel')

RANGOS_VISTA = {
    'lat': (17.0, 24.5),
    'lon': (-107.5, -99.5),
    'zoom': (1.0, 20.0),
    'rotation': (-360.0, 360.0),
}


def _es_numero(valor: Any) -> bool:
    return isinstance(valor, (int, float)) and not isinstance(valor, bool) and valor == valor


def limpiar_capas(items: Optional[list]) -> list[dict]:
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


def validar_etiqueta(texto: str, campo: str) -> str:
    limpio = (texto or '').strip()
    if len(limpio) > MAX_ETIQUETA_LADO:
        raise ValueError(f'{campo} admite hasta {MAX_ETIQUETA_LADO} caracteres.')
    return limpio


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
        valor = anotacion.get('value')
        if valor is not None and not _es_numero(valor) and not (isinstance(valor, str) and len(valor) <= MAX_TEXTO_ANOTACION):
            raise ValueError(f'annotations[{indice}].value debe ser número o texto corto.')
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


techo_compartidos = Techo(por_minuto=30, por_dia=2000)
