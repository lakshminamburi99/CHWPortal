from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.api.deps import get_db
from app.models.assessment import AssessmentTemplateModel
from app.models.clinical import CaseRecordModel, FollowUpModel, ReferralModel
from app.models.notification import NotificationModel
from app.schemas.assessment import (
    AssessmentTemplateSchema,
    AssessmentSubmitRequest,
)
from app.schemas.clinical import CaseRecordSchema
from app.services.protocol_engine import protocol_engine

router = APIRouter()

@router.get("/templates", response_model=List[AssessmentTemplateSchema])
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(AssessmentTemplateModel).all()
    return [
        AssessmentTemplateSchema(
            id=t.id,
            category=t.category,
            name=t.name,
            description=t.description,
            durationMinutes=t.duration_minutes,
            questions=t.questions,
        )
        for t in templates
    ]

@router.get("/templates/{id}", response_model=AssessmentTemplateSchema)
def get_template(id: str, db: Session = Depends(get_db)):
    template = db.query(AssessmentTemplateModel).filter(AssessmentTemplateModel.id == id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TEMPLATE_NOT_FOUND")
    return AssessmentTemplateSchema(
        id=template.id,
        category=template.category,
        name=template.name,
        description=template.description,
        durationMinutes=template.duration_minutes,
        questions=template.questions,
    )

@router.post("/submit", response_model=CaseRecordSchema)
def submit_assessment(payload: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    protocol_result = protocol_engine.evaluate(payload.answers, payload.vitals)
    case_count = db.query(CaseRecordModel).count()
    import time
    case_id = f"CASE-{str(29000 + case_count + int(time.time() % 1000)).zfill(5)}"
    now_iso = datetime.now(timezone.utc).isoformat()
    now_time = datetime.now(timezone.utc).strftime("%I:%M %p")

    status_val = "SUPERVISOR_REVIEW" if protocol_result.riskLevel == "HIGH" else "IN_PROGRESS"

    timeline = [
        {"id": "t-1", "at": now_time, "label": f"Assessment completed ({payload.templateName})", "actor": "You"},
        {"id": "t-2", "at": now_time, "label": f"Risk calculated: {protocol_result.riskLevel}", "actor": "Protocol Engine"},
    ]
    if protocol_result.riskLevel == "HIGH":
        timeline.append({"id": "t-3", "at": now_time, "label": "Case flagged for supervisor review", "actor": "Protocol Engine"})

    case_record = CaseRecordModel(
        id=case_id,
        patient_id=payload.patientId,
        chw_id=payload.chwId,
        template_id=payload.templateId,
        template_name=payload.templateName,
        risk_level=protocol_result.riskLevel,
        status=status_val,
        created_at=now_iso,
        flagged_at=now_iso if protocol_result.riskLevel == "HIGH" else None,
        answers=[a.model_dump() for a in payload.answers],
        vitals=payload.vitals.model_dump(),
        protocol_result=protocol_result.model_dump(),
        chw_notes=payload.notes,
        timeline=timeline,
    )
    db.add(case_record)

    if protocol_result.riskLevel == "HIGH":
        ntf_count = db.query(NotificationModel).count()
        new_ntf = NotificationModel(
            id=f"ntf-{ntf_count + 1}",
            category="HIGH_PRIORITY",
            title="High risk case requires supervisor review",
            body=f"{case_id}: {protocol_result.reason}",
            created_at=now_iso,
            read=False,
            audience="SUPERVISOR",
            case_id=case_id,
        )
        db.add(new_ntf)

    db.commit()
    db.refresh(case_record)

    return CaseRecordSchema(
        id=case_record.id,
        patientId=case_record.patient_id,
        chwId=case_record.chw_id,
        templateId=case_record.template_id,
        templateName=case_record.template_name,
        riskLevel=case_record.risk_level,
        status=case_record.status,
        createdAt=case_record.created_at,
        flaggedAt=case_record.flagged_at,
        supervisorAcknowledgedAt=case_record.supervisor_acknowledged_at,
        answers=case_record.answers,
        vitals=case_record.vitals,
        protocolResult=case_record.protocol_result,
        chwNotes=case_record.chw_notes,
        timeline=case_record.timeline,
        referralId=case_record.referral_id,
    )
