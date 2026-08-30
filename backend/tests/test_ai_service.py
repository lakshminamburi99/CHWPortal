import pytest
from app.services.ai_service import GeminiAIService
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_gemini_entity_extraction_fallback():
    options = ["Option A: High fever", "Option B: Vomiting", "Option C: Normal"]
    result = GeminiAIService.transcribe_and_extract_entities(options=options, audio_transcript="Child has high fever")

    assert "transcript" in result
    assert "suggestedOption" in result
    assert result["suggestedOption"] in options or result["suggestedOption"] is None

def test_gemini_case_summarization():
    case_data = {
        "patient_name": "Test Patient",
        "risk_level": "HIGH",
        "danger_flags": ["Severe Dehydration", "High Fever"],
        "vitals": {"temp": "39.5C"},
    }
    summary = GeminiAIService.summarize_case(case_data)
    assert isinstance(summary, str)
    assert len(summary) > 20
    assert "Key Clinical Concern" in summary or "HIGH" in summary or "Patient" in summary

def test_voice_transcribe_api():
    response = client.post("/api/v1/voice/transcribe", json={"options": ["Fever", "Vomiting"]})
    assert response.status_code == 200
    data = response.json()
    assert "transcript" in data
    assert "suggestedOption" in data
