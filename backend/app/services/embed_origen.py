from __future__ import annotations

from typing import Optional
from urllib.parse import parse_qs, urlparse

from fastapi import Request

from app.utils.client_ip import get_request_origin

SIN_MARCO = "frame-ancestors 'none'"
SOLO_PROPIO = "frame-ancestors 'self'"


def origen_valido(valor: Optional[str]) -> Optional[str]:
    if not valor:
        return None
    try:
        partes = urlparse(valor.strip())
    except ValueError:
        return None
    if partes.scheme not in ('http', 'https') or not partes.hostname:
        return None
    return f"{partes.scheme}://{partes.netloc}".lower()


def _host_propio(request: Request) -> str:
    host = request.headers.get('x-forwarded-host') or request.headers.get('host') or ''
    return host.split(',')[0].strip().split(':')[0].lower()


def origen_para_llave(request: Request) -> Optional[str]:
    origen = get_request_origin(request)
    padre = origen_valido(request.query_params.get('parent'))
    if not origen or not padre:
        return origen
    if (urlparse(origen).hostname or '').lower() != _host_propio(request):
        return origen
    return padre


def llave_de_uri(uri: Optional[str]) -> str:
    if not uri:
        return ''
    valores = parse_qs(urlparse(uri).query).get('key') or ['']
    return valores[0][:120]


def politica_de_marco(dominios: Optional[list[str]]) -> str:
    if dominios is None:
        return "frame-ancestors *"
    fuentes: list[str] = ["'self'"]
    for crudo in dominios:
        dominio = (crudo or '').strip()
        if not dominio:
            continue
        if dominio == '*':
            return "frame-ancestors *"
        if '://' not in dominio:
            dominio = f"https://{dominio}"
        fuentes.append(dominio.rstrip('/'))
    return f"frame-ancestors {' '.join(fuentes)}"
