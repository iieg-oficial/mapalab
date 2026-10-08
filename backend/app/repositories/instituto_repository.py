import json
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


_ORIGEN = text(
    'SELECT ST_X(c) AS lng, ST_Y(c) AS lat '
    'FROM (SELECT ST_Transform(ST_Centroid(ST_Collect(geom)), 4326) AS c FROM instituto.espacios '
    "WHERE incluir AND tipo <> 'exterior') t"
)

_PISOS = text(
    'SELECT id, nombre, orden, nivel, altura, transitable, con_plano '
    'FROM instituto.pisos ORDER BY orden, id'
)

_ESPACIOS = text(
    'SELECT fid, nombre, tipo, piso_id, '
    'ST_AsGeoJSON(ST_Transform(geom, CAST(:proj AS text)), 2)::json AS geometria '
    'FROM instituto.espacios WHERE incluir ORDER BY orden, fid'
)

_ELEMENTOS = text(
    'SELECT fid, tipo, piso_id, base, altura, aproximado, '
    'ST_AsGeoJSON(ST_Transform(geom, CAST(:proj AS text)), 2)::json AS geometria '
    'FROM instituto.elementos ORDER BY tipo, fid'
)

_HUELLA = text(
    'WITH base AS (SELECT id FROM instituto.pisos ORDER BY nivel, orden LIMIT 1), '
    'u AS (SELECT ST_Union(geom) AS g FROM ('
    "SELECT e.geom FROM instituto.espacios e, base WHERE e.incluir AND e.tipo <> 'exterior' AND e.piso_id = base.id "
    "UNION ALL SELECT m.geom FROM instituto.elementos m, base WHERE m.tipo = 'muro' AND m.piso_id = base.id) t), "
    "c AS (SELECT (ST_Dump(ST_Buffer(ST_Buffer(g, :cierre, 'join=mitre'), -:cierre, 'join=mitre'))).geom AS p FROM u) "
    'SELECT ST_AsGeoJSON(ST_Transform(ST_Collect(ST_MakePolygon(ST_ExteriorRing(p), ARRAY('
    'SELECT ST_ExteriorRing(r.geom) FROM ST_DumpRings(p) r WHERE r.path[1] > 0 AND ST_Area(r.geom) > :patio'
    '))), CAST(:proj AS text)), 2)::json AS geometria FROM c'
)

CIERRE_HUELLA_M = 0.6
PATIO_MIN_M2 = 10


def _poligonos(geometria: object) -> list:
    datos = json.loads(geometria) if isinstance(geometria, str) else geometria
    if not datos:
        return []
    return datos['coordinates'] if datos['type'] == 'MultiPolygon' else [datos['coordinates']]


def _proyeccion_local(lng: float, lat: float) -> str:
    return f'+proj=aeqd +lat_0={lat:.9f} +lon_0={lng:.9f} +datum=WGS84 +units=m +no_defs'


def _flotante(valor: object) -> Optional[float]:
    return float(valor) if valor is not None else None


class InstitutoRepository:

    @staticmethod
    def get_edificio(session: Session) -> Optional[dict]:
        origen = session.execute(_ORIGEN).one_or_none()
        if origen is None or origen.lng is None:
            return None
        centro = {'proj': _proyeccion_local(origen.lng, origen.lat)}
        pisos = [
            {
                'id': row.id,
                'nombre': row.nombre,
                'orden': row.orden,
                'nivel': float(row.nivel),
                'altura': float(row.altura),
                'transitable': row.transitable,
                'conPlano': row.con_plano,
            }
            for row in session.execute(_PISOS)
        ]
        espacios = [
            {
                'fid': row.fid,
                'nombre': row.nombre,
                'tipo': row.tipo,
                'pisoId': row.piso_id,
                'poligonos': _poligonos(row.geometria),
            }
            for row in session.execute(_ESPACIOS, centro)
        ]
        elementos = [
            {
                'fid': row.fid,
                'tipo': row.tipo,
                'pisoId': row.piso_id,
                'base': float(row.base),
                'altura': _flotante(row.altura),
                'aproximado': row.aproximado,
                'poligonos': _poligonos(row.geometria),
            }
            for row in session.execute(_ELEMENTOS, centro)
        ]
        huella = session.execute(
            _HUELLA, {**centro, 'cierre': CIERRE_HUELLA_M, 'patio': PATIO_MIN_M2}
        ).scalar_one_or_none()
        return {
            'origen': {'lng': origen.lng, 'lat': origen.lat},
            'huella': _poligonos(huella),
            'pisos': pisos,
            'espacios': espacios,
            'elementos': elementos,
        }
