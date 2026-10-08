from __future__ import annotations

import threading
from dataclasses import dataclass, fields
from datetime import date, datetime, timezone
from typing import Optional

import httpx

from app.config import settings
from app.utils.logger import Logger

UMBRALES: dict[str, tuple[float, float]] = {
    'LCP': (2500, 4000),
    'INP': (200, 500),
    'CLS': (0.1, 0.25),
    'FCP': (1800, 3000),
    'TTFB': (800, 1800),
    'LISTO': (3000, 6000),
    'SERVIDOR_CONFIG': (300, 1000),
    'SERVIDOR_WMS': (1000, 3000),
}

_MAX_FILAS = 5000
_HTTP_TIMEOUT = 8.0


@dataclass
class _Rendimiento:
    muestras: int = 0
    suma: float = 0.0
    buenas: int = 0
    regulares: int = 0
    malas: int = 0

    def sumar(self, otro: _Rendimiento) -> None:
        self.muestras += otro.muestras
        self.suma += otro.suma
        self.buenas += otro.buenas
        self.regulares += otro.regulares
        self.malas += otro.malas


@dataclass
class _Sitio:
    cargas: int = 0
    listos: int = 0
    errores_js: int = 0
    denegados: int = 0
    timeouts: int = 0

    def sumar(self, otro: _Sitio) -> None:
        for campo in fields(self):
            setattr(self, campo.name, getattr(self, campo.name) + getattr(otro, campo.name))


CAMPOS_SITIO = tuple(campo.name for campo in fields(_Sitio))

ClaveRendimiento = tuple[int, date, str, str]
ClaveSitio = tuple[int, date, str]


def cubeta(metrica: str, valor: float) -> Optional[str]:
    umbral = UMBRALES.get(metrica)
    if umbral is None:
        return None
    if valor <= umbral[0]:
        return 'buenas'
    if valor <= umbral[1]:
        return 'regulares'
    return 'malas'


def _hoy() -> date:
    return datetime.now(timezone.utc).date()


class AgregadorTelemetria:
    def __init__(self, max_filas: int = _MAX_FILAS) -> None:
        self._lock = threading.Lock()
        self._max_filas = max_filas
        self._rendimiento: dict[ClaveRendimiento, _Rendimiento] = {}
        self._sitios: dict[ClaveSitio, _Sitio] = {}

    def registrar_metrica(self, key_id: int, origen: str, metrica: str, valor: float) -> bool:
        nombre = cubeta(metrica, valor)
        if nombre is None:
            return False
        clave = (key_id, _hoy(), origen or '', metrica)
        with self._lock:
            fila = self._rendimiento.get(clave)
            if fila is None:
                if len(self._rendimiento) >= self._max_filas:
                    return False
                fila = self._rendimiento[clave] = _Rendimiento()
            fila.muestras += 1
            fila.suma += float(valor)
            setattr(fila, nombre, getattr(fila, nombre) + 1)
        return True

    def sumar(self, key_id: int, origen: str, campo: str, cantidad: int = 1) -> bool:
        if campo not in CAMPOS_SITIO or cantidad <= 0:
            return False
        clave = (key_id, _hoy(), origen or '')
        with self._lock:
            fila = self._sitios.get(clave)
            if fila is None:
                if len(self._sitios) >= self._max_filas:
                    return False
                fila = self._sitios[clave] = _Sitio()
            setattr(fila, campo, getattr(fila, campo) + cantidad)
        return True

    def drenar(self) -> tuple[dict[ClaveRendimiento, _Rendimiento], dict[ClaveSitio, _Sitio]]:
        with self._lock:
            rendimiento, self._rendimiento = self._rendimiento, {}
            sitios, self._sitios = self._sitios, {}
        return rendimiento, sitios

    def devolver_rendimiento(self, filas: dict[ClaveRendimiento, _Rendimiento]) -> None:
        with self._lock:
            self._fusionar(self._rendimiento, filas)

    def devolver_sitios(self, filas: dict[ClaveSitio, _Sitio]) -> None:
        with self._lock:
            self._fusionar(self._sitios, filas)

    def _fusionar(self, destino: dict, filas: dict) -> None:
        for clave, fila in filas.items():
            actual = destino.get(clave)
            if actual is not None:
                actual.sumar(fila)
            elif len(destino) < self._max_filas:
                destino[clave] = fila


def payload_rendimiento(filas: dict[ClaveRendimiento, _Rendimiento]) -> list[dict]:
    return [
        {
            'keyId': key_id,
            'dia': dia.isoformat(),
            'origen': origen,
            'metrica': metrica,
            'muestras': fila.muestras,
            'suma': round(fila.suma, 4),
            'buenas': fila.buenas,
            'regulares': fila.regulares,
            'malas': fila.malas,
        }
        for (key_id, dia, origen, metrica), fila in filas.items()
    ]


def payload_sitios(filas: dict[ClaveSitio, _Sitio]) -> list[dict]:
    return [
        {
            'keyId': key_id,
            'dia': dia.isoformat(),
            'origen': origen,
            'cargas': fila.cargas,
            'listos': fila.listos,
            'erroresJs': fila.errores_js,
            'denegados': fila.denegados,
            'timeouts': fila.timeouts,
        }
        for (key_id, dia, origen), fila in filas.items()
    ]


_agregador = AgregadorTelemetria()


def get_agregador() -> AgregadorTelemetria:
    return _agregador


def _enviar(ruta: str, items: list[dict]) -> bool:
    url = f"{settings.MARIACHI_BACKEND_URL.rstrip('/')}/api/mariachi/internal/mapalab/keys/{ruta}"
    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT, verify=settings.MARIACHI_VERIFY_SSL) as client:
            response = client.post(
                url,
                json={'items': items},
                headers={'X-Internal-Token': settings.MAPALAB_INTERNAL_TOKEN},
            )
    except httpx.RequestError as exc:
        Logger.error(f"embed.telemetria.flush.request_error ruta={ruta} {exc}")
        return False
    if response.status_code != 200:
        Logger.warning(f"embed.telemetria.flush.unexpected_status ruta={ruta} status={response.status_code}")
        return False
    return True


def flush_to_mariachi(agregador: Optional[AgregadorTelemetria] = None) -> int:
    if not settings.MARIACHI_BACKEND_URL or not settings.MAPALAB_INTERNAL_TOKEN:
        return 0
    destino = agregador or _agregador
    rendimiento, sitios = destino.drenar()
    enviadas = 0
    if rendimiento:
        if _enviar('rendimiento', payload_rendimiento(rendimiento)):
            enviadas += len(rendimiento)
        else:
            destino.devolver_rendimiento(rendimiento)
    if sitios:
        if _enviar('sitios', payload_sitios(sitios)):
            enviadas += len(sitios)
        else:
            destino.devolver_sitios(sitios)
    return enviadas
