"""
RBAC dependency injection:
  get_current_user, require_role, require_permission, get_org_scope
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import hash_session_token, decode_token
from app.models.user import UserModel, SessionModel
from app.config import settings


# ── Constants ─────────────────────────────────────────────────────────────────
ROLE_HIERARCHY = {
    "CHW":               1,
    "SUPERVISOR":        2,
    "PROGRAMME_MANAGER": 3,
    "REGIONAL_ADMIN":    4,
    "SUPER_ADMIN":       5,
}


# ── Session extraction ────────────────────────────────────────────────────────
def _extract_token(request: Request) -> Optional[str]:
    """Extract bearer token from Cookie or Authorization header."""
    # Try cookie first (preferred for browser sessions)
    token = request.cookies.get("access_token")
    if token:
        return token

    # Fallback to Authorization header
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


# ── get_current_user ──────────────────────────────────────────────────────────
def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> UserModel:
    """
    Validate the JWT, verify the session in the DB, return the UserModel.
    Every protected endpoint must use this dependency.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "UNAUTHORIZED", "message": "Authentication required."},
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = _extract_token(request)
    if not token:
        raise credentials_exc

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exc

    user_id    = payload.get("sub")
    session_id = payload.get("session_id")

    if not user_id or not session_id:
        raise credentials_exc

    # Verify session exists and is valid in the DB
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == user_id,
    ).first()

    if not session or not session.is_valid:
        raise credentials_exc

    # Idle timeout check
    last_act = session.last_activity_at
    if last_act.tzinfo is None:
        last_act = last_act.replace(tzinfo=timezone.utc)
    idle_delta = datetime.now(timezone.utc) - last_act
    if idle_delta.total_seconds() > settings.SESSION_IDLE_MINUTES * 60:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "SESSION_EXPIRED", "message": "Session expired due to inactivity."},
        )

    # Touch last_activity_at
    session.last_activity_at = datetime.now(timezone.utc)
    db.commit()

    # Load user
    user = db.query(UserModel).filter(
        UserModel.id == user_id,
        UserModel.deleted_at.is_(None),
    ).first()

    if not user or user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ACCOUNT_DISABLED", "message": "Account is not active."},
        )

    return user


# ── Role guard ────────────────────────────────────────────────────────────────
def require_role(*roles: str):
    """
    FastAPI dependency factory. Usage:
        current_user: UserModel = Depends(require_role("SUPERVISOR", "SUPER_ADMIN"))
    """
    def _check(user: UserModel = Depends(get_current_user)) -> UserModel:
        role = user.effective_role
        if role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code":    "FORBIDDEN",
                    "message": "You do not have permission to perform this action.",
                },
            )
        return user
    return _check


def require_min_role(min_role: str):
    """
    Require at least `min_role` in the hierarchy.
    E.g. require_min_role("SUPERVISOR") allows SUPERVISOR, PROGRAMME_MANAGER, REGIONAL_ADMIN, SUPER_ADMIN.
    """
    min_level = ROLE_HIERARCHY.get(min_role, 99)

    def _check(user: UserModel = Depends(get_current_user)) -> UserModel:
        role = user.effective_role or ""
        if ROLE_HIERARCHY.get(role, 0) < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "Insufficient role level."},
            )
        return user
    return _check


# ── Permission guard ──────────────────────────────────────────────────────────
def require_permission(permission_code: str):
    """
    Dependency factory that checks a specific permission code.
    Usage: current_user: UserModel = Depends(require_permission("PATIENT_CREATE"))
    """
    def _check(user: UserModel = Depends(get_current_user)) -> UserModel:
        if permission_code not in user.permission_codes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code":    "FORBIDDEN",
                    "message": f"Permission '{permission_code}' is required.",
                },
            )
        return user
    return _check


# ── Org scope helper ──────────────────────────────────────────────────────────
def assert_patient_scope(user: UserModel, patient_assignment, db: Session) -> None:
    """
    Raise 403 if `user` is not authorized to access a patient.
    CHW: must be assigned chw_user_id
    SUPERVISOR: must share team_id
    PROGRAMME_MANAGER: must share region_id
    REGIONAL_ADMIN: no clinical access
    SUPER_ADMIN: full access
    """
    role = user.effective_role

    if role == "SUPER_ADMIN":
        return

    if role == "REGIONAL_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Regional Administrators do not have clinical data access."},
        )

    if role == "PROGRAMME_MANAGER":
        if patient_assignment and patient_assignment.region_id == user.region_id:
            return

    if role == "SUPERVISOR":
        if patient_assignment and patient_assignment.team_id == user.team_id:
            return

    if role == "CHW":
        if patient_assignment and patient_assignment.chw_user_id == user.id:
            return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "FORBIDDEN", "message": "You do not have access to this patient."},
    )
