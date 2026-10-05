from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func, or_, select

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.models.acceso import CapaAcceso, GrupoMiembro, UsuarioMapalab
from app.models.layer import Layer

_TTL_ESTRUCTURA = 60
_TTL_CONCESIONES = 30
_LOCK = threading.Lock()
_estructura: dict[str, Any] = {'exp': 0.0, 'compuertas': {}}
_concesiones: dict[int, tuple[float, frozenset[str]]] = {}


class AccesoError(Exception):
    def __init__(self, motivo: str) -> None:
        super().__init__(motivo)
        self.motivo = motivo


def _calcular_compuertas(filas: list[tuple[str, Optional[str], bool]]) -> dict[str, tuple[str, ...]]:
    padre = {fid: pid for fid, pid, _ in filas}
    privada = {fid for fid, _, es in filas if es}
    compuertas: dict[str, tuple[str, ...]] = {}
    for fid in padre:
        cadena: list[str] = []
        actual: Optional[str] = fid
        vistos: set[str] = set()
        while actual is not None and actual not in vistos:
            vistos.add(actual)
            if actual in privada:
                cadena.append(actual)
            actual = padre.get(actual)
        if cadena:
            compuertas[fid] = tuple(cadena)
    return compuertas


def compuertas() -> dict[str, tuple[str, ...]]:
    ahora = time.monotonic()
    with _LOCK:
        if _estructura['exp'] > ahora:
            return _estructura['compuertas']
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        filas = session.execute(
            select(Layer.id, Layer.parent_id, Layer.privada).where(Layer.deleted_at.is_(None))
        ).all()
    calculadas = _calcular_compuertas([(f[0], f[1], bool(f[2])) for f in filas])
    with _LOCK:
        _estructura['compuertas'] = calculadas
        _estructura['exp'] = ahora + _TTL_ESTRUCTURA
    return calculadas


def es_privada(layer_id: str) -> bool:
    return layer_id in compuertas()


def concedidas(usuario_id: int) -> frozenset[str]:
    ahora = time.monotonic()
    with _LOCK:
        guardado = _concesiones.get(usuario_id)
        if guardado and guardado[0] > ahora:
            return guardado[1]
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        activo = session.execute(
            select(UsuarioMapalab.activo).where(UsuarioMapalab.id == usuario_id)
        ).scalar()
        if not activo:
            ids: frozenset[str] = frozenset()
        else:
            grupos = select(GrupoMiembro.grupo_id).where(GrupoMiembro.usuario_id == usuario_id)
            ids = frozenset(session.execute(
                select(CapaAcceso.layer_id).where(
                    or_(CapaAcceso.usuario_id == usuario_id, CapaAcceso.grupo_id.in_(grupos))
                )
            ).scalars())
    with _LOCK:
        _concesiones[usuario_id] = (ahora + _TTL_CONCESIONES, ids)
    return ids


def visibles(usuario_id: Optional[int]) -> set[str]:
    if usuario_id is None:
        return set()
    otorgadas = concedidas(usuario_id)
    return {fid for fid, cadena in compuertas().items() if all(c in otorgadas for c in cadena)}


def puede_ver(layer_id: str, usuario_id: Optional[int]) -> bool:
    cadena = compuertas().get(layer_id)
    if cadena is None:
        return True
    if usuario_id is None:
        return False
    otorgadas = concedidas(usuario_id)
    return all(c in otorgadas for c in cadena)


def olvidar_cache() -> None:
    with _LOCK:
        _estructura['exp'] = 0.0
        _concesiones.clear()


def registrar_login(sub: str, correo: str, nombre: Optional[str]) -> dict[str, Any]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        usuario = session.execute(select(UsuarioMapalab).where(UsuarioMapalab.sub == sub)).scalar_one_or_none()
        if usuario is None:
            por_correo = session.execute(
                select(UsuarioMapalab).where(func.lower(UsuarioMapalab.correo) == correo.lower())
            ).scalar_one_or_none()
            if por_correo is not None and por_correo.sub and por_correo.sub != sub:
                raise AccesoError('conflicto')
            usuario = por_correo
        if usuario is None:
            usuario = UsuarioMapalab(sub=sub, correo=correo, nombre=nombre)
            session.add(usuario)
        if not usuario.activo:
            raise AccesoError('inactivo')
        usuario.sub = sub
        usuario.correo = correo
        if nombre:
            usuario.nombre = nombre
        usuario.ultimo_acceso = datetime.now(timezone.utc)
        session.commit()
        resultado = {'id': usuario.id, 'nombre': usuario.nombre or correo, 'correo': usuario.correo}
    with _LOCK:
        _concesiones.pop(resultado['id'], None)
    return resultado
