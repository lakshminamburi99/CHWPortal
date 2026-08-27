from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone, date
from app.api.deps import get_db
from app.models.patient import PatientModel
from app.models.clinical import FollowUpModel
from app.schemas.patient import (
    PatientSchema,
    PatientCreate,
    PatientStatusUpdate,
    ScheduleFollowUpRequest,
)
from app.schemas.clinical import FollowUpSchema

router = APIRouter()

PRIORITY_ORDER = ["HIGH_PRIORITY", "REFERRED", "FOLLOW_UP", "ACTIVE", "INACTIVE"]

def to_patient_schema(p: PatientModel) -> PatientSchema:
    return PatientSchema(
        id=p.id,
        firstName=p.first_name,
        lastName=p.last_name,
        dateOfBirth=str(p.date_of_birth) if p.date_of_birth else None,
        age=p.age,
        sex=p.sex,
        preferredLanguage=p.preferred_language,
        phone=p.phone,
        address=p.address,
        emergencyContact=p.emergency_contact,
        assignedChwId=p.assigned_chw_id,
        status=p.status,
        lastVisit=p.last_visit,
        externalMrn=p.external_mrn,
    )

@router.get("", response_model=List[PatientSchema])
def list_patients(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(PatientModel)

    if status and status != "ALL":
        query = query.filter(PatientModel.status == status)

    patients = query.all()

    if search and search.strip():
        term = search.strip().lower()
        patients = [
            p for p in patients
            if term in f"{p.first_name} {p.last_name} {p.id} {p.phone} {p.date_of_birth}".lower()
        ]

    if sort == "recent":
        patients.sort(key=lambda p: p.last_visit, reverse=True)
    elif sort == "priority":
        patients.sort(
            key=lambda p: PRIORITY_ORDER.index(p.status)
            if p.status in PRIORITY_ORDER else 99
        )
    else:
        patients.sort(key=lambda p: p.last_name)

    return [to_patient_schema(p) for p in patients]

@router.get("/{id}", response_model=PatientSchema)
def get_patient(id: str, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PATIENT_NOT_FOUND")
    return to_patient_schema(patient)

@router.post("", response_model=PatientSchema)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    count = db.query(PatientModel).count() + 1
    year = datetime.now(timezone.utc).year
    patient_id = f"PT-{year}-{str(count).zfill(4)}"

    birth_year = int(payload.dateOfBirth[:4]) if len(payload.dateOfBirth) >= 4 and payload.dateOfBirth[:4].isdigit() else 2000
    age = max(0, year - birth_year)

    now_date = datetime.now(timezone.utc).isoformat()[:10]
    dob = None
    if payload.dateOfBirth:
        try:
            dob = date.fromisoformat(payload.dateOfBirth[:10])
        except Exception:
            dob = None

    patient = PatientModel(
        id=patient_id,
        first_name=payload.firstName,
        last_name=payload.lastName,
        date_of_birth=dob,
        age=age,
        sex=payload.sex,
        preferred_language=payload.preferredLanguage,
        phone=payload.phone,
        address=payload.address,
        emergency_contact=payload.emergencyContact.model_dump() if payload.emergencyContact else None,
        assigned_chw_id=payload.assignedChwId,
        status="ACTIVE",
        last_visit=now_date,
        external_mrn=payload.externalMrn,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return to_patient_schema(patient)

@router.patch("/{id}/status", response_model=PatientSchema)
def update_patient_status(id: str, payload: PatientStatusUpdate, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PATIENT_NOT_FOUND")
    patient.status = payload.status
    db.commit()
    db.refresh(patient)
    return to_patient_schema(patient)

@router.post("/{id}/log-visit", response_model=PatientSchema)
def log_patient_visit(id: str, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PATIENT_NOT_FOUND")
    patient.last_visit = datetime.now(timezone.utc).isoformat()[:10]
    db.commit()
    db.refresh(patient)
    return to_patient_schema(patient)

@router.post("/{id}/schedule-follow-up", response_model=FollowUpSchema)
def schedule_follow_up(id: str, payload: ScheduleFollowUpRequest, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PATIENT_NOT_FOUND")

    fu_count = db.query(FollowUpModel).count()
    due = (datetime.now(timezone.utc) + timedelta(days=payload.days)).isoformat()[:10]
    priority = "HIGH" if patient.status == "HIGH_PRIORITY" else "MEDIUM"
    fu_status = "DUE_TODAY" if payload.days == 0 else "UPCOMING"

    fu_id = f"FU-{1000 + fu_count + int(datetime.now(timezone.utc).timestamp()) % 10000}"
    follow_up = FollowUpModel(
        id=fu_id,
        patient_id=patient.id,
        chw_id=patient.assigned_chw_id,
        reason="Follow-up visit scheduled from patient record",
        due_date=due,
        priority=priority,
        status=fu_status,
    )
    db.add(follow_up)

    if patient.status == "ACTIVE":
        patient.status = "FOLLOW_UP"

    db.commit()
    db.refresh(follow_up)

    return FollowUpSchema(
        id=follow_up.id,
        patientId=follow_up.patient_id,
        chwId=follow_up.chw_id,
        reason=follow_up.reason,
        dueDate=follow_up.due_date,
        priority=follow_up.priority,
        status=follow_up.status,
    )
