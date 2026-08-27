from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON
from app.db.base import Base

class OrgUnitModel(Base):
    __tablename__ = "org_units"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # REGION, DISTRICT, CLINIC
    parent_id = Column(String, nullable=True)
    manager_name = Column(String, nullable=False)
    chw_count = Column(Integer, default=0)
    patient_count = Column(Integer, default=0)
    coverage_percent = Column(Integer, default=0)
    open_cases = Column(Integer, default=0)

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, index=True)
    at = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)  # CHW, SUPERVISOR, MANAGER, ADMIN, SUPER_ADMIN
    action = Column(String, nullable=False)
    target = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # INFO, WARNING, CRITICAL

class SystemServiceModel(Base):
    __tablename__ = "system_services"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)  # OPERATIONAL, DEGRADED, DOWN
    uptime_percent = Column(Float, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    detail = Column(Text, nullable=False)

class RoleDefinitionModel(Base):
    __tablename__ = "role_definitions"

    role = Column(String, primary_key=True, index=True)  # CHW, SUPERVISOR, MANAGER, ADMIN, SUPER_ADMIN
    label = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    user_count = Column(Integer, nullable=False)
    permissions = Column(JSON, nullable=False)  # List of strings

class ProgramMetricModel(Base):
    __tablename__ = "program_metrics"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    owner_id = Column(String, nullable=True)
    target = Column(Integer, nullable=False)
    actual = Column(Integer, nullable=False)
    trend = Column(String, nullable=False)  # UP, FLAT, DOWN
    period = Column(String, nullable=False)

class SystemSettingModel(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(Boolean, nullable=False)
