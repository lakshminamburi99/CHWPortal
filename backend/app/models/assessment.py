"""
Assessment models (versioned):
  AssessmentTemplateModel → AssessmentTemplateVersionModel
  → AssessmentSectionModel → AssessmentQuestionModel → AssessmentOptionModel
  AssessmentModel → AssessmentAnswerModel → AssessmentResultModel
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def _uuid() -> str:
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


class AssessmentTemplateModel(Base):
    __tablename__ = "assessment_templates"

    id               = Column(String(64), primary_key=True, default=_uuid)
    code             = Column(String(64), unique=True, nullable=True)
    name             = Column(String(256), nullable=False)
    category         = Column(String(64), nullable=True)
    description      = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True, default=10)
    questions        = Column(JSON_TYPE, nullable=True)
    is_active        = Column(Boolean, default=True, nullable=False)
    created_at       = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at       = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    versions         = relationship("AssessmentTemplateVersionModel", back_populates="template")


class AssessmentTemplateVersionModel(Base):
    __tablename__ = "assessment_template_versions"

    id            = Column(String(64), primary_key=True, default=_uuid)
    template_id   = Column(String(64), ForeignKey("assessment_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    version       = Column(Integer, nullable=False, default=1)
    content_hash  = Column(String(64), nullable=True)
    is_published  = Column(Boolean, default=False, nullable=False)
    published_at  = Column(DateTime(timezone=True), nullable=True)
    created_at    = Column(DateTime(timezone=True), default=_now, nullable=False)

    template      = relationship("AssessmentTemplateModel", back_populates="versions")
    sections      = relationship("AssessmentSectionModel", back_populates="template_version")


class AssessmentSectionModel(Base):
    __tablename__ = "assessment_sections"

    id                  = Column(String(64), primary_key=True, default=_uuid)
    template_version_id = Column(String(64), ForeignKey("assessment_template_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    order               = Column(Integer, nullable=False, default=0)
    title               = Column(String(256), nullable=False)
    created_at          = Column(DateTime(timezone=True), default=_now, nullable=False)

    template_version    = relationship("AssessmentTemplateVersionModel", back_populates="sections")
    questions           = relationship("AssessmentQuestionModel", back_populates="section")


class AssessmentQuestionModel(Base):
    __tablename__ = "assessment_questions"

    id          = Column(String(64), primary_key=True, default=_uuid)
    section_id  = Column(String(64), ForeignKey("assessment_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    order       = Column(Integer, nullable=False, default=0)
    text        = Column(Text, nullable=False)
    help_text   = Column(Text, nullable=True)
    # SINGLE_CHOICE | MULTI_CHOICE | TEXT | NUMBER | BOOLEAN | DATE
    type        = Column(String(32), nullable=False, default="SINGLE_CHOICE")
    is_required = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), default=_now, nullable=False)

    section     = relationship("AssessmentSectionModel", back_populates="questions")
    options     = relationship("AssessmentOptionModel", back_populates="question")


class AssessmentOptionModel(Base):
    __tablename__ = "assessment_options"

    id          = Column(String(64), primary_key=True, default=_uuid)
    question_id = Column(String(64), ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    value       = Column(String(128), nullable=False)
    label       = Column(String(256), nullable=False)
    score       = Column(Float, nullable=True)
    order       = Column(Integer, nullable=False, default=0)

    question    = relationship("AssessmentQuestionModel", back_populates="options")


class AssessmentModel(Base):
    __tablename__ = "assessments"

    id                  = Column(String(64), primary_key=True, default=_uuid)
    patient_id          = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    template_version_id = Column(String(64), ForeignKey("assessment_template_versions.id"), nullable=True)
    chw_user_id         = Column(String(64), ForeignKey("users.id"), nullable=False)

    started_at          = Column(DateTime(timezone=True), default=_now, nullable=False)
    completed_at        = Column(DateTime(timezone=True), nullable=True)
    # DRAFT | IN_PROGRESS | COMPLETED | VOIDED
    status              = Column(String(32), nullable=False, default="IN_PROGRESS", index=True)
    voice_used          = Column(Boolean, default=False, nullable=False)
    language            = Column(String(8), nullable=False, default="en")

    created_at          = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at          = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    answers             = relationship("AssessmentAnswerModel", back_populates="assessment", cascade="all, delete-orphan")
    results             = relationship("AssessmentResultModel", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentAnswerModel(Base):
    __tablename__ = "assessment_answers"

    id                 = Column(String(64), primary_key=True, default=_uuid)
    assessment_id      = Column(String(64), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id        = Column(String(64), ForeignKey("assessment_questions.id"), nullable=True)
    selected_option_id = Column(String(64), ForeignKey("assessment_options.id"), nullable=True)
    text_value         = Column(Text, nullable=True)
    numeric_value      = Column(Float, nullable=True)
    answered_at        = Column(DateTime(timezone=True), default=_now, nullable=False)

    assessment         = relationship("AssessmentModel", back_populates="answers")


class AssessmentResultModel(Base):
    __tablename__ = "assessment_results"

    id            = Column(String(64), primary_key=True, default=_uuid)
    assessment_id = Column(String(64), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    # LOW | MEDIUM | HIGH | CRITICAL
    risk_level    = Column(String(32), nullable=False)
    risk_code     = Column(String(128), nullable=True)
    summary       = Column(Text, nullable=True)
    detail        = Column(JSON_TYPE, nullable=True)
    generated_at  = Column(DateTime(timezone=True), default=_now, nullable=False)

    assessment    = relationship("AssessmentModel", back_populates="results")
