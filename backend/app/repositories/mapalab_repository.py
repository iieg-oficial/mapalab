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
