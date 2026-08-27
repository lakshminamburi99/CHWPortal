# RBAC.md — Role-Based Access Control Matrix

## System Roles

1. `CHW` — Community Health Worker (frontline field worker)
2. `SUPERVISOR` — Field Supervisor (manages CHW team & priority cases)
3. `PROGRAMME_MANAGER` — Regional/District Programme Manager
4. `REGIONAL_ADMIN` — Regional Administrator (user & org unit admin)
5. `SUPER_ADMIN` — Super Administrator (global platform admin)

---

## Detailed Capability Matrix

| Capability | Permission Code | CHW | Supervisor | Programme Mgr | Regional Admin | Super Admin |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Patients** | | | | | | |
| View own patients | `PATIENT_VIEW` | ✅ | ✅ | ✅ | ❌ | ✅ |
| Register patient | `PATIENT_CREATE` | ✅ | ❌ | ❌ | ❌ | ✅ |
| Update patient details | `PATIENT_UPDATE` | ✅ | ❌ | ❌ | ❌ | ✅ |
| Delete patient record | `PATIENT_DELETE` | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Assessments** | | | | | | |
| Run & complete assessment | `ASSESSMENT_COMPLETE` | ✅ | ❌ | ❌ | ❌ | ✅ |
| View assessment history | `ASSESSMENT_VIEW` | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Cases & Triage** | | | | | | |
| View case queue | `CASE_VIEW` | ✅ | ✅ | ✅ | ❌ | ✅ |
| Review & acknowledge case | `CASE_REVIEW` | ❌ | ✅ | ✅ (monitor) | ❌ | ✅ |
| Escalate case | `CASE_ESCALATE` | ❌ | ✅ | ❌ | ❌ | ✅ |
| Assign case to CHW | `CASE_ASSIGN` | ❌ | ✅ | ❌ | ❌ | ✅ |
| Resolve case | `CASE_RESOLVE` | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Referrals & Follow-ups** | | | | | | |
| Create referral / follow-up | `REFERRAL_CREATE` | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage / approve referral | `REFERRAL_UPDATE` | ❌ | ✅ | ❌ | ❌ | ✅ |
| Reschedule / reassign follow-up | `FOLLOWUP_UPDATE` | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Administration** | | | | | | |
| View user accounts | `USER_VIEW` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create / edit user accounts | `USER_CREATE` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Disable user account | `USER_DISABLE` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign user roles | `ROLE_ASSIGN` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage organization units | `ORG_MANAGE` | ❌ | ❌ | ✅ | ✅ | ✅ |
| View audit log | `AUDIT_VIEW` | ❌ | ❌ | ❌ | ✅ | ✅ |
| System settings | `SYSTEM_SETTINGS_UPDATE`| ❌ | ❌ | ❌ | ❌ | ✅ |
