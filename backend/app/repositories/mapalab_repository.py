from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.mapalab import MapalabMetadata
from typing import Optional

class MapalabRepository:

    @staticmethod
    def get_layers(
        session: Session,
        page: int = 1,
        size: int = 50,
        keyword: Optional[str] = None,
    ) -> tuple[list[MapalabMetadata], int]:

        query = session.query(MapalabMetadata)

        filters = []

        if keyword:
            keyword_filter = or_(
                MapalabMetadata.nombre.ilike(f'%{keyword}%'),
                MapalabMetadata.descripcion.ilike(f'%{keyword}%'),
                MapalabMetadata.tematica.ilike(f'%{keyword}%')
            )
            filters.append(keyword_filter)

        if filters:
            query = query.filter(and_(*filters))

        total = query.count()

        offset = (page - 1) * size
        results = query.limit(size).offset(offset).all()

        return results, total

    @staticmethod
    def get_layer_by_id(session: Session, layer_id: int) -> Optional[MapalabMetadata]:
        return session.query(MapalabMetadata).filter(MapalabMetadata.id == layer_id).first()

    @staticmethod
    def get_layer_periodicity_by_url(session: Session, url: str) -> Optional[MapalabMetadata]:
        return session.query(MapalabMetadata).filter(MapalabMetadata.url == url).first()
