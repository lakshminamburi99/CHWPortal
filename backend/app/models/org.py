"""
Organization hierarchy models:
  organizations → regions → districts → teams
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


class OrganizationModel(Base):
    __tablename__ = "organizations"

    id         = Column(String(36), primary_key=True, default=_uuid)
    name       = Column(String(256), nullable=False)
    code       = Column(String(64), unique=True, nullable=False)
    status     = Column(String(32), default="ACTIVE", nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    regions    = relationship("RegionModel", back_populates="organization")


class RegionModel(Base):
    __tablename__ = "regions"

    id              = Column(String(36), primary_key=True, default=_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name            = Column(String(256), nullable=False)
    code            = Column(String(64), nullable=False)
    manager_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status          = Column(String(32), default="ACTIVE", nullable=False)
    created_at      = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at      = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    organization    = relationship("OrganizationModel", back_populates="regions")
    districts       = relationship("DistrictModel", back_populates="region")


class DistrictModel(Base):
    __tablename__ = "districts"

    id              = Column(String(36), primary_key=True, default=_uuid)
    region_id       = Column(String(36), ForeignKey("regions.id", ondelete="CASCADE"), nullable=False, index=True)
    name            = Column(String(256), nullable=False)
    code            = Column(String(64), nullable=False)
    manager_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status          = Column(String(32), default="ACTIVE", nullable=False)
    created_at      = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at      = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    region          = relationship("RegionModel", back_populates="districts")
    teams           = relationship("TeamModel", back_populates="district")


class TeamModel(Base):
    __tablename__ = "teams"

    id                = Column(String(36), primary_key=True, default=_uuid)
    district_id       = Column(String(36), ForeignKey("districts.id", ondelete="CASCADE"), nullable=False, index=True)
    name              = Column(String(256), nullable=False)
    code              = Column(String(64), nullable=False)
    supervisor_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status            = Column(String(32), default="ACTIVE", nullable=False)
    created_at        = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at        = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    district          = relationship("DistrictModel", back_populates="teams")
