from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Integer,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.models.layer import LayerBase


class MapShare(LayerBase):
    __tablename__ = 'map_shares'
    __table_args__ = (
        CheckConstraint("kind IN ('single','compare')", name='ck_map_shares_kind'),
        {'schema': 'mapalab'},
    )

    id = Column(String(10), primary_key=True)
    payload = Column(JSONB, nullable=False)
    kind = Column(String(16), nullable=False)
    schema_version = Column(Integer, nullable=False, server_default='1')
    created_at = Column(DateTime(timezone=True), server_default=text('NOW()'), nullable=False)
    last_accessed_at = Column(DateTime(timezone=True), server_default=text('NOW()'), nullable=False)
    access_count = Column(Integer, nullable=False, server_default='0')
    pinned_until = Column(DateTime(timezone=True), nullable=True)
    created_ip_hash = Column(String(64), nullable=True)
