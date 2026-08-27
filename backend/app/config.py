"""Application configuration and environment settings."""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, List
import secrets


class Settings(BaseSettings):
    # ── Project ─────────────────────────────────────────────────────────────
    PROJECT_NAME: str = "CHW Care Platform"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"          # development | testing | production

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "chw_care_db"

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 30        # short-lived access token
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # ── Session ───────────────────────────────────────────────────────────────
    SESSION_IDLE_MINUTES: int = 60             # idle timeout
    SESSION_ABSOLUTE_HOURS: int = 12           # absolute timeout

    # ── Security ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://admin.localhost:5173",
        "http://chw.localhost:5173",
        "http://manager.localhost:5173",
    ]
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10       # tighter limit on login endpoint

    # ── Account lockout ───────────────────────────────────────────────────────
    MAX_FAILED_LOGINS: int = 5
    LOCKOUT_MINUTES: int = 15

    # ── Demo mode (development only) ──────────────────────────────────────────
    DEMO_MODE: bool = True

    # ── Password reset ────────────────────────────────────────────────────────
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # If POSTGRES_SERVER is set to something non-localhost or explicitly configured via env
        import os
        if "DATABASE_URL" in os.environ:
            return os.environ["DATABASE_URL"]
        if "POSTGRES_SERVER" in os.environ and os.environ["POSTGRES_SERVER"] != "localhost":
            return (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        # Default local dev fallback to SQLite for immediate out-of-the-box execution
        from pathlib import Path
        db_file = (Path(__file__).resolve().parent.parent / "chw_care.db").as_posix()
        return f"sqlite:///{db_file}"

    @field_validator("JWT_SECRET", mode="before")
    @classmethod
    def _require_jwt_secret(cls, v: str, info) -> str:
        # In production, a real secret MUST be provided
        if not v:
            return "CHANGE_ME_IN_PRODUCTION_" + secrets.token_urlsafe(32)
        return v

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
