"""
Case management models:
  CaseModel, CaseNoteModel, CaseReviewModel, CaseEscalationModel, CaseStatusHistoryModel
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


class CaseModel(Base):
    __tablename__ = "cases"
    __table_args__ = (
        Index("ix_cases_status",      "status"),
        Index("ix_cases_assigned_to", "assigned_to"),
        Index("ix_cases_patient_id",  "patient_id"),
    )

    id             = Column(String(64), primary_key=True, default=_uuid)
    patient_id     = Column(String(64), ForeignKey("patients.id"), nullable=False)
    assessment_id  = Column(String(64), ForeignKey("assessments.id"), nullable=True)
    risk_result_id = Column(String(64), ForeignKey("risk_results.id"), nullable=True)

    # OPEN | ASSIGNED | UNDER_REVIEW | ESCALATED | RESOLVED | CLOSED
    status         = Column(String(32), nullable=False, default="OPEN")
    # LOW | MEDIUM | HIGH | CRITICAL
    priority       = Column(String(32), nullable=False, default="MEDIUM")

    assigned_to    = Column(String(64), ForeignKey("users.id"), nullable=True)
    assigned_at    = Column(DateTime(timezone=True), nullable=True)

    notes          = Column(Text, nullable=True)
    created_at     = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at     = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
    created_by     = Column(String(64), ForeignKey("users.id"), nullable=True)
    closed_at      = Column(DateTime(timezone=True), nullable=True)
    deleted_at     = Column(DateTime(timezone=True), nullable=True)

    case_notes      = relationship("CaseNoteModel",       back_populates="case", cascade="all, delete-orphan")
    reviews         = relationship("CaseReviewModel",      back_populates="case", cascade="all, delete-orphan")
    escalations     = relationship("CaseEscalationModel",  back_populates="case", cascade="all, delete-orphan")
    status_history  = relationship("CaseStatusHistoryModel", back_populates="case", cascade="all, delete-orphan")


class CaseNoteModel(Base):
    __tablename__ = "case_notes"

    id         = Column(String(64), primary_key=True, default=_uuid)
    case_id    = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id  = Column(String(64), ForeignKey("users.id"), nullable=False)
    note       = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)

    case       = relationship("CaseModel", back_populates="case_notes")


class CaseReviewModel(Base):
    __tablename__ = "case_reviews"

    id              = Column(String(64), primary_key=True, default=_uuid)
    case_id         = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id     = Column(String(64), ForeignKey("users.id"), nullable=False)
    # PENDING | IN_PROGRESS | COMPLETED | ESCALATED
    review_status   = Column(String(32), nullable=False, default="PENDING")
    priority        = Column(String(32), nullable=True)
    review_notes    = Column(Text, nullable=True)
    reviewed_at     = Column(DateTime(timezone=True), nullable=True)
    action_required = Column(Boolean, default=False, nullable=False)
    created_at      = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at      = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    case            = relationship("CaseModel", back_populates="reviews")


class CaseEscalationModel(Base):
    __tablename__ = "case_escalations"

    id            = Column(String(64), primary_key=True, default=_uuid)
    case_id       = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    escalated_by  = Column(String(64), ForeignKey("users.id"), nullable=False)
    escalated_to  = Column(String(64), ForeignKey("users.id"), nullable=True)
    reason        = Column(Text, nullable=True)
    escalated_at  = Column(DateTime(timezone=True), default=_now, nullable=False)

    case          = relationship("CaseModel", back_populates="escalations")


class CaseStatusHistoryModel(Base):
    __tablename__ = "case_status_history"

    id          = Column(String(64), primary_key=True, default=_uuid)
    case_id     = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status  = Column(String(32), nullable=True)
    new_status  = Column(String(32), nullable=False)
    changed_by  = Column(String(64), ForeignKey("users.id"), nullable=True)
    changed_at  = Column(DateTime(timezone=True), default=_now, nullable=False)
    note        = Column(Text, nullable=True)

    case        = relationship("CaseModel", back_populates="status_history")

