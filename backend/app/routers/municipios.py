import hashlib
import json
import time
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.municipios_repository import MunicipiosRepository
from app.utils.api_responses import api_responses

router = APIRouter(prefix='/municipios', tags=['Municipios'])

_VALID_SOURCES = {'iieg', 'inegi'}
SILUETAS_TTL_S = 6 * 3600
_siluetas_cache: dict[str, tuple[float, dict, str]] = {}


def _get_session() -> Session:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    return conn.get_session()


def _normalize_source(source: str) -> str:
    src = (source or '').lower().strip()
    if src not in _VALID_SOURCES:
        return 'iieg'
    return src


def _hash_payload(payload) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()
    return hashlib.sha256(raw).hexdigest()[:16]


@router.get(
    '/',
    responses=api_responses(500),
    operation_id='list_municipios',
    summary='Lista de municipios de Jalisco con clave y nombre',
    description=(
        "Devuelve la lista completa de municipios (~125) con su clave INEGI de 3 dígitos, "
        "nombre, región y áreas. Los datos vienen de la vista materializada "
        "`mapalab.municipios`, que une `mapa_base.limite_municipal` (IIEG) y "
        "`mapa_base.limite_municipal_inegi`. Soporta `If-None-Match` con ETag. "
        "La MV se refresca mensualmente (1º a las 05:00) desde dataengine-jobs."
    ),
)
def list_municipios(
    response: Response,
    if_none_match: Optional[str] = Header(default=None),
):
    with _get_session() as session:
        items = MunicipiosRepository.list_all(session)
    payload = {'items': items, 'count': len(items)}
    etag = _hash_payload(payload)
    response.headers['ETag'] = etag
    response.headers['Cache-Control'] = 'public, max-age=3600'
    if if_none_match and if_none_match == etag:
        response.status_code = 304
        return Response(status_code=304, headers={'ETag': etag})
    return payload


@router.get(
    '/geometries',
    responses=api_responses(400, 500),
    operation_id='get_municipios_geometries',
    summary='Geometrías GeoJSON y bbox unión de los municipios seleccionados',
    description=(
        "Devuelve un `FeatureCollection` GeoJSON con las geometrías detalladas de los "
        "municipios (EPSG:3857, para la máscara visual en OpenLayers) más `unionBbox`, "
        "la caja envolvente de la selección en EPSG:6368. El visor usa el bbox como "
        "filtro de respaldo en las capas que todavía no declaran su campo de municipio."
    ),
)
def get_geometries(
    response: Response,
    claves: str = Query(description='Claves de municipios separadas por coma (ej. 014,067)'),
    source: str = Query(default='iieg', description='Fuente: iieg | inegi'),
):
    claves_list = [c.strip() for c in (claves or '').split(',') if c.strip()]
    if not claves_list:
        raise HTTPException(status_code=400, detail='Parámetro `claves` requerido')
    if len(claves_list) > 200:
        raise HTTPException(status_code=400, detail='Máximo 200 claves por request')
    src = _normalize_source(source)
    with _get_session() as session:
        features = MunicipiosRepository.get_geometries(session, claves_list, src)
        union_bbox = MunicipiosRepository.get_union_bbox(session, claves_list, src)
    response.headers['Cache-Control'] = 'public, max-age=3600'
    return {
        'type': 'FeatureCollection',
        'source': src,
        'features': features,
        'unionBbox': union_bbox,
    }


@router.get(
    '/siluetas',
    responses=api_responses(500),
    operation_id='get_municipios_siluetas',
    summary='Contorno de Jalisco y municipios simplificados para el minimapa',
    description=(
        "Devuelve el contorno del estado y los 125 municipios en EPSG:3857, simplificados a "
        "unos 300 m y con coordenadas en metros enteros: ~200 KB contra los ~9 MB de "
        "`/geometries`. Sirve para dibujar el minimapa y nombrar el municipio bajo la vista, no "
        "para filtrar. Se guarda 6 h en memoria porque la vista materializada cambia una vez al "
        "mes. Soporta `If-None-Match` con ETag."
    ),
)
def get_siluetas(
    response: Response,
    source: str = Query(default='iieg', description='Fuente: iieg | inegi'),
    if_none_match: Optional[str] = Header(default=None),
):
    src = _normalize_source(source)
    guardado = _siluetas_cache.get(src)
    if not guardado or time.monotonic() - guardado[0] > SILUETAS_TTL_S:
        with _get_session() as session:
            payload = MunicipiosRepository.get_siluetas(session, src)
        guardado = (time.monotonic(), payload, _hash_payload(payload))
        _siluetas_cache[src] = guardado
    _, payload, etag = guardado
    response.headers['ETag'] = etag
    response.headers['Cache-Control'] = 'public, max-age=21600'
    if if_none_match and if_none_match == etag:
        return Response(status_code=304, headers={'ETag': etag})
    return payload
