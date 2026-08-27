from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.api.deps import get_db
from app.models.clinical import ReferralModel, CaseRecordModel
from app.models.notification import NotificationModel
from app.schemas.clinical import (
    ReferralSchema,
    ReferralCreate,
    ReferralStatusUpdate,
)

router = APIRouter()

def to_referral_schema(r: ReferralModel) -> ReferralSchema:
    return ReferralSchema(
        id=r.id,
        patientId=r.patient_id,
        caseId=r.case_id,
        chwId=r.chw_id,
        reason=r.reason,
        priority=r.priority,
        destination=r.destination,
        supervisorId=r.supervisor_id,
        notes=r.notes,
        status=r.status,
        createdAt=r.created_at,
    )

@router.get("", response_model=List[ReferralSchema])
def list_referrals(
    chwId: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ReferralModel)
    if chwId:
        query = query.filter(ReferralModel.chw_id == chwId)
    if status and status != "ALL":
        query = query.filter(ReferralModel.status == status)

    referrals = query.all()
    return [to_referral_schema(r) for r in referrals]

@router.post("", response_model=ReferralSchema)
def create_referral(
    payload: ReferralCreate,
    status_param: str = Query("SUBMITTED", alias="status"),
    db: Session = Depends(get_db),
):
    count = db.query(ReferralModel).count()
    ref_id = f"REF-3{str(900 + count)[-3:]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    now_time = datetime.now(timezone.utc).strftime("%I:%M %p")

    referral = ReferralModel(
        id=ref_id,
        patient_id=payload.patientId,
        case_id=payload.caseId,
        chw_id=payload.chwId,
        reason=payload.reason,
        priority=payload.priority,
        destination=payload.destination,
        supervisor_id=payload.supervisorId,
        notes=payload.notes,
        status=status_param,
        created_at=now_iso,
    )
    db.add(referral)

    if payload.caseId:
        case_record = db.query(CaseRecordModel).filter(CaseRecordModel.id == payload.caseId).first()
        if case_record:
            case_record.referral_id = referral.id
            case_record.status = case_record.status if status_param == "DRAFT" else "REFERRED"
            new_timeline = list(case_record.timeline or [])
            new_timeline.append({
                "id": f"t-{len(new_timeline) + 1}",
                "at": now_time,
                "label": "Referral saved as draft" if status_param == "DRAFT" else "Referral submitted",
                "actor": "You",
            })
            case_record.timeline = new_timeline

    ntf_count = db.query(NotificationModel).count()
    new_ntf = NotificationModel(
        id=f"ntf-{ntf_count + 1}",
        category="REFERRAL",
        title="Referral draft saved" if status_param == "DRAFT" else "Referral submitted",
        body=f"{payload.destination} — priority {payload.priority}.",
        created_at=now_iso,
        read=False,
        audience="SUPERVISOR",
        case_id=payload.caseId,
    )
    db.add(new_ntf)

    db.commit()
    db.refresh(referral)
    return to_referral_schema(referral)

@router.patch("/{id}/status", response_model=ReferralSchema)
def update_referral_status(id: str, payload: ReferralStatusUpdate, db: Session = Depends(get_db)):
    referral = db.query(ReferralModel).filter(ReferralModel.id == id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="REFERRAL_NOT_FOUND")

    referral.status = payload.status

    if referral.case_id:
        case_record = db.query(CaseRecordModel).filter(CaseRecordModel.id == referral.case_id).first()
        if case_record and payload.status == "COMPLETED":
            case_record.status = "COMPLETED"

    now_iso = datetime.now(timezone.utc).isoformat()
    ntf_count = db.query(NotificationModel).count()
    new_ntf = NotificationModel(
        id=f"ntf-{ntf_count + 1}",
        category="REFERRAL",
        title=f"Referral {payload.status.lower().replace('_', ' ')}",
        body=f"{referral.destination} — referral {referral.id} was updated by your supervisor.",
        created_at=now_iso,
        read=False,
        audience="CHW",
        case_id=referral.case_id,
    )
    db.add(new_ntf)

    db.commit()
    db.refresh(referral)
    return to_referral_schema(referral)
