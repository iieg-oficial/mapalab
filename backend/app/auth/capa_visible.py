from typing import Optional

from fastapi import HTTPException, Request

from app.routers.sesion import usuario_actual
from app.services import acceso_capas, arbol_privado


def capa_visible(request: Request, workspace: str, capa: str) -> bool:
    nodos = arbol_privado.nodos_por_capa(workspace, capa)
    if not nodos or any(not acceso_capas.es_privada(n) for n in nodos):
        return True
    usuario = usuario_actual(request)
    uid: Optional[int] = usuario['uid'] if usuario else None
    return any(acceso_capas.puede_ver(n, uid) for n in nodos)


def exigir_capa_visible(request: Request, workspace: str, capa: str) -> None:
    if not capa_visible(request, workspace, capa):
        raise HTTPException(status_code=404, detail=f'Capa {workspace}:{capa} no encontrada')


def claves_visibles(request: Request, claves: list[str]) -> list[str]:
    visibles = []
    for clave in claves:
        workspace, _, capa = clave.partition(':')
        if capa and capa_visible(request, workspace, capa):
            visibles.append(clave)
    return visibles


def es_publica(workspace: str, capa: str) -> bool:
    nodos = arbol_privado.nodos_por_capa(workspace, capa)
    return not nodos or any(not acceso_capas.es_privada(n) for n in nodos)
