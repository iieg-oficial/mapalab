from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

_SELECT = (
    'SELECT c.id, c.slug, c.nombre, c.workspace_alias, '
    'w.geoserver_workspace, c.geoserver_layer, c.search_tags, '
    'COALESCE(c.infobox_config, l.infobox_config) AS infobox_config, '
    'c.infobox_config IS NOT NULL AS infobox_propia, '
    'i.slug AS institucion_slug, i.nombre AS institucion_nombre '
    'FROM mapalab.catalogo_capas c '
    'LEFT JOIN mapalab.workspaces w ON w.alias = c.workspace_alias '
    'LEFT JOIN mapalab.catalogo_instituciones i '
    '  ON i.id = c.institucion_id AND i.deleted_at IS NULL '
    'LEFT JOIN LATERAL ('
    '  SELECT infobox_config FROM mapalab.layers '
    '  WHERE workspace_alias = c.workspace_alias '
    '    AND geoserver_layer = c.geoserver_layer '
    '    AND infobox_config IS NOT NULL '
    '  LIMIT 1'
    ') l ON TRUE '
)


class CatalogoRepository:

    @staticmethod
    def get_enabled_capas(session: Session) -> list[dict]:
        rows = session.execute(
            text(
                _SELECT
                + 'WHERE c.enabled = TRUE AND c.deleted_at IS NULL '
                'ORDER BY c.orden, c.nombre'
            )
        ).mappings().all()
        return [dict(row) for row in rows]

    @staticmethod
    def get_instituciones(session: Session) -> list[dict]:
        rows = session.execute(
            text(
                'SELECT i.id, i.slug, i.nombre, i.logo_url, i.orden '
                'FROM mapalab.catalogo_instituciones i '
                'WHERE i.deleted_at IS NULL AND EXISTS ('
                '  SELECT 1 FROM mapalab.catalogo_capas c '
                '  WHERE c.institucion_id = i.id '
                '    AND c.enabled = TRUE AND c.deleted_at IS NULL'
                ') '
                'ORDER BY i.orden, i.nombre'
            )
        ).mappings().all()
        return [dict(row) for row in rows]

    @staticmethod
    def get_capa_by_slug(session: Session, slug: str) -> Optional[dict]:
        row = session.execute(
            text(
                _SELECT
                + 'WHERE c.slug = :slug AND c.enabled = TRUE '
                'AND c.deleted_at IS NULL LIMIT 1'
            ),
            {'slug': slug},
        ).mappings().first()
        return dict(row) if row else None
