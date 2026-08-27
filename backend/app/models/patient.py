"""
Patient models:
  PatientModel, PatientAssignmentModel, PatientContactModel, PatientStatusHistoryModel
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, ForeignKey,
    DateTime, Text, Date, Index, Integer, JSON,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


class PatientModel(Base):
    __tablename__ = "patients"
    __table_args__ = (
        Index("ix_patients_status",     "status"),
        Index("ix_patients_risk_level", "risk_level"),
        Index("ix_patients_created_at", "created_at"),
    )

    id                 = Column(String(64), primary_key=True, default=_uuid)
    mrn                = Column(String(64), unique=True, nullable=True)        # Medical Record Number
    first_name         = Column(String(128), nullable=False)
    middle_name        = Column(String(128), nullable=True)
    last_name          = Column(String(128), nullable=False)
    date_of_birth      = Column(Date, nullable=True)
    age                = Column(Integer, nullable=True, default=30)
    sex                = Column(String(16), nullable=True)                     # MALE | FEMALE | OTHER | UNKNOWN
    preferred_language = Column(String(8), nullable=False, default="en")

    # Status: ACTIVE | INACTIVE | TRANSFERRED | DECEASED | HIGH_PRIORITY | FOLLOW_UP | REFERRED
    status             = Column(String(32), nullable=False, default="ACTIVE")
    # Risk: LOW | MEDIUM | HIGH | CRITICAL | UNKNOWN
    risk_level         = Column(String(32), nullable=False, default="UNKNOWN")

    phone              = Column(String(64), nullable=True)
    address            = Column(String(256), nullable=True)
    emergency_contact  = Column(JSON_TYPE, nullable=True)
    assigned_chw_id    = Column(String(64), ForeignKey("users.id"), nullable=True)
    last_visit         = Column(String(32), nullable=True)
    external_mrn       = Column(String(64), nullable=True)

    address_line1      = Column(String(256), nullable=True)
    address_city       = Column(String(128), nullable=True)
    address_district   = Column(String(128), nullable=True)
    address_region     = Column(String(128), nullable=True)

    notes              = Column(Text, nullable=True)

    # Audit
    created_at         = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at         = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
    created_by         = Column(String(64), ForeignKey("users.id"), nullable=True)
    updated_by         = Column(String(64), ForeignKey("users.id"), nullable=True)
    deleted_at         = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    assignments        = relationship("PatientAssignmentModel", back_populates="patient")
    contacts           = relationship("PatientContactModel",    back_populates="patient")
    status_history     = relationship("PatientStatusHistoryModel", back_populates="patient")


class PatientAssignmentModel(Base):
    """Determines which CHW / team can access a patient."""
    __tablename__ = "patient_assignments"
    __table_args__ = (
        Index("ix_pa_patient_id",   "patient_id"),
        Index("ix_pa_chw_user_id",  "chw_user_id"),
        Index("ix_pa_team_id",      "team_id"),
    )

    id          = Column(String(64), primary_key=True, default=_uuid)
    patient_id  = Column(String(64), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    chw_user_id = Column(String(64), ForeignKey("users.id"),    nullable=True)
    team_id     = Column(String(64), ForeignKey("teams.id"),    nullable=True)
    district_id = Column(String(64), ForeignKey("districts.id"),nullable=True)
    region_id   = Column(String(64), ForeignKey("regions.id"),  nullable=True)
    assigned_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    assigned_by = Column(String(64), ForeignKey("users.id"), nullable=True)
    ended_at    = Column(DateTime(timezone=True), nullable=True)
    # Status: ACTIVE | ENDED | TRANSFERRED
    status      = Column(String(32), nullable=False, default="ACTIVE")
    created_at  = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    patient     = relationship("PatientModel", back_populates="assignments")


class PatientContactModel(Base):
    __tablename__ = "patient_contacts"

    id          = Column(String(64), primary_key=True, default=_uuid)
    patient_id  = Column(String(64), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    type        = Column(String(32), nullable=False)   # PHONE | EMAIL | EMERGENCY
    value       = Column(String(256), nullable=False)
    label       = Column(String(128), nullable=True)
    is_primary  = Column(Boolean, default=False, nullable=False)
    created_at  = Column(DateTime(timezone=True), default=_now, nullable=False)

    patient     = relationship("PatientModel", back_populates="contacts")


class PatientStatusHistoryModel(Base):
    __tablename__ = "patient_status_history"

    id          = Column(String(64), primary_key=True, default=_uuid)
    patient_id  = Column(String(64), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status  = Column(String(32), nullable=True)
    new_status  = Column(String(32), nullable=False)
    changed_by  = Column(String(64), ForeignKey("users.id"), nullable=True)
    changed_at  = Column(DateTime(timezone=True), default=_now, nullable=False)
    reason      = Column(Text, nullable=True)

    patient     = relationship("PatientModel", back_populates="status_history")
