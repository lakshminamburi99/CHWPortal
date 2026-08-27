"""
Notification models: NotificationModel, UserNotificationModel
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


class NotificationModel(Base):
    __tablename__ = "notifications"

    id            = Column(String(64), primary_key=True, default=_uuid)
    category      = Column(String(64), nullable=True, default="SYSTEM")
    type          = Column(String(64), nullable=True)
    title         = Column(String(256), nullable=False)
    body          = Column(Text, nullable=True)
    created_at    = Column(String(64), nullable=True)
    read          = Column(Boolean, default=False, nullable=False)
    audience      = Column(String(64), default="CHW", nullable=False)
    case_id       = Column(String(64), nullable=True)
    resource_type = Column(String(64), nullable=True)
    resource_id   = Column(String(64), nullable=True)
    expires_at    = Column(DateTime(timezone=True), nullable=True)

    user_notifications = relationship("UserNotificationModel", back_populates="notification", cascade="all, delete-orphan")


class UserNotificationModel(Base):
    __tablename__ = "user_notifications"
    __table_args__ = (
        Index("ix_un_user_id",    "user_id"),
        Index("ix_un_read_at",    "read_at"),
    )

    id              = Column(String(64), primary_key=True, default=_uuid)
    notification_id = Column(String(64), ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id         = Column(String(64), nullable=False, index=True)
    read_at         = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), default=_now, nullable=False)

    notification    = relationship("NotificationModel", back_populates="user_notifications")

