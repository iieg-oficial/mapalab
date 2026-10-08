import json
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


_GEOM_COLUMN = {
    'iieg': 'geom_iieg',
    'inegi': 'geom_inegi',
}


def _resolve_geom_column(source: str) -> str:
    return _GEOM_COLUMN.get((source or '').lower(), 'geom_iieg')


def _leer_geojson(geometria: object) -> Optional[dict]:
    return json.loads(geometria) if isinstance(geometria, str) else geometria


class MunicipiosRepository:

    @staticmethod
    def list_all(session: Session) -> list[dict]:
        result = session.execute(
            text(
                'SELECT clave_geo, nombre, region, area_km2, area_ha '
                'FROM mapalab.municipios '
                'ORDER BY nombre'
            )
        )
        return [
            {
                'clave': row.clave_geo,
                'nombre': row.nombre,
                'region': row.region,
                'areaKm2': float(row.area_km2) if row.area_km2 is not None else None,
                'areaHa': float(row.area_ha) if row.area_ha is not None else None,
            }
            for row in result
        ]

    @staticmethod
    def get_geometries(
        session: Session,
        claves: list[str],
        source: str = 'iieg',
        target_srid: int = 3857,
    ) -> list[dict]:
        if not claves:
            return []
        geom_col = _resolve_geom_column(source)
        result = session.execute(
            text(
                f'SELECT clave_geo, nombre, '
                f'ST_AsGeoJSON(ST_Transform({geom_col}, :srid))::json AS geometry '
                f'FROM mapalab.municipios '
                f'WHERE clave_geo = ANY(:claves) AND {geom_col} IS NOT NULL'
            ),
            {'claves': list(claves), 'srid': target_srid},
        )
        features = []
        for row in result:
            geometry = row.geometry
            if isinstance(geometry, str):
                geometry = json.loads(geometry)
            features.append({
                'type': 'Feature',
                'properties': {
                    'clave': row.clave_geo,
                    'nombre': row.nombre,
                },
                'geometry': geometry,
            })
        return features

    @staticmethod
    def get_union_bbox(
        session: Session,
        claves: list[str],
        source: str = 'iieg',
        target_srid: Optional[int] = None,
    ) -> Optional[list[float]]:
        if not claves:
            return None
        geom_col = _resolve_geom_column(source)
        if target_srid:
            geom_expr = f'ST_Transform(ST_Envelope(ST_Union({geom_col})), :srid)'
        else:
            geom_expr = f'ST_Envelope(ST_Union({geom_col}))'
        sql = (
            f'SELECT ST_XMin({geom_expr}), ST_YMin({geom_expr}), '
            f'ST_XMax({geom_expr}), ST_YMax({geom_expr}) '
            f'FROM mapalab.municipios '
            f'WHERE clave_geo = ANY(:claves) AND {geom_col} IS NOT NULL'
        )
        params: dict = {'claves': list(claves)}
        if target_srid:
            params['srid'] = target_srid
        row = session.execute(text(sql), params).first()
        if not row or row[0] is None:
            return None
        return [float(row[0]), float(row[1]), float(row[2]), float(row[3])]

    @staticmethod
    def get_siluetas(session: Session, source: str = 'iieg', tolerancia_m: float = 300) -> dict:
        geom_col = _resolve_geom_column(source)
        filas = session.execute(
            text(
                f'SELECT clave_geo, nombre, '
                f'ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_Transform({geom_col}, 3857), :tol), 0)::json AS geometry '
                f'FROM mapalab.municipios WHERE {geom_col} IS NOT NULL'
            ),
            {'tol': tolerancia_m},
        ).fetchall()
        estado = session.execute(
            text(
                f'SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_Union(ST_Transform({geom_col}, 3857)), :tol), 0)::json '
                f'FROM mapalab.municipios WHERE {geom_col} IS NOT NULL'
            ),
            {'tol': tolerancia_m * 2},
        ).scalar()
        return {
            'estado': _leer_geojson(estado),
            'municipios': [
                {'clave': fila.clave_geo, 'nombre': fila.nombre, 'geometry': _leer_geojson(fila.geometry)}
                for fila in filas
            ],
        }
