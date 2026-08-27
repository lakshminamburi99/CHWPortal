from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal
from app.schemas.user import Role

OrgType = Literal["REGION", "DISTRICT", "TEAM"]
Severity = Literal["INFO", "WARNING", "CRITICAL"]
ServiceStatus = Literal["OPERATIONAL", "DEGRADED", "DOWN"]
Trend = Literal["UP", "FLAT", "DOWN"]

class OrgUnitSchema(BaseModel):
    id: str
    name: str
    type: OrgType
    parentId: Optional[str] = None
    managerName: str
    chwCount: int
    patientCount: int
    coveragePercent: int
    openCases: int = 0
    model_config = ConfigDict(from_attributes=True)

class AuditEventSchema(BaseModel):
    id: str
    at: str
    actor: str
    actorRole: Role
    action: str
    target: str
    severity: Severity
    model_config = ConfigDict(from_attributes=True)

class SystemServiceSchema(BaseModel):
    id: str
    name: str
    status: ServiceStatus
    uptimePercent: float
    latencyMs: int
    detail: str
    model_config = ConfigDict(from_attributes=True)

class RoleDefinitionSchema(BaseModel):
    role: Role
    label: str
    description: str
    userCount: int
    permissions: List[str]
    model_config = ConfigDict(from_attributes=True)

class ProgramMetricSchema(BaseModel):
    id: str
    name: str
    owner: str
    target: int
    actual: int
    trend: Trend
    period: str
    model_config = ConfigDict(from_attributes=True)

class SettingUpdateRequest(BaseModel):
    key: str
    value: bool

class ProgramTargetUpdate(BaseModel):
    target: int

class ExportReportRequest(BaseModel):
    name: str

class OrgUnitCreate(BaseModel):
    name: str
    type: str
    parentId: Optional[str] = None
    managerName: str = ""
