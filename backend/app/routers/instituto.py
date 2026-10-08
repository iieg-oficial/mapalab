import time

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy.orm import Session

from app.consts.databases import DatabaseType
from app.databases.factory import DatabaseFactory
from app.repositories.instituto_repository import InstitutoRepository
from app.utils.api_responses import api_responses

router = APIRouter(prefix='/instituto', tags=['Instituto'])

EDIFICIO_TTL_S = 300
_edificio_cache: dict[str, tuple[float, dict]] = {}


def _get_session() -> Session:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    return conn.get_session()


@router.get(
    '/edificio',
    responses=api_responses(404, 500),
    operation_id='get_instituto_edificio',
    summary='Edificio del IIEG en metros locales para el recorrido 3D',
    description=(
        "Devuelve los pisos con su nivel y altura, los espacios y los elementos constructivos "
        "(muros, escaleras, volúmenes) del schema `instituto` de dataengine. Las coordenadas van en "
        "metros este/norte (azimutal equidistante) relativos al centro del edificio, que viaja en `origen` como lng/lat: "
        "el visor coloca el modelo ahí sin reproyectar. Se guarda 5 min en memoria."
    ),
)
def get_edificio(response: Response) -> dict:
    guardado = _edificio_cache.get('edificio')
    if not guardado or time.monotonic() - guardado[0] > EDIFICIO_TTL_S:
        with _get_session() as session:
            payload = InstitutoRepository.get_edificio(session)
        if payload is None:
            raise HTTPException(status_code=404, detail='El edificio del instituto no está cargado')
        guardado = (time.monotonic(), payload)
        _edificio_cache['edificio'] = guardado
    response.headers['Cache-Control'] = 'public, max-age=300'
    return guardado[1]
