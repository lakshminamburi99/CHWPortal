import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Index
from app.db.base import Base

def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)

class DirectMessageModel(Base):
    __tablename__ = "direct_messages"
    __table_args__ = (
        Index("ix_dm_sender", "sender_id"),
        Index("ix_dm_recipient", "recipient_id"),
    )

    id = Column(String(64), primary_key=True, default=_uuid)
    sender_id = Column(String(64), nullable=False)
    recipient_id = Column(String(64), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
