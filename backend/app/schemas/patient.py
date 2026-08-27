from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal

PatientStatus = Literal["ACTIVE", "FOLLOW_UP", "REFERRED", "HIGH_PRIORITY", "INACTIVE"]
LanguageCode = Literal["en", "es", "ar", "hi"]
Sex = Literal["Female", "Male", "Other"]

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str

class PatientCreate(BaseModel):
    firstName: str
    lastName: str
    dateOfBirth: str
    sex: Sex
    preferredLanguage: LanguageCode
    phone: str
    address: str
    emergencyContact: EmergencyContact
    assignedChwId: str
    externalMrn: Optional[str] = None

class PatientSchema(PatientCreate):
    id: str
    age: int
    status: PatientStatus
    lastVisit: str
    model_config = ConfigDict(from_attributes=True)

class PatientStatusUpdate(BaseModel):
    status: PatientStatus

class ScheduleFollowUpRequest(BaseModel):
    days: int = 3
