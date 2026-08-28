from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal, Any
from app.schemas.assessment import AssessmentAnswer, VitalsSchema

RiskLevel = Literal["HIGH", "MEDIUM", "LOW", "CRITICAL"]
CaseStatus = Literal[
    "IN_PROGRESS",
    "SUPERVISOR_REVIEW",
    "FOLLOW_UP",
    "REFERRED",
    "COMPLETED",
    "OPEN",
    "UNDER_REVIEW",
    "RESOLVED",
]
ReferralStatus = Literal[
    "DRAFT",
    "SUBMITTED",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
]
FollowUpStatus = Literal["DUE_TODAY", "UPCOMING", "OVERDUE", "COMPLETED"]

class ProtocolResultSchema(BaseModel):
    riskLevel: str
    status: Optional[str] = "ROUTINE"
    reason: Optional[str] = ""
    recommendedAction: Optional[str] = ""
    protocolName: Optional[str] = ""
    protocolVersion: Optional[str] = ""
    generatedAt: Optional[str] = ""
    triggeringFindings: Optional[List[str]] = []

class TimelineEventSchema(BaseModel):
    id: str
    at: str
    label: str
    actor: str

class CaseRecordSchema(BaseModel):
    id: str
    patientId: str
    chwId: str
    templateId: str
    templateName: str
    riskLevel: str
    status: str
    createdAt: str
    flaggedAt: Optional[str] = None
    supervisorAcknowledgedAt: Optional[str] = None
    answers: Optional[List[Any]] = []
    vitals: Optional[Any] = None
    protocolResult: Optional[Any] = None
    chwNotes: Optional[str] = ""
    timeline: Optional[List[Any]] = []
    referralId: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CaseStatusUpdate(BaseModel):
    status: CaseStatus

class SupervisorActionRequest(BaseModel):
    action: Literal["ACKNOWLEDGE", "REQUEST_INFO", "CONTACT_CHW", "ESCALATE", "CLOSE"]

class ReferralCreate(BaseModel):
    patientId: str
    caseId: Optional[str] = None
    chwId: Optional[str] = None
    reason: Optional[str] = None
    priority: Optional[str] = None
    destination: Optional[str] = None
    supervisorId: Optional[str] = None
    notes: Optional[str] = None

class ReferralSchema(ReferralCreate):
    id: str
    status: Optional[str] = None
    createdAt: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ReferralStatusUpdate(BaseModel):
    status: ReferralStatus

class FollowUpSchema(BaseModel):
    id: str
    patientId: str
    chwId: Optional[str] = None
    reason: Optional[str] = None
    dueDate: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class FollowUpRescheduleRequest(BaseModel):
    days: int

class FollowUpReassignRequest(BaseModel):
    chwId: str
