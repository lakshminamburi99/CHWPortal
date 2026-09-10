from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Union, Any
from datetime import datetime, timezone
from app.api.deps import get_db
from app.models.user import PlatformUserModel, UserModel
from app.models.rbac import RoleModel, UserRoleModel
from app.core.rbac import require_role, get_current_user
from app.core.security import hash_password
from app.models.admin import (
    OrgUnitModel,
    AuditEventModel,
    SystemServiceModel,
    RoleDefinitionModel,
    ProgramMetricModel,
    SystemSettingModel,
)
from app.models.org import RegionModel
from app.schemas.user import PlatformUserSchema, UserStatusUpdate, UserRoleUpdate, InviteUserRequest, UserAvatarUpdate
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
            org_ids = list(set(l1_l2_ids + l3_ids + [region_code]))
            
            org_query = org_query.filter(OrgUnitModel.id.in_(org_ids))
            user_query = user_query.filter(PlatformUserModel.org_unit_id.in_(org_ids))
        else:
            # Fallback if no region code found, return 0 for safety
            org_query = org_query.filter(OrgUnitModel.id == "NONE")
            user_query = user_query.filter(PlatformUserModel.id == "NONE")

    total = user_query.count()
    if total == 0 and current_user.effective_role != "REGIONAL_ADMIN":
        total = db.query(UserModel).filter(UserModel.deleted_at.is_(None)).count()
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
    core_users_count = db.query(UserModel).filter(UserModel.deleted_at.is_(None)).count()
    platform_users_count = db.query(PlatformUserModel).count()
    users = max(core_users_count, platform_users_count)
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


def log_audit(
    db: Session,
    actor: Optional[Union[str, Any]],
    role: Optional[Union[str, Any]],
    action: str,
    target: Optional[Union[str, Any]],
    severity: str,
) -> None:
    audit_count = db.query(AuditEventModel).count()
    event = AuditEventModel(
        id=f"aud-{audit_count + 1}",
        at=datetime.now(timezone.utc).isoformat(),
        actor=str(actor or "System"),
        actor_role=str(role or "SYSTEM"),
        action=action,
        target=str(target or "System"),
        severity=severity,
    )
    db.add(event)

def to_platform_user_schema(u: PlatformUserModel) -> PlatformUserSchema:
    return PlatformUserSchema.model_construct(
        id=str(u.id),
        name=str(u.name),
        email=str(u.email),
        role=str(u.role),
        orgUnitId=str(u.org_unit_id),
        status=str(u.status), # type: ignore
        lastSignIn=str(u.last_sign_in),
        mfaEnabled=bool(u.mfa_enabled),
        avatar=u.avatar,
        phone=getattr(u, "phone", None),
    )

def user_model_to_platform_schema(u: UserModel, p_user: Optional[PlatformUserModel] = None) -> PlatformUserSchema:
    role = (p_user.role if p_user and p_user.role else None) or u.effective_role or "CHW"
    org_unit = (p_user.org_unit_id if p_user and p_user.org_unit_id else None) or u.team_id or u.district_id or u.region_id or u.organization_id or "RHA"
    last_sign_in = (p_user.last_sign_in if p_user and p_user.last_sign_in and p_user.last_sign_in != "Never" else None) or (u.last_login_at.strftime("%Y-%m-%d %H:%M:%S") if u.last_login_at else "Never")
    avatar = (p_user.avatar if p_user and p_user.avatar else None) or u.avatar
    phone = (p_user.phone if hasattr(p_user, "phone") and p_user.phone else None) or u.phone
    mfa_enabled = bool(u.mfa_enabled or (p_user and p_user.mfa_enabled))
    status_val = u.status if u.status in ["ACTIVE", "INVITED", "SUSPENDED"] else (p_user.status if p_user and p_user.status in ["ACTIVE", "INVITED", "SUSPENDED"] else "ACTIVE")
    name = (p_user.name if p_user and p_user.name else None) or u.display_name or u.full_name or u.username

    return PlatformUserSchema.model_construct(
        id=str(u.id),
        name=str(name),
        email=str(u.email),
        role=str(role),
        orgUnitId=str(org_unit),
        status=str(status_val), # type: ignore
        lastSignIn=str(last_sign_in),
        mfaEnabled=mfa_enabled,
        avatar=avatar,
        phone=phone,
    )

@router.get("/users", response_model=List[PlatformUserSchema])
def list_users(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user_models = db.query(UserModel).filter(UserModel.deleted_at.is_(None)).all()
    p_users = db.query(PlatformUserModel).all()
    p_user_by_id = {pu.id: pu for pu in p_users}
    p_user_by_email = {pu.email.lower(): pu for pu in p_users if pu.email}

    results: List[PlatformUserSchema] = []
    seen_ids = set()
    seen_emails = set()

    for u in user_models:
        pu = p_user_by_id.get(u.id) or p_user_by_email.get(u.email.lower() if u.email else "")
        schema = user_model_to_platform_schema(u, pu)
        results.append(schema)
        seen_ids.add(u.id)
        if u.email:
            seen_emails.add(u.email.lower())

    # Include any legacy PlatformUserModel records not in UserModel
    for pu in p_users:
        if pu.id not in seen_ids and (not pu.email or pu.email.lower() not in seen_emails):
            results.append(to_platform_user_schema(pu))
            seen_ids.add(pu.id)

    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = _get_region_code(db, current_user)
        if region_code:
            l1_l2_ids = [ou.id for ou in db.query(OrgUnitModel).filter(
                (OrgUnitModel.id == region_code) |
                (OrgUnitModel.parent_id == region_code)
            ).all()]
            l3_ids = [ou.id for ou in db.query(OrgUnitModel).filter(OrgUnitModel.parent_id.in_(l1_l2_ids)).all()]
            org_ids = set(l1_l2_ids + l3_ids + [region_code])
            results = [r for r in results if r.orgUnitId in org_ids]
        else:
            results = []

    return results

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

    count = db.query(PlatformUserModel).count() + db.query(UserModel).count()
    user_id = f"usr-{str(count + 1).zfill(4)}"
    
    # Check if user already exists
    clean_email = payload.email.strip().lower()
    existing = db.query(UserModel).filter(UserModel.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists.")

    name_parts = payload.name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]

    # Create Core UserModel
    new_core_user = UserModel(
        id=user_id,
        username=clean_email,
        email=clean_email,
        password_hash=hash_password("demo1234"),
        first_name=first_name,
        last_name=last_name,
        display_name=payload.name.strip(),
        phone=payload.phone,
        preferred_language="en",
        status="INVITED",
        is_email_verified=False,
        avatar=payload.avatar,
    )
    db.add(new_core_user)
    db.flush()

    # Assign Role in RBAC
    role_obj = db.query(RoleModel).filter(RoleModel.code == payload.role).first()
    if role_obj:
        ur = UserRoleModel(user_id=new_core_user.id, role_id=role_obj.id)
        db.add(ur)

    # Also add to PlatformUserModel for legacy compatibility
    new_platform_user = PlatformUserModel(
        id=user_id,
        name=payload.name,
        email=clean_email,
        role=payload.role,
        org_unit_id=payload.orgUnitId,
        status="INVITED",
        last_sign_in="Never",
        mfa_enabled=False,
        avatar=payload.avatar,
    )
    db.add(new_platform_user)

    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Invited new user ({payload.role})",
        target=clean_email,
        severity="INFO",
    )
    db.commit()
    db.refresh(new_core_user)
    return user_model_to_platform_schema(new_core_user, new_platform_user)

def _get_region_code(db: Session, current_user: UserModel) -> Optional[str]:
    if not current_user.region_id:
        return None
    region = db.query(RegionModel).filter(RegionModel.id == str(current_user.region_id)).first()
    return str(region.code) if region and region.code else None

def _require_user_in_scope(db: Session, current_user: UserModel, target_user: Union[PlatformUserModel, UserModel]) -> None:
    if current_user.effective_role == "REGIONAL_ADMIN":
        region_code = _get_region_code(db, current_user)
                
        if not region_code:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        org_unit_id = getattr(target_user, 'org_unit_id', None) or getattr(target_user, 'region_id', None) or getattr(target_user, 'district_id', None) or getattr(target_user, 'team_id', None)
        org = db.query(OrgUnitModel).filter(OrgUnitModel.id == str(org_unit_id)).first() if org_unit_id else None
        if not org:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify user outside your region.")
            
        is_allowed = False
        if org.id == region_code or org.parent_id == region_code:
            is_allowed = True
        elif org.parent_id:
            parent_org = db.query(OrgUnitModel).filter(OrgUnitModel.id == str(org.parent_id)).first()
            if parent_org and parent_org.parent_id == region_code:
                is_allowed = True
                
        if not is_allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify user outside your region.")

@router.patch("/users/{id}/status", response_model=PlatformUserSchema)
def set_user_status(id: str, payload: UserStatusUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    core_user = db.query(UserModel).filter(UserModel.id == id).first()
    target_user = user or core_user
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, target_user)

    if user:
        setattr(user, "status", str(payload.status))
    if core_user:
        setattr(core_user, "status", str(payload.status))

    target_email = str((user.email if user else None) or (core_user.email if core_user else id))
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Set account status to {payload.status.lower()}",
        target=target_email,
        severity="WARNING" if payload.status == "SUSPENDED" else "INFO",
    )
    db.commit()
    if core_user:
        db.refresh(core_user)
        return user_model_to_platform_schema(core_user, user)
    if user:
        db.refresh(user)
        return to_platform_user_schema(user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")

@router.patch("/users/{id}/role", response_model=PlatformUserSchema)
def set_user_role(id: str, payload: UserRoleUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    core_user = db.query(UserModel).filter(UserModel.id == id).first()
    target_user = user or core_user
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, target_user)

    if user:
        setattr(user, "role", payload.role)
    if core_user:
        role_obj = db.query(RoleModel).filter(RoleModel.code == payload.role).first()
        if role_obj:
            existing_ur = db.query(UserRoleModel).filter(UserRoleModel.user_id == core_user.id).first()
            if existing_ur:
                setattr(existing_ur, "role_id", role_obj.id)
                setattr(existing_ur, "is_active", True)
            else:
                db.add(UserRoleModel(user_id=str(core_user.id), role_id=str(role_obj.id)))

    target_email = str((user.email if user else None) or (core_user.email if core_user else id))
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action=f"Changed role to {payload.role}",
        target=target_email,
        severity="CRITICAL",
    )
    db.commit()
    if core_user:
        db.refresh(core_user)
        return user_model_to_platform_schema(core_user, user)
    if user:
        db.refresh(user)
        return to_platform_user_schema(user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")

@router.patch("/users/{id}/avatar", response_model=PlatformUserSchema)
def set_user_avatar(id: str, payload: UserAvatarUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    core_user = db.query(UserModel).filter(UserModel.id == id).first()
    target_user = user or core_user
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, target_user)

    avatar_val = payload.avatar if payload.avatar and payload.avatar.strip() else None
    if user:
        setattr(user, "avatar", avatar_val)
    if core_user:
        setattr(core_user, "avatar", avatar_val)

    target_email = str((user.email if user else None) or (core_user.email if core_user else id))
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action="Updated user profile picture" if avatar_val else "Removed user profile picture",
        target=target_email,
        severity="INFO",
    )
    db.commit()
    if core_user:
        db.refresh(core_user)
        return user_model_to_platform_schema(core_user, user)
    if user:
        db.refresh(user)
        return to_platform_user_schema(user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")

@router.post("/users/{id}/toggle-mfa", response_model=PlatformUserSchema)
@router.post("/users/{id}/mfa", response_model=PlatformUserSchema)
def toggle_mfa(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    core_user = db.query(UserModel).filter(UserModel.id == id).first()
    target_user = user or core_user
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, target_user)

    curr_mfa = bool((user and user.mfa_enabled) or (core_user and core_user.mfa_enabled))
    next_mfa = not curr_mfa
    if user:
        setattr(user, "mfa_enabled", next_mfa)
    if core_user:
        setattr(core_user, "mfa_enabled", next_mfa)

    target_email = str((user.email if user else None) or (core_user.email if core_user else id))
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action="Enforced MFA" if next_mfa else "Removed MFA requirement",
        target=target_email,
        severity="INFO" if next_mfa else "WARNING",
    )
    db.commit()
    if core_user:
        db.refresh(core_user)
        return user_model_to_platform_schema(core_user, user)
    if user:
        db.refresh(user)
        return to_platform_user_schema(user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")

@router.post("/users/{id}/resend-invite", response_model=PlatformUserSchema)
def resend_invite(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    user = db.query(PlatformUserModel).filter(PlatformUserModel.id == id).first()
    core_user = db.query(UserModel).filter(UserModel.id == id).first()
    target_user = user or core_user
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")
    _require_user_in_scope(db, current_user, target_user)

    target_email = str((user.email if user else None) or (core_user.email if core_user else id))
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role,
        action="Resent account invitation",
        target=target_email,
        severity="INFO",
    )
    db.commit()
    if core_user:
        return user_model_to_platform_schema(core_user, user)
    if user:
        return to_platform_user_schema(user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="USER_NOT_FOUND")

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

    setattr(role_def, "permissions", payload.permissions)
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

    setattr(svc, "status", "OPERATIONAL")
    setattr(svc, "detail", "Recovered after manual restart.")
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
        setattr(setting, "value", payload.value)

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

