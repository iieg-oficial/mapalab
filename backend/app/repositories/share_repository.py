from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.share import MapShare


class ShareRepository:

    @staticmethod
    def get(session: Session, share_id: str) -> Optional[MapShare]:
        return session.query(MapShare).filter(MapShare.id == share_id).first()

    @staticmethod
    def upsert(
        session: Session,
        share_id: str,
        payload: dict,
        kind: str,
        schema_version: int,
        created_ip_hash: Optional[str],
    ) -> MapShare:
        existing = session.query(MapShare).filter(MapShare.id == share_id).first()
        if existing is not None:
            existing.last_accessed_at = datetime.utcnow()
            existing.access_count = (existing.access_count or 0) + 1
            session.flush()
            return existing
        share = MapShare(
            id=share_id,
            payload=payload,
            kind=kind,
            schema_version=schema_version,
            created_ip_hash=created_ip_hash,
        )
        session.add(share)
        session.flush()
        return share

    @staticmethod
    def bump_access(session: Session, share: MapShare) -> None:
        share.last_accessed_at = datetime.utcnow()
        share.access_count = (share.access_count or 0) + 1
        session.flush()

    @staticmethod
    def pin(session: Session, share: MapShare, until: datetime) -> None:
        share.pinned_until = until
        session.flush()

    @staticmethod
    def unpin(session: Session, share: MapShare) -> None:
        share.pinned_until = None
        session.flush()
