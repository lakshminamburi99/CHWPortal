import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["version"] == "2.0.0"

def test_signin():
    response = client.post("/api/v1/auth/login", json={"email": "demo-admin@example.com", "password": "demo"})
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "demo-admin@example.com"
    assert data["user"]["role"] == "SUPER_ADMIN"
    assert "access_token" in data

def test_list_patients():
    response = client.get("/api/v1/patients")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_create_patient():
    new_patient = {
        "firstName": "Fatima",
        "lastName": "Zahra",
        "dateOfBirth": "1998-05-15",
        "sex": "Female",
        "preferredLanguage": "ar",
        "phone": "+254 700 112 233",
        "address": "Village 3, North District",
        "emergencyContact": {
            "name": "Youssef Zahra",
            "relationship": "Father",
            "phone": "+254 700 999 888"
        },
        "assignedChwId": "usr-chw-001",
        "externalMrn": "MRN-1002"
    }
    response = client.post("/api/v1/patients", json=new_patient)
    assert response.status_code == 200
    data = response.json()
    assert data["firstName"] == "Fatima"
    assert data["status"] == "ACTIVE"
    assert data["id"].startswith("PT-")

def test_submit_assessment_high_risk():
    payload = {
        "patientId": "PT-2026-0002",
        "chwId": "usr-chw-001",
        "templateId": "tpl-child",
        "templateName": "Pediatric Danger Sign Triage (iCCM)",
        "answers": [
            {"questionId": "q1", "prompt": "Unable to drink or breastfeed?", "value": "Yes"},
            {"questionId": "q2", "prompt": "Vomiting everything?", "value": "Yes"}
        ],
        "vitals": {
            "temperature": "39.1 °C",
            "oxygen": "91%"
        },
        "notes": "Child lethargic with high fever."
    }
    response = client.post("/api/v1/assessments/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["riskLevel"] == "HIGH"
    assert data["status"] == "SUPERVISOR_REVIEW"
    assert data["protocolResult"]["status"] == "REFERRAL_REQUIRED"

def test_admin_settings():
    auth_res = client.post("/api/v1/auth/login", json={"email": "demo-admin@example.com", "password": "demo"})
    token = auth_res.json()["access_token"]
    response = client.get("/api/v1/admin/settings", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    settings = response.json()
    assert isinstance(settings, dict)
