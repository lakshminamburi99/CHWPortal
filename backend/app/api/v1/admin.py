from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime, timezone
from app.api.deps import get_db
from app.models.user import PlatformUserModel, UserModel
from app.core.rbac import require_role, get_current_user
from app.models.admin import (
    OrgUnitModel,
    AuditEventModel,
    SystemServiceModel,
    RoleDefinitionModel,
    ProgramMetricModel,
    SystemSettingModel,
)
from app.models.org import RegionModel
from app.schemas.user import PlatformUserSchema, UserStatusUpdate, UserRoleUpdate, InviteUserRequest
from app.schemas.admin import (
    OrgUnitSchema,
    OrgUnitCreate,
    AuditEventSchema,
    SystemServiceSchema,
    RoleDefinitionSchema,
    ProgramMetricSchema,
    SettingUpdateRequest,
)
from pydantic import BaseModel

class RegionalStatsResponse(BaseModel):
    totalAccounts: int
    orgUnits: int
    pendingInvites: int
    suspendedAccounts: int

class SuperStatsResponse(BaseModel):
    totalUsers: int
    activeRegions: int
    totalOrgUnits: int
    auditEvents: int
    systemHealth: str

router = APIRouter(dependencies=[Depends(require_role("SUPER_ADMIN", "REGIONAL_ADMIN"))])

@router.get("/stats/regional", response_model=RegionalStatsResponse)
def get_regional_stats(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    # Scope to region if Regional Admin
    org_query = db.query(OrgUnitModel)
    user_query = db.query(PlatformUserModel)
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = None
        if current_user.region_id:
            region = db.query(RegionModel).filter(RegionModel.id == current_user.region_id).first()
            if region:
                region_code = region.code
                
        if region_code:
            l1_l2_ids = [u.id for u in db.query(OrgUnitModel).filter(
                (OrgUnitModel.id == region_code) |
                (OrgUnitModel.parent_id == region_code)
            ).all()]
            l3_ids = [u.id for u in db.query(OrgUnitModel).filter(OrgUnitModel.parent_id.in_(l1_l2_ids)).all()]
            org_ids = list(set(l1_l2_ids + l3_ids))
            
            org_query = org_query.filter(OrgUnitModel.id.in_(org_ids))
            user_query = user_query.filter(PlatformUserModel.org_unit_id.in_(org_ids))
        else:
            # Fallback if no region code found, return 0 for safety
            org_query = org_query.filter(OrgUnitModel.id == "NONE")
            user_query = user_query.filter(PlatformUserModel.id == "NONE")

    total = user_query.count()
    orgs = org_query.count()
    pending = user_query.filter(PlatformUserModel.status == "INVITED").count()
    suspended = user_query.filter(PlatformUserModel.status == "SUSPENDED").count()
    return RegionalStatsResponse(
        totalAccounts=total,
        orgUnits=orgs,
        pendingInvites=pending,
        suspendedAccounts=suspended
    )

@router.get("/stats/super", response_model=SuperStatsResponse)
def get_super_stats(db: Session = Depends(get_db)):
    users = db.query(PlatformUserModel).count()
    regions = db.query(OrgUnitModel).filter(OrgUnitModel.type == "REGION").count()
    orgs = db.query(OrgUnitModel).count()
    audits = db.query(AuditEventModel).count()
    
    services_count = db.query(SystemServiceModel).count()
    op_services = db.query(SystemServiceModel).filter(SystemServiceModel.status == "OPERATIONAL").count()
    health = f"{op_services}/{services_count}" if services_count > 0 else "0/0"
    
    return SuperStatsResponse(
        totalUsers=users,
        activeRegions=regions,
        totalOrgUnits=orgs,
        auditEvents=audits,
        systemHealth=health
    )


def log_audit(db: Session, actor: str, role: str, action: str, target: str, severity: str):
    audit_count = db.query(AuditEventModel).count()
    event = AuditEventModel(
        id=f"aud-{audit_count + 1}",
        at=datetime.now(timezone.utc).isoformat(),
        actor=actor,
        actor_role=role,
        action=action,
        target=target,
        severity=severity,
    )
    db.add(event)

def to_platform_user_schema(u: PlatformUserModel) -> PlatformUserSchema:
    return PlatformUserSchema.model_construct(
        id=u.id,
        name=u.name,
        email=u.email,
        role=u.role,
        orgUnitId=u.org_unit_id,
        status=u.status,
        lastSignIn=u.last_sign_in,
        mfaEnabled=u.mfa_enabled,
    )

@router.get("/users", response_model=List[PlatformUserSchema])
def list_users(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    q = db.query(PlatformUserModel)
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = None
        if current_user.region_id:
            region = db.query(RegionModel).filter(RegionModel.id == current_user.region_id).first()
            if region:
                region_code = region.code

        if region_code:
            l1_l2_ids = [u.id for u in db.query(OrgUnitModel).filter(
                (OrgUnitModel.id == region_code) |
                (OrgUnitModel.parent_id == region_code)
            ).all()]
            l3_ids = [u.id for u in db.query(OrgUnitModel).filter(OrgUnitModel.parent_id.in_(l1_l2_ids)).all()]
            org_ids = list(set(l1_l2_ids + l3_ids))
            q = q.filter(PlatformUserModel.org_unit_id.in_(org_ids))
        else:
            q = q.filter(PlatformUserModel.id == "NONE")
    users = q.all()
    return [to_platform_user_schema(u) for u in users]

@router.post("/users", response_model=PlatformUserSchema)
def invite_user(payload: InviteUserRequest, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = None
        if current_user.region_id:
            region = db.query(RegionModel).filter(RegionModel.id == current_user.region_id).first()
            if region:
                region_code = region.code

        target_org = db.query(OrgUnitModel).filter(OrgUnitModel.id == payload.orgUnitId).first()
        if not target_org:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot invite user to an org unit outside your region.")
            
        is_allowed = False
        if target_org.id == region_code or target_org.parent_id == region_code:
            is_allowed = True
        elif target_org.parent_id:
            parent_org = db.query(OrgUnitModel).filter(OrgUnitModel.id == target_org.parent_id).first()
            if parent_org and parent_org.parent_id == region_code:
                is_allowed = True
                
        if not is_allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot invite user to an org unit outside your region.")

    count = db.query(PlatformUserModel).count()
    user_id = f"usr-{str(count + 1).zfill(4)}"
    
    new_user = PlatformUserModel(
        id=user_id,
        name=payload.name,
        email=payload.email,
        role=payload.role,
        org_unit_id=payload.orgUnitId,
        status="INVITED",
        last_sign_in="Never",
        mfa_enabled=False,
    )
    db.add(new_user)
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Invited new user ({payload.role})",
        target=payload.email,
        severity="INFO",
    )
    db.commit()
    db.refresh(new_user)
    return to_platform_user_schema(new_user)

def _get_region_code(db: Session, current_user: UserModel) -> str | None:
    if not current_user.region_id:
        return None
    region = db.query(RegionModel).filter(RegionModel.id == current_user.region_id).first()
    return region.code if region else None

def _require_user_in_scope(db: Session, current_user: UserModel, target_user: PlatformUserModel):
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = _get_region_code(db, current_user)
                
        if not region_code:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        # user's org unit must be in current_user's region or one of its child districts/teams
        org = db.query(OrgUnitModel).filter(OrgUnitModel.id == target_user.org_unit_id).first()
        if not org:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify user outside your region.")
            
        is_allowed = False
        if org.id == region_code or org.parent_id == region_code:
            is_allowed = True
        elif org.parent_id:
            parent_org = db.query(OrgUnitModel).filter(OrgUnitModel.id == org.parent_id).first()
            if parent_org and parent_org.parent_id == region_code:
                is_allowed = True
                
        if not is_allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify user outside your region.")

@router.patch("/users/{id}/status", response_model=PlatformUserSchema)
def set_user_status(id: str, payload: UserStatusUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, user)

    user.status = payload.status
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Set account status to {payload.status.lower()}",
        target=user.email,
        severity="WARNING" if payload.status == "SUSPENDED" else "INFO",
    )
    db.commit()
    db.refresh(user)
    return to_platform_user_schema(user)

@router.patch("/users/{id}/role", response_model=PlatformUserSchema)
def set_user_role(id: str, payload: UserRoleUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, user)

    user.role = payload.role
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Changed role to {payload.role}",
        target=user.email,
        severity="CRITICAL",
    )
    db.commit()
    db.refresh(user)
    return to_platform_user_schema(user)

@router.post("/users/{id}/toggle-mfa", response_model=PlatformUserSchema)
def toggle_mfa(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, user)

    user.mfa_enabled = not user.mfa_enabled
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action="Enforced MFA" if user.mfa_enabled else "Removed MFA requirement",
        target=user.email,
        severity="INFO" if user.mfa_enabled else "WARNING",
    )
    db.commit()
    db.refresh(user)
    return to_platform_user_schema(user)

@router.post("/users/{id}/resend-invite", response_model=PlatformUserSchema)
def resend_invite(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, user)

    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action="Resent account invitation",
        target=user.email,
        severity="INFO",
    )
    db.commit()
    return to_platform_user_schema(user)

@router.get("/org-units", response_model=List[OrgUnitSchema])
def list_org_units(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    q = db.query(OrgUnitModel)
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = _get_region_code(db, current_user)

        if region_code:
            l1_l2_ids = [u.id for u in db.query(OrgUnitModel).filter(
                (OrgUnitModel.id == region_code) |
                (OrgUnitModel.parent_id == region_code)
            ).all()]
            l3_ids = [u.id for u in db.query(OrgUnitModel).filter(OrgUnitModel.parent_id.in_(l1_l2_ids)).all()]
            org_ids = list(set(l1_l2_ids + l3_ids))
            q = q.filter(OrgUnitModel.id.in_(org_ids))
        else:
            q = q.filter(OrgUnitModel.id == "NONE")
    units = q.all()
    return [
        OrgUnitSchema.model_construct(
            id=u.id,
            name=u.name,
            type=u.type,
            parentId=u.parent_id,
            managerName=u.manager_name,
            chwCount=u.chw_count,
            patientCount=u.patient_count,
            coveragePercent=u.coverage_percent,
            openCases=u.open_cases,
        )
        for u in units
    ]



@router.get("/org-units/{id}", response_model=OrgUnitSchema)
def get_org_unit(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    unit = db.query(OrgUnitModel).filter(OrgUnitModel.id == id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORG_UNIT_NOT_FOUND")
        
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = _get_region_code(db, current_user)
        is_allowed = False
        if region_code:
            l1_l2_ids = [u.id for u in db.query(OrgUnitModel).filter(
                (OrgUnitModel.id == region_code) |
                (OrgUnitModel.parent_id == region_code)
            ).all()]
            l3_ids = [u.id for u in db.query(OrgUnitModel).filter(OrgUnitModel.parent_id.in_(l1_l2_ids)).all()]
            org_ids = list(set(l1_l2_ids + l3_ids))
            if unit.id in org_ids:
                is_allowed = True
        
        if not is_allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access org unit outside your region.")
            
    return OrgUnitSchema.model_construct(
        id=unit.id,
        name=unit.name,
        type=unit.type,
        parentId=unit.parent_id,
        managerName=unit.manager_name,
        chwCount=unit.chw_count,
        patientCount=unit.patient_count,
        coveragePercent=unit.coverage_percent,
        openCases=unit.open_cases,
    )

@router.post("/org-units", response_model=OrgUnitSchema)
def create_org_unit(payload: OrgUnitCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = _get_region_code(db, current_user)

        if payload.parentId != region_code:
            # Check if parent is a district in the region
            parent_org = db.query(OrgUnitModel).filter(OrgUnitModel.id == payload.parentId).first()
            if not parent_org or parent_org.parent_id != region_code:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create org unit outside your region")
    count = db.query(OrgUnitModel).count()
    new_id = f"org-{count + 1}"
    unit = OrgUnitModel(
        id=new_id,
        name=payload.name,
        type=payload.type,
        parent_id=payload.parentId,
        manager_name=payload.managerName,
        chw_count=0,
        patient_count=0,
        coverage_percent=0,
        open_cases=0
    )
    db.add(unit)
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Created {payload.type} org unit: {payload.name}",
        target=new_id,
        severity="INFO"
    )
    db.commit()
    db.refresh(unit)
    return OrgUnitSchema.model_construct(
        id=unit.id,
        name=unit.name,
        type=unit.type,
        parentId=unit.parent_id,
        managerName=unit.manager_name,
        chwCount=unit.chw_count,
        patientCount=unit.patient_count,
        coveragePercent=unit.coverage_percent,
        openCases=unit.open_cases
    )

@router.get("/roles", response_model=List[RoleDefinitionSchema])
def list_roles(db: Session = Depends(get_db)):
    roles = db.query(RoleDefinitionModel).all()
    return [
        RoleDefinitionSchema.model_construct(
            role=r.role,
            label=r.label,
            description=r.description,
            userCount=r.user_count,
            permissions=r.permissions,
        )
        for r in roles
    ]


class RolePermissionsUpdate(BaseModel):
    permissions: List[str]

@router.patch("/roles/{role}/permissions", response_model=RoleDefinitionSchema)
def update_role_permissions(role: str, payload: RolePermissionsUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    role_def = db.query(RoleDefinitionModel).filter(RoleDefinitionModel.role == role).first()
    if not role_def:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ROLE_NOT_FOUND")

    role_def.permissions = payload.permissions
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Updated permissions for role {role}",
        target=role,
        severity="WARNING"
    )
    db.commit()
    db.refresh(role_def)
    return RoleDefinitionSchema.model_construct(
        role=role_def.role,
        label=role_def.label,
        description=role_def.description,
        userCount=role_def.user_count,
        permissions=role_def.permissions,
    )

@router.get("/audit", response_model=List[AuditEventSchema])
def list_audit(db: Session = Depends(get_db)):
    events = db.query(AuditEventModel).order_by(AuditEventModel.id.desc()).all()
    return [
        AuditEventSchema.model_construct(
            id=e.id,
            at=e.at,
            actor=e.actor,
            actorRole=e.actor_role,
            action=e.action,
            target=e.target,
            severity=e.severity,
        )
        for e in events
    ]

@router.get("/services", response_model=List[SystemServiceSchema])
def list_services(db: Session = Depends(get_db)):
    services = db.query(SystemServiceModel).all()
    return [
        SystemServiceSchema.model_construct(
            id=s.id,
            name=s.name,
            status=s.status,
            uptimePercent=s.uptime_percent,
            latencyMs=s.latency_ms,
            detail=s.detail,
        )
        for s in services
    ]

@router.post("/services/{id}/restart", response_model=SystemServiceSchema)
def restart_service(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    svc = db.query(SystemServiceModel).filter(SystemServiceModel.id == id).first()
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SERVICE_NOT_FOUND")

    svc.status = "OPERATIONAL"
    svc.detail = "Recovered after manual restart."
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action="Restarted service",
        target=svc.name,
        severity="WARNING",
    )
    db.commit()
    db.refresh(svc)
    return SystemServiceSchema.model_construct(
        id=svc.id,
        name=svc.name,
        status=svc.status,
        uptimePercent=svc.uptime_percent,
        latencyMs=svc.latency_ms,
        detail=svc.detail,
    )

@router.get("/programs", response_model=List[ProgramMetricSchema])
def list_programs(db: Session = Depends(get_db)):
    programs = db.query(ProgramMetricModel).all()
    return [
        ProgramMetricSchema.model_construct(
            id=p.id,
            name=p.name,
            owner=p.owner,
            target=p.target,
            actual=p.actual,
            trend=p.trend,
            period=p.period,
        )
        for p in programs
    ]

@router.get("/settings", response_model=Dict[str, bool])
def get_settings(db: Session = Depends(get_db)):
    settings_rows = db.query(SystemSettingModel).all()
    return {s.key: s.value for s in settings_rows}

@router.post("/settings", response_model=Dict[str, bool])
def update_setting(payload: SettingUpdateRequest, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    setting = db.query(SystemSettingModel).filter(SystemSettingModel.key == payload.key).first()
    if not setting:
        setting = SystemSettingModel(key=payload.key, value=payload.value)
        db.add(setting)
    else:
        setting.value = payload.value

    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"{'Enabled' if payload.value else 'Disabled'} platform setting: {payload.key}",
        target="System settings",
        severity="CRITICAL",
    )
    db.commit()

    all_settings = db.query(SystemSettingModel).all()
    return {s.key: s.value for s in all_settings}
