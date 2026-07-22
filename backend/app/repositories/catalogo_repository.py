from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

_SELECT = (
    'SELECT c.id, c.slug, c.nombre, c.workspace_alias, '
    'w.geoserver_workspace, c.geoserver_layer, c.search_tags '
    'FROM mapalab.catalogo_capas c '
    'LEFT JOIN mapalab.workspaces w ON w.alias = c.workspace_alias '
)


class CatalogoRepository:

    @staticmethod
    def get_enabled_capas(session: Session) -> list[dict]:
        rows = session.execute(
            text(
                _SELECT
                + 'WHERE c.enabled = TRUE AND c.deleted_at IS NULL '
                'ORDER BY c.nombre'
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
