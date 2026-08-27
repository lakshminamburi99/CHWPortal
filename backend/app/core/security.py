"""
Security core: Argon2id password hashing, JWT access/refresh tokens.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from jose import jwt, JWTError

from app.config import settings

# ── Argon2id hasher ──────────────────────────────────────────────────────────
# RFC 9106 recommended parameters (interactive profile)
_ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,   # 64 MB
    parallelism=2,
    hash_len=32,
    salt_len=16,
)


def hash_password(password: str) -> str:
    """Hash a password with Argon2id. Never store the plain-text."""
    return _ph.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """
    Verify a plain-text password against the stored Argon2id hash.
    Returns False on any mismatch — never raises to the caller.
    """
    try:
        return _ph.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(hashed: str) -> bool:
    """Returns True if the hash should be upgraded (e.g. cost params changed)."""
    return _ph.check_needs_rehash(hashed)


# ── Session token ─────────────────────────────────────────────────────────────
def generate_session_token() -> tuple[str, str]:
    """
    Generate a cryptographically-secure session token.
    Returns (raw_token, sha256_hash_of_token).
    Only the hash is stored in the database; the raw token is sent to the client.
    """
    raw = secrets.token_urlsafe(48)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_session_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ── Password-reset token ──────────────────────────────────────────────────────
def generate_reset_token() -> tuple[str, str]:
    """
    Generate a one-time password-reset token.
    Returns (raw_token, sha256_hash).
    """
    raw = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ── JWT ───────────────────────────────────────────────────────────────────────
def create_access_token(
    subject: str,
    role: str,
    permissions: list[str],
    session_id: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub":         subject,          # user id
        "role":        role,
        "permissions": permissions,
        "session_id":  session_id,
        "exp":         expire,
        "iat":         datetime.now(timezone.utc),
        "type":        "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str, session_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub":        subject,
        "session_id": session_id,
        "exp":        expire,
        "iat":        datetime.now(timezone.utc),
        "type":       "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
