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
def test_admin_list_users():
    token = get_token("demo-admin@example.com")
    res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    users = res.json()
    assert isinstance(users, list)
    assert len(users) >= 5
    # verify user attributes
    first = users[0]
    assert "id" in first
    assert "name" in first
    assert "email" in first
    assert "role" in first

def test_admin_invite_and_manage_user():
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_email = f"sarah.johnson.{uid}@example.com"
    token = get_token("demo-admin@example.com")
    invite_payload = {
        "name": "Dr. Sarah Johnson",
        "email": test_email,
        "role": "SUPERVISOR",
        "orgUnitId": "RD"
    }
    # Invite
    invite_res = client.post("/api/v1/admin/users", json=invite_payload, headers={"Authorization": f"Bearer {token}"})
    assert invite_res.status_code == 200
    created = invite_res.json()
    assert created["email"] == test_email
    assert created["role"] == "SUPERVISOR"
    assert created["status"] == "INVITED"
    user_id = created["id"]

    # Update role
    role_res = client.patch(f"/api/v1/admin/users/{user_id}/role", json={"role": "PROGRAMME_MANAGER"}, headers={"Authorization": f"Bearer {token}"})
    assert role_res.status_code == 200
    assert role_res.json()["role"] == "PROGRAMME_MANAGER"

    # Update status
    status_res = client.patch(f"/api/v1/admin/users/{user_id}/status", json={"status": "ACTIVE"}, headers={"Authorization": f"Bearer {token}"})
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "ACTIVE"

    # Toggle MFA via both endpoints
    mfa_res1 = client.post(f"/api/v1/admin/users/{user_id}/mfa", headers={"Authorization": f"Bearer {token}"})
    assert mfa_res1.status_code == 200
    assert mfa_res1.json()["mfaEnabled"] is True

    mfa_res2 = client.post(f"/api/v1/admin/users/{user_id}/toggle-mfa", headers={"Authorization": f"Bearer {token}"})
    assert mfa_res2.status_code == 200
    assert mfa_res2.json()["mfaEnabled"] is False

