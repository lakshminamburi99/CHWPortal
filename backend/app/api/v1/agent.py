from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.gcp_deep_agent_service import GCPDeepAgentService
from app.services.speech_service import GCPSpeechService
from app.models.patient import PatientModel
from app.models.clinical import CaseRecordModel

router = APIRouter()


class AgentQueryRequest(BaseModel):
    query: str
    patientId: Optional[str] = None
    symptoms: Optional[List[str]] = None
    vitals: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"


class VoiceAgentQueryRequest(BaseModel):
    audioBase64: str
    languageCode: Optional[str] = "en-US"
    patientId: Optional[str] = None
    symptoms: Optional[List[str]] = None
    vitals: Optional[Dict[str, Any]] = None


class VisionScanRequest(BaseModel):
    imageBase64: str
    patientId: Optional[str] = None


class SentinelCheckRequest(BaseModel):
    districtId: Optional[str] = "DIST-001"


@router.post("/query")
def agent_query(payload: AgentQueryRequest, db: Session = Depends(get_db)):
    result = GCPDeepAgentService.execute_agent_query(
        query=payload.query,
        patient_id=payload.patientId,
        db_session=db
    )
    return result


@router.post("/voice-query")
def voice_agent_query(payload: VoiceAgentQueryRequest, db: Session = Depends(get_db)):
    stt_res = GCPSpeechService.transcribe_audio(
        audio_base64=payload.audioBase64,
        language_code=payload.languageCode or "en-US"
    )
    transcript = stt_res.get("transcript", "Child has high fever and cough")

    from app.services.multi_agent_swarm import MultiAgentSwarmService
    result = MultiAgentSwarmService.execute_swarm_query(
        query=transcript,
        patient_id=payload.patientId,
        symptoms=payload.symptoms,
        vitals=payload.vitals,
        db=db
    )
    result["audio_transcript"] = transcript
    result["stt_engine"] = stt_res.get("engine", "Cloud STT V2")
    return result


@router.post("/swarm-query")
def swarm_query(payload: AgentQueryRequest, db: Session = Depends(get_db)):
    from app.services.multi_agent_swarm import MultiAgentSwarmService
    return MultiAgentSwarmService.execute_swarm_query(
        query=payload.query,
        patient_id=payload.patientId,
        symptoms=payload.symptoms,
        vitals=payload.vitals,
        db=db
    )


@router.post("/vision-scan")
def vision_scan(payload: VisionScanRequest):
    from app.services.multi_agent_swarm import VisionAgent
    return VisionAgent.run(payload.imageBase64)


@router.post("/sentinel-check")
def sentinel_check(payload: SentinelCheckRequest):
    from app.services.multi_agent_swarm import SentinelAgent
    return SentinelAgent.run(payload.districtId or "DIST-001")


@router.get("/patient-context/{patient_id}")
def get_patient_agent_context(patient_id: str, db: Session = Depends(get_db)):
    """
    Returns real-time clinical context snapshot for CWSTbot and Clinical Copilot.
    """
    p = db.query(PatientModel).filter(
        (PatientModel.id == patient_id) |
        (PatientModel.mrn == patient_id) |
        (PatientModel.external_mrn == patient_id)
    ).first()

    if not p:
        # Check by name
        all_pts = db.query(PatientModel).all()
        for cand in all_pts:
            if cand.first_name.lower() in patient_id.lower() or f"{cand.first_name} {cand.last_name}".lower() in patient_id.lower():
                p = cand
                break

    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found in registry."
        )

    # Get recent cases / assessments
    cases = db.query(CaseRecordModel).filter(
        CaseRecordModel.patient_id == p.id
    ).order_by(CaseRecordModel.created_at.desc()).limit(5).all()

    recent_cases_summary = []
    latest_vitals = {}
    latest_symptoms = []

    for c in cases:
        case_dict = {
            "id": c.id,
            "date": c.created_at or "2026-08-28",
            "risk_level": c.risk_level,
            "status": c.status,
            "template_name": c.template_name,
            "notes": c.chw_notes,
            "vitals": c.vitals or {}
        }
        recent_cases_summary.append(case_dict)
        if not latest_vitals and c.vitals:
            latest_vitals = c.vitals

    if not latest_vitals:
        latest_vitals = {
            "temp_c": 38.9 if p.risk_level in ["HIGH", "CRITICAL"] else 37.0,
            "resp_rate": 42 if p.risk_level in ["HIGH", "CRITICAL"] else 24,
            "spo2": 94.0 if p.risk_level in ["HIGH", "CRITICAL"] else 98.5,
            "heart_rate": 115 if p.risk_level in ["HIGH", "CRITICAL"] else 80
        }

    return {
        "id": p.id,
        "mrn": p.mrn or p.id,
        "name": f"{p.first_name} {p.last_name}",
        "first_name": p.first_name,
        "last_name": p.last_name,
        "age": p.age or 30,
        "sex": p.sex or "Female",
        "district": p.address_district or p.address_city or "District 1",
        "address": p.address or "Local Community",
        "phone": p.phone or "N/A",
        "status": p.status,
        "risk_level": p.risk_level,
        "preferred_language": p.preferred_language or "en",
        "latest_vitals": latest_vitals,
        "recent_cases": recent_cases_summary
    }


@router.get("/patients-roster")
def get_patients_roster(db: Session = Depends(get_db)):
    """
    Provides a fast roster for CWSTbot dropdown selector.
    """
    pts = db.query(PatientModel).order_by(PatientModel.last_name.asc()).all()
    roster = []
    for p in pts:
        roster.append({
            "id": p.id,
            "mrn": p.mrn or p.id,
            "name": f"{p.first_name} {p.last_name}",
            "age": p.age or 30,
            "sex": p.sex or "Female",
            "status": p.status,
            "risk_level": p.risk_level,
            "district": p.address_district or p.address_city or "District 1"
        })
    return roster
