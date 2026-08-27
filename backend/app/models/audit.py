"""
Audit log model — write-only append table.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Index, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


class AuditLogModel(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_user_id",       "user_id"),
        Index("ix_audit_resource",      "resource_type", "resource_id"),
        Index("ix_audit_timestamp",     "timestamp"),
        Index("ix_audit_action",        "action"),
    )

    id            = Column(String(64), primary_key=True, default=_uuid)
    user_id       = Column(String(64), nullable=True, index=True)   # nullable for system events
    session_id    = Column(String(64), nullable=True)
    action        = Column(String(128), nullable=False)
    resource_type = Column(String(64),  nullable=True)
    resource_id   = Column(String(64), nullable=True)
    old_values    = Column(JSON_TYPE, nullable=True)
    new_values    = Column(JSON_TYPE, nullable=True)
    ip_address    = Column(String(64),  nullable=True)
    user_agent    = Column(Text,        nullable=True)
    request_id    = Column(String(128), nullable=True)
    timestamp     = Column(DateTime(timezone=True), default=_now, nullable=False)
