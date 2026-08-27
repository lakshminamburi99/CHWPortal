from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.user import UserModel
from app.core.rbac import require_role
from app.models.admin import ProgramMetricModel, OrgUnitModel
from app.api.v1.admin import log_audit
from app.schemas.admin import (
    ProgramMetricSchema,
    OrgUnitSchema,
    ProgramTargetUpdate,
    ExportReportRequest,
    OrgUnitCreate,
)

router = APIRouter()

@router.get("/programs", response_model=list[ProgramMetricSchema])
def list_programs(db: Session = Depends(get_db), current_user: UserModel = Depends(require_role("PROGRAMME_MANAGER", "MANAGER"))):
    programs = db.query(ProgramMetricModel).filter(ProgramMetricModel.owner_id == current_user.id).all()
    return programs

@router.patch("/programs/{id}/target", response_model=ProgramMetricSchema)
def set_program_target(id: str, payload: ProgramTargetUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(require_role("PROGRAMME_MANAGER", "MANAGER"))):
    program = db.query(ProgramMetricModel).filter(ProgramMetricModel.id == id).first()
    if not program or program.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PROGRAM_NOT_FOUND")

    program.target = payload.target
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role or "MANAGER",
        action=f"Updated programme target to {payload.target}%",
        target=program.name,
        severity="INFO",
    )
    db.commit()
    db.refresh(program)
    return ProgramMetricSchema(
        id=program.id,
        name=program.name,
        owner=program.owner,
        target=program.target,
        actual=program.actual,
        trend=program.trend,
        period=program.period,
    )

@router.post("/programs/{id}/request-review", response_model=ProgramMetricSchema)
def request_program_review(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(require_role("PROGRAMME_MANAGER", "MANAGER"))):
    program = db.query(ProgramMetricModel).filter(ProgramMetricModel.id == id).first()
    if not program or program.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PROGRAM_NOT_FOUND")

    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role or "MANAGER",
        action="Requested performance review",
        target=program.name,
        severity="INFO",
    )
    db.commit()
    return ProgramMetricSchema(
        id=program.id,
        name=program.name,
        owner=program.owner,
        target=program.target,
        actual=program.actual,
        trend=program.trend,
        period=program.period,
    )

@router.post("/reports/export")
def export_report(payload: ExportReportRequest, db: Session = Depends(get_db), current_user: UserModel = Depends(require_role("PROGRAMME_MANAGER", "MANAGER"))):
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role or "MANAGER",
        action="Exported report",
        target=payload.name,
        severity="INFO",
    )
    db.commit()
    return {"name": payload.name}

@router.post("/org-units/{id}/rebalance", response_model=OrgUnitSchema)
def rebalance_org_unit(id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(require_role("PROGRAMME_MANAGER", "MANAGER"))):
    unit = db.query(OrgUnitModel).filter(OrgUnitModel.id == id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORG_UNIT_NOT_FOUND")

    unit.coverage_percent = min(100, unit.coverage_percent + 4)
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role or "MANAGER",
        action="Rebalanced caseload coverage",
        target=unit.name,
        severity="INFO",
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

@router.get("/org-units", response_model=list[OrgUnitSchema])
def list_manager_org_units(db: Session = Depends(get_db), current_user: UserModel = Depends(require_role("PROGRAMME_MANAGER", "MANAGER"))):
    q = db.query(OrgUnitModel)
    if current_user.effective_role == "PROGRAMME_MANAGER":
        # The manager should only see org units they have access to. 
        # For our mock implementation, we scope by parent region or direct assignment
        # Let's say managers can see anything in their assigned organization or region
        # If user.region_id is set, filter by that. Otherwise allow if organization_id matches.
        if current_user.region_id:
             q = q.filter((OrgUnitModel.id == current_user.region_id) | (OrgUnitModel.parent_id == current_user.region_id))
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

@router.post("/org-units", response_model=OrgUnitSchema)
def create_manager_org_unit(payload: OrgUnitCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(require_role("PROGRAMME_MANAGER", "MANAGER"))):
    # Only allow creating teams
    if payload.type != "TEAM":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers can only create teams.")
        
    count = db.query(OrgUnitModel).count()
    new_id = f"org-{count + 1}"
    unit = OrgUnitModel(
        id=new_id,
        name=payload.name,
        type=payload.type,
        parent_id=payload.parentId,
        manager_name=current_user.display_name or current_user.username,
        chw_count=0,
        patient_count=0,
        coverage_percent=0,
        open_cases=0
    )
    db.add(unit)
    log_audit(
        db,
        actor=current_user.display_name or current_user.username,
        role=current_user.effective_role or "MANAGER",
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
