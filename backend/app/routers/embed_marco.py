from __future__ import annotations

from fastapi import APIRouter, Request, Response, status

from app.services.api_key_validator import validate_api_key
from app.services.embed_origen import SIN_MARCO, SOLO_PROPIO, llave_de_uri, politica_de_marco
from app.utils.client_ip import get_client_ip, get_request_origin
from app.utils.logger import Logger

router = APIRouter(prefix='/embed', tags=['Embed'])

CABECERA = 'X-Embed-Frame-Ancestors'


@router.get('/marco', include_in_schema=False)
def marco_del_embed(request: Request) -> Response:
    llave = llave_de_uri(request.headers.get('x-original-uri'))
    politica = SOLO_PROPIO
    if len(llave) >= 8:
        origen = get_request_origin(request)
        resultado = validate_api_key(llave, origin=origen, ip=get_client_ip(request))
        if resultado.valid:
            politica = politica_de_marco(resultado.dominios_permitidos)
        else:
            politica = SIN_MARCO
            Logger.warning(f"embed.marco.denied reason={resultado.reason} origin={origen} prefix={llave[:12]}")
    return Response(status_code=status.HTTP_204_NO_CONTENT, headers={CABECERA: politica})
