from __future__ import annotations

import base64
import hashlib
import secrets
import time
from typing import Any

import httpx

from app.config import settings

_TIMEOUT = 10
_DISCOVERY_TTL = 3600
_discovery: dict[str, Any] = {'exp': 0.0, 'doc': None}


class OidcError(Exception):
    pass


def _issuer() -> str:
    return (settings.MINERVA_ISSUER_URL or '').rstrip('/')


def _descubrir() -> dict[str, Any]:
    ahora = time.time()
    if _discovery['doc'] is not None and _discovery['exp'] > ahora:
        return _discovery['doc']
    issuer = _issuer()
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.get(f'{issuer}/.well-known/openid-configuration')
            resp.raise_for_status()
        doc = resp.json()
    except httpx.HTTPError:
        doc = {
            'authorization_endpoint': f'{issuer}/auth/authorize',
            'token_endpoint': f'{issuer}/auth/token',
            'userinfo_endpoint': f'{issuer}/userinfo',
        }
    declarado = (doc.get('issuer') or '').rstrip('/')
    if declarado and declarado != issuer:
        doc = {k: issuer + v[len(declarado):] if isinstance(v, str) and v.startswith(declarado) else v for k, v in doc.items()}
    _discovery['doc'] = doc
    _discovery['exp'] = ahora + _DISCOVERY_TTL
    return doc


def nuevo_estado() -> str:
    return secrets.token_urlsafe(32)


def nuevo_pkce() -> tuple[str, str]:
    verificador = secrets.token_urlsafe(64)
    reto = base64.urlsafe_b64encode(hashlib.sha256(verificador.encode('ascii')).digest()).decode('ascii').rstrip('=')
    return verificador, reto


def redirect_uri() -> str:
    return f"{(settings.MAPALAB_PUBLIC_BASE_URL or '').rstrip('/')}/mapalab/api/sesion/callback"


def url_de_autorizacion(estado: str, reto: str) -> str:
    endpoint = _descubrir()['authorization_endpoint']
    publico = (settings.MINERVA_PUBLIC_BASE or '').rstrip('/')
    if publico and publico != _issuer():
        endpoint = endpoint.replace(_issuer(), publico, 1)
    query = httpx.QueryParams({
        'response_type': 'code',
        'client_id': settings.MINERVA_CLIENT_ID,
        'redirect_uri': redirect_uri(),
        'scope': settings.MINERVA_SCOPES,
        'state': estado,
        'code_challenge': reto,
        'code_challenge_method': 'S256',
    })
    return f'{endpoint}?{query}'


def canjear(codigo: str, verificador: str) -> dict[str, Any]:
    datos = {
        'grant_type': 'authorization_code',
        'code': codigo,
        'redirect_uri': redirect_uri(),
        'client_id': settings.MINERVA_CLIENT_ID,
        'client_secret': settings.MINERVA_CLIENT_SECRET,
        'code_verifier': verificador,
    }
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.post(_descubrir()['token_endpoint'], data=datos)
            resp.raise_for_status()
            tokens = resp.json()
            info = client.get(
                _descubrir()['userinfo_endpoint'],
                headers={'Authorization': f"Bearer {tokens['access_token']}"},
            )
            info.raise_for_status()
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise OidcError(str(exc)) from exc
    claims = info.json()
    if not claims.get('sub') or not claims.get('email'):
        raise OidcError('minerva no entregó sub o correo')
    return claims
