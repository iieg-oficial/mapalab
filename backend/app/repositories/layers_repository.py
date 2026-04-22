from datetime import datetime
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.layer import InitialLayerOrder, Layer, Workspace


class LayersRepository:

    @staticmethod
    def get_all_layers(session: Session) -> list[Layer]:
        return (
            session.query(Layer)
            .order_by(Layer.parent_id.nulls_first(), Layer.sort_order, Layer.id)
            .all()
        )

    @staticmethod
    def get_all_workspaces(session: Session) -> list[Workspace]:
        return session.query(Workspace).order_by(Workspace.alias).all()

    @staticmethod
    def get_initial_order(session: Session) -> list[str]:
        rows = (
            session.query(InitialLayerOrder.layer_id)
            .order_by(InitialLayerOrder.sort_order)
            .all()
        )
        return [r[0] for r in rows]

    @staticmethod
    def get_max_updated_at(session: Session) -> Optional[datetime]:
        return session.query(func.max(Layer.updated_at)).scalar()

    @staticmethod
    def count_layers(session: Session) -> int:
        return session.query(Layer).count()

    @staticmethod
    def search_layers(session: Session, query_text: str, limit: int = 50) -> list[Layer]:
        q = query_text.strip().lower()
        if not q:
            return []

        like_pattern = f'%{q}%'
        return (
            session.query(Layer)
            .filter(Layer.node_type == 'leaf')
            .filter(
                or_(
                    func.lower(Layer.label).like(like_pattern),
                    func.array_to_string(Layer.search_tags, ' ').ilike(like_pattern),
                    func.lower(Layer.id).like(like_pattern),
                )
            )
            .order_by(Layer.label)
            .limit(limit)
            .all()
        )
