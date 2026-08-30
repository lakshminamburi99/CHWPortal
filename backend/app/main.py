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
    import time, sys
    for attempt in range(1, 6):
        try:
            print(f"Initializing database & migrating SQLite data (attempt {attempt}/5)...", file=sys.stderr, flush=True)
            init_db()
            seed_db()
            from app.db.migrate_to_cloudsql import migrate_sqlite_to_postgres
            migrate_sqlite_to_postgres()
            
            # Seed test data for all pages and roles if needed
            try:
                from app.db.session import SessionLocal
                from app.db.seed_test_data import seed_all_test_data
                db = SessionLocal()
                try:
                    seed_all_test_data(db)
                finally:
                    db.close()
            except Exception as test_err:
                print(f"Failed to seed test data: {test_err}", file=sys.stderr, flush=True)

            print("Database initialized, seeded, and migrated successfully!", file=sys.stderr, flush=True)
            break
        except Exception as e:
            print(f"DB connection attempt {attempt} failed: {e}", file=sys.stderr, flush=True)
            if attempt < 5:
                time.sleep(2)
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
    allow_origin_regex=r"https://.*\.run\.app|http://(localhost|127\.0\.0\.1)(:\d+)?|http://.*\.localhost(:\d+)?",
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


# ── Structured error handler — diagnostic details for troubleshooting ─────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback, sys
    error_trace = traceback.format_exc()
    print(error_trace, file=sys.stderr, flush=True)
    
    # Secure error handling in production: hide stack trace/internal database names
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code":    "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred.",
                }
            },
        )
        
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code":    "INTERNAL_SERVER_ERROR",
                "message": str(exc) if str(exc) else "An unexpected error occurred.",
                "type":    type(exc).__name__,
                "detail":  error_trace.splitlines()[-3:],
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
