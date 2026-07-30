from __future__ import annotations

import os
from typing import Any

from app.config import settings
from app.services.ventana_eventos import VentanaEventos

_STATE_PATH = os.getenv('CLIENT_ERROR_STATE_PATH', '/tmp/mapalab_client_errors.json')

_ventana = VentanaEventos(_STATE_PATH, lambda: settings.CLIENT_ERROR_WINDOW_MINUTES)


def record(error_type: str) -> None:
    _ventana.record(error_type)


def snapshot() -> dict[str, Any]:
    total, by_type = _ventana.por_tipo()
    status = 'degraded' if total >= settings.CLIENT_ERROR_WARN_COUNT else 'ok'
    result: dict[str, Any] = {
        'status': status,
        'count': total,
        'window_minutes': settings.CLIENT_ERROR_WINDOW_MINUTES,
    }
    if by_type:
        result['by_type'] = by_type
    if status == 'degraded':
        dominant = max(by_type, key=by_type.get)
        result['detail'] = (
            f'{total} errores de carga en el navegador en '
            f'{settings.CLIENT_ERROR_WINDOW_MINUTES} min (predomina {dominant})'
        )
    return result
