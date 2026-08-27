from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.api.deps import get_db
from app.models.clinical import CaseRecordModel
from app.models.notification import NotificationModel
from app.schemas.clinical import (
    CaseRecordSchema,
    CaseStatusUpdate,
    SupervisorActionRequest,
)

router = APIRouter()

def to_case_schema(c: CaseRecordModel) -> CaseRecordSchema:
    return CaseRecordSchema(
        id=c.id,
        patientId=c.patient_id,
        chwId=c.chw_id,
        templateId=c.template_id,
        templateName=c.template_name,
        riskLevel=c.risk_level,
        status=c.status,
        createdAt=c.created_at,
        flaggedAt=c.flagged_at,
        supervisorAcknowledgedAt=c.supervisor_acknowledged_at,
        answers=c.answers,
        vitals=c.vitals,
        protocolResult=c.protocol_result,
        chwNotes=c.chw_notes,
        timeline=c.timeline,
        referralId=c.referral_id,
    )

@router.get("", response_model=List[CaseRecordSchema])
def list_cases(
    chwId: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CaseRecordModel)
    if chwId:
        query = query.filter(CaseRecordModel.chw_id == chwId)
    if status == "HIGH":
        query = query.filter(CaseRecordModel.risk_level == "HIGH")
    elif status and status != "ALL":
        query = query.filter(CaseRecordModel.status == status)

    cases = query.all()
    return [to_case_schema(c) for c in cases]

@router.get("/priority-queue", response_model=List[CaseRecordSchema])
def priority_queue(db: Session = Depends(get_db)):
    weight = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    cases = db.query(CaseRecordModel).filter(CaseRecordModel.status != "COMPLETED").all()
    cases.sort(key=lambda c: (weight.get(c.risk_level, 9), c.created_at), reverse=False)
    return [to_case_schema(c) for c in cases]

@router.get("/{id}", response_model=CaseRecordSchema)
def get_case(id: str, db: Session = Depends(get_db)):
    case_record = db.query(CaseRecordModel).filter(CaseRecordModel.id == id).first()
    if not case_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CASE_NOT_FOUND")
    return to_case_schema(case_record)

@router.patch("/{id}/status", response_model=CaseRecordSchema)
def update_case_status(id: str, payload: CaseStatusUpdate, db: Session = Depends(get_db)):
    case_record = db.query(CaseRecordModel).filter(CaseRecordModel.id == id).first()
    if not case_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CASE_NOT_FOUND")

    case_record.status = payload.status
    now_time = datetime.now(timezone.utc).strftime("%I:%M %p")
    new_timeline = list(case_record.timeline or [])
    new_timeline.append({
        "id": f"t-{len(new_timeline) + 1}",
        "at": now_time,
        "label": f"Case marked {payload.status.lower().replace('_', ' ')}",
        "actor": "You",
    })
    case_record.timeline = new_timeline
    db.commit()
    db.refresh(case_record)
    return to_case_schema(case_record)

@router.post("/{id}/supervisor-action", response_model=CaseRecordSchema)
def record_supervisor_action(id: str, payload: SupervisorActionRequest, db: Session = Depends(get_db)):
    case_record = db.query(CaseRecordModel).filter(CaseRecordModel.id == id).first()
    if not case_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CASE_NOT_FOUND")

    labels = {
        "ACKNOWLEDGE": "Supervisor reviewed case",
        "REQUEST_INFO": "Supervisor requested more information",
        "CONTACT_CHW": "Supervisor contacted the community health worker",
        "ESCALATE": "Case escalated for clinical follow-up",
        "CLOSE": "Case closed by supervisor",
    }

    now_iso = datetime.now(timezone.utc).isoformat()
    now_time = datetime.now(timezone.utc).strftime("%I:%M %p")

    new_timeline = list(case_record.timeline or [])
    new_timeline.append({
        "id": f"t-{len(new_timeline) + 1}",
        "at": now_time,
        "label": labels[payload.action],
        "actor": "Supervisor",
    })
    case_record.timeline = new_timeline

    if payload.action == "ACKNOWLEDGE":
        case_record.supervisor_acknowledged_at = now_iso
        case_record.status = "FOLLOW_UP"
    elif payload.action == "CLOSE":
        case_record.status = "COMPLETED"
    elif payload.action == "ESCALATE":
        case_record.status = "REFERRED"

    ntf_count = db.query(NotificationModel).count()
    new_ntf = NotificationModel(
        id=f"ntf-{ntf_count + 1}",
        category="SUPERVISOR",
        title=labels[payload.action],
        body=f"Case {case_record.id}: please review the supervisor note and next steps.",
        created_at=now_iso,
        read=False,
        audience="CHW",
        case_id=case_record.id,
    )
    db.add(new_ntf)

    db.commit()
    db.refresh(case_record)
    return to_case_schema(case_record)

@router.post("/{id}/notify-supervisor")
def notify_supervisor(id: str, db: Session = Depends(get_db)):
    case_record = db.query(CaseRecordModel).filter(CaseRecordModel.id == id).first()
    if case_record:
        now_iso = datetime.now(timezone.utc).isoformat()
        now_time = datetime.now(timezone.utc).strftime("%I:%M %p")
        new_timeline = list(case_record.timeline or [])
        new_timeline.append({
            "id": f"t-{len(new_timeline) + 1}",
            "at": now_time,
            "label": "Supervisor notified",
            "actor": "You",
        })
        case_record.timeline = new_timeline

        ntf_count = db.query(NotificationModel).count()
        new_ntf = NotificationModel(
            id=f"ntf-{ntf_count + 1}",
            category="HIGH_PRIORITY",
            title="Community health worker requested review",
            body=f"Case {case_record.id} was sent for supervisor review.",
            created_at=now_iso,
            read=False,
            audience="SUPERVISOR",
            case_id=case_record.id,
        )
        db.add(new_ntf)
        db.commit()

    return {"message": "Supervisor notified successfully"}
