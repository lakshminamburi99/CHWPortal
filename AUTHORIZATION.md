# AUTHORIZATION.md — CHW Care Platform

## Overview

Authorization in the CHW Care Platform is enforced at **two distinct layers**:

1. **Permission-based authorization (RBAC)** — What actions a user is allowed to perform.
2. **Data-scope authorization** — Which specific organization units, teams, or patient records the user can access.

> Both checks are evaluated independently on the backend for **every single protected endpoint**.

---

## Authorization Evaluation Flow

```
HTTP Request → Bearer Token → get_current_user
  ↓ (verify JWT & active DB session)
UserModel loaded
  ↓
Check 1: require_permission("PATIENT_VIEW")
  ↳ Checks user.permission_codes
  ↳ Fails? → 403 FORBIDDEN {"code": "FORBIDDEN", "message": "Permission 'PATIENT_VIEW' is required."}
  ↓
Check 2: assert_patient_scope(user, patient_assignment)
  ↳ Fails? → 403 FORBIDDEN {"code": "FORBIDDEN", "message": "You do not have access to this patient."}
  ↓
Execute endpoint handler
```

---

## Data Scope Rules by Role

| Role | Permitted Data Scope | Administrative Access | Clinical Access |
|---|---|---|---|
| **CHW** | Assigned patients (`patient_assignments.chw_user_id == user.id`) | ❌ None | ✅ Own patients |
| **SUPERVISOR** | Patients assigned to CHWs in their team (`patient_assignments.team_id == user.team_id`) | ❌ Team coaching only | ✅ Team patients |
| **PROGRAMME_MANAGER** | Region/district aggregated metrics & patients (`patient_assignments.region_id == user.region_id`) | ❌ Limited | ✅ Regional overview |
| **REGIONAL_ADMIN** | All user accounts & org units within assigned region | ✅ Regional users/units | 🛑 **NO CLINICAL ACCESS** |
| **SUPER_ADMIN** | Platform-wide administrative scope | ✅ Platform-wide | ✅ Full access |

---

## Insecure Direct Object Reference (IDOR) Protection

Every resource endpoint (e.g. `/api/v1/patients/{patient_id}`, `/api/v1/cases/{case_id}`) queries the database and passes the record's org assignment to `assert_patient_scope()`.

- A CHW changing `{patient_id}` in a URL to a patient assigned to another CHW receives a `403 FORBIDDEN`
- A Supervisor trying to fetch a case belonging to another team receives a `403 FORBIDDEN`
- Changing UUIDs or parameters in API calls cannot bypass server-side authorization

---

## Administrative & Clinical Separation

To prevent privilege escalation and protect patient privacy (PHI), **Regional Administrators are strictly isolated from clinical data**.

```python
if user.effective_role == "REGIONAL_ADMIN":
    raise HTTPException(
        status_code=403,
        detail={"code": "FORBIDDEN", "message": "Regional Administrators do not have clinical data access."}
    )
```

Regional Administrators can manage user accounts, assign roles, and view system metrics, but cannot view clinical assessments, patient medical records, or risk flags.
