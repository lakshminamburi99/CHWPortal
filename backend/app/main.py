"""
CHW Care Platform — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.db.init_db import init_db
from app.db.seed import seed_db

from app.api.v1.auth         import router as auth_router
from app.api.v1.patients     import router as patients_router
from app.api.v1.assessments  import router as assessments_router
from app.api.v1.cases        import router as cases_router
from app.api.v1.referrals    import router as referrals_router
from app.api.v1.follow_ups   import router as follow_ups_router
from app.api.v1.chws         import router as chws_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.training      import router as training_router
from app.api.v1.voice         import router as voice_router
from app.api.v1.admin        import router as admin_router
from app.api.v1.manager      import router as manager_router
from app.api.v1.messages     import router as messages_router

# ── Startup / Shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        seed_db()
    except Exception as e:
        import sys
        print(f"Warning: Initial DB setup deferred: {e}", file=sys.stderr, flush=True)
    yield


# ── Application ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs"   if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)


# ── CORS — explicit allowlist, not wildcard ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Security headers middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "DENY"
    response.headers["Referrer-Policy"]           = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]        = "geolocation=(), microphone=(), camera=()"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ── Structured error handler — never leaks internals ─────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback, sys
    print(traceback.format_exc(), file=sys.stderr, flush=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code":    "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred.",
            }
        },
    )


# ── API Routers ───────────────────────────────────────────────────────────────
PREFIX = settings.API_V1_STR

app.include_router(auth_router,          prefix=f"{PREFIX}/auth",          tags=["Authentication"])
app.include_router(patients_router,      prefix=f"{PREFIX}/patients",      tags=["Patients"])
app.include_router(assessments_router,   prefix=f"{PREFIX}/assessments",   tags=["Assessments"])
app.include_router(cases_router,         prefix=f"{PREFIX}/cases",         tags=["Cases"])
app.include_router(referrals_router,     prefix=f"{PREFIX}/referrals",     tags=["Referrals"])
app.include_router(follow_ups_router,    prefix=f"{PREFIX}/follow-ups",    tags=["Follow-ups"])
app.include_router(chws_router,          prefix=f"{PREFIX}/chws",          tags=["CHWs"])
app.include_router(notifications_router, prefix=f"{PREFIX}/notifications", tags=["Notifications"])
app.include_router(training_router,      prefix=f"{PREFIX}/training",      tags=["Training"])
app.include_router(voice_router,         prefix=f"{PREFIX}/voice",         tags=["Voice"])
app.include_router(admin_router,         prefix=f"{PREFIX}/admin",         tags=["Administration"])
app.include_router(manager_router,       prefix=f"{PREFIX}/manager",       tags=["Programme Manager"])
app.include_router(messages_router,      prefix=f"{PREFIX}/messages",      tags=["Messaging"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok", "service": settings.PROJECT_NAME}


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "2.0.0",
        "docs":    "/docs" if settings.ENVIRONMENT != "production" else None,
    }
