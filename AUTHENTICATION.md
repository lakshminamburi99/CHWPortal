# AUTHENTICATION.md — Care Compass Platform

## Overview

The Care Compass Platform uses **JWT-based stateless authentication** combined with **server-side session tracking** to provide both scalability and the ability to immediately revoke sessions.

---

## Password Hashing

**Algorithm:** Argon2id (RFC 9106 recommended parameters)

| Parameter | Value |
|---|---|
| time_cost | 2 |
| memory_cost | 65,536 KB (64 MB) |
| parallelism | 2 |
| hash_len | 32 bytes |
| salt_len | 16 bytes |

- Passwords are **never stored in plaintext**
- Password hashes are **never returned to clients**
- Automatic rehashing occurs on next login if cost parameters have changed

---

## Login Flow

```
POST /api/v1/auth/login
  → Normalize email (lowercase, strip whitespace)
  → Look up user by email
  → Check account status (must be ACTIVE)
  → Check lockout (locked_until > now?)
  → Verify Argon2id password hash
  → Reset failed_login_attempts to 0
  → Update last_login_at
  → Create session record (session_token_hash stored, raw token sent once)
  → Generate JWT access token (30-minute expiry)
  → Generate JWT refresh token (7-day expiry)
  → Write LOGIN audit event
  → Return: access_token, refresh_token, user (safe profile only)
```

### On authentication failure:
- Increment `failed_login_attempts`
- If attempts >= MAX_FAILED_LOGINS (5): set `locked_until = now + 15 minutes`
- Write LOGIN_FAILED audit event
- Always return `401 INVALID_CREDENTIALS` (never distinguish email/password)

---

## Session Management

Every session is recorded in the `sessions` database table.

```sql
sessions (
  id                UUID PRIMARY KEY,
  user_id           UUID REFERENCES users(id),
  session_token_hash TEXT UNIQUE,    -- SHA-256 hash of raw token
  created_at        TIMESTAMPTZ,
  last_activity_at  TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,     -- set on logout / revocation
  ip_address        TEXT,
  user_agent        TEXT
)
```

**Raw session tokens are never stored.** Only the SHA-256 hash is persisted.

### Token types in JWT payload:

| Field | Description |
|---|---|
| `sub` | User UUID |
| `role` | Effective role code |
| `permissions` | List of permission codes |
| `session_id` | UUID of the sessions row |
| `type` | `access` or `refresh` |
| `exp` | Expiry timestamp |
| `iat` | Issue timestamp |

---

## Session Validation (every request)

```
get_current_user dependency:
  → Extract Bearer token from Authorization header
  → Decode and validate JWT signature
  → Verify token type = "access"
  → Look up session in DB by session_id
  → Check: revoked_at IS NULL AND expires_at > now
  → Check idle timeout: last_activity_at + IDLE_MINUTES > now
  → Update last_activity_at (touch)
  → Load user, verify status = ACTIVE, deleted_at IS NULL
  → Return UserModel
```

---

## Session Termination

Sessions are revoked in `sessions.revoked_at` on:

- **Logout** (`POST /api/v1/auth/logout`)
- **Password change** (all other sessions revoked)
- **Password reset** (all sessions revoked)
- **Account disable** (admin action)
- **Role removal** (admin action, next request will fail)
- **Idle timeout** (detected on next request)
- **Absolute timeout** (session expires_at exceeded)
- **Token refresh** (old session revoked, new session created)

---

## Token Refresh

```
POST /api/v1/auth/refresh
  → Validate refresh token (type = "refresh")
  → Look up session in DB
  → Verify session is still valid
  → Revoke old session
  → Create new session
  → Return new access_token + refresh_token
```

---

## Account Lockout

| Condition | Action |
|---|---|
| failed_login_attempts >= 5 | Set locked_until = now + 15 minutes |
| locked_until > now on login | Return 403 ACCOUNT_LOCKED |
| Successful login | Reset failed_login_attempts = 0, locked_until = NULL |
| Admin unlock | Reset failed_login_attempts = 0, locked_until = NULL, write audit |

---

## Demo Mode

- Demo users (password: `demo`) exist **only in development** (`DEMO_MODE=true`)
- Demo passwords are hashed with Argon2id — **never stored as plaintext**
- A production startup safeguard raises `RuntimeError` if `DEMO_MODE=False` AND `ENVIRONMENT=production` when seeding

---

## Security Boundaries

- JWT secret is configured via `JWT_SECRET` environment variable (never hardcoded)
- In development, a random secret is auto-generated per instance (not suitable for production)
- Production requires a stable, strong secret (minimum 256 bits of entropy)
