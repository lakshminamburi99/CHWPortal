from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.gcp_deep_agent_service import GCPDeepAgentService
from app.services.speech_service import GCPSpeechService

router = APIRouter()

class AgentQueryRequest(BaseModel):
    query: str
    patientId: Optional[str] = None

class VoiceAgentQueryRequest(BaseModel):
    audioBase64: str
    languageCode: Optional[str] = "en-US"
    patientId: Optional[str] = None

@router.post("/query")
def agent_query(payload: AgentQueryRequest):
    result = GCPDeepAgentService.execute_agent_query(
        query=payload.query,
        patient_id=payload.patientId
    )
    return result

@router.post("/voice-query")
def voice_agent_query(payload: VoiceAgentQueryRequest):
    stt_res = GCPSpeechService.transcribe_audio(
        audio_base64=payload.audioBase64,
        language_code=payload.languageCode or "en-US"
    )
    transcript = stt_res.get("transcript", "Child has high fever and cough")

    result = GCPDeepAgentService.execute_agent_query(
        query=transcript,
        patient_id=payload.patientId
    )
    result["audio_transcript"] = transcript
    result["stt_engine"] = stt_res.get("engine", "Cloud STT V2")
    return result

class VisionScanRequest(BaseModel):
    imageBase64: str

class SentinelCheckRequest(BaseModel):
    districtId: Optional[str] = "DIST-001"

@router.post("/swarm-query")
def swarm_query(payload: AgentQueryRequest):
    from app.services.multi_agent_swarm import MultiAgentSwarmService
    return MultiAgentSwarmService.execute_swarm_query(
        query=payload.query,
        patient_id=payload.patientId or "PT-2026-0002"
    )

@router.post("/vision-scan")
def vision_scan(payload: VisionScanRequest):
    from app.services.multi_agent_swarm import VisionAgent
    return VisionAgent.run(payload.imageBase64)

@router.post("/sentinel-check")
def sentinel_check(payload: SentinelCheckRequest):
    from app.services.multi_agent_swarm import SentinelAgent
    return SentinelAgent.run(payload.districtId or "DIST-001")
