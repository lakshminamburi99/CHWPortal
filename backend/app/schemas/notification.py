from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from app.schemas.user import Role

NotificationCategory = Literal[
    "HIGH_PRIORITY",
    "SUPERVISOR",
    "FOLLOW_UP",
    "REFERRAL",
    "TRAINING",
    "SYSTEM",
]

class NotificationSchema(BaseModel):
    id: str
    category: NotificationCategory
    title: str
    body: str
    createdAt: str
    read: bool
    audience: Role
    caseId: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class NotificationReadUpdate(BaseModel):
    read: bool = True

class VoiceTranscribeRequest(BaseModel):
    options: list[str]

class VoiceTranscribeResponse(BaseModel):
    transcript: str
    suggestedOption: Optional[str] = None
