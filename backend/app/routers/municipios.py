import hashlib
import json
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.municipios_repository import MunicipiosRepository
from app.utils.api_responses import api_responses

router = APIRouter(prefix='/municipios', tags=['Municipios'])

_VALID_SOURCES = {'iieg', 'inegi'}


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
