from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.api.deps import get_db
from app.core.rbac import require_role
from app.models.messaging import DirectMessageModel
from app.schemas.messaging import MessageSchema, MessageCreate

router = APIRouter()

@router.get("", response_model=List[MessageSchema])
def list_messages(db: Session = Depends(get_db)):
    # Mock behavior: we would normally filter by current_user.id
    messages = db.query(DirectMessageModel).order_by(DirectMessageModel.created_at.desc()).all()
    return [
        MessageSchema.model_construct(
            id=m.id,
            senderId=m.sender_id,
            recipientId=m.recipient_id,
            content=m.content,
            createdAt=m.created_at,
            read=m.read,
        )
        for m in messages
    ]

@router.post("", response_model=MessageSchema)
def send_message(payload: MessageCreate, db: Session = Depends(get_db)):
    msg = DirectMessageModel(
        sender_id="current_user_placeholder", # Normally auth.current_user
        recipient_id=payload.recipientId,
        content=payload.content,
        created_at=datetime.now(timezone.utc),
        read=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    
    return MessageSchema.model_construct(
        id=msg.id,
        senderId=msg.sender_id,
        recipientId=msg.recipient_id,
        content=msg.content,
        createdAt=msg.created_at,
        read=msg.read,
    )
