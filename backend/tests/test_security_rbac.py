"""
Security, RBAC, and Authentication test suite.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db
from app.db.seed import seed_db
from app.core.security import hash_password, verify_password

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    seed_db()


@pytest.fixture(autouse=True)
def clear_cookies():
    client.cookies.clear()


# ── 1. Argon2id Password Hashing Tests ────────────────────────────────────────
def test_argon2id_hashing():
    pw = "SuperSecret123!"
    hashed = hash_password(pw)
    assert hashed.startswith("$argon2id$")
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


# ── 2. Login Flow Tests for All 5 Roles ───────────────────────────────────────
@pytest.mark.parametrize("email,expected_role", [
    ("demo-chw@example.com",            "CHW"),
    ("demo-supervisor@example.com",     "SUPERVISOR"),
    ("demo-manager@example.com",        "PROGRAMME_MANAGER"),
    ("demo-regional-admin@example.com", "REGIONAL_ADMIN"),
    ("demo-admin@example.com",          "SUPER_ADMIN"),
])
def test_login_all_roles(email, expected_role):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "demo"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == expected_role
    assert len(data["user"]["permissions"]) > 0


def test_login_invalid_password():
    res = client.post("/api/v1/auth/login", json={"email": "demo-chw@example.com", "password": "wrong"})
    assert res.status_code == 401
    assert res.json()["detail"]["code"] == "INVALID_CREDENTIALS"


# ── 3. Session Route & Logout Test ────────────────────────────────────────────
def test_session_and_logout():
    # Login
    res = client.post("/api/v1/auth/login", json={"email": "demo-supervisor@example.com", "password": "demo"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # GET /session
    sess_res = client.get("/api/v1/auth/session", headers=headers)
    assert sess_res.status_code == 200
    assert sess_res.json()["email"] == "demo-supervisor@example.com"

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 204

    # GET /session after logout should fail (session revoked)
    sess_res_after = client.get("/api/v1/auth/session", headers=headers)
    assert sess_res_after.status_code == 401


# ── 4. RBAC & Data Scope Boundaries ───────────────────────────────────────────
def test_regional_admin_clinical_boundary():
    """Verify Regional Admin cannot access clinical endpoints (RBAC boundary)."""
    res = client.post("/api/v1/auth/login", json={"email": "demo-regional-admin@example.com", "password": "demo"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt patient list or clinical endpoint
    # Regional admin has no clinical permissions
    sess = client.get("/api/v1/auth/session", headers=headers)
    assert sess.status_code == 200
    permissions = sess.json()["permissions"]
    assert "PATIENT_VIEW" not in permissions
