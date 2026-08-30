import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.circuit_breaker import EnterpriseCircuitBreaker, CircuitBreakerOpenException
from app.services.secret_manager import GCPSecretManagerService

client = TestClient(app)

def test_circuit_breaker():
    cb = EnterpriseCircuitBreaker(failure_threshold=2, recovery_time_secs=10)
    assert cb.state == "CLOSED"

    def faulty_call():
        raise ValueError("Cloud API Timeout")

    with pytest.raises(ValueError):
        cb.call(faulty_call)

    with pytest.raises(ValueError):
        cb.call(faulty_call)

    assert cb.state == "OPEN"

    with pytest.raises(CircuitBreakerOpenException):
        cb.call(faulty_call)

def test_secret_manager():
    val = GCPSecretManagerService.get_secret("NON_EXISTENT_SECRET", default_value="fallback_val")
    assert val == "fallback_val"

def test_fhir_observations_endpoint():
    res = client.get("/api/v1/fhir/R4/Observation")
    assert res.status_code == 200
    data = res.json()
    assert data["resourceType"] == "Bundle"
    assert data["type"] == "searchset"

def test_fhir_encounters_endpoint():
    res = client.get("/api/v1/fhir/R4/Encounter")
    assert res.status_code == 200
    data = res.json()
    assert data["resourceType"] == "Bundle"
