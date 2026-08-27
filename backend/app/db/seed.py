"""
Database seed — development only.
Seeds: roles, permissions, org hierarchy, 5 demo users (Argon2id-hashed passwords).
Production safeguard: raises RuntimeError if DEMO_MODE is False.
"""
from datetime import date
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.config import settings
from app.core.security import hash_password

# Import all models so Base.metadata is populated
import app.models  # noqa


# ── Permission definitions ────────────────────────────────────────────────────
PERMISSIONS = [
    # Patients
    ("PATIENT_VIEW",              "View patients",              "patient",    "view"),
    ("PATIENT_CREATE",            "Create patients",            "patient",    "create"),
    ("PATIENT_UPDATE",            "Update patients",            "patient",    "update"),
    ("PATIENT_DELETE",            "Delete patients",            "patient",    "delete"),
    # Assessments
    ("ASSESSMENT_VIEW",           "View assessments",           "assessment", "view"),
    ("ASSESSMENT_CREATE",         "Create assessments",         "assessment", "create"),
    ("ASSESSMENT_UPDATE",         "Update assessments",         "assessment", "update"),
    ("ASSESSMENT_COMPLETE",       "Complete assessments",       "assessment", "complete"),
    # Referrals
    ("REFERRAL_VIEW",             "View referrals",             "referral",   "view"),
    ("REFERRAL_CREATE",           "Create referrals",           "referral",   "create"),
    ("REFERRAL_UPDATE",           "Update referrals",           "referral",   "update"),
    # Follow-ups
    ("FOLLOWUP_VIEW",             "View follow-ups",            "followup",   "view"),
    ("FOLLOWUP_CREATE",           "Create follow-ups",          "followup",   "create"),
    ("FOLLOWUP_UPDATE",           "Update follow-ups",          "followup",   "update"),
    # Cases
    ("CASE_VIEW",                 "View cases",                 "case",       "view"),
    ("CASE_REVIEW",               "Review cases",               "case",       "review"),
    ("CASE_ESCALATE",             "Escalate cases",             "case",       "escalate"),
    ("CASE_ASSIGN",               "Assign cases",               "case",       "assign"),
    ("CASE_RESOLVE",              "Resolve cases",              "case",       "resolve"),
    # CHWs
    ("CHW_VIEW",                  "View CHWs",                  "chw",        "view"),
    ("CHW_CREATE",                "Create CHW accounts",        "chw",        "create"),
    ("CHW_UPDATE",                "Update CHW accounts",        "chw",        "update"),
    # Teams
    ("TEAM_VIEW",                 "View teams",                 "team",       "view"),
    ("TEAM_MANAGE",               "Manage teams",               "team",       "manage"),
    # Reports
    ("REPORT_VIEW",               "View reports",               "report",     "view"),
    ("REPORT_EXPORT",             "Export reports",             "report",     "export"),
    # User administration
    ("USER_VIEW",                 "View users",                 "user",       "view"),
    ("USER_CREATE",               "Create users",               "user",       "create"),
    ("USER_UPDATE",               "Update users",               "user",       "update"),
    ("USER_DISABLE",              "Disable users",              "user",       "disable"),
    # Roles
    ("ROLE_VIEW",                 "View roles",                 "role",       "view"),
    ("ROLE_ASSIGN",               "Assign roles",               "role",       "assign"),
    # Audit
    ("AUDIT_VIEW",                "View audit log",             "audit",      "view"),
    # System
    ("SYSTEM_SETTINGS_VIEW",      "View system settings",       "system",     "view"),
    ("SYSTEM_SETTINGS_UPDATE",    "Update system settings",     "system",     "update"),
    # Org
    ("ORG_VIEW",                  "View org structure",         "org",        "view"),
    ("ORG_MANAGE",                "Manage org structure",       "org",        "manage"),
]

# ── Role → Permissions matrix ─────────────────────────────────────────────────
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "CHW": [
        "PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE",
        "ASSESSMENT_VIEW", "ASSESSMENT_CREATE", "ASSESSMENT_UPDATE", "ASSESSMENT_COMPLETE",
        "REFERRAL_VIEW", "REFERRAL_CREATE",
        "FOLLOWUP_VIEW", "FOLLOWUP_CREATE", "FOLLOWUP_UPDATE",
        "CASE_VIEW",
    ],
    "SUPERVISOR": [
        "PATIENT_VIEW",
        "ASSESSMENT_VIEW",
        "REFERRAL_VIEW", "REFERRAL_UPDATE",
        "FOLLOWUP_VIEW", "FOLLOWUP_UPDATE",
        "CASE_VIEW", "CASE_REVIEW", "CASE_ESCALATE", "CASE_ASSIGN", "CASE_RESOLVE",
        "CHW_VIEW",
        "TEAM_VIEW",
        "REPORT_VIEW",
    ],
    "PROGRAMME_MANAGER": [
        "PATIENT_VIEW",
        "ASSESSMENT_VIEW",
        "REFERRAL_VIEW",
        "FOLLOWUP_VIEW",
        "CASE_VIEW", "CASE_REVIEW",
        "CHW_VIEW",
        "TEAM_VIEW", "TEAM_MANAGE",
        "REPORT_VIEW", "REPORT_EXPORT",
        "ORG_VIEW",
    ],
    "REGIONAL_ADMIN": [
        # Administrative access — NO clinical data access
        "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DISABLE",
        "ROLE_VIEW", "ROLE_ASSIGN",
        "TEAM_VIEW", "TEAM_MANAGE",
        "ORG_VIEW", "ORG_MANAGE",
        "REPORT_VIEW",
        "AUDIT_VIEW",
    ],
    "SUPER_ADMIN": [
        # Full platform access
        "PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE", "PATIENT_DELETE",
        "ASSESSMENT_VIEW", "ASSESSMENT_CREATE", "ASSESSMENT_UPDATE", "ASSESSMENT_COMPLETE",
        "REFERRAL_VIEW", "REFERRAL_CREATE", "REFERRAL_UPDATE",
        "FOLLOWUP_VIEW", "FOLLOWUP_CREATE", "FOLLOWUP_UPDATE",
        "CASE_VIEW", "CASE_REVIEW", "CASE_ESCALATE", "CASE_ASSIGN", "CASE_RESOLVE",
        "CHW_VIEW", "CHW_CREATE", "CHW_UPDATE",
        "TEAM_VIEW", "TEAM_MANAGE",
        "REPORT_VIEW", "REPORT_EXPORT",
        "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DISABLE",
        "ROLE_VIEW", "ROLE_ASSIGN",
        "AUDIT_VIEW",
        "SYSTEM_SETTINGS_VIEW", "SYSTEM_SETTINGS_UPDATE",
        "ORG_VIEW", "ORG_MANAGE",
    ],
}

ROLES = [
    ("CHW",               "Community Health Worker",   "Front-line CHW field worker"),
    ("SUPERVISOR",        "Supervisor",                "Manages a team of CHWs, reviews cases"),
    ("PROGRAMME_MANAGER", "Programme Manager",         "Manages regions, districts, targets, reports"),
    ("REGIONAL_ADMIN",    "Regional Administrator",    "Manages user accounts and org units — no clinical access"),
    ("SUPER_ADMIN",       "Super Administrator",       "Full platform-wide administrative access"),
]

# ── Demo users (DEVELOPMENT ONLY) ─────────────────────────────────────────────
DEMO_PASSWORD_HASH = None   # computed at seed time

DEMO_USERS = [
    {
        "id":         "usr-chw-001",
        "email":      "demo-chw@example.com",
        "username":   "demo-chw",
        "first_name": "John",
        "last_name":  "Smith",
        "role_code":  "CHW",
    },
    {
        "id":         "usr-sup-001",
        "email":      "demo-supervisor@example.com",
        "username":   "demo-supervisor",
        "first_name": "Amara",
        "last_name":  "Okafor",
        "role_code":  "SUPERVISOR",
    },
    {
        "id":         "usr-mgr-001",
        "email":      "demo-manager@example.com",
        "username":   "demo-manager",
        "first_name": "Daniel",
        "last_name":  "Whitfield",
        "role_code":  "PROGRAMME_MANAGER",
    },
    {
        "id":         "usr-reg-001",
        "email":      "demo-regional-admin@example.com",
        "username":   "demo-regional-admin",
        "first_name": "Rachel",
        "last_name":  "Summers",
        "role_code":  "REGIONAL_ADMIN",
    },
    {
        "id":         "usr-adm-001",
        "email":      "demo-admin@example.com",
        "username":   "demo-admin",
        "first_name": "Admin",
        "last_name":  "User",
        "role_code":  "SUPER_ADMIN",
    },
]


def seed_db():
    """Seed the database with roles, permissions, org hierarchy, and demo users."""
    print("[seed] Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # ── 1 & 2. Roles and permissions ─────────────────────────────────────
        from app.models.rbac import RoleModel, PermissionModel
        if db.query(RoleModel).count() == 0:
            print("[seed] Seeding roles and permissions...")
            perm_map: dict[str, PermissionModel] = {}
            for code, name, resource, action in PERMISSIONS:
                p = PermissionModel(code=code, name=name, resource=resource, action=action)
                db.add(p)
                perm_map[code] = p
            db.flush()

            role_map: dict[str, RoleModel] = {}
            for code, name, desc in ROLES:
                r = RoleModel(code=code, name=name, description=desc, is_system_role=True, is_active=True)
                for perm_code in ROLE_PERMISSIONS.get(code, []):
                    if perm_code in perm_map:
                        r.permissions.append(perm_map[perm_code])
                db.add(r)
                role_map[code] = r
            db.flush()

        # ── 3. Organization hierarchy ─────────────────────────────────────────
        from app.models.org import OrganizationModel, RegionModel, DistrictModel, TeamModel
        org = db.query(OrganizationModel).first()
        region = db.query(RegionModel).first()
        district = db.query(DistrictModel).first()
        team = db.query(TeamModel).first()

        if not org:
            print("[seed] Seeding organization hierarchy...")
            org = OrganizationModel(name="Riverside Health Authority", code="RHA", status="ACTIVE")
            db.add(org)
            db.flush()

            region = RegionModel(organization_id=org.id, name="Western Region", code="WR", status="ACTIVE")
            db.add(region)
            db.flush()

            district = DistrictModel(region_id=region.id, name="Riverside District", code="RD", status="ACTIVE")
            db.add(district)
            db.flush()

            team = TeamModel(district_id=district.id, name="Field Team Alpha", code="FTA", status="ACTIVE")
            db.add(team)
            db.flush()

        # ── 4. Demo users ─────────────────────────────────────────────────────
        from app.models.user import UserModel
        from app.models.rbac import UserRoleModel
        if db.query(UserModel).count() == 0:
            print("[seed] Hashing demo passwords (Argon2id — this may take a moment)...")
            demo_pw_hash = hash_password("demo")

            print("[seed] Seeding demo users...")
            role_dict = {r.code: r for r in db.query(RoleModel).all()}

            for ud in DEMO_USERS:
                user = UserModel(
                    id=ud["id"],
                    username=ud["username"],
                    email=ud["email"],
                    password_hash=demo_pw_hash,
                    first_name=ud["first_name"],
                    last_name=ud["last_name"],
                    display_name=f"{ud['first_name']} {ud['last_name']}",
                    preferred_language="en",
                    status="ACTIVE",
                    is_email_verified=True,
                    organization_id=org.id if org else None,
                    region_id=region.id if region else None,
                    district_id=district.id if district else None,
                    team_id=team.id if team else None,
                )
                db.add(user)
                db.flush()

                # Assign role
                if ud["role_code"] in role_dict:
                    ur = UserRoleModel(user_id=user.id, role_id=role_dict[ud["role_code"]].id)
                    db.add(ur)

            db.flush()

            # Link supervisor to team
            sup_user = db.query(UserModel).filter_by(id="usr-sup-001").first()
            if sup_user and team:
                team.supervisor_user_id = sup_user.id
            db.flush()

        # ── 5. Demo Patients ──────────────────────────────────────────────────
        from app.models.patient import PatientModel
        if db.query(PatientModel).count() == 0:
            print("[seed] Seeding demo patients...")
            patients_data = [
                {
                    "id": "PT-2026-0001",
                    "first_name": "Maria", "last_name": "Santos",
                    "date_of_birth": date.fromisoformat("1998-05-14"), "age": 28, "sex": "Female",
                    "preferred_language": "es", "status": "HIGH_PRIORITY",
                    "phone": "+1-555-0101", "address": "Sector 4, House 12",
                    "emergency_contact": {"name": "Juan Santos", "relationship": "Spouse", "phone": "+1-555-0191"},
                    "assigned_chw_id": "usr-chw-001", "last_visit": "2026-08-20",
                },
                {
                    "id": "PT-2026-0002",
                    "first_name": "Ahmed", "last_name": "Robinson",
                    "date_of_birth": date.fromisoformat("2019-02-10"), "age": 7, "sex": "Male",
                    "preferred_language": "ar", "status": "FOLLOW_UP",
                    "phone": "+1-555-0102", "address": "North Block, Apt 3B",
                    "emergency_contact": {"name": "Amina Robinson", "relationship": "Mother", "phone": "+1-555-0192"},
                    "assigned_chw_id": "usr-chw-001", "last_visit": "2026-08-22",
                },
                {
                    "id": "PT-2026-0003",
                    "first_name": "Priya", "last_name": "Patel",
                    "date_of_birth": date.fromisoformat("1992-11-22"), "age": 34, "sex": "Female",
                    "preferred_language": "hi", "status": "ACTIVE",
                    "phone": "+1-555-0103", "address": "East Street, House 45",
                    "emergency_contact": {"name": "Raj Patel", "relationship": "Brother", "phone": "+1-555-0193"},
                    "assigned_chw_id": "usr-chw-001", "last_visit": "2026-08-18",
                },
                {
                    "id": "PT-2026-0004",
                    "first_name": "James", "last_name": "Wilson",
                    "date_of_birth": date.fromisoformat("1959-07-03"), "age": 67, "sex": "Male",
                    "preferred_language": "en", "status": "ACTIVE",
                    "phone": "+1-555-0104", "address": "West Road, House 8",
                    "emergency_contact": {"name": "Mary Wilson", "relationship": "Spouse", "phone": "+1-555-0194"},
                    "assigned_chw_id": "usr-chw-001", "last_visit": "2026-08-15",
                },
                {
                    "id": "PT-2026-0005",
                    "first_name": "Fatima", "last_name": "Al-Rashid",
                    "date_of_birth": date.fromisoformat("1984-09-12"), "age": 42, "sex": "Female",
                    "preferred_language": "ar", "status": "REFERRED",
                    "phone": "+1-555-0105", "address": "Central Community, Unit 12",
                    "emergency_contact": {"name": "Tariq Al-Rashid", "relationship": "Husband", "phone": "+1-555-0195"},
                    "assigned_chw_id": "usr-chw-001", "last_visit": "2026-08-21",
                },
                {
                    "id": "PT-2026-0006",
                    "first_name": "Carlos", "last_name": "Rivera",
                    "date_of_birth": date.fromisoformat("1971-04-18"), "age": 55, "sex": "Male",
                    "preferred_language": "es", "status": "ACTIVE",
                    "phone": "+1-555-0106", "address": "South Sector, House 23",
                    "emergency_contact": {"name": "Elena Rivera", "relationship": "Daughter", "phone": "+1-555-0196"},
                    "assigned_chw_id": "usr-chw-001", "last_visit": "2026-08-19",
                },
            ]
            for p in patients_data:
                db.add(PatientModel(**p))
            db.flush()

        # ── 6. Assessment Templates ───────────────────────────────────────────
        from app.models.assessment import AssessmentTemplateModel
        if db.query(AssessmentTemplateModel).count() == 0:
            print("[seed] Seeding assessment templates...")
            templates_data = [
                {
                    "id": "tpl-maternal",
                    "category": "MATERNAL",
                    "name": "Maternal Health Assessment",
                    "description": "Comprehensive assessment for pregnant and post-partum women.",
                    "duration_minutes": 15,
                    "questions": [
                        {"id": "q1", "text": "What is the gestational age or post-partum status?", "helpText": "Record weeks of pregnancy or days since delivery.", "type": "text"},
                        {"id": "q2", "text": "Is the patient experiencing severe headache or vision changes?", "helpText": "Key warning signs for pre-eclampsia.", "type": "choice", "options": ["Yes", "No", "Unknown"]},
                        {"id": "q3", "text": "Any abnormal bleeding or severe abdominal pain?", "helpText": "Immediate danger signs requiring emergency care.", "type": "choice", "options": ["Yes", "No"]},
                        {"id": "q4", "text": "Is the patient taking prenatal iron/folate supplements?", "helpText": "Essential for preventing maternal anaemia.", "type": "choice", "options": ["Yes, daily", "Irregularly", "No"]},
                        {"id": "q5", "text": "Additional clinical observations", "helpText": "Record blood pressure, swelling, or fetal movement notes.", "type": "text"},
                    ],
                },
                {
                    "id": "tpl-child",
                    "category": "CHILD",
                    "name": "Child Illness Assessment",
                    "description": "Assess children under 5 for common illnesses and malnutrition.",
                    "duration_minutes": 10,
                    "questions": [
                        {"id": "q1", "text": "What is the child's primary symptom today?", "helpText": "Ask the caregiver to describe main complaint.", "type": "text"},
                        {"id": "q2", "text": "Is the child experiencing fever (>38.5°C)?", "helpText": "Record fever duration and temperature.", "type": "choice", "options": ["Yes", "No", "Unknown"]},
                        {"id": "q3", "text": "How long have symptoms been present?", "helpText": "Duration helps evaluate acute vs prolonged infection.", "type": "choice", "options": ["Less than 24 hours", "1-3 days", "4-7 days", "More than 1 week"]},
                        {"id": "q4", "text": "Is the child able to drink or breastfeed normally?", "helpText": "Inability to feed is a critical danger sign.", "type": "choice", "options": ["Yes, normally", "Reduced intake", "Unable to drink/feed"]},
                        {"id": "q5", "text": "Any vomiting, lethargy, or rapid breathing?", "helpText": "Danger sign checklist.", "type": "choice", "options": ["Yes", "No"]},
                    ],
                },
                {
                    "id": "tpl-chronic",
                    "category": "CHRONIC",
                    "name": "Chronic Disease Assessment",
                    "description": "Monitor patients with diabetes, hypertension, and cardiovascular conditions.",
                    "duration_minutes": 12,
                    "questions": [
                        {"id": "q1", "text": "What is the patient's current blood pressure / blood glucose?", "helpText": "Record latest measured numbers.", "type": "text"},
                        {"id": "q2", "text": "Has the patient taken prescribed medications as directed?", "helpText": "Check for adherence barriers.", "type": "choice", "options": ["Yes, fully adherent", "Missed some doses", "Not taking medication"]},
                        {"id": "q3", "text": "Are there symptoms like chest pain, shortness of breath, or dizziness?", "helpText": "Cardiovascular danger signs.", "type": "choice", "options": ["Yes", "No"]},
                        {"id": "q4", "text": "Lifestyle factors (diet, physical activity, salt intake)", "helpText": "Discuss daily habits.", "type": "text"},
                    ],
                },
                {
                    "id": "tpl-surveillance",
                    "category": "SURVEILLANCE",
                    "name": "Disease Surveillance Assessment",
                    "description": "Community-level outbreak tracking for infectious diseases.",
                    "duration_minutes": 8,
                    "questions": [
                        {"id": "q1", "text": "Cluster of similar symptoms in the household or neighbourhood?", "helpText": "Check if others nearby are also sick.", "type": "choice", "options": ["Yes", "No", "Uncertain"]},
                        {"id": "q2", "text": "Primary syndrome observed", "helpText": "Respiratory, gastrointestinal, rash, or febrile syndrome.", "type": "choice", "options": ["Acute respiratory illness", "Watery diarrhoea", "Fever with rash", "Unexplained fever", "Other"]},
                        {"id": "q3", "text": "Water source and sanitation status", "helpText": "Environmental risk factors.", "type": "text"},
                    ],
                },
            ]
            for t in templates_data:
                db.add(AssessmentTemplateModel(**t))
            db.flush()

        # ── 7. Training Lessons ───────────────────────────────────────────────
        from app.models.training import TrainingLessonModel
        if db.query(TrainingLessonModel).count() == 0:
            print("[seed] Seeding training lessons...")
            lessons_data = [
                {
                    "id": "trn-danger-signs",
                    "title": "Danger Signs in Children",
                    "category": "Child Health",
                    "duration_minutes": 20,
                    "difficulty": "Beginner",
                    "progress": 100,
                    "recommended": True,
                    "recommendation_reason": "Relevant to your recent high-risk case.",
                    "slides": [
                        {"title": "Introduction", "content": "Recognizing childhood danger signs is vital for timely referral and saving lives under IMCI guidelines."},
                        {"title": "Key Danger Signs", "content": "Inability to drink or breastfeed, vomiting everything, convulsions, lethargy or unconsciousness."},
                        {"title": "Immediate Actions", "content": "Keep the child warm, administer first-dose antibiotics if protocol allows, and initiate urgent referral to hospital."},
                    ],
                },
                {
                    "id": "trn-maternal",
                    "title": "Maternal Health Essentials",
                    "category": "Maternal Care",
                    "duration_minutes": 25,
                    "difficulty": "Beginner",
                    "progress": 60,
                    "recommended": True,
                    "recommendation_reason": "Your caseload includes 8 pregnant women.",
                    "slides": [
                        {"title": "Antenatal Care Schedule", "content": "WHO recommends a minimum of 8 antenatal contacts throughout pregnancy."},
                        {"title": "Warning Signs in Pregnancy", "content": "Severe headache, blurred vision, sudden swelling of hands/face, vaginal bleeding, reduced fetal movements."},
                        {"title": "Post-partum Checkup", "content": "First visit within 24 hours, followed by day 3, between days 7-14, and at 6 weeks."},
                    ],
                },
                {
                    "id": "trn-htx",
                    "title": "Hypertension Management in the Field",
                    "category": "Chronic Disease",
                    "duration_minutes": 30,
                    "difficulty": "Intermediate",
                    "progress": 25,
                    "recommended": False,
                    "recommendation_reason": None,
                    "slides": [
                        {"title": "Blood Pressure Measurement", "content": "Ensure patient is seated quietly for 5 minutes before cuff measurement at heart level."},
                        {"title": "Thresholds & Flags", "content": "Systolic > 140 or Diastolic > 90 indicates hypertension. >180/120 requires immediate emergency referral."},
                    ],
                },
                {
                    "id": "trn-rtl",
                    "title": "Multilingual Patient Communication",
                    "category": "Communication",
                    "duration_minutes": 15,
                    "difficulty": "Beginner",
                    "progress": 0,
                    "recommended": False,
                    "recommendation_reason": None,
                    "slides": [
                        {"title": "Respectful Field Care", "content": "Communicate in the patient's preferred language and verify comprehension with teach-back questions."},
                    ],
                },
            ]
            for l in lessons_data:
                db.add(TrainingLessonModel(**l))
            db.flush()

        # ── 8. Clinical Cases ─────────────────────────────────────────────────
        from app.models.clinical import CaseRecordModel
        if db.query(CaseRecordModel).count() == 0:
            print("[seed] Seeding clinical cases...")
            cases_data = [
                {
                    "id": "CASE-02400",
                    "patient_id": "PT-2026-0002",
                    "chw_id": "usr-chw-001",
                    "template_id": "tpl-child",
                    "template_name": "Child Illness Assessment",
                    "risk_level": "HIGH",
                    "status": "SUPERVISOR_REVIEW",
                    "created_at": "2026-08-22T14:15:00Z",
                    "flagged_at": "2026-08-22T14:16:00Z",
                    "answers": [
                        {"questionId": "q1", "value": "Fever and vomiting for 2 days"},
                        {"questionId": "q2", "value": "Yes"},
                        {"questionId": "q3", "value": "1-3 days"},
                        {"questionId": "q4", "value": "Unable to drink/feed"},
                    ],
                    "vitals": {"temperature": 38.9, "respiratoryRate": 42, "heartRate": 110},
                    "protocol_result": {
                        "riskLevel": "HIGH",
                        "reason": "Child under 5 presenting with high fever (>38.5°C) and reduced fluid intake.",
                    },
                    "chw_notes": "Caregiver reports child has been listless and refusing oral fluids.",
                    "timeline": [
                        {"id": "t-1", "at": "02:15 PM", "label": "Assessment completed by CHW", "actor": "John Smith"},
                        {"id": "t-2", "at": "02:15 PM", "label": "Risk calculated: HIGH", "actor": "Protocol Engine"},
                        {"id": "t-3", "at": "02:16 PM", "label": "Flagged for supervisor review", "actor": "Protocol Engine"},
                    ],
                },
                {
                    "id": "CASE-02398",
                    "patient_id": "PT-2026-0001",
                    "chw_id": "usr-chw-001",
                    "template_id": "tpl-maternal",
                    "template_name": "Maternal Health Assessment",
                    "risk_level": "MEDIUM",
                    "status": "FOLLOW_UP",
                    "created_at": "2026-08-20T10:30:00Z",
                    "answers": [
                        {"questionId": "q1", "value": "3rd trimester (34 weeks)"},
                        {"questionId": "q2", "value": "No"},
                        {"questionId": "q4", "value": "Yes, daily"},
                    ],
                    "vitals": {"bloodPressure": "120/80", "temperature": 36.8},
                    "protocol_result": {
                        "riskLevel": "MEDIUM",
                        "reason": "Routine post-partum/third trimester check required within 48 hours.",
                    },
                    "timeline": [
                        {"id": "t-1", "at": "10:30 AM", "label": "Assessment completed", "actor": "John Smith"},
                        {"id": "t-2", "at": "10:31 AM", "label": "Follow-up scheduled", "actor": "Protocol Engine"},
                    ],
                },
                {
                    "id": "CASE-02390",
                    "patient_id": "PT-2026-0003",
                    "chw_id": "usr-chw-001",
                    "template_id": "tpl-chronic",
                    "template_name": "Chronic Disease Assessment",
                    "risk_level": "LOW",
                    "status": "COMPLETED",
                    "created_at": "2026-08-18T09:00:00Z",
                    "answers": [
                        {"questionId": "q1", "value": "Fasting blood sugar 110 mg/dL"},
                        {"questionId": "q2", "value": "Yes, fully adherent"},
                    ],
                    "vitals": {"glucose": "110 mg/dL", "bloodPressure": "118/76"},
                    "protocol_result": {
                        "riskLevel": "LOW",
                        "reason": "Blood glucose level within normal target range.",
                    },
                    "timeline": [
                        {"id": "t-1", "at": "09:00 AM", "label": "Routine check complete", "actor": "John Smith"},
                    ],
                },
            ]
            for c in cases_data:
                db.add(CaseRecordModel(**c))
            db.flush()

        # ── 9. Referrals & Follow-ups ─────────────────────────────────────────
        from app.models.clinical import ReferralModel, FollowUpModel
        if db.query(ReferralModel).count() == 0:
            print("[seed] Seeding referrals...")
            refs_data = [
                {
                    "id": "REF-3901",
                    "patient_id": "PT-2026-0002",
                    "case_id": "CASE-02400",
                    "chw_id": "usr-chw-001",
                    "reason": "High-risk child illness — referral to paediatric clinic required",
                    "priority": "HIGH",
                    "destination": "City Paediatric Hospital",
                    "notes": "Urgent transport requested by supervisor.",
                    "status": "SUBMITTED",
                    "created_at": "2026-08-22T14:30:00Z",
                },
                {
                    "id": "REF-3898",
                    "patient_id": "PT-2026-0005",
                    "chw_id": "usr-chw-001",
                    "reason": "Uncontrolled hypertension — cardiology review needed",
                    "priority": "MEDIUM",
                    "destination": "Regional Medical Centre",
                    "notes": "Appointment booked for Aug 25.",
                    "status": "ACCEPTED",
                    "created_at": "2026-08-21T11:00:00Z",
                },
            ]
            for r in refs_data:
                db.add(ReferralModel(**r))
            db.flush()

        if db.query(FollowUpModel).count() == 0:
            print("[seed] Seeding follow-ups...")
            fus_data = [
                {
                    "id": "FU-901",
                    "patient_id": "PT-2026-0002",
                    "chw_id": "usr-chw-001",
                    "reason": "Post-referral follow-up — monitor recovery",
                    "due_date": "2026-08-24",
                    "priority": "HIGH",
                    "status": "DUE_TODAY",
                },
                {
                    "id": "FU-899",
                    "patient_id": "PT-2026-0001",
                    "chw_id": "usr-chw-001",
                    "reason": "Antenatal check-up — 3rd trimester",
                    "due_date": "2026-08-24",
                    "priority": "HIGH",
                    "status": "DUE_TODAY",
                },
                {
                    "id": "FU-895",
                    "patient_id": "PT-2026-0003",
                    "chw_id": "usr-chw-001",
                    "reason": "Medication adherence check — diabetes management",
                    "due_date": "2026-08-27",
                    "priority": "MEDIUM",
                    "status": "UPCOMING",
                },
            ]
            for fu in fus_data:
                db.add(FollowUpModel(**fu))
            db.flush()

        # ── 10. Notifications ─────────────────────────────────────────────────
        from app.models.notification import NotificationModel
        if db.query(NotificationModel).count() == 0:
            print("[seed] Seeding notifications...")
            ntfs_data = [
                {
                    "id": "ntf-1",
                    "category": "HIGH_PRIORITY",
                    "title": "Case CASE-02400 flagged for supervisor review",
                    "body": "Ahmed Robinson's Child Illness Assessment has been evaluated as HIGH RISK and sent for supervisor review.",
                    "created_at": "2026-08-24T10:00:00Z",
                    "read": False,
                    "audience": "CHW",
                    "case_id": "CASE-02400",
                },
                {
                    "id": "ntf-2",
                    "category": "FOLLOW_UP",
                    "title": "Follow-up due today",
                    "body": "Scheduled follow-up with Ahmed Robinson is due today.",
                    "created_at": "2026-08-24T08:00:00Z",
                    "read": False,
                    "audience": "CHW",
                },
                {
                    "id": "ntf-3",
                    "category": "REFERRAL",
                    "title": "Referral REF-3901 accepted",
                    "body": "City Paediatric Hospital has accepted the referral for Ahmed Robinson.",
                    "created_at": "2026-08-23T14:00:00Z",
                    "read": True,
                    "audience": "CHW",
                },
            ]
            for n in ntfs_data:
                db.add(NotificationModel(**n))
            db.flush()

        # ── 11. CHWs and Platform Users ───────────────────────────────────────
        from app.models.user import ChwModel, PlatformUserModel
        if db.query(ChwModel).count() == 0:
            print("[seed] Seeding CHW team...")
            chws_data = [
                {"id": "usr-chw-001", "name": "John Smith", "email": "demo-chw@example.com", "status": "ACTIVE", "region": "North District", "assigned_patients": 50, "open_cases": 8, "follow_ups": 3, "high_priority_cases": 2, "last_active": "Today, 2:15 PM", "training_progress": 75},
                {"id": "chw-2", "name": "Aisha Patel", "email": "aisha.patel@example.com", "status": "ACTIVE", "region": "North District", "assigned_patients": 45, "open_cases": 5, "follow_ups": 2, "high_priority_cases": 0, "last_active": "Today, 1:30 PM", "training_progress": 90},
                {"id": "chw-3", "name": "Emmanuel Diaz", "email": "emmanuel.diaz@example.com", "status": "OFFLINE", "region": "North District", "assigned_patients": 38, "open_cases": 3, "follow_ups": 1, "high_priority_cases": 1, "last_active": "Yesterday, 5:00 PM", "training_progress": 50},
                {"id": "chw-4", "name": "Mei Lin Chen", "email": "mei.chen@example.com", "status": "ACTIVE", "region": "North District", "assigned_patients": 52, "open_cases": 6, "follow_ups": 4, "high_priority_cases": 1, "last_active": "Today, 12:45 PM", "training_progress": 65},
            ]
            for c in chws_data:
                db.add(ChwModel(**c))
            db.flush()

        if db.query(PlatformUserModel).count() == 0:
            print("[seed] Seeding platform users...")
            p_users_data = [
                {"id": "usr-chw-001", "name": "John Smith", "email": "demo-chw@example.com", "role": "CHW", "org_unit_id": "FTA", "status": "ACTIVE", "last_sign_in": "2026-08-24 12:00:00", "mfa_enabled": False},
                {"id": "usr-sup-001", "name": "Amara Okafor", "email": "demo-supervisor@example.com", "role": "SUPERVISOR", "org_unit_id": "RD", "status": "ACTIVE", "last_sign_in": "2026-08-24 11:30:00", "mfa_enabled": True},
                {"id": "usr-mgr-001", "name": "Daniel Whitfield", "email": "demo-manager@example.com", "role": "PROGRAMME_MANAGER", "org_unit_id": "RHA", "status": "ACTIVE", "last_sign_in": "2026-08-24 10:15:00", "mfa_enabled": True},
                {"id": "usr-reg-001", "name": "Rachel Summers", "email": "demo-regional-admin@example.com", "role": "REGIONAL_ADMIN", "org_unit_id": "WR", "status": "ACTIVE", "last_sign_in": "2026-08-24 09:00:00", "mfa_enabled": True},
                {"id": "usr-adm-001", "name": "Admin User", "email": "demo-admin@example.com", "role": "SUPER_ADMIN", "org_unit_id": "RHA", "status": "ACTIVE", "last_sign_in": "2026-08-24 08:30:00", "mfa_enabled": True},
            ]
            for pu in p_users_data:
                db.add(PlatformUserModel(**pu))
            db.flush()

        # ── 12. Administrative & Manager Models ───────────────────────────────
        from app.models.admin import (
            OrgUnitModel,
            AuditEventModel,
            SystemServiceModel,
            RoleDefinitionModel,
            ProgramMetricModel,
            SystemSettingModel,
        )

        if db.query(OrgUnitModel).count() == 0:
            print("[seed] Seeding org units...")
            org_units_data = [
                {"id": "FTA", "name": "Field Team Alpha", "type": "TEAM", "parent_id": "RD", "manager_name": "Amara Okafor", "chw_count": 4, "patient_count": 185, "coverage_percent": 94},
                {"id": "RD", "name": "Riverside District", "type": "DISTRICT", "parent_id": "WR", "manager_name": "Daniel Whitfield", "chw_count": 28, "patient_count": 1420, "coverage_percent": 88},
                {"id": "WR", "name": "Western Region", "type": "REGION", "parent_id": "RHA", "manager_name": "Rachel Summers", "chw_count": 142, "patient_count": 6800, "coverage_percent": 82},
                {"id": "NRA", "name": "North Region Authority", "type": "REGION", "parent_id": "RHA", "manager_name": "Admin User", "chw_count": 350, "patient_count": 17500, "coverage_percent": 86},
                {"id": "NR", "name": "Northern Region", "type": "REGION", "parent_id": "NRA", "manager_name": "Alice Smith", "chw_count": 110, "patient_count": 5200, "coverage_percent": 75},
                {"id": "ND", "name": "Northern District", "type": "DISTRICT", "parent_id": "NR", "manager_name": "Bob Jones", "chw_count": 15, "patient_count": 800, "coverage_percent": 78},
                {"id": "RHA", "name": "Riverside Health Authority", "type": "REGION", "parent_id": None, "manager_name": "Admin User", "chw_count": 350, "patient_count": 17500, "coverage_percent": 86},
            ]
            for u in org_units_data:
                db.add(OrgUnitModel(**u))
            db.flush()

        if db.query(ProgramMetricModel).count() == 0:
            print("[seed] Seeding program metrics...")
            metrics_data = [
                {"id": "prog-1", "name": "Maternal ANC Coverage (8+ Contacts)", "owner": "Daniel Whitfield", "owner_id": "usr-mgr-001", "target": 90, "actual": 84, "trend": "UP", "period": "Q3 2026"},
                {"id": "prog-2", "name": "Childhood Immunization Completeness", "owner": "Daniel Whitfield", "owner_id": "usr-mgr-001", "target": 95, "actual": 91, "trend": "UP", "period": "Q3 2026"},
                {"id": "prog-3", "name": "Hypertension Screening & Adherence", "owner": "Maria Santos", "owner_id": "usr-mgr-002", "target": 80, "actual": 76, "trend": "FLAT", "period": "Q3 2026"},
                {"id": "prog-4", "name": "Communicable Disease Case Escalation Rate", "owner": "Dr. Ahmed Hassan", "owner_id": "usr-mgr-003", "target": 100, "actual": 98, "trend": "UP", "period": "Q3 2026"},
            ]
            for m in metrics_data:
                db.add(ProgramMetricModel(**m))
            db.flush()

        if db.query(SystemServiceModel).count() == 0:
            print("[seed] Seeding system services...")
            services_data = [
                {"id": "srv-1", "name": "FastAPI Core API", "status": "OPERATIONAL", "uptime_percent": 99.98, "latency_ms": 24, "detail": "All API routes responding within SLAs."},
                {"id": "srv-2", "name": "Clinical Protocol Rule Engine", "status": "OPERATIONAL", "uptime_percent": 99.99, "latency_ms": 12, "detail": "Evaluating real-time triage rules with zero dropped flags."},
                {"id": "srv-3", "name": "Notification & SMS Gateway", "status": "OPERATIONAL", "uptime_percent": 99.85, "latency_ms": 110, "detail": "Supervisor alerts and follow-up reminders active."},
                {"id": "srv-4", "name": "SQLite / PostgreSQL Storage Layer", "status": "OPERATIONAL", "uptime_percent": 100.0, "latency_ms": 5, "detail": "Read/write operations healthy."},
            ]
            for s in services_data:
                db.add(SystemServiceModel(**s))
            db.flush()

        if db.query(RoleDefinitionModel).count() == 0:
            print("[seed] Seeding role definitions...")
            roles_data = [
                {"role": "CHW", "label": "Community Health Worker", "description": "Field frontline health worker executing assessments, patient registration, and care visits.", "user_count": 4, "permissions": ["PATIENT_READ", "PATIENT_WRITE", "ASSESSMENT_CREATE", "REFERRAL_CREATE", "FOLLOWUP_MANAGE"]},
                {"role": "SUPERVISOR", "label": "Clinical Supervisor", "description": "Clinical governance, case reviews, CHW team supervision, and emergency escalations.", "user_count": 1, "permissions": ["CASE_REVIEW", "REFERRAL_TRIAGE", "CHW_MANAGE", "PROTOCOL_OVERRIDE"]},
                {"role": "PROGRAMME_MANAGER", "label": "Programme Manager", "description": "District and facility operational oversight, KPI monitoring, and surveillance tracking.", "user_count": 1, "permissions": ["KPI_VIEW", "RESOURCE_ALLOCATE", "DISTRICT_MANAGE", "REPORT_EXPORT"]},
                {"role": "REGIONAL_ADMIN", "label": "Regional Admin", "description": "Regional health authority governance, cross-district policy, and compliance auditing.", "user_count": 1, "permissions": ["REGION_GOVERN", "POLICY_MANAGE", "AUDIT_VIEW"]},
                {"role": "SUPER_ADMIN", "label": "Super Administrator", "description": "Full platform administration, user provisioning, security, and system configuration.", "user_count": 1, "permissions": ["ALL_PERMISSIONS", "SECURITY_ADMIN", "USER_ADMIN", "CONFIG_ADMIN"]},
            ]
            for r in roles_data:
                db.add(RoleDefinitionModel(**r))
            db.flush()

        if db.query(AuditEventModel).count() == 0:
            print("[seed] Seeding audit events...")
            audits_data = [
                {"id": "aud-1", "at": "2026-08-24T12:00:00Z", "actor": "Admin User", "actor_role": "SUPER_ADMIN", "action": "System initialization and seed validation", "target": "Platform", "severity": "INFO"},
                {"id": "aud-2", "at": "2026-08-24T11:45:00Z", "actor": "Daniel Whitfield", "actor_role": "MANAGER", "action": "Updated programme target for Maternal ANC Coverage to 90%", "target": "Maternal ANC Coverage", "severity": "INFO"},
                {"id": "aud-3", "at": "2026-08-24T11:15:00Z", "actor": "Amara Okafor", "actor_role": "SUPERVISOR", "action": "Clinical sign-off on high-risk paediatric referral", "target": "CASE-02400", "severity": "INFO"},
            ]
            for a in audits_data:
                db.add(AuditEventModel(**a))
            db.flush()

        # ── 13. Training Modules ──────────────────────────────────────────────
        from app.models.training import TrainingLessonModel
        if db.query(TrainingLessonModel).count() == 0:
            print("[seed] Seeding training modules...")
            training_data = [
                {
                    "id": "les-1",
                    "title": "Pediatric Danger Sign Triage (iCCM)",
                    "category": "Child Health",
                    "duration_minutes": 15,
                    "difficulty": "Beginner",
                    "progress": 65,
                    "recommended": True,
                    "recommendation_reason": "High frequency of pediatric cases this week",
                    "slides": [
                        {"title": "Introduction to iCCM Protocol", "content": "Integrated Community Case Management (iCCM) equips frontline health workers to identify and triage life-threatening childhood illnesses in rural and underserved areas."},
                        {"title": "Recognizing General Danger Signs", "content": "Immediate danger signs include inability to drink or breastfeed, continuous vomiting, convulsions during illness, and severe lethargy or unconsciousness."},
                        {"title": "Respiratory Assessment & Fast Breathing", "content": "Count respiratory rate for a full 60 seconds with child calm. Thresholds: >= 50 breaths/min for 2-11 months, >= 40 breaths/min for 12-59 months."},
                        {"title": "Immediate Actions for High Risk", "content": "For high-risk findings, initiate pre-referral treatment (e.g. rectal artesunate if fever >38.5°C in malaria zone), arrange emergency transport, and notify clinical supervisor immediately."},
                    ],
                },
                {
                    "id": "les-2",
                    "title": "Antenatal Care: Danger Signs & Referral Criteria",
                    "category": "Maternal Health",
                    "duration_minutes": 20,
                    "difficulty": "Intermediate",
                    "progress": 100,
                    "recommended": False,
                    "recommendation_reason": None,
                    "slides": [
                        {"title": "ANC Schedule & Core Objectives", "content": "WHO recommends at least 8 ANC contacts. Ensure early first trimester registration and screening for pre-eclampsia and gestational diabetes."},
                        {"title": "Hypertensive Disorders of Pregnancy", "content": "Systolic BP >= 140 mmHg or Diastolic >= 90 mmHg after 20 weeks indicates pre-eclampsia risk. Check for severe headaches, visual disturbances, and epigastric pain."},
                        {"title": "Obstetric Hemorrhage & Warning Signs", "content": "Any vaginal bleeding in second or third trimester is an obstetric emergency requiring immediate transfer to a comprehensive EmONC facility."},
                    ],
                },
                {
                    "id": "les-3",
                    "title": "Community Hypertension Screening & Adherence",
                    "category": "NCDs",
                    "duration_minutes": 12,
                    "difficulty": "Beginner",
                    "progress": 0,
                    "recommended": True,
                    "recommendation_reason": "New protocol guidelines updated for NCD surveillance",
                    "slides": [
                        {"title": "Accurate Blood Pressure Measurement", "content": "Ensure patient has rested for 5 minutes. Use appropriately sized cuff at heart level. Record two readings spaced 2 minutes apart."},
                        {"title": "Lifestyle Modification & Salt Intake", "content": "Counsel patients on sodium reduction, increased physical activity, and maintaining a healthy body weight."},
                        {"title": "Medication Adherence Support", "content": "Assess barriers to daily compliance, manage side-effect concerns, and schedule regular monthly refills before supply exhaustion."},
                    ],
                },
                {
                    "id": "les-4",
                    "title": "Infection Prevention & Field Clinical Safety",
                    "category": "Clinical Practice",
                    "duration_minutes": 10,
                    "difficulty": "Beginner",
                    "progress": 40,
                    "recommended": False,
                    "recommendation_reason": None,
                    "slides": [
                        {"title": "Hand Hygiene Protocols", "content": "Perform hand hygiene before and after every patient interaction using alcohol-based rub or soap and clean water for at least 20 seconds."},
                        {"title": "Personal Protective Equipment (PPE)", "content": "Wear clean gloves during wound inspection, rapid diagnostic testing, and vital measurements where fluid contact is possible."},
                        {"title": "Safe Sharps & Waste Disposal", "content": "Dispose of lancets and test cartridges immediately into puncture-proof safety boxes. Never recap needles."},
                    ],
                },
                {
                    "id": "les-5",
                    "title": "Severe Acute Malnutrition (SAM) Screening via MUAC",
                    "category": "Nutrition",
                    "duration_minutes": 18,
                    "difficulty": "Intermediate",
                    "progress": 25,
                    "recommended": False,
                    "recommendation_reason": None,
                    "slides": [
                        {"title": "Mid-Upper Arm Circumference (MUAC) Technique", "content": "Locate midpoint between shoulder and elbow on left arm. Apply color-coded MUAC tape without pinching."},
                        {"title": "Triage Color Codes", "content": "Red (<11.5 cm): Severe Acute Malnutrition (SAM). Yellow (11.5 - 12.4 cm): Moderate Acute Malnutrition (MAM). Green (>= 12.5 cm): Normal."},
                        {"title": "Bilateral Pitting Edema Check", "content": "Apply gentle thumb pressure to both feet for 3 seconds. Pitting edema indicates severe malnutrition regardless of MUAC measurement."},
                    ],
                },
            ]
            for l in training_data:
                db.add(TrainingLessonModel(**l))
            db.flush()

        # ── 14. Coordination: Referrals ───────────────────────────────────────
        from app.models.clinical import ReferralModel
        if db.query(ReferralModel).count() == 0:
            print("[seed] Seeding coordination referrals...")
            referrals_data = [
                {
                    "id": "REF-3901",
                    "patient_id": "PT-2026-0002",
                    "case_id": "CASE-02400",
                    "chw_id": "usr-chw-001",
                    "supervisor_id": "usr-sup-001",
                    "destination": "City Paediatric Hospital",
                    "reason": "Severe fever 39.1°C and respiratory distress (iCCM red flag)",
                    "priority": "HIGH",
                    "status": "SUBMITTED",
                    "notes": "Emergency transport dispatched. Oxygen saturation 91%.",
                    "created_at": "Today, 10:15 AM",
                },
                {
                    "id": "REF-3902",
                    "patient_id": "PT-2026-0001",
                    "case_id": "CASE-02399",
                    "chw_id": "usr-chw-001",
                    "supervisor_id": "usr-sup-001",
                    "destination": "District General Clinic",
                    "reason": "Antenatal ultrasound confirmation and comprehensive lab workup",
                    "priority": "ROUTINE",
                    "status": "ACCEPTED",
                    "notes": "Scheduled for Thursday clinic intake.",
                    "created_at": "Yesterday, 3:30 PM",
                },
                {
                    "id": "REF-3903",
                    "patient_id": "PT-2026-0004",
                    "case_id": "CASE-02398",
                    "chw_id": "usr-chw-001",
                    "supervisor_id": "usr-sup-001",
                    "destination": "Community Health Center",
                    "reason": "Hypertension staging & medication adjustment review",
                    "priority": "ROUTINE",
                    "status": "COMPLETED",
                    "notes": "Prescription refilled and dietary plan updated.",
                    "created_at": "Aug 20, 2026",
                },
                {
                    "id": "REF-3904",
                    "patient_id": "PT-2026-0003",
                    "case_id": "CASE-02397",
                    "chw_id": "usr-chw-001",
                    "supervisor_id": "usr-sup-001",
                    "destination": "Regional Infectious Disease Center",
                    "reason": "Persistent productive cough > 2 weeks; GeneXpert TB evaluation",
                    "priority": "HIGH",
                    "status": "SUBMITTED",
                    "notes": "Sputum sample collected; awaiting transfer approval.",
                    "created_at": "Aug 22, 2026",
                },
            ]
            for ref in referrals_data:
                db.add(ReferralModel(**ref))
            db.flush()

        # ── 15. Coordination: Follow-ups ──────────────────────────────────────
        from app.models.clinical import FollowUpModel
        if db.query(FollowUpModel).count() == 0:
            print("[seed] Seeding coordination follow-ups...")
            followups_data = [
                {
                    "id": "FU-001",
                    "patient_id": "PT-2026-0001",
                    "chw_id": "usr-chw-001",
                    "reason": "Post-fever temperature & oral hydration follow-up",
                    "due_date": "Today, 4:00 PM",
                    "priority": "HIGH",
                    "status": "DUE_TODAY",
                    "notes": "Verify fever has resolved and patient is drinking fluids.",
                },
                {
                    "id": "FU-002",
                    "patient_id": "PT-2026-0002",
                    "chw_id": "usr-chw-001",
                    "reason": "Antibiotic adherence and symptom resolution (Day 3)",
                    "due_date": "Tomorrow, 10:00 AM",
                    "priority": "HIGH",
                    "status": "UPCOMING",
                    "notes": "Check complete intake of prescribed amoxicillin.",
                },
                {
                    "id": "FU-003",
                    "patient_id": "PT-2026-0004",
                    "chw_id": "usr-chw-001",
                    "reason": "Monthly blood pressure monitoring & lifestyle review",
                    "due_date": "Aug 28, 2026",
                    "priority": "ROUTINE",
                    "status": "UPCOMING",
                    "notes": "Target BP < 130/80 mmHg.",
                },
                {
                    "id": "FU-004",
                    "patient_id": "PT-2026-0005",
                    "chw_id": "usr-chw-001",
                    "reason": "Postnatal newborn feeding & umbilical cord assessment",
                    "due_date": "Aug 22, 2026",
                    "priority": "HIGH",
                    "status": "OVERDUE",
                    "notes": "Urgent home visit required to inspect neonatal hydration.",
                },
            ]
            for fu in followups_data:
                db.add(FollowUpModel(**fu))
            db.flush()

        # ── 16. Coordination: Notifications ───────────────────────────────────
        from app.models.notification import NotificationModel
        if db.query(NotificationModel).count() == 0:
            print("[seed] Seeding notifications...")
            notifs_data = [
                {
                    "id": "notif-001",
                    "category": "CLINICAL",
                    "type": "SUPERVISOR_ACTION",
                    "title": "Supervisor Approved Case #02400",
                    "body": "Clinical Supervisor Amara Okafor approved the referral for Amara Diop to City Paediatric Hospital.",
                    "created_at": "10 minutes ago",
                    "read": False,
                    "audience": "CHW",
                    "case_id": "CASE-02400",
                },
                {
                    "id": "notif-002",
                    "category": "TRAINING",
                    "type": "LESSON_ASSIGNED",
                    "title": "Refresher Training Assigned",
                    "body": "You have been assigned: Pediatric Danger Sign Triage (iCCM). Target completion: Friday.",
                    "created_at": "1 hour ago",
                    "read": False,
                    "audience": "CHW",
                    "case_id": None,
                },
                {
                    "id": "notif-003",
                    "category": "FOLLOWUP",
                    "type": "DUE_ALERT",
                    "title": "High-Priority Follow-up Due Today",
                    "body": "Patient Amina Mwangi has a follow-up visit scheduled for 4:00 PM today.",
                    "created_at": "3 hours ago",
                    "read": True,
                    "audience": "CHW",
                    "case_id": None,
                },
                {
                    "id": "notif-004",
                    "category": "CLINICAL",
                    "type": "HIGH_RISK_ESCALATION",
                    "title": "Urgent Paediatric Escalation",
                    "body": "CHW John Smith logged a high-risk case (CASE-02400) requiring immediate triage sign-off.",
                    "created_at": "15 minutes ago",
                    "read": False,
                    "audience": "SUPERVISOR",
                    "case_id": "CASE-02400",
                },
            ]
            for n in notifs_data:
                db.add(NotificationModel(**n))
            db.flush()

        # ── 17. Admin Dashboards (Programs & Services) ────────────────────────
        from app.models.admin import ProgramMetricModel, SystemServiceModel
        if db.query(ProgramMetricModel).count() == 0:
            print("[seed] Seeding program metrics...")
            prog_data = [
                {"id": "prog-1", "name": "Maternal ANC Coverage (8+ Contacts)", "owner": "Daniel Whitfield", "owner_id": "usr-mgr-001", "target": 90, "actual": 84, "trend": "UP", "period": "2026-Q3"},
                {"id": "prog-2", "name": "Childhood Immunization Completeness", "owner": "Daniel Whitfield", "owner_id": "usr-mgr-001", "target": 95, "actual": 91, "trend": "UP", "period": "2026-Q3"},
                {"id": "prog-3", "name": "Hypertension Screening & Adherence", "owner": "Maria Santos", "owner_id": "usr-mgr-002", "target": 80, "actual": 76, "trend": "FLAT", "period": "2026-Q3"},
                {"id": "prog-4", "name": "Communicable Disease Case Escalation Rate", "owner": "Dr. Ahmed Hassan", "owner_id": "usr-mgr-003", "target": 100, "actual": 98, "trend": "UP", "period": "2026-Q3"},
            ]
            for p in prog_data:
                db.add(ProgramMetricModel(**p))
            db.flush()

        if db.query(SystemServiceModel).count() == 0:
            print("[seed] Seeding system services...")
            svc_data = [
                {"id": "svc-api", "name": "Core API", "status": "OPERATIONAL", "uptime_percent": 99.9, "latency_ms": 42, "detail": "All endpoints responding normally."},
                {"id": "svc-protocol", "name": "Protocol engine", "status": "OPERATIONAL", "uptime_percent": 99.7, "latency_ms": 78, "detail": "Clinical risk evaluation running."},
                {"id": "svc-db", "name": "Database cluster", "status": "OPERATIONAL", "uptime_percent": 99.9, "latency_ms": 12, "detail": "Primary and replica in sync."},
                {"id": "svc-notif", "name": "Notification service", "status": "DEGRADED", "uptime_percent": 97.2, "latency_ms": 320, "detail": "Push delivery delayed. Investigation ongoing."},
                {"id": "svc-voice", "name": "Voice transcription", "status": "OPERATIONAL", "uptime_percent": 99.1, "latency_ms": 200, "detail": "All language models loaded."},
            ]
            for s in svc_data:
                db.add(SystemServiceModel(**s))
            db.flush()

        db.commit()
        print("[seed] [OK] Seeding complete.")
        print("[seed]")
        print("[seed]   Demo accounts (DEVELOPMENT ONLY — password: demo):")
        for ud in DEMO_USERS:
            print(f"[seed]     {ud['role_code']:20s}  {ud['email']}")
        print("[seed]")

    except Exception as exc:
        db.rollback()
        print(f"[seed] ERROR: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()

