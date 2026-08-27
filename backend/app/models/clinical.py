"""
Clinical models: ReferralModel, FollowUpModel, RiskResultModel, RiskFlagModel
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text, Index, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


class CaseRecordModel(Base):
    __tablename__ = "case_records"
    __table_args__ = (
        Index("ix_case_records_patient_id", "patient_id"),
        Index("ix_case_records_status", "status"),
        Index("ix_case_records_risk_level", "risk_level"),
    )

    id                         = Column(String(64), primary_key=True, default=_uuid)
    patient_id                 = Column(String(64), nullable=False)
    chw_id                     = Column(String(64), nullable=True)
    template_id                = Column(String(64), nullable=True)
    template_name              = Column(String(256), nullable=True)
    risk_level                 = Column(String(32), nullable=False, default="LOW")
    status                     = Column(String(64), nullable=False, default="IN_PROGRESS")
    created_at                 = Column(String(64), nullable=True)
    flagged_at                 = Column(String(64), nullable=True)
    supervisor_acknowledged_at = Column(String(64), nullable=True)
    answers                    = Column(JSON_TYPE, nullable=True)
    vitals                     = Column(JSON_TYPE, nullable=True)
    protocol_result            = Column(JSON_TYPE, nullable=True)
    chw_notes                  = Column(Text, nullable=True)
    timeline                   = Column(JSON_TYPE, nullable=True)
    referral_id                = Column(String(64), nullable=True)


class RiskResultModel(Base):
    __tablename__ = "risk_results"
    __table_args__ = (
        Index("ix_risk_results_patient_id", "patient_id"),
        Index("ix_risk_results_risk_level",  "risk_level"),
    )

    id               = Column(String(64), primary_key=True, default=_uuid)
    assessment_id    = Column(String(64), nullable=True)
    patient_id       = Column(String(64), nullable=False)
    # LOW | MEDIUM | HIGH | CRITICAL
    risk_level       = Column(String(32), nullable=False)
    risk_code        = Column(String(128), nullable=True)
    risk_description = Column(Text, nullable=True)
    triggered_at     = Column(DateTime(timezone=True), default=_now, nullable=False)
    resolved_at      = Column(DateTime(timezone=True), nullable=True)
    # ACTIVE | ACKNOWLEDGED | RESOLVED
    status           = Column(String(32), nullable=False, default="ACTIVE")
    generated_by     = Column(String(64), nullable=True)

    flags            = relationship("RiskFlagModel", back_populates="risk_result", foreign_keys="[RiskFlagModel.risk_result_id]")


class RiskFlagModel(Base):
    __tablename__ = "risk_flags"
    __table_args__ = (
        Index("ix_risk_flags_patient_id", "patient_id"),
        Index("ix_risk_flags_status",     "status"),
    )

    id                = Column(String(64), primary_key=True, default=_uuid)
    patient_id        = Column(String(64), nullable=False)
    risk_result_id    = Column(String(64), ForeignKey("risk_results.id"), nullable=True)
    flagged_at        = Column(DateTime(timezone=True), default=_now, nullable=False)
    flagged_by        = Column(String(64), nullable=True)
    acknowledged_at   = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by   = Column(String(64), nullable=True)
    escalated_at      = Column(DateTime(timezone=True), nullable=True)
    escalated_to      = Column(String(64), nullable=True)
    # ACTIVE | ACKNOWLEDGED | ESCALATED | RESOLVED
    status            = Column(String(32), nullable=False, default="ACTIVE")

    risk_result       = relationship("RiskResultModel", back_populates="flags", foreign_keys="[RiskFlagModel.risk_result_id]")


class ReferralModel(Base):
    __tablename__ = "referrals"
    __table_args__ = (
        Index("ix_referrals_patient_id", "patient_id"),
        Index("ix_referrals_status",     "status"),
    )

    id            = Column(String(64), primary_key=True, default=_uuid)
    patient_id    = Column(String(64), nullable=False)
    case_id       = Column(String(64), nullable=True)
    chw_id        = Column(String(64), nullable=True)
    supervisor_id = Column(String(64), nullable=True)
    destination   = Column(String(256), nullable=True)
    reason        = Column(Text, nullable=True)
    priority      = Column(String(32), nullable=False, default="MEDIUM")
    status        = Column(String(32), nullable=False, default="SUBMITTED")
    notes         = Column(Text, nullable=True)
    created_at    = Column(String(64), nullable=True)


class FollowUpModel(Base):
    __tablename__ = "followups"
    __table_args__ = (
        Index("ix_followups_patient_id",  "patient_id"),
        Index("ix_followups_status",      "status"),
    )

    id            = Column(String(64), primary_key=True, default=_uuid)
    patient_id    = Column(String(64), nullable=False)
    chw_id        = Column(String(64), nullable=True)
    reason        = Column(Text, nullable=True)
    due_date      = Column(String(64), nullable=True)
    priority      = Column(String(32), nullable=False, default="MEDIUM")
    status        = Column(String(32), nullable=False, default="PENDING")
    notes         = Column(Text, nullable=True)

