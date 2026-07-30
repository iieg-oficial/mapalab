from __future__ import annotations

import os
from typing import Any

from app.config import settings
from app.services.ventana_eventos import VentanaEventos

_STATE_PATH = os.getenv('EMBED_ABUSE_STATE_PATH', '/tmp/mapalab_embed_abuse.json')

TIPO_DENEGADO = 'denied'
TIPO_CUOTA = 'quota_exceeded'

_ventana = VentanaEventos(_STATE_PATH, lambda: settings.EMBED_ABUSE_WINDOW_MINUTES)


def record(tipo: str) -> None:
    _ventana.record(tipo)


def snapshot() -> dict[str, Any]:
    total, by_type = _ventana.por_tipo()
    status = 'degraded' if total >= settings.EMBED_ABUSE_WARN_COUNT else 'ok'
    result: dict[str, Any] = {
        'status': status,
        'count': total,
        'window_minutes': settings.EMBED_ABUSE_WINDOW_MINUTES,
    }
    if by_type:
        result['by_type'] = by_type
    if status == 'degraded':
        result['detail'] = (
            f'{total} rechazos de embed en {settings.EMBED_ABUSE_WINDOW_MINUTES} min '
            f'(denegados {by_type.get(TIPO_DENEGADO, 0)}, cuota {by_type.get(TIPO_CUOTA, 0)})'
        )
    return result
