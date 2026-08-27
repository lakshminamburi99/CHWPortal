"""
Audit log writer — call write_audit() from any endpoint or service layer.
"""
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.models.audit import AuditLogModel


# ── Action constants ──────────────────────────────────────────────────────────
class AuditAction:
    LOGIN                = "LOGIN"
    LOGIN_FAILED         = "LOGIN_FAILED"
    LOGOUT               = "LOGOUT"
    PASSWORD_CHANGE      = "PASSWORD_CHANGE"
    PASSWORD_RESET       = "PASSWORD_RESET"
    ACCOUNT_LOCKED       = "ACCOUNT_LOCKED"
    ACCOUNT_UNLOCKED     = "ACCOUNT_UNLOCKED"
    ROLE_ASSIGNED        = "ROLE_ASSIGNED"
    ROLE_REMOVED         = "ROLE_REMOVED"
    USER_CREATED         = "USER_CREATED"
    USER_UPDATED         = "USER_UPDATED"
    USER_DISABLED        = "USER_DISABLED"
    PATIENT_VIEW         = "PATIENT_VIEW"
    PATIENT_CREATE       = "PATIENT_CREATE"
    PATIENT_UPDATE       = "PATIENT_UPDATE"
    ASSESSMENT_CREATE    = "ASSESSMENT_CREATE"
    ASSESSMENT_COMPLETE  = "ASSESSMENT_COMPLETE"
    REFERRAL_CREATE      = "REFERRAL_CREATE"
    CASE_ESCALATE        = "CASE_ESCALATE"
    CASE_REVIEW          = "CASE_REVIEW"
    CASE_RESOLVE         = "CASE_RESOLVE"
    SETTINGS_UPDATE      = "SETTINGS_UPDATE"
    DATA_EXPORT          = "DATA_EXPORT"
    PERMISSION_CHANGED   = "PERMISSION_CHANGED"
    ORG_SCOPE_CHANGED    = "ORG_SCOPE_CHANGED"


def write_audit(
    db: Session,
    action: str,
    *,
    user_id: Optional[str]       = None,
    session_id: Optional[str]    = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str]   = None,
    old_values: Optional[dict]   = None,
    new_values: Optional[dict]   = None,
    ip_address: Optional[str]    = None,
    user_agent: Optional[str]    = None,
    request_id: Optional[str]    = None,
) -> None:
    """
    Append a single audit event. Silently swallows errors so audit failures
    never break business logic — but logs to stderr.
    """
    try:
        entry = AuditLogModel(
            user_id=user_id,
            session_id=session_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(entry)
        db.flush()   # write within current transaction without committing
    except Exception as exc:
        import sys
        print(f"[AUDIT ERROR] {exc}", file=sys.stderr)
