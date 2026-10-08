from __future__ import annotations

import json
from typing import Optional
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import HTMLResponse, RedirectResponse

from app.config import settings
from app.services import acceso_capas, arbol_privado, sesion_oidc
from app.services.sesion_firma import firmar, leer
from app.utils.api_responses import api_responses
from app.utils.logger import Logger

router = APIRouter(prefix='/sesion', tags=['Sesión'])

COOKIE_SESION = 'mapalab_sesion'
COOKIE_TX = 'mapalab_sesion_tx'
_RUTA_COOKIE = '/mapalab'
_RUTA_TX = '/mapalab/api/sesion'
_TX_SEGUNDOS = 600
_CANAL = 'mapalab-sesion'
_SIN_CACHE = {'Cache-Control': 'private, no-store'}


def _segura(request: Request) -> bool:
    proto = request.headers.get('x-forwarded-proto') or request.url.scheme
    return proto == 'https'


def _base_publica(request: Request) -> str:
    proto = request.headers.get('x-forwarded-proto') or request.url.scheme
    host = request.headers.get('x-forwarded-host') or request.headers.get('host') or ''
    if not host or any(c in host for c in '/\\@ '):
        return (settings.MAPALAB_PUBLIC_BASE_URL or '').rstrip('/')
    return f'{proto}://{host.split(",")[0].strip()}'


def _siguiente_seguro(valor: Optional[str]) -> str:
    if not valor or not valor.startswith('/mapalab') or valor.startswith('//') or '\\' in valor:
        return '/mapalab/'
    return valor


def usuario_actual(request: Request) -> Optional[dict]:
    datos = leer('sesion', request.cookies.get(COOKIE_SESION))
    if not datos or not isinstance(datos.get('uid'), int):
        return None
    return datos


def _requiere_sesion_habilitada() -> None:
    if not settings.sesion_habilitada:
        raise HTTPException(status_code=503, detail='El inicio de sesión no está disponible')


@router.get('', responses=api_responses(500))
def estado(request: Request, response: Response):
    response.headers.update(_SIN_CACHE)
    usuario = usuario_actual(request)
    if usuario is None:
        return {'habilitada': settings.sesion_habilitada, 'usuario': None, 'capasPrivadas': 0}
    return {
        'habilitada': True,
        'usuario': {'nombre': usuario['nombre'], 'correo': usuario['correo']},
        'capasPrivadas': arbol_privado.contar_capas(usuario['uid']),
    }


@router.get('/entrar', responses=api_responses(503))
def entrar(request: Request, modo: str = Query('popup', pattern='^(popup|pagina)$'), siguiente: str = ''):
    _requiere_sesion_habilitada()
    estado_oidc = sesion_oidc.nuevo_estado()
    verificador, reto = sesion_oidc.nuevo_pkce()
    vuelta = sesion_oidc.redirect_uri(_base_publica(request))
    destino = sesion_oidc.url_de_autorizacion(estado_oidc, reto, vuelta)
    redirect = RedirectResponse(url=destino, status_code=302)
    tx = firmar('tx', {'estado': estado_oidc, 'verificador': verificador, 'modo': modo, 'siguiente': _siguiente_seguro(siguiente), 'vuelta': vuelta}, _TX_SEGUNDOS)
    redirect.set_cookie(COOKIE_TX, tx, max_age=_TX_SEGUNDOS, path=_RUTA_TX, httponly=True, samesite='lax', secure=_segura(request))
    return redirect


def _cierre_popup(resultado: dict) -> HTMLResponse:
    mensaje = json.dumps({'tipo': _CANAL, **resultado})
    html = (
        '<!doctype html><meta charset="utf-8"><title>MapaLab</title>'
        f'<script>try{{new BroadcastChannel({json.dumps(_CANAL)}).postMessage({mensaje})}}catch(e){{}}'
        f'try{{localStorage.setItem({json.dumps(_CANAL)},JSON.stringify({{...{mensaje},t:Date.now()}}))}}catch(e){{}}'
        'window.close();</script>'
        '<p style="font-family:sans-serif;padding:24px">Listo. Ya puedes cerrar esta ventana.</p>'
    )
    return HTMLResponse(html, headers=_SIN_CACHE)


def _terminar(tx: dict, resultado: dict) -> Response:
    if tx.get('modo') == 'popup':
        respuesta = _cierre_popup(resultado)
    else:
        siguiente = tx.get('siguiente') or '/mapalab/'
        if resultado.get('error'):
            separador = '&' if '?' in siguiente else '?'
            siguiente = f"{siguiente}{separador}{urlencode({'sesion_error': resultado['error']})}"
        respuesta = RedirectResponse(url=siguiente, status_code=302)
    respuesta.delete_cookie(COOKIE_TX, path=_RUTA_TX)
    return respuesta


@router.get('/callback', include_in_schema=False)
async def callback(request: Request, code: str = '', state: str = '', error: str = ''):
    _requiere_sesion_habilitada()
    tx = leer('tx', request.cookies.get(COOKIE_TX)) or {'modo': 'popup'}
    if error:
        Logger.info(f'sesion.login.denegado error={error}')
        return _terminar(tx, {'ok': False, 'error': 'sin_acceso' if error == 'access_denied' else 'minerva'})
    if not code or not state or state != tx.get('estado'):
        return _terminar(tx, {'ok': False, 'error': 'expirado'})
    try:
        vuelta = tx.get('vuelta') or sesion_oidc.redirect_uri(_base_publica(request))
        claims = await run_in_threadpool(sesion_oidc.canjear, code, tx['verificador'], vuelta)
        usuario = await run_in_threadpool(acceso_capas.registrar_login, claims['sub'], claims['email'], claims.get('name'))
    except sesion_oidc.OidcError as exc:
        Logger.warning(f'sesion.login.canje_fallido {exc}')
        return _terminar(tx, {'ok': False, 'error': 'minerva'})
    except acceso_capas.AccesoError as exc:
        Logger.info(f'sesion.login.rechazado motivo={exc.motivo}')
        return _terminar(tx, {'ok': False, 'error': exc.motivo})
    segundos = settings.MAPALAB_SESSION_HOURS * 3600
    valor = firmar('sesion', {'uid': usuario['id'], 'nombre': usuario['nombre'], 'correo': usuario['correo']}, segundos)
    respuesta = _terminar(tx, {'ok': True})
    respuesta.set_cookie(COOKIE_SESION, valor, max_age=segundos, path=_RUTA_COOKIE, httponly=True, samesite='lax', secure=_segura(request))
    Logger.info(f"sesion.login.ok usuario_id={usuario['id']}")
    return respuesta


@router.post('/salir', responses=api_responses(500))
def salir(request: Request, response: Response):
    response.headers.update(_SIN_CACHE)
    response.delete_cookie(COOKIE_SESION, path=_RUTA_COOKIE)
    return {'ok': True}


@router.get('/capas', responses=api_responses(500))
def capas_privadas(request: Request, response: Response):
    response.headers.update(_SIN_CACHE)
    usuario = usuario_actual(request)
    if usuario is None:
        return []
    return arbol_privado.complemento(usuario['uid'])


@router.get('/pendientes', responses=api_responses(400))
def pendientes(request: Request, response: Response, refs: str = Query('', max_length=4000)):
    response.headers.update(_SIN_CACHE)
    referencias = [r.strip() for r in refs.split(',') if r.strip()][:100]
    usuario = usuario_actual(request)
    return {'privadas': arbol_privado.privadas_no_visibles(referencias, usuario['uid'] if usuario else None)}
