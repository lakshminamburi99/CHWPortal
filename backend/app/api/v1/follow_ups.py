from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.api.deps import get_db
from app.models.clinical import FollowUpModel
from app.models.notification import NotificationModel
from app.schemas.clinical import (
    FollowUpSchema,
    FollowUpRescheduleRequest,
    FollowUpReassignRequest,
)

router = APIRouter()

def to_followup_schema(f: FollowUpModel) -> FollowUpSchema:
    return FollowUpSchema(
        id=f.id,
        patientId=f.patient_id,
        chwId=f.chw_id,
        reason=f.reason,
        dueDate=f.due_date,
        priority=f.priority,
        status=f.status,
    )

@router.get("", response_model=List[FollowUpSchema])
def list_follow_ups(
    chwId: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(FollowUpModel)
    if chwId:
        query = query.filter(FollowUpModel.chw_id == chwId)
    if status and status != "ALL":
        query = query.filter(FollowUpModel.status == status)

    follow_ups = query.all()
    return [to_followup_schema(f) for f in follow_ups]

@router.post("/{id}/complete", response_model=FollowUpSchema)
def complete_follow_up(id: str, db: Session = Depends(get_db)):
    follow_up = db.query(FollowUpModel).filter(FollowUpModel.id == id).first()
    if not follow_up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FOLLOW_UP_NOT_FOUND")
    follow_up.status = "COMPLETED"
    db.commit()
    db.refresh(follow_up)
    return to_followup_schema(follow_up)

@router.post("/{id}/reschedule", response_model=FollowUpSchema)
def reschedule_follow_up(id: str, payload: FollowUpRescheduleRequest, db: Session = Depends(get_db)):
    follow_up = db.query(FollowUpModel).filter(FollowUpModel.id == id).first()
    if not follow_up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FOLLOW_UP_NOT_FOUND")

    base_date = datetime.strptime(follow_up.due_date, "%Y-%m-%d") if len(follow_up.due_date) == 10 else datetime.now(timezone.utc)
    new_due = (base_date + timedelta(days=payload.days)).strftime("%Y-%m-%d")
    follow_up.due_date = new_due
    follow_up.status = "UPCOMING" if payload.days > 0 else "DUE_TODAY"

    db.commit()
    db.refresh(follow_up)
    return to_followup_schema(follow_up)

@router.post("/{id}/reassign", response_model=FollowUpSchema)
def reassign_follow_up(id: str, payload: FollowUpReassignRequest, db: Session = Depends(get_db)):
    follow_up = db.query(FollowUpModel).filter(FollowUpModel.id == id).first()
    if not follow_up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FOLLOW_UP_NOT_FOUND")

    follow_up.chw_id = payload.chwId

    now_iso = datetime.now(timezone.utc).isoformat()
    ntf_count = db.query(NotificationModel).count()
    new_ntf = NotificationModel(
        id=f"ntf-{ntf_count + 1}",
        category="FOLLOW_UP",
        title="Follow-up visit assigned to you",
        body=f"{follow_up.reason} — due {follow_up.due_date}.",
        created_at=now_iso,
        read=False,
        audience="CHW",
    )
    db.add(new_ntf)

    db.commit()
    db.refresh(follow_up)
    return to_followup_schema(follow_up)

@router.post("/{id}/escalate", response_model=FollowUpSchema)
def escalate_follow_up(id: str, db: Session = Depends(get_db)):
    follow_up = db.query(FollowUpModel).filter(FollowUpModel.id == id).first()
    if not follow_up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FOLLOW_UP_NOT_FOUND")

    follow_up.priority = "HIGH"

    now_iso = datetime.now(timezone.utc).isoformat()
    ntf_count = db.query(NotificationModel).count()
    new_ntf = NotificationModel(
        id=f"ntf-{ntf_count + 1}",
        category="HIGH_PRIORITY",
        title="Follow-up escalated",
        body=f"{follow_up.reason} was escalated by your supervisor. Please visit today.",
        created_at=now_iso,
        read=False,
        audience="CHW",
    )
    db.add(new_ntf)

    db.commit()
    db.refresh(follow_up)
    return to_followup_schema(follow_up)
