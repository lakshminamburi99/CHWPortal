import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.gcp_deep_agent_service import GCPDeepAgentService
from app.services.speech_service import GCPSpeechService

client = TestClient(app)

def test_deep_agent_tools_execution():
    patient_res = GCPDeepAgentService.tool_get_patient_history("PT-2026-0002")
    assert patient_res["patient_id"] == "PT-2026-0002"

    iccm_res = GCPDeepAgentService.tool_evaluate_iccm_protocol(24, ["fever", "vomiting"], {"temp_c": 39.0, "resp_rate": 42})
    assert iccm_res["risk_level"] == "HIGH"
    assert len(iccm_res["triggered_danger_flags"]) >= 1

    guidelines_res = GCPDeepAgentService.tool_search_medical_guidelines("danger signs in infants")
    assert len(guidelines_res["citations"]) > 0

    facility_res = GCPDeepAgentService.tool_check_facility_capacity("DIST-001", "pediatric_triage")
    assert len(facility_res["available_facilities"]) > 0

    followup_res = GCPDeepAgentService.tool_schedule_chw_followup("PT-2026-0002", "usr-chw-001", 1, "Check temp")
    assert followup_res["status"] == "SCHEDULED"

def test_deep_agent_query_endpoint():
    res = client.post("/api/v1/agent/query", json={"query": "Assess 2-year-old patient with fever and recommend immediate steps", "patientId": "PT-2026-0002"})
    assert res.status_code == 200
    data = res.json()
    assert "synthesis" in data
    assert "tool_calls_executed" in data
    assert len(data["tool_calls_executed"]) >= 4

def test_speech_to_text_service():
    stt = GCPSpeechService.transcribe_audio("mock_base64_string")
    assert "transcript" in stt
    assert "confidence" in stt
