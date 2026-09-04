"""
Authentication API:
  POST /login      — credential verification, session creation, audit log
  GET  /session    — validate current session, return user + permissions
  POST /logout     — revoke session
  POST /refresh    — exchange refresh token for new access token
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import settings
from app.core.audit import write_audit, AuditAction
from app.core.rbac import get_current_user, _extract_token
from app.core.security import (
    verify_password,
    hash_password,
    needs_rehash,
    generate_session_token,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_session_token,
)
from app.models.user import UserModel, SessionModel

router = APIRouter()


# ── Request / Response schemas ────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id:                 str
    email:              str
    display_name:       str
    role:               Optional[str]
    permissions:        list[str]
    preferred_language: str
    avatar:             Optional[str] = None
    phone:              Optional[str] = None
    organization_id:    Optional[str]
    region_id:          Optional[str]
    district_id:        Optional[str]
    team_id:            Optional[str]

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    expires_in:    int                  # seconds
    user:          UserOut


# ── Helpers ───────────────────────────────────────────────────────────────────
def _build_user_out(user: UserModel) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        display_name=user.display_name or user.full_name,
        role=user.effective_role,
        permissions=sorted(user.permission_codes),
        preferred_language=user.preferred_language,
        avatar=user.avatar,
        phone=user.phone,
        organization_id=user.organization_id,
        region_id=user.region_id,
        district_id=user.district_id,
        team_id=user.team_id,
    )


def _create_session(user: UserModel, request: Request, db: Session) -> tuple[str, str, SessionModel]:
    """Create DB session + access + refresh tokens. Returns (access, refresh, session)."""
    raw_token, token_hash = generate_session_token()

    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.SESSION_ABSOLUTE_HOURS)
    session = SessionModel(
        user_id=user.id,
        session_token_hash=token_hash,
        expires_at=expires_at,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
    )
    db.add(session)
    db.flush()   # get session.id

    permissions = sorted(user.permission_codes)
    access  = create_access_token(
        subject=user.id,
        role=user.effective_role or "",
        permissions=permissions,
        session_id=session.id,
    )
    refresh = create_refresh_token(subject=user.id, session_id=session.id)
    return access, refresh, session


# ── POST /login ───────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("User-Agent", "")
    email = payload.email.strip().lower()

    # Fetch user — don't reveal whether email exists (timing-safe)
    user: Optional[UserModel] = db.query(UserModel).filter(
        UserModel.email == email,
        UserModel.deleted_at.is_(None),
    ).first()

    def _fail(reason: str):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= settings.MAX_FAILED_LOGINS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.LOCKOUT_MINUTES)
                write_audit(db, AuditAction.ACCOUNT_LOCKED, user_id=user.id, ip_address=ip, user_agent=ua,
                            new_values={"reason": "exceeded_failed_logins"})
            db.commit()
        write_audit(db, AuditAction.LOGIN_FAILED, user_id=user.id if user else None,
                    ip_address=ip, user_agent=ua, new_values={"email": email, "reason": reason})
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."},
        )

    if not user:
        _fail("user_not_found")

    # Lockout check
    if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_LOCKED", "message": "Account temporarily locked. Try again later."},
        )

    # Account status check
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_DISABLED", "message": "Account is not active. Contact your administrator."},
        )

    # Password verify
    if not verify_password(payload.password, user.password_hash):
        _fail("wrong_password")

    # Rehash if parameters changed
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)

    # Reset failed attempts on success
    user.failed_login_attempts = 0
    user.locked_until          = None
    user.last_login_at         = datetime.now(timezone.utc)

    access, refresh, session = _create_session(user, request, db)

    write_audit(db, AuditAction.LOGIN, user_id=user.id, session_id=session.id,
                ip_address=ip, user_agent=ua)
    db.commit()

    # Set secure HttpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax" if settings.ENVIRONMENT != "production" else "none",
        max_age=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax" if settings.ENVIRONMENT != "production" else "none",
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        user=_build_user_out(user),
    )


# ── GET /session ──────────────────────────────────────────────────────────────
@router.get("/session", response_model=UserOut)
def get_session(
    current_user: UserModel = Depends(get_current_user),
):
    """Returns the current authenticated user's safe profile. Used by the frontend on app load."""
    return _build_user_out(current_user)


# ── PATCH /profile ────────────────────────────────────────────────────────────
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    avatar: Optional[str] = None


@router.patch("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's profile attributes including profile avatar, phone, and name."""
    if payload.name is not None:
        current_user.display_name = payload.name
        # Split first and last name if possible
        parts = payload.name.strip().split(" ", 1)
        current_user.first_name = parts[0]
        if len(parts) > 1:
            current_user.last_name = parts[1]

    if payload.phone is not None:
        current_user.phone = payload.phone

    if payload.preferred_language is not None:
        current_user.preferred_language = payload.preferred_language

    if payload.avatar is not None:
        current_user.avatar = payload.avatar if payload.avatar.strip() else None

    # Sync to PlatformUserModel if exists
    from app.models.user import PlatformUserModel
    platform_user = db.query(PlatformUserModel).filter(
        (PlatformUserModel.id == current_user.id) | (PlatformUserModel.email == current_user.email)
    ).first()
    if platform_user:
        if payload.name is not None:
            platform_user.name = payload.name
        if payload.avatar is not None:
            platform_user.avatar = payload.avatar if payload.avatar.strip() else None

    write_audit(
        db,
        AuditAction.USER_UPDATED,
        user_id=current_user.id,
        new_values={"avatar_updated": payload.avatar is not None, "name": current_user.display_name},
    )
    db.commit()
    db.refresh(current_user)
    return _build_user_out(current_user)


# ── POST /logout ──────────────────────────────────────────────────────────────
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token = _extract_token(request)
    if token:
        payload = decode_token(token)
        if payload:
            session_id = payload.get("session_id")
            session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
            if session:
                session.revoked_at = datetime.now(timezone.utc)

    write_audit(db, AuditAction.LOGOUT, user_id=current_user.id,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("User-Agent"))
    db.commit()

    # Clear HttpOnly cookies
    response.delete_cookie(
        key="access_token",
        secure=settings.ENVIRONMENT == "production",
        samesite="lax" if settings.ENVIRONMENT != "production" else "none",
    )
    response.delete_cookie(
        key="refresh_token",
        secure=settings.ENVIRONMENT == "production",
        samesite="lax" if settings.ENVIRONMENT != "production" else "none",
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── POST /refresh ─────────────────────────────────────────────────────────────
class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: Request, response: Response, payload: Optional[RefreshRequest] = None, db: Session = Depends(get_db)):
    ref_token = request.cookies.get("refresh_token")
    if not ref_token and payload:
        ref_token = payload.refresh_token

    if not ref_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={"code": "INVALID_TOKEN", "message": "Invalid or expired refresh token."})

    data = decode_token(ref_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={"code": "INVALID_TOKEN", "message": "Invalid or expired refresh token."})

    user_id    = data.get("sub")
    session_id = data.get("session_id")

    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == user_id,
    ).first()

    if not session or not session.is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={"code": "SESSION_INVALID", "message": "Session is invalid or revoked."})

    user = db.query(UserModel).filter(
        UserModel.id == user_id,
        UserModel.status == "ACTIVE",
        UserModel.deleted_at.is_(None),
    ).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={"code": "USER_NOT_FOUND", "message": "User not found."})

    # Revoke old session and create new one
    session.revoked_at = datetime.now(timezone.utc)
    access, refresh, new_session = _create_session(user, request, db)
    db.commit()

    # Set new secure cookies
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax" if settings.ENVIRONMENT != "production" else "none",
        max_age=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax" if settings.ENVIRONMENT != "production" else "none",
        max_age=settings.JWT_REFRESH_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        user=_build_user_out(user),
    )
