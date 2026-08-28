import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db
from app.db.seed import seed_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    seed_db()

@pytest.fixture(autouse=True)
def clear_cookies():
    client.cookies.clear()

def get_token(email):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "demo"})
    return res.json()["access_token"]

def test_admin_routes_unauthenticated():
    res = client.get("/api/v1/admin/stats/regional")
    assert res.status_code == 401

def test_admin_routes_forbidden_for_chw():
    token = get_token("demo-chw@example.com")
    res = client.get("/api/v1/admin/stats/regional", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_manager_routes_unauthenticated():
    res = client.get("/api/v1/manager/programs")
    assert res.status_code == 401

def test_manager_routes_forbidden_for_regional_admin():
    token = get_token("demo-regional-admin@example.com")
    # Regional admin cannot access manager endpoints
    res = client.get("/api/v1/manager/programs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_manager_scope_enforcement():
    token = get_token("demo-manager@example.com")
    res = client.get("/api/v1/manager/programs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    programs = res.json()
    assert len(programs) > 0
    # verify we can't access someone else's program
    # Assuming prog-999 doesn't belong to this manager or doesn't exist
    res = client.post("/api/v1/manager/programs/prog-999/request-review", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404 # Not found or unauthorized (which we merged into 404)
