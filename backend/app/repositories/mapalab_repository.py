from sqlalchemy.orm import Session
from app.models.mapalab import Mapalab_Card
from typing import Optional

class MapalabRepository:
    @staticmethod
    def get_metadata(
        session: Session,
        workspace: Optional[str] = None,
        layer: Optional[str] = None,
    ) -> list[Mapalab_Card]:

        query = session.query(Mapalab_Card)

        query = query.filter(
            Mapalab_Card.nombre_capa_geoserver == f"{workspace}:{layer}"
        )
        return query.all()

    @staticmethod
    def get_sources_batch(
        session: Session,
        layer_keys: list[str],
    ) -> list[Mapalab_Card]:
        return (
            session.query(
                Mapalab_Card.nombre_capa_geoserver,
                Mapalab_Card.fuentes_texto_corto,
                Mapalab_Card.fuentes_texto_largo,
            )
            .filter(Mapalab_Card.nombre_capa_geoserver.in_(layer_keys))
            .all()
        )
