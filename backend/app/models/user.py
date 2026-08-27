"""
User models: UserModel, SessionModel, PasswordResetTokenModel
"""
import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, ForeignKey,
    DateTime, Text, Index,
)
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


class UserModel(Base):
    __tablename__ = "users"

    id                    = Column(String(36), primary_key=True, default=_uuid)
    username              = Column(String(128), unique=True, nullable=False, index=True)
    email                 = Column(String(256), unique=True, nullable=False, index=True)
    password_hash         = Column(Text, nullable=False)

    first_name            = Column(String(128), nullable=False)
    middle_name           = Column(String(128), nullable=True)
    last_name             = Column(String(128), nullable=False)
    display_name          = Column(String(256), nullable=True)
    phone                 = Column(String(32), nullable=True)

    preferred_language    = Column(String(8), nullable=False, default="en")
    timezone              = Column(String(64), nullable=False, default="UTC")

    # Status: ACTIVE | INVITED | SUSPENDED | INACTIVE
    status                = Column(String(32), nullable=False, default="ACTIVE", index=True)
    is_email_verified     = Column(Boolean, default=False, nullable=False)

    # Security tracking
    last_login_at         = Column(DateTime(timezone=True), nullable=True)
    password_changed_at   = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until          = Column(DateTime(timezone=True), nullable=True)
    must_change_password  = Column(Boolean, default=False, nullable=False)
    mfa_enabled           = Column(Boolean, default=False, nullable=False)

    # Org scope
    team_id               = Column(String(36), ForeignKey("teams.id"), nullable=True)
    district_id           = Column(String(36), ForeignKey("districts.id"), nullable=True)
    region_id             = Column(String(36), ForeignKey("regions.id"), nullable=True)
    organization_id       = Column(String(36), ForeignKey("organizations.id"), nullable=True)

    # Audit fields
    created_at            = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at            = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
    created_by            = Column(String(36), ForeignKey("users.id"), nullable=True)
    updated_by            = Column(String(36), ForeignKey("users.id"), nullable=True)
    deleted_at            = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user_roles            = relationship("UserRoleModel", foreign_keys="UserRoleModel.user_id", back_populates="user")
    sessions              = relationship("SessionModel", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetTokenModel", back_populates="user", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        return " ".join(parts)

    @property
    def effective_role(self) -> str | None:
        """Returns the code of the first active role."""
        for ur in self.user_roles:
            if ur.is_active:
                return ur.role.code
        return None

    @property
    def permission_codes(self) -> set[str]:
        codes: set[str] = set()
        for ur in self.user_roles:
            if ur.is_active:
                for perm in ur.role.permissions:
                    codes.add(perm.code)
        return codes


class SessionModel(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        Index("ix_sessions_user_id",   "user_id"),
        Index("ix_sessions_expires_at","expires_at"),
    )

    id                 = Column(String(36), primary_key=True, default=_uuid)
    user_id            = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_token_hash = Column(String(256), unique=True, nullable=False, index=True)
    created_at         = Column(DateTime(timezone=True), default=_now, nullable=False)
    last_activity_at   = Column(DateTime(timezone=True), default=_now, nullable=False)
    expires_at         = Column(DateTime(timezone=True), nullable=False)
    revoked_at         = Column(DateTime(timezone=True), nullable=True)
    ip_address         = Column(String(64), nullable=True)
    user_agent         = Column(Text, nullable=True)

    user               = relationship("UserModel", back_populates="sessions")

    @property
    def is_valid(self) -> bool:
        now = datetime.now(timezone.utc)
        exp = self.expires_at
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return self.revoked_at is None and exp > now


class PasswordResetTokenModel(Base):
    __tablename__ = "password_reset_tokens"

    id          = Column(String(36), primary_key=True, default=_uuid)
    user_id     = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash  = Column(String(256), unique=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), default=_now, nullable=False)
    expires_at  = Column(DateTime(timezone=True), nullable=False)
    used_at     = Column(DateTime(timezone=True), nullable=True)

    user        = relationship("UserModel", back_populates="password_reset_tokens")


# Legacy models retained for endpoint compatibility
class ChwModel(Base):
    __tablename__ = "chws"

    id                  = Column(String, primary_key=True, index=True)
    name                = Column(String, nullable=False)
    email               = Column(String, nullable=False)
    status              = Column(String, nullable=False)
    region              = Column(String, nullable=False)
    assigned_patients   = Column(Integer, default=0)
    open_cases          = Column(Integer, default=0)
    follow_ups          = Column(Integer, default=0)
    high_priority_cases = Column(Integer, default=0)
    last_active         = Column(String, nullable=False)
    training_progress   = Column(Integer, default=0)


class PlatformUserModel(Base):
    __tablename__ = "platform_users"

    id           = Column(String, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    email        = Column(String, unique=True, index=True, nullable=False)
    role         = Column(String, nullable=False)
    org_unit_id  = Column(String, nullable=False)
    status       = Column(String, nullable=False)
    last_sign_in = Column(String, nullable=False)
    mfa_enabled  = Column(Boolean, default=False)
