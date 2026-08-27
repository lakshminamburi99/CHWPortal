from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db
from app.models.notification import NotificationModel
from app.schemas.notification import NotificationSchema, NotificationReadUpdate

router = APIRouter()

def to_notification_schema(n: NotificationModel) -> NotificationSchema:
    return NotificationSchema(
        id=n.id,
        category=n.category,
        title=n.title,
        body=n.body,
        createdAt=n.created_at,
        read=n.read,
        audience=n.audience,
        caseId=n.case_id,
    )

@router.get("", response_model=List[NotificationSchema])
def list_notifications(
    audience: str = Query("CHW"),
    db: Session = Depends(get_db),
):
    notifications = db.query(NotificationModel).filter(NotificationModel.audience == audience).all()
    return [to_notification_schema(n) for n in notifications]

@router.post("/mark-all-read")
def mark_all_read(
    audience: str = Query("CHW"),
    db: Session = Depends(get_db),
):
    db.query(NotificationModel).filter(NotificationModel.audience == audience).update({"read": True})
    db.commit()
    return {"success": True}

@router.patch("/{id}/read", response_model=NotificationSchema)
def mark_notification_read(id: str, payload: NotificationReadUpdate, db: Session = Depends(get_db)):
    notification = db.query(NotificationModel).filter(NotificationModel.id == id).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTIFICATION_NOT_FOUND")

    notification.read = payload.read
    db.commit()
    db.refresh(notification)
    return to_notification_schema(notification)

@router.delete("/{id}")
def dismiss_notification(id: str, db: Session = Depends(get_db)):
    notification = db.query(NotificationModel).filter(NotificationModel.id == id).first()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTIFICATION_NOT_FOUND")

    db.delete(notification)
    db.commit()
    return {"success": True}
