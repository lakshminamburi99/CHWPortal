"""
SQLAlchemy ORM models for RBAC:
  roles, permissions, roles_permissions, user_roles
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, ForeignKey, Table,
    DateTime, UniqueConstraint, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


# ── Association: roles <-> permissions (many-to-many) ───────────────────────
roles_permissions = Table(
    "roles_permissions",
    Base.metadata,
    Column("role_id",       String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class RoleModel(Base):
    __tablename__ = "roles"

    id             = Column(String(36), primary_key=True, default=_uuid)
    code           = Column(String(64), unique=True, nullable=False, index=True)
    name           = Column(String(128), nullable=False)
    description    = Column(Text)
    is_system_role = Column(Boolean, default=True, nullable=False)
    is_active      = Column(Boolean, default=True, nullable=False)
    created_at     = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at     = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    permissions    = relationship("PermissionModel", secondary=roles_permissions, back_populates="roles")
    user_roles     = relationship("UserRoleModel", back_populates="role")


class PermissionModel(Base):
    __tablename__ = "permissions"

    id          = Column(String(36), primary_key=True, default=_uuid)
    code        = Column(String(128), unique=True, nullable=False, index=True)
    name        = Column(String(128), nullable=False)
    description = Column(Text)
    resource    = Column(String(64), nullable=False)   # patient | assessment | case | ...
    action      = Column(String(64), nullable=False)   # view | create | update | delete | ...
    created_at  = Column(DateTime(timezone=True), default=_now, nullable=False)

    roles       = relationship("RoleModel", secondary=roles_permissions, back_populates="permissions")


class UserRoleModel(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_role"),)

    id          = Column(String(36), primary_key=True, default=_uuid)
    user_id     = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id     = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    expires_at  = Column(DateTime(timezone=True), nullable=True)
    is_active   = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    role        = relationship("RoleModel", back_populates="user_roles")
    user        = relationship("UserModel", foreign_keys=[user_id], back_populates="user_roles")
