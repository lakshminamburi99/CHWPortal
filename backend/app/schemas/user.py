from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal

Role = Literal["CHW", "SUPERVISOR", "MANAGER", "ADMIN", "SUPER_ADMIN"]
LanguageCode = Literal["en", "es", "ar", "hi"]
ChwStatus = Literal["ACTIVE", "OFFLINE", "INACTIVE"]
AccountStatus = Literal["ACTIVE", "INVITED", "SUSPENDED"]

class UserBase(BaseModel):
    name: str
    email: str
    role: Role
    organization: str
    supervisorName: Optional[str] = None
    preferredLanguage: LanguageCode = "en"

class UserCreate(UserBase):
    pass

class UserSchema(UserBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class SignInRequest(BaseModel):
    email: str
    password: Optional[str] = None

class ChwSchema(BaseModel):
    id: str
    name: str
    email: str
    status: ChwStatus
    region: str
    assignedPatients: int
    openCases: int
    followUps: int
    highPriorityCases: int
    lastActive: str
    trainingProgress: int
    model_config = ConfigDict(from_attributes=True)

class ChwStatusUpdate(BaseModel):
    status: ChwStatus

class ChwMessageRequest(BaseModel):
    message: str

class PlatformUserSchema(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    orgUnitId: str
    status: AccountStatus
    lastSignIn: str
    mfaEnabled: bool
    model_config = ConfigDict(from_attributes=True)

class UserStatusUpdate(BaseModel):
    status: AccountStatus

class UserRoleUpdate(BaseModel):
    role: str

class InviteUserRequest(BaseModel):
    name: str
    email: str
    role: str
    orgUnitId: str = "FTA"

