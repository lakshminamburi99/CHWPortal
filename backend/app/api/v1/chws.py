from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.api.deps import get_db
from app.models.user import ChwModel
from app.models.notification import NotificationModel
from app.schemas.user import ChwSchema, ChwStatusUpdate, ChwMessageRequest

router = APIRouter()

def to_chw_schema(c: ChwModel) -> ChwSchema:
    return ChwSchema(
        id=c.id,
        name=c.name,
        email=c.email,
        status=c.status,
        region=c.region,
        assignedPatients=c.assigned_patients,
        openCases=c.open_cases,
        followUps=c.follow_ups,
        highPriorityCases=c.high_priority_cases,
        lastActive=c.last_active,
        trainingProgress=c.training_progress,
    )

@router.get("", response_model=List[ChwSchema])
def list_chws(db: Session = Depends(get_db)):
    chws = db.query(ChwModel).all()
    return [to_chw_schema(c) for c in chws]

@router.get("/{id}", response_model=ChwSchema)
def get_chw(id: str, db: Session = Depends(get_db)):
    chw = db.query(ChwModel).filter(ChwModel.id == id).first()
    if not chw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CHW_NOT_FOUND")
    return to_chw_schema(chw)

@router.patch("/{id}/status", response_model=ChwSchema)
def update_chw_status(id: str, payload: ChwStatusUpdate, db: Session = Depends(get_db)):
    chw = db.query(ChwModel).filter(ChwModel.id == id).first()
    if not chw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CHW_NOT_FOUND")
    chw.status = payload.status
    chw.last_active = datetime.now(timezone.utc).isoformat()[:10]
    db.commit()
    db.refresh(chw)
    return to_chw_schema(chw)

@router.post("/{id}/message", response_model=ChwSchema)
def send_message_to_chw(id: str, payload: ChwMessageRequest, db: Session = Depends(get_db)):
    chw = db.query(ChwModel).filter(ChwModel.id == id).first()
    if not chw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CHW_NOT_FOUND")
    
    ntf_count = db.query(NotificationModel).count()
    new_ntf = NotificationModel(
        id=f"ntf-{ntf_count + 1}",
        category="SUPERVISOR",
        title="Message from your supervisor",
        body=payload.message,
        created_at=datetime.now(timezone.utc).isoformat(),
        read=False,
        audience="CHW"
    )
    db.add(new_ntf)
    db.commit()
    return to_chw_schema(chw)
