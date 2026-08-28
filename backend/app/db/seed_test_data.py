import os
import sys
from sqlalchemy.orm import Session
from app.models.patient import PatientModel
from datetime import date
import random

def seed_twenty_test_patients(db: Session):
    # Check if we already have the test patients
    test_patients_count = db.query(PatientModel).filter(PatientModel.mrn.like("TEST-MRN-%")).count()
    if test_patients_count >= 20:
        print(f"[test-data] Already have {test_patients_count} test patients in database. Skipping seeding.")
        return

    print(f"[test-data] Seeding 20 test patients...")
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry",
                   "Ivy", "Jack", "Karl", "Lily", "Mia", "Noah", "Olivia", "Peter", "Ryan", "Sophia"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
                  "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White"]
    genders = ["Male", "Female"]
    statuses = ["ACTIVE", "HIGH_PRIORITY", "FOLLOW_UP", "REFERRED"]
    risks = ["LOW", "MEDIUM", "HIGH"]
    languages = ["en", "es", "hi", "ar"]

    for i in range(1, 21):
        mrn = f"TEST-MRN-{1000 + i}"
        # Check if this specific MRN already exists
        existing = db.query(PatientModel).filter_by(mrn=mrn).first()
        if existing:
            continue

        first_name = first_names[(i - 1) % len(first_names)]
        last_name = last_names[(i - 1) % len(last_names)]
        sex = genders[i % 2]
        status = statuses[i % len(statuses)]
        risk = risks[i % len(risks)]
        lang = languages[i % len(languages)]
        age = random.randint(18, 75)
        dob = date(2026 - age, random.randint(1, 12), random.randint(1, 28))

        patient = PatientModel(
            id=f"pt-test-{1000 + i}",
            mrn=mrn,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=dob,
            age=age,
            sex=sex,
            preferred_language=lang,
            status=status,
            risk_level=risk,
            phone=f"+1-555-{i:04d}",
            address=f"Test Street {i}, Ward {random.randint(1, 5)}",
            emergency_contact={"name": f"Contact {first_name}", "relationship": "Relative", "phone": f"+1-555-9{i:03d}"},
            assigned_chw_id="usr-chw-001",
            last_visit="2026-08-25"
        )
        db.add(patient)
    
    db.commit()
    print("[test-data] Successfully seeded 20 test patients.")
