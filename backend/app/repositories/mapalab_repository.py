from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.mapalab import Mapalab_Card
from typing import Optional

class MapalabRepository:

    @staticmethod
    def get_layers(
        session: Session,
        page: int = 1,
        size: int = 50,
        keyword: Optional[str] = None,
    ) -> tuple[list[Mapalab_Card], int]:

        query = session.query(Mapalab_Card)

        filters = []

        if keyword:
            keyword_filter = or_(
                Mapalab_Card.tema.ilike(f'%{keyword}%'),
                Mapalab_Card.subtema.ilike(f'%{keyword}%'),
                Mapalab_Card.descripcion.ilike(f'%{keyword}%'),
                Mapalab_Card.nombre_capa_usuario.ilike(f'%{keyword}%'),
                Mapalab_Card.nombre_capa_db.ilike(f'%{keyword}%')
            )
            filters.append(keyword_filter)

        if filters:
            query = query.filter(and_(*filters))

        total = query.count()

        offset = (page - 1) * size
        results = query.limit(size).offset(offset).all()

        return results, total
