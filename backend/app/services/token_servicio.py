from __future__ import annotations

import threading
import time
from collections.abc import Generator
from typing import Optional

import httpx

MARGEN_RENOVACION = 60


class ErrorTokenServicio(Exception):
    pass


class ProveedorTokenServicio:
    def __init__(
        self,
        issuer_url: str,
        client_id: str,
        client_secret: str,
        audience: str,
        timeout: float = 10.0,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        self._url_token = f"{issuer_url.rstrip('/')}/auth/token"
        self._client_id = client_id
        self._client_secret = client_secret
        self._audience = audience
        self._timeout = timeout
        self._transport = transport
        self._candado = threading.Lock()
        self._token: Optional[str] = None
        self._vence = 0.0

    def token(self) -> str:
        with self._candado:
            if self._token is None or time.monotonic() >= self._vence - MARGEN_RENOVACION:
                self._token, self._vence = self._pedir()
            return self._token

    def invalidar(self) -> None:
        with self._candado:
            self._token = None
            self._vence = 0.0

    def _pedir(self) -> tuple[str, float]:
        datos = {
            'grant_type': 'client_credentials',
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'audience': self._audience,
        }
        try:
            with httpx.Client(timeout=self._timeout, transport=self._transport) as cliente:
                respuesta = cliente.post(self._url_token, data=datos)
        except httpx.HTTPError as exc:
            raise ErrorTokenServicio(f'minerva no respondio al pedir el token de servicio: {exc}') from exc
        if respuesta.status_code != 200:
            try:
                detalle = respuesta.json().get('error_description') or respuesta.text
            except ValueError:
                detalle = respuesta.text
            raise ErrorTokenServicio(f'minerva nego el token de servicio ({respuesta.status_code}): {detalle}')
        cuerpo = respuesta.json()
        token = cuerpo.get('access_token')
        if not token:
            raise ErrorTokenServicio('minerva respondio sin access_token')
        return token, time.monotonic() + float(cuerpo.get('expires_in', 0))


class AuthTokenServicio(httpx.Auth):
    def __init__(self, proveedor: ProveedorTokenServicio):
        self._proveedor = proveedor

    def auth_flow(self, request: httpx.Request) -> Generator[httpx.Request, httpx.Response, None]:
        request.headers['Authorization'] = f'Bearer {self._proveedor.token()}'
        respuesta = yield request
        if respuesta.status_code == 401:
            self._proveedor.invalidar()
            request.headers['Authorization'] = f'Bearer {self._proveedor.token()}'
            yield request


_proveedores: dict[tuple[str, str, str], ProveedorTokenServicio] = {}
_candado_proveedores = threading.Lock()


def proveedor_compartido(issuer_url: str, client_id: str, client_secret: str, audience: str) -> ProveedorTokenServicio:
    clave = (issuer_url, client_id, audience)
    with _candado_proveedores:
        proveedor = _proveedores.get(clave)
        if proveedor is None:
            proveedor = ProveedorTokenServicio(issuer_url, client_id, client_secret, audience)
            _proveedores[clave] = proveedor
        return proveedor


def auth_geoserver(settings) -> Optional[httpx.Auth | tuple[str, str]]:
    if settings.GEOSERVER_AUTH_MODE == 'minerva':
        if not (settings.MINERVA_ISSUER_URL and settings.MINERVA_CLIENT_ID and settings.MINERVA_CLIENT_SECRET):
            raise ErrorTokenServicio('GEOSERVER_AUTH_MODE=minerva necesita MINERVA_ISSUER_URL, MINERVA_CLIENT_ID y MINERVA_CLIENT_SECRET')
        return AuthTokenServicio(proveedor_compartido(
            settings.MINERVA_ISSUER_URL,
            settings.MINERVA_CLIENT_ID,
            settings.MINERVA_CLIENT_SECRET,
            settings.GEOSERVER_MINERVA_AUDIENCE,
        ))
    if settings.GEOSERVER_USER:
        return (settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD or '')
    return None
