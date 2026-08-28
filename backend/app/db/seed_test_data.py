import os
import sys
import random
from datetime import date
from sqlalchemy.orm import Session

# Import Models
from app.models.org import OrganizationModel, RegionModel, DistrictModel, TeamModel
from app.models.admin import OrgUnitModel, AuditEventModel, SystemServiceModel, RoleDefinitionModel, ProgramMetricModel, SystemSettingModel
from app.models.user import UserModel
from app.models.rbac import UserRoleModel, RoleModel
from app.models.patient import PatientModel
from app.models.assessment import AssessmentModel
from app.models.clinical import CaseRecordModel, ReferralModel, FollowUpModel
from app.models.notification import NotificationModel
from app.models.training import TrainingLessonModel

def seed_all_test_data(db: Session):
    print("[test-data] Initializing test data check...")

    # 1. Organization
    org = db.query(OrganizationModel).first()
    if not org:
        org = OrganizationModel(id="org-default", name="Riverside Health Authority", code="RHA", status="ACTIVE")
        db.add(org)
        db.commit()
        print("[test-data] Default organization created.")

    # 2. Regions
    regions_count = db.query(RegionModel).count()
    if regions_count < 10:
        print(f"[test-data] Seeding regions (currently {regions_count})...")
        for i in range(regions_count + 1, 11):
            r = RegionModel(
                id=f"reg-test-{i:03d}",
                organization_id=org.id,
                name=f"Region {i}",
                code=f"REG-{i:02d}",
                status="ACTIVE"
            )
            db.add(r)
        db.commit()

    # 3. Districts
    districts_count = db.query(DistrictModel).count()
    if districts_count < 10:
        print(f"[test-data] Seeding districts (currently {districts_count})...")
        regions = db.query(RegionModel).all()
        for i in range(districts_count + 1, 11):
            reg = regions[i % len(regions)]
            d = DistrictModel(
                id=f"dist-test-{i:03d}",
                region_id=reg.id,
                name=f"District {i}",
                code=f"DIST-{i:02d}",
                status="ACTIVE"
            )
            db.add(d)
        db.commit()

    # 4. Teams
    teams_count = db.query(TeamModel).count()
    if teams_count < 10:
        print(f"[test-data] Seeding teams (currently {teams_count})...")
        districts = db.query(DistrictModel).all()
        for i in range(teams_count + 1, 11):
            dist = districts[i % len(districts)]
            t = TeamModel(
                id=f"team-test-{i:03d}",
                district_id=dist.id,
                name=f"Field Team {i}",
                code=f"TEAM-{i:02d}",
                status="ACTIVE"
            )
            db.add(t)
        db.commit()

    # 5. Org Units
    org_units_count = db.query(OrgUnitModel).count()
    if org_units_count < 10:
        print(f"[test-data] Seeding org units (currently {org_units_count})...")
        types = ["REGION", "DISTRICT", "CLINIC"]
        for i in range(org_units_count + 1, 11):
            ou = OrgUnitModel(
                id=f"ou-test-{i:03d}",
                name=f"Health Unit {i}",
                type=types[i % len(types)],
                parent_id=None,
                manager_name=f"Manager {i}",
                chw_count=random.randint(5, 25),
                patient_count=random.randint(50, 250),
                coverage_percent=random.randint(70, 99),
                open_cases=random.randint(2, 15)
            )
            db.add(ou)
        db.commit()

    # 6. Users & Roles
    roles = db.query(RoleModel).all()
    role_dict = {r.code: r for r in roles}
    users_count = db.query(UserModel).count()
    if users_count < 10:
        print(f"[test-data] Seeding user accounts (currently {users_count})...")
        from app.core.security import hash_password
        pw_hash = hash_password("demo")
        role_codes = list(role_dict.keys()) if role_dict else ["CHW"]
        teams = db.query(TeamModel).all()
        for i in range(users_count + 1, 11):
            role_code = role_codes[i % len(role_codes)]
            t = teams[i % len(teams)] if teams else None
            user = UserModel(
                id=f"usr-test-{i:03d}",
                username=f"test-user-{i}",
                email=f"test-user-{i}@example.com",
                password_hash=pw_hash,
                first_name=f"TestName{i}",
                last_name=f"TestLast{i}",
                display_name=f"TestName{i} TestLast{i}",
                preferred_language="en",
                status="ACTIVE",
                is_email_verified=True,
                organization_id=org.id,
                team_id=t.id if t else None
            )
            db.add(user)
            db.flush()
            
            if role_code in role_dict:
                ur = UserRoleModel(user_id=user.id, role_id=role_dict[role_code].id)
                db.add(ur)
        db.commit()

    # 7. Patients
    patients_count = db.query(PatientModel).count()
    if patients_count < 10:
        print(f"[test-data] Seeding patients (currently {patients_count})...")
        first_names = ["Maria", "Ahmed", "Priya", "James", "Fatima", "Carlos", "Yuki", "Lin", "David", "Sarah"]
        last_names = ["Santos", "Robinson", "Patel", "Wilson", "Al-Rashid", "Gomez", "Tanaka", "Wang", "Smith", "Jones"]
        genders = ["Male", "Female"]
        statuses = ["ACTIVE", "HIGH_PRIORITY", "FOLLOW_UP", "REFERRED"]
        risks = ["LOW", "MEDIUM", "HIGH"]
        languages = ["en", "es", "hi", "ar"]
        for i in range(patients_count + 1, 11):
            dob = date(2026 - random.randint(20, 70), random.randint(1, 12), random.randint(1, 28))
            p = PatientModel(
                id=f"pt-test-{i:03d}",
                mrn=f"TEST-MRN-{2000 + i}",
                first_name=first_names[i % len(first_names)],
                last_name=last_names[i % len(last_names)],
                date_of_birth=dob,
                age=2026 - dob.year,
                sex=genders[i % 2],
                preferred_language=languages[i % len(languages)],
                status=statuses[i % len(statuses)],
                risk_level=risks[i % len(risks)],
                phone=f"+1-555-02{i:02d}",
                address=f"Sector {i}, Street {i}",
                emergency_contact={"name": f"Contact {i}", "relationship": "Relative", "phone": f"+1-555-09{i:02d}"},
                assigned_chw_id="usr-chw-001",
                last_visit="2026-08-25"
            )
            db.add(p)
        db.commit()

    # 8. Assessments
    assessments_count = db.query(AssessmentModel).count()
    if assessments_count < 10:
        print(f"[test-data] Seeding assessments (currently {assessments_count})...")
        patients = db.query(PatientModel).all()
        for i in range(assessments_count + 1, 11):
            pat = patients[i % len(patients)]
            a = AssessmentModel(
                id=f"asm-test-{i:03d}",
                patient_id=pat.id,
                template_version_id=None,
                chw_user_id="usr-chw-001",
                status="COMPLETED",
                voice_used=(i % 2 == 0),
                language="en"
            )
            db.add(a)
        db.commit()

    # 9. Case Records
    cases_count = db.query(CaseRecordModel).count()
    if cases_count < 10:
        print(f"[test-data] Seeding case records (currently {cases_count})...")
        patients = db.query(PatientModel).all()
        risks = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        statuses = ["OPEN", "IN_PROGRESS", "UNDER_REVIEW", "RESOLVED"]
        for i in range(cases_count + 1, 11):
            pat = patients[i % len(patients)]
            cr = CaseRecordModel(
                id=f"case-test-{i:03d}",
                patient_id=pat.id,
                chw_id="usr-chw-001",
                template_id="tpl-pregnancy",
                template_name="Maternal ANC Triage",
                risk_level=risks[i % len(risks)],
                status=statuses[i % len(statuses)],
                created_at="2026-08-24T12:00:00Z",
                flagged_at="2026-08-24T12:05:00Z",
                chw_notes=f"Test case notes for patient {pat.first_name}."
            )
            db.add(cr)
        db.commit()

    # 10. Referrals
    referrals_count = db.query(ReferralModel).count()
    if referrals_count < 10:
        print(f"[test-data] Seeding referrals (currently {referrals_count})...")
        patients = db.query(PatientModel).all()
        priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]
        statuses = ["SUBMITTED", "PENDING", "ACCEPTED", "COMPLETED"]
        for i in range(referrals_count + 1, 11):
            pat = patients[i % len(patients)]
            ref = ReferralModel(
                id=f"ref-test-{i:03d}",
                patient_id=pat.id,
                chw_id="usr-chw-001",
                supervisor_id="usr-sup-001",
                destination=f"General Hospital Wing {i}",
                reason="Specialist evaluation required.",
                priority=priorities[i % len(priorities)],
                status=statuses[i % len(statuses)],
                created_at="2026-08-24T12:00:00Z"
            )
            db.add(ref)
        db.commit()

    # 11. Followups
    followups_count = db.query(FollowUpModel).count()
    if followups_count < 10:
        print(f"[test-data] Seeding follow-ups (currently {followups_count})...")
        patients = db.query(PatientModel).all()
        priorities = ["LOW", "MEDIUM", "HIGH"]
        statuses = ["PENDING", "COMPLETED", "OVERDUE"]
        for i in range(followups_count + 1, 11):
            pat = patients[i % len(patients)]
            fu = FollowUpModel(
                id=f"fu-test-{i:03d}",
                patient_id=pat.id,
                chw_id="usr-chw-001",
                reason=f"Post-treatment check-up {i}",
                due_date=f"2026-09-{i:02d}",
                priority=priorities[i % len(priorities)],
                status=statuses[i % len(statuses)],
                notes=f"Please verify patient takes daily meds."
            )
            db.add(fu)
        db.commit()

    # 12. Notifications
    notifications_count = db.query(NotificationModel).count()
    if notifications_count < 10:
        print(f"[test-data] Seeding notifications (currently {notifications_count})...")
        categories = ["CLINICAL", "SYSTEM", "TRAINING"]
        audiences = ["CHW", "SUPERVISOR", "MANAGER"]
        for i in range(notifications_count + 1, 11):
            n = NotificationModel(
                id=f"notif-test-{i:03d}",
                category=categories[i % len(categories)],
                type="ALERT",
                title=f"Notification Alert {i}",
                body=f"Important system or clinical update message number {i}.",
                created_at=f"{i} hours ago",
                read=False,
                audience=audiences[i % len(audiences)]
            )
            db.add(n)
        db.commit()

    # 13. Training Lessons
    lessons_count = db.query(TrainingLessonModel).count()
    if lessons_count < 10:
        print(f"[test-data] Seeding training lessons (currently {lessons_count})...")
        categories = ["Maternal", "Paediatrics", "First Aid", "Hygiene"]
        difficulties = ["Beginner", "Intermediate", "Advanced"]
        for i in range(lessons_count + 1, 11):
            l = TrainingLessonModel(
                id=f"trn-test-{i:03d}",
                title=f"Lesson {i}: Essential Health Protocols",
                category=categories[i % len(categories)],
                duration_minutes=15 * (i % 3 + 1),
                difficulty=difficulties[i % len(difficulties)],
                progress=random.randint(0, 100),
                recommended=(i % 3 == 0),
                recommendation_reason=f"Important for district health campaign" if i % 3 == 0 else None,
                slides=[
                    {"title": "Introduction", "content": "Overview of this topic."},
                    {"title": "Best Practices", "content": "Practical steps to follow."}
                ]
            )
            db.add(l)
        db.commit()

    # 14. Program Metrics
    metrics_count = db.query(ProgramMetricModel).count()
    if metrics_count < 10:
        print(f"[test-data] Seeding program metrics (currently {metrics_count})...")
        trends = ["UP", "FLAT", "DOWN"]
        for i in range(metrics_count + 1, 11):
            pm = ProgramMetricModel(
                id=f"prog-test-{i:03d}",
                name=f"Health Initiative Project {i}",
                owner=f"Officer {i}",
                owner_id="usr-mgr-001",
                target=80 + i,
                actual=75 + (i % 3),
                trend=trends[i % len(trends)],
                period="2026-Q3"
            )
            db.add(pm)
        db.commit()

    # 15. System Services
    services_count = db.query(SystemServiceModel).count()
    if services_count < 10:
        print(f"[test-data] Seeding system services (currently {services_count})...")
        statuses = ["OPERATIONAL", "DEGRADED", "DOWN"]
        for i in range(services_count + 1, 11):
            ss = SystemServiceModel(
                id=f"svc-test-{i:03d}",
                name=f"Service Micro-Cluster {i}",
                status=statuses[i % len(statuses)],
                uptime_percent=95.0 + (i % 5),
                latency_ms=10 * i,
                detail=f"Status details for microservice {i}."
            )
            db.add(ss)
        db.commit()

    # 16. Role Definitions
    roles_def_count = db.query(RoleDefinitionModel).count()
    if roles_def_count < 10:
        print(f"[test-data] Seeding role definitions (currently {roles_def_count})...")
        extra_roles = [
            ("CLINIC_ADMIN", "Clinic Administrator", "Handles local clinic operations"),
            ("COMMUNITY_LEADER", "Community Leader", "Advocates health programs locally"),
            ("LAB_TECH", "Laboratory Technician", "Manages lab records and reports"),
            ("PHARMACIST", "Pharmacist", "Manages local dispensary stocks"),
            ("STUDENT_CHW", "Student CHW", "Intern or student health worker in training"),
            ("DATA_ANALYST", "Data Analyst", "Reviews trends and exports data reports")
        ]
        for i, (code, label, desc) in enumerate(extra_roles, start=roles_def_count + 1):
            rd = RoleDefinitionModel(
                role=code,
                label=label,
                description=desc,
                user_count=random.randint(1, 10),
                permissions=["USER_VIEW", "PATIENT_VIEW"]
            )
            db.add(rd)
        db.commit()

    # 17. Audit Events
    audit_count = db.query(AuditEventModel).count()
    if audit_count < 10:
        print(f"[test-data] Seeding audit events (currently {audit_count})...")
        actor_roles = ["CHW", "SUPERVISOR", "MANAGER", "ADMIN", "SUPER_ADMIN"]
        severities = ["INFO", "WARNING", "CRITICAL"]
        for i in range(audit_count + 1, 11):
            ae = AuditEventModel(
                id=f"aud-test-{i:03d}",
                at=f"2026-08-28T12:0{i}:00Z",
                actor=f"Actor {i}",
                actor_role=actor_roles[i % len(actor_roles)],
                action=f"Resource update request {i}",
                target="Database",
                severity=severities[i % len(severities)]
            )
            db.add(ae)
        db.commit()

    # 18. System Settings
    settings_count = db.query(SystemSettingModel).count()
    if settings_count < 10:
        print(f"[test-data] Seeding system settings (currently {settings_count})...")
        for i in range(settings_count + 1, 11):
            ss = SystemSettingModel(
                key=f"setting_toggle_feature_{i}",
                value=(i % 2 == 0)
            )
            db.add(ss)
        db.commit()

    print("[test-data] Seeding of all test data completed successfully!")
