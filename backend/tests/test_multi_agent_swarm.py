import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.multi_agent_swarm import (
    TriageAgent,
    PharmaAgent,
    VisionAgent,
    SentinelAgent,
    AuditAgent,
    MultiAgentSwarmService,
)

client = TestClient(app)

def test_triage_agent():
    res = TriageAgent.run(["fever", "vomiting"], {"temp_c": 39.1, "resp_rate": 44})
    assert res["risk_level"] == "HIGH"
    assert len(res["danger_flags"]) >= 2

def test_pharma_agent():
    res = PharmaAgent.run("DIST-001", ["Oral Rehydration Salts (ORS)", "Artemether-Lumefantrine (ACT)"])
    assert "stock_check" in res
    assert "Oral Rehydration Salts (ORS)" in res["stock_check"]

def test_vision_agent():
    res = VisionAgent.run("mock_rdt_base64_image")
    assert res["result"] == "POSITIVE_PF_MALARIA"
    assert res["confidence"] > 0.95

def test_sentinel_agent():
    res = SentinelAgent.run("DIST-001")
    assert res["alert_level"] == "WARNING"
    assert "febrile_cases_surge" in res

def test_audit_agent():
    res_pass = AuditAgent.run("Immediate hospital referral arranged", "HIGH")
    assert res_pass["passed_safety_audit"] is True

    res_fail = AuditAgent.run("Rest at home and take warm tea", "HIGH")
    assert res_fail["passed_safety_audit"] is False

def test_swarm_query_endpoint():
    res = client.post("/api/v1/agent/swarm-query", json={"query": "Patient has high fever and vomiting", "patientId": "PT-2026-0002"})
    assert res.status_code == 200
    data = res.json()
    assert data["bot_name"] == "CWSTbot"
    assert len(data["swarm_agents_executed"]) >= 4
    assert "patient_context" in data
    assert data["patient_context"]["name"] == "Ahmed Robinson"

def test_patient_context_endpoint():
    res = client.get("/api/v1/agent/patient-context/PT-2026-0001")
    assert res.status_code in [200, 404]
    if res.status_code == 200:
        data = res.json()
        assert "name" in data
        assert "latest_vitals" in data

def test_patients_roster_endpoint():
    res = client.get("/api/v1/agent/patients-roster")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_vision_scan_endpoint():
    res = client.post("/api/v1/agent/vision-scan", json={"imageBase64": "mock_rdt_image"})
    assert res.status_code == 200
    data = res.json()
    assert data["result"] == "POSITIVE_PF_MALARIA"
