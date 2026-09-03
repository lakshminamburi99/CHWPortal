import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { API_BASE } from '../../config';

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
export interface SlideQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TrainingSlide {
  heading: string;
  stage?: string;
  body: string;
  points?: string[];
  keyPoint?: string;
  dangerAlert?: string;
  question?: SlideQuestion;
}

export interface TrainingLesson {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  recommended: boolean;
  recommendationReason?: string | null;
  slides: TrainingSlide[];
}

// ---------------------------------------------------------
// Comprehensive Clinical Training Curriculum (8 Full Modules)
// ---------------------------------------------------------
const comprehensiveLessons: TrainingLesson[] = [
  {
    id: 'les-1',
    title: 'Pediatric Danger Sign Triage (iCCM)',
    category: 'Child Health',
    durationMinutes: 20,
    difficulty: 'Beginner',
    progress: 75,
    recommended: true,
    recommendationReason: 'High frequency of pediatric acute respiratory & fever cases this week',
    slides: [
      {
        heading: 'Integrated Community Case Management (iCCM) Core Principles',
        stage: 'PROTOCOL OVERVIEW',
        body: 'iCCM is an equity-focused strategy that trains frontline community health workers to assess, classify, and treat or refer children aged 2 to 59 months suffering from pneumonia, diarrhea, malaria, and severe malnutrition.',
        points: [
          'Focuses on the top causes of under-5 mortality in community settings.',
          'Standardized clinical decision trees ensure consistent triage quality.',
          'Prompt recognition and referral within 24 hours of symptom onset saves lives.',
        ],
        keyPoint: 'Timely triage and prompt pre-referral stabilization prevent 70%+ of preventable under-5 deaths.',
        question: {
          id: 'q1-1',
          prompt: 'What is the primary objective of the iCCM strategy in community health?',
          options: [
            'To replace district hospital pediatricians with community volunteers',
            'To assess, classify, treat, or urgently refer under-5 children with acute life-threatening conditions',
            'To conduct clinical surgical trials in rural communities',
            'To only record vital statistics without clinical triage',
          ],
          correctIndex: 1,
          explanation: 'iCCM empowers frontline workers to rapidly identify, treat uncomplicated cases, and refer severe pediatric illnesses (pneumonia, malaria, diarrhea, malnutrition).',
        },
      },
      {
        heading: 'The 4 General Danger Signs in Children (IMCI/WHO)',
        stage: 'CLINICAL TRIAGE',
        body: 'Every child presenting with illness must be immediately screened for the 4 WHO General Danger Signs. The presence of ANY one sign classifies the child as HIGH RISK requiring emergency transfer.',
        points: [
          '1. Inability to drink or breastfeed (vomits everything or cannot latch/swallow).',
          '2. Vomiting everything consumed (retains no fluids whatsoever).',
          '3. Convulsions or seizures during the current illness episode.',
          '4. Severe lethargy, somnolence, or unconsciousness (difficult to awaken).',
        ],
        dangerAlert: 'Any single General Danger Sign = Immediate emergency pre-referral treatment and urgent hospital transfer!',
        keyPoint: 'Never delay emergency transport for extensive administrative tasks when a danger sign is present.',
        question: {
          id: 'q1-2',
          prompt: 'A 2-year-old child presents with fever and has vomited all fluids and food for 6 hours. What is the immediate triage classification?',
          options: [
            'Low Risk — advise caregiver to try feeding again in 12 hours',
            'Moderate Risk — schedule a routine follow-up in 3 days',
            'High Risk (General Danger Sign) — administer pre-referral treatment and arrange emergency transfer',
            'Normal finding in common colds',
          ],
          correctIndex: 2,
          explanation: 'Vomiting everything is a WHO General Danger Sign indicating severe illness and potential shock, requiring urgent hospital referral.',
        },
      },
      {
        heading: 'Respiratory Assessment & Fast Breathing Cutoffs',
        stage: 'DIAGNOSTIC TECHNIQUE',
        body: 'To accurately detect pneumonia in the community, count the child\'s breaths for one full 60-second minute while the child is calm and not crying. Inspect for chest indrawing (lower chest wall moves inward during inhalation).',
        points: [
          'Age 2 months up to 11 months: Fast breathing is 50 breaths per minute or more.',
          'Age 12 months up to 59 months: Fast breathing is 40 breaths per minute or more.',
          'Subcostal / Lower Chest Indrawing: Definite indicator of severe pneumonia requiring referral.',
          'Stridor in calm child: Indicates upper airway obstruction requiring urgent emergency referral.',
        ],
        keyPoint: 'Always count for a FULL 60 seconds with a timer. A 15-second shortcut leads to misclassification.',
        question: {
          id: 'q1-3',
          prompt: 'You count 48 breaths per minute in a calm 8-month-old infant with cough. How should this respiratory rate be classified?',
          options: [
            'Normal breathing rate for this age group (cutoff is 50+ breaths/min)',
            'Severe Bradypnea (dangerously slow)',
            'Definite fast breathing requiring pneumonia protocol',
            'Respiratory arrest',
          ],
          correctIndex: 0,
          explanation: 'For infants aged 2 to 11 months, fast breathing is defined as 50 breaths per minute or higher. 48 breaths/min is within normal limits for an 8-month-old.',
        },
      },
      {
        heading: 'Dehydration Assessment in Diarrheal Illness',
        stage: 'PHYSICAL EXAMINATION',
        body: 'Diarrhea-induced dehydration can rapidly lead to hypovolemic shock in small children. Assess general appearance, sunken eyes, skin pinch turgor, and fluid thirst.',
        points: [
          'Skin Pinch Test: Pinch skin of the abdomen halfway between umbilicus and side for 1 second, then release.',
          'Very Slow Return (>2 seconds): Indicates SEVERE DEHYDRATION.',
          'Slow Return (1-2 seconds) + Sunken eyes / Irritability: Indicates SOME DEHYDRATION.',
          'Oral Rehydration Salts (ORS) + Zinc Sulfate (20mg daily for 10-14 days) are mandatory for all pediatric diarrhea.',
        ],
        keyPoint: 'Zinc supplementation reduces diarrhea duration by 25% and prevents recurrence for 3 months.',
        question: {
          id: 'q1-4',
          prompt: 'During an abdominal skin pinch test on an 18-month-old with watery diarrhea, the skin fold takes 3 seconds to flatten. What does this indicate?',
          options: [
            'No signs of dehydration',
            'Mild dehydration managed with plain water',
            'Severe dehydration requiring urgent rehydration and clinical monitoring',
            'Normal skin elasticity for toddlers',
          ],
          correctIndex: 2,
          explanation: 'A skin pinch returning very slowly (longer than 2 seconds) is a cardinal clinical sign of Severe Dehydration according to WHO guidelines.',
        },
      },
      {
        heading: 'Emergency Pre-Referral Stabilization Protocol',
        stage: 'EMERGENCY ACTION',
        body: 'When urgent referral is mandated, pre-referral interventions stabilize the patient during transport and prevent death en route.',
        points: [
          'High fever (>38.5°C) in malaria endemic zone: Administer single rectal artesunate suppository (RAS) before transport.',
          'Suspected severe pneumonia / sepsis: Administer first dose of oral amoxicillin (or intramuscular ampicillin if certified).',
          'Prevent Hypoglycemia: Give breastmilk, sugar water, or oral glucose solution to sip on the way to hospital.',
          'Prevent Hypothermia: Wrap infant snugly using Kangaroo Mother Care (skin-to-skin) or clean warm blankets.',
        ],
        dangerAlert: 'Never send a severely ill child to hospital without an emergency referral slip and notifying the supervisor!',
        keyPoint: 'Rectal artesunate + keeping the child warm + preventing hypoglycemia saves lives during transfer.',
        question: {
          id: 'q1-5',
          prompt: 'What pre-referral treatment should be provided to an unconscious 3-year-old with suspected severe malaria before transport?',
          options: [
            'Oral chloroquine tablets with full meal',
            'Rectal Artesunate Suppository (RAS), prevent hypoglycemia, and keep warm',
            'Cold ice bath immersion',
            'No treatment until full lab results arrive at hospital',
          ],
          correctIndex: 1,
          explanation: 'Rectal artesunate is the WHO-endorsed pre-referral intervention for severe pediatric malaria when parenteral treatment is unavailable at frontline level.',
        },
      },
    ],
  },
  {
    id: 'les-2',
    title: 'Antenatal Care: Danger Signs & Obstetric Emergencies',
    category: 'Maternal Health',
    durationMinutes: 25,
    difficulty: 'Intermediate',
    progress: 100,
    recommended: true,
    recommendationReason: '8 pregnant mothers registered in your assigned community sector',
    slides: [
      {
        heading: 'WHO Antenatal Care (ANC) Model & Core Goals',
        stage: 'PROGRAMME GUIDELINE',
        body: 'The WHO 2016 ANC Model recommends a minimum of 8 antenatal contacts to reduce perinatal mortality and improve maternal birth experience.',
        points: [
          'Contact 1: Up to 12 weeks gestation (early booking & baseline screen).',
          'Contacts 2-3: 20 and 26 weeks gestation.',
          'Contacts 4-8: 30, 34, 36, 38, and 40 weeks gestation.',
          'Core Community Tasks: Blood pressure screening, nutritional counseling (Iron-Folic Acid), birth preparedness planning, and danger sign education.',
        ],
        keyPoint: 'Early registration in the first trimester allows early detection of pre-existing hypertension, anemia, and infections.',
        question: {
          id: 'q2-1',
          prompt: 'How many ANC contacts does the World Health Organization (WHO) recommend as the standard for a positive pregnancy experience?',
          options: [
            'At least 8 contacts throughout pregnancy',
            'Only 2 visits before delivery',
            'Monthly visits only after 36 weeks',
            '1 visit per trimester',
          ],
          correctIndex: 0,
          explanation: 'WHO guidelines recommend at least 8 contacts (starting before 12 weeks) to systematically detect complications and ensure safe birth preparedness.',
        },
      },
      {
        heading: 'Preeclampsia & Hypertensive Crises in Pregnancy',
        stage: 'CLINICAL IDENTIFICATION',
        body: 'Hypertensive disorders of pregnancy are leading causes of maternal death. Gestational hypertension and preeclampsia develop after 20 weeks gestation.',
        points: [
          'Threshold: Systolic BP >= 140 mmHg OR Diastolic BP >= 90 mmHg on two separate readings.',
          'Severe Hypertension: Systolic >= 160 mmHg OR Diastolic >= 110 mmHg (Hypertensive emergency!).',
          'Preeclampsia Warning Symptoms: Severe persistent frontal headache, visual blurriness/flashing lights, epigastric or right upper quadrant pain, sudden facial/hand edema.',
        ],
        dangerAlert: 'Preeclampsia with severe headache or epigastric pain can progress to life-threatening eclamptic seizures within hours!',
        keyPoint: 'Elevated blood pressure + severe headache in pregnancy is preeclampsia until proven otherwise.',
        question: {
          id: 'q2-2',
          prompt: 'A pregnant woman at 34 weeks presents with BP 155/98 mmHg, epigastric abdominal pain, and blurred vision. What is the clinical priority?',
          options: [
            'Reassure her it is normal third-trimester indigestion and advise bed rest',
            'Classify as Severe Preeclampsia and arrange immediate emergency transfer to a comprehensive EmONC hospital',
            'Tell her to return next week for a routine check',
            'Prescribe over-the-counter antacids only',
          ],
          correctIndex: 1,
          explanation: 'Elevated BP accompanied by epigastric pain and visual disturbances are cardinal symptoms of Severe Preeclampsia / impending eclampsia requiring urgent hospital escalation.',
        },
      },
      {
        heading: 'Obstetric Hemorrhage & Warning Signs',
        stage: 'EMERGENCY TRIAGE',
        body: 'Any vaginal bleeding during pregnancy is abnormal and requires urgent investigation. Postpartum hemorrhage (PPH) is the leading cause of maternal mortality worldwide.',
        points: [
          'Antepartum Hemorrhage (APH): Bleeding after 20 weeks (Placenta previa, placental abruption). DO NOT perform digital vaginal exams!',
          'Postpartum Hemorrhage (PPH): Loss of >500 mL blood after vaginal delivery (or soaking >1 pad per hour).',
          'Common PPH Causes (The 4 Ts): Tone (uterine atony - 70%), Trauma (lacerations), Tissue (retained placenta), Thrombin (coagulopathy).',
          'Immediate First Aid: Uterine fundal massage to stimulate contraction, immediate transport, keep warm.',
        ],
        keyPoint: 'Never perform digital vaginal examinations in a community setting on a pregnant woman with vaginal bleeding.',
        question: {
          id: 'q2-3',
          prompt: 'What is the most common cause of Postpartum Hemorrhage (PPH) accounting for over 70% of cases?',
          options: [
            'Uterine Atony (failure of the uterus to contract firmly after birth)',
            'Vitamin C deficiency',
            'Gestational diabetes',
            'Maternal dehydration',
          ],
          correctIndex: 0,
          explanation: 'Uterine atony (lack of uterine muscle tone after delivery) is responsible for ~70% of PPH cases and is immediately treated with vigorous fundal massage and uterotonics.',
        },
      },
      {
        heading: 'Postpartum Follow-up Schedule & Neonatal Danger Signs',
        stage: 'POSTNATAL CARE',
        body: 'The first 48 hours post-delivery carry the highest risk of maternal and neonatal mortality. Scheduled home visits ensure early intervention.',
        points: [
          'PNC Visit 1: Within 24 hours of birth (or within 24h of home discharge).',
          'PNC Visit 2: Day 3 (48-72 hours).',
          'PNC Visit 3: Between days 7 and 14.',
          'PNC Visit 4: At 6 weeks (immunizations, family planning counseling, maternal wellbeing).',
          'Newborn Danger Signs: Hypothermia (<36.5°C), yellow palms/soles (severe jaundice), poor feeding, umbilical redness with pus.',
        ],
        keyPoint: 'Check maternal bleeding, fundal firmness, blood pressure, and newborn temperature at every postnatal contact.',
        question: {
          id: 'q2-4',
          prompt: 'According to WHO guidelines, when must the first postnatal care contact occur after delivery?',
          options: [
            'Within the first 24 hours after birth',
            'At 1 month of age',
            'Only when the child develops a fever',
            'At 6 weeks for first vaccines',
          ],
          correctIndex: 0,
          explanation: 'The first 24 hours is the highest risk window for both mother (PPH, preeclampsia) and neonate (asphyxia, sepsis, hypothermia); early assessment is vital.',
        },
      },
    ],
  },
  {
    id: 'les-3',
    title: 'Community Hypertension Screening & Cardiovascular Health',
    category: 'Chronic Disease',
    durationMinutes: 18,
    difficulty: 'Beginner',
    progress: 40,
    recommended: true,
    recommendationReason: 'Updated national protocol for non-communicable disease (NCD) surveillance',
    slides: [
      {
        heading: 'Standardized Blood Pressure Measurement Technique',
        stage: 'CLINICAL TECHNIQUE',
        body: 'Accurate blood pressure (BP) measurement is essential for community cardiovascular screening. Measurement errors frequently cause false hypertension diagnoses.',
        points: [
          'Pre-test Rest: Patient must sit quietly with back supported and feet flat on the floor for at least 5 minutes before measurement.',
          'No Stimulants: No caffeine, tobacco smoking, or vigorous exercise for 30 minutes prior.',
          'Cuff Placement: Apply correct cuff size directly on bare upper arm with artery marker aligned, bladder at heart level.',
          'Protocol: Take 2 measurements spaced 1-2 minutes apart; record the average of the readings.',
        ],
        keyPoint: 'A cuff that is too small falsely elevates BP readings by up to 10-15 mmHg.',
        question: {
          id: 'q3-1',
          prompt: 'What patient preparation step is required prior to taking an accurate diagnostic blood pressure reading?',
          options: [
            'Ask the patient to jog in place to stimulate circulation',
            'Have the patient rest quietly seated for at least 5 minutes with arm supported at heart level',
            'Take the reading immediately upon their arrival while they are standing',
            'Have the patient drink a strong coffee',
          ],
          correctIndex: 1,
          explanation: 'Resting for 5 minutes in a supported seated position prevents acute stress-induced transient blood pressure elevations.',
        },
      },
      {
        heading: 'Blood Pressure Classification & Triage Thresholds',
        stage: 'DIAGNOSTIC CLASSIFICATION',
        body: 'Community health workers must classify BP readings accurately into standard clinical tiers and initiate the appropriate triage response.',
        points: [
          'Normal BP: Systolic < 120 mmHg AND Diastolic < 80 mmHg (annual routine screen).',
          'Elevated BP: Systolic 120-129 mmHg AND Diastolic < 80 mmHg (lifestyle modification).',
          'Stage 1 Hypertension: Systolic 130-139 mmHg OR Diastolic 80-89 mmHg (counsel & recheck in 2-4 weeks).',
          'Stage 2 Hypertension: Systolic >= 140 mmHg OR Diastolic >= 90 mmHg (refer for medical physician review).',
          'Hypertensive Emergency: Systolic >= 180 mmHg OR Diastolic >= 120 mmHg (Urgent emergency referral!).',
        ],
        dangerAlert: 'BP >= 180/120 mmHg with chest pain, shortness of breath, or neurological deficits = Hypertensive Crisis!',
        keyPoint: 'Two elevated readings on separate occasions are required to confirm clinical hypertension.',
        question: {
          id: 'q3-2',
          prompt: 'A 55-year-old patient has a resting blood pressure reading of 190/122 mmHg and complains of chest tightness. What is the correct triage step?',
          options: [
            'Advise dietary changes and recheck next month',
            'Hypertensive Emergency — initiate urgent referral to emergency department / hospital',
            'Normal finding for older adults',
            'Recommend drinking herbal tea and sleeping',
          ],
          correctIndex: 1,
          explanation: 'BP >= 180/120 mmHg with target organ symptoms (chest tightness) indicates a Hypertensive Emergency requiring immediate hospital stabilization to prevent stroke or myocardial infarction.',
        },
      },
      {
        heading: 'Lifestyle Interventions & Medication Adherence Support',
        stage: 'COUNSELING & COMPLIANCE',
        body: 'Long-term hypertension management requires a partnership between health workers and patients to maintain dietary changes and daily pill adherence.',
        points: [
          'Dietary Sodium Restriction: Limit salt intake to less than 5 grams (approx. 1 teaspoon) per day.',
          'Physical Activity: Recommend at least 150 minutes of moderate aerobic exercise per week (e.g. brisk walking 30 mins, 5 days/week).',
          'Smoking Cessation & Alcohol Reduction: Strongly counsel against tobacco use.',
          'Medication Coaching: Explain that hypertension is often a "silent killer" with no symptoms; patients must continue daily antihypertensive medications even when feeling completely healthy.',
        ],
        keyPoint: 'Never stop antihypertensive medications without consulting a clinical supervisor or doctor.',
        question: {
          id: 'q3-3',
          prompt: 'An asymptomatic patient with diagnosed hypertension tells you: "I stopped taking my pills because I felt completely fine." How should you counsel them?',
          options: [
            'Agree that pills are only needed when a headache occurs',
            'Explain that hypertension is a "silent" condition without symptoms, and daily medication is required to prevent stroke and heart attack',
            'Advise them to double the dose once every week instead',
            'Recommend stopping all medications permanently',
          ],
          correctIndex: 1,
          explanation: 'Hypertension typically has no daily symptoms ("silent killer"), yet sustained elevated pressures cause strokes, kidney failure, and heart disease if medications are discontinued.',
        },
      },
    ],
  },
  {
    id: 'les-4',
    title: 'Severe Acute Malnutrition (SAM) Screening via MUAC',
    category: 'Nutrition',
    durationMinutes: 20,
    difficulty: 'Intermediate',
    progress: 20,
    recommended: false,
    recommendationReason: null,
    slides: [
      {
        heading: 'Mid-Upper Arm Circumference (MUAC) Measurement Protocol',
        stage: 'MEASUREMENT TECHNIQUE',
        body: 'MUAC is the gold-standard community screening tool for children aged 6 to 59 months. It measures muscle and subcutaneous fat reserve independent of height.',
        points: [
          'Locate Left Arm: Always use the child\'s LEFT arm with clothing removed.',
          'Determine Midpoint: Bend arm at 90 degrees; find midpoint between acromion (tip of shoulder) and olecranon (tip of elbow). Mark point.',
          'Straighten Arm: Child relaxes arm freely at side.',
          'Apply Tape: Wrap color-coded MUAC tape snugly around marked midpoint without compressing soft tissue or leaving slack.',
          'Read Measurement: Record exact millimeter reading through window where arrows align.',
        ],
        keyPoint: 'Pulling the tape too tightly causes false-positive SAM diagnoses by compressing subcutaneous tissue.',
        question: {
          id: 'q4-1',
          prompt: 'When performing a standardized MUAC measurement on an under-5 child, on which arm should the measurement be performed?',
          options: [
            'Always on the left arm at the marked midpoint',
            'On either leg around the calf muscle',
            'On the right wrist',
            'Whichever arm the child prefers to extend',
          ],
          correctIndex: 0,
          explanation: 'Standardized global nutritional protocols mandate measuring the LEFT upper arm at the precise midpoint between shoulder and elbow tips.',
        },
      },
      {
        heading: 'MUAC Triage Color Codes & Diagnostic Cutoffs',
        stage: 'DIAGNOSTIC CRITERIA',
        body: 'Community health workers classify nutritional status according to standardized WHO color thresholds on the MUAC tape.',
        points: [
          'RED ZONE (< 115 mm / < 11.5 cm): Severe Acute Malnutrition (SAM) — High mortality risk. Requires immediate enrollment in OTP or SC.',
          'YELLOW ZONE (115 mm to 124 mm / 11.5 - 12.4 cm): Moderate Acute Malnutrition (MAM) — Requires supplementary feeding program (SFP) and growth monitoring.',
          'GREEN ZONE (>= 125 mm / >= 12.5 cm): Normal Nutritional Status — Continue age-appropriate infant and young child feeding (IYCF) counseling.',
        ],
        dangerAlert: 'MUAC < 115 mm = SEVERE ACUTE MALNUTRITION requiring urgent therapeutic feeding!',
        keyPoint: 'Children with red MUAC have up to a 9-fold increased risk of mortality without therapeutic feeding.',
        question: {
          id: 'q4-2',
          prompt: 'A 20-month-old child has a MUAC reading of 11.1 cm (111 mm). How is the child\'s nutritional status classified?',
          options: [
            'Normal nutritional status (Green)',
            'Moderate Acute Malnutrition (Yellow)',
            'Severe Acute Malnutrition (Red Zone / SAM) requiring urgent therapeutic care',
            'Overweight',
          ],
          correctIndex: 2,
          explanation: 'A MUAC measurement below 11.5 cm (115 mm) is the diagnostic criterion for Severe Acute Malnutrition (SAM), demanding urgent clinical and therapeutic nutritional intervention.',
        },
      },
      {
        heading: 'Bilateral Pitting Edema Examination & Kwashiorkor',
        stage: 'PHYSICAL EXAMINATION',
        body: 'Bilateral pitting edema is a hallmark of edematous severe malnutrition (Kwashiorkor). Its presence automatically classifies a child as SAM regardless of MUAC reading.',
        points: [
          'Technique: Place both thumbs on the tops (dorsum) of both feet and apply gentle, firm pressure for a full 3 seconds.',
          'Positive Edema: A visible pit or depression remains in the skin on BOTH feet after removing thumb pressure.',
          'Bilateral Requirement: Edema must be present on BOTH feet. Unilateral edema suggests localized trauma or infection.',
          'Edema Severity Grading: Grade + (feet only), Grade ++ (feet and lower legs), Grade +++ (generalized edema including face/hands).',
        ],
        dangerAlert: 'Bilateral pitting edema = SEVERE MALNUTRITION regardless of arm circumference measurement!',
        keyPoint: 'Always test both feet for 3 full seconds. Never skip the edema test even if MUAC is in the green zone.',
        question: {
          id: 'q4-3',
          prompt: 'A 3-year-old child has a green MUAC reading of 13.0 cm, but both feet retain deep pits after 3 seconds of thumb pressure. What is the diagnosis?',
          options: [
            'Healthy child because MUAC is green',
            'Severe Acute Malnutrition (Edematous Malnutrition / Kwashiorkor)',
            'Mild dehydration',
            'Normal muscular fatigue',
          ],
          correctIndex: 1,
          explanation: 'Bilateral pitting edema automatically diagnoses Severe Acute Malnutrition (SAM / Kwashiorkor) regardless of MUAC or weight-for-height measurements.',
        },
      },
      {
        heading: 'Appetite Test & Outpatient vs Inpatient Triage',
        stage: 'CLINICAL TRIAGE',
        body: 'Once SAM is diagnosed, conduct an Appetite Test with Ready-to-Use Therapeutic Food (RUTF) to determine whether the child can be treated at home or needs hospital admission.',
        points: [
          'Appetite Test Method: Offer child a packet of RUTF in a calm, quiet setting. Observe if child eagerly eats the recommended minimum amount.',
          'Pass Appetite Test + No Medical Complications: Treat at home in Outpatient Therapeutic Program (OTP) with weekly RUTF ration.',
          'Fail Appetite Test OR Presence of Danger Signs (Hypothermia, hypoglycemia, severe edema +++, intractable vomiting, severe anemia): URGENT INPATIENT REFERRAL to Stabilization Center (SC).',
        ],
        keyPoint: 'Never force-feed RUTF to a child who fails the appetite test; refer immediately to a stabilization center.',
        question: {
          id: 'q4-4',
          prompt: 'Which clinical finding in a child with Severe Acute Malnutrition mandates immediate INPATIENT hospital referral to a Stabilization Center?',
          options: [
            'Child eagerly consumes half a packet of RUTF during appetite test',
            'Child refuses RUTF (fails appetite test) and has severe lethargy and hypothermia',
            'Child is alert and smiling with caregiver',
            'Child has mild skin dry patches',
          ],
          correctIndex: 1,
          explanation: 'Failing the appetite test combined with medical complications (hypothermia, lethargy) indicates metabolic decompensation requiring inpatient stabilization with therapeutic milk (F-75).',
        },
      },
    ],
  },
  {
    id: 'les-5',
    title: 'Infectious Disease Surveillance: Malaria, Cholera & TB',
    category: 'Infectious Disease',
    durationMinutes: 22,
    difficulty: 'Intermediate',
    progress: 10,
    recommended: false,
    recommendationReason: null,
    slides: [
      {
        heading: 'Malaria Rapid Diagnostic Testing (mRDT) & Treatment',
        stage: 'DIAGNOSTIC TESTING',
        body: 'Every patient presenting with acute fever in a malaria-endemic area must undergo parasitological confirmation via mRDT before antimalarial administration.',
        points: [
          'Aseptic Technique: Clean finger with alcohol swab; allow to air dry completely before puncture to avoid lysing RBCs.',
          'Safety Lancet: Use single-use auto-retracting safety lancet. Dispose immediately into sharps box.',
          'Buffer & Timing: Add exact blood volume using capillary tube; add buffer drops per kit instructions; read result at exactly 15-20 minutes.',
          'Confirmed Uncomplicated Malaria: Prescribe full 3-day course of Artemisinin-based Combination Therapy (ACT), e.g. Artemether-Lumefantrine (AL).',
        ],
        keyPoint: 'Do not treat fever with antimalarials if mRDT is negative; investigate other causes of pediatric/adult fever.',
        question: {
          id: 'q5-1',
          prompt: 'What is the standard first-line treatment for confirmed uncomplicated Plasmodium falciparum malaria?',
          options: [
            'Oral paracetamol alone for 5 days',
            'Artemisinin-based Combination Therapy (ACT) taken as a full 3-day course',
            'Single dose of aspirin',
            'Intravenous antibiotics without antimalarials',
          ],
          correctIndex: 1,
          explanation: 'WHO guidelines mandate Artemisinin-based Combination Therapy (ACT) as the first-line treatment for uncomplicated falciparum malaria to ensure high cure rates and prevent resistance.',
        },
      },
      {
        heading: 'Acute Watery Diarrhea & Rapid Cholera Outbreak Detection',
        stage: 'EPIDEMIC SURVEILLANCE',
        body: 'Cholera is an acute diarrheal infection caused by Vibrio cholerae. It can cause severe dehydration and death within hours if untreated.',
        points: [
          'Clinical Presentation: Sudden onset of profuse, painless "rice-water" watery diarrhea with vomiting.',
          'Rapid Dehydration: Sunken eyes, loss of skin elasticity, rapid weak pulse, dry mouth, muscle cramps.',
          'Immediate First Aid: Initiate rapid Oral Rehydration Solution (ORS) immediately while preparing transport.',
          'Notification: Report any cluster of acute watery diarrhea cases (>= 3 cases in 48 hours in same village) to disease surveillance officers within 2 hours.',
        ],
        dangerAlert: 'Cholera can kill an adult within 4 to 12 hours from hypovolemic shock if fluids are not replaced!',
        keyPoint: 'ORS reduces cholera mortality from over 50% down to less than 1%.',
        question: {
          id: 'q5-2',
          prompt: 'What is the immediate and most critical lifesaving treatment for a patient presenting with profuse rice-water cholera diarrhea?',
          options: [
            'Withhold all fluids to stop diarrhea',
            'Immediate and continuous rehydration with Oral Rehydration Solution (ORS) and IV fluids for severe cases',
            'Administer high-dose sleeping pills',
            'Wait 24 hours for stool culture results before giving fluids',
          ],
          correctIndex: 1,
          explanation: 'Rapid, aggressive fluid and electrolyte replacement with ORS (and IV Ringer\'s Lactate for shock) is the cornerstone of cholera management and prevents hypovolemic mortality.',
        },
      },
      {
        heading: 'Presumptive Tuberculosis (TB) Case Finding',
        stage: 'CHRONIC INFECTION SCREENING',
        body: 'Community health workers are the frontline defense in finding missed TB cases and breaking transmission chains in households.',
        points: [
          'Cardinal Screening Sign: Cough lasting for 2 weeks or longer (with or without sputum production).',
          'Constitutional Symptoms: Unexplained weight loss, drenching night sweats, persistent evening low-grade fever, hemoptysis (coughing up blood).',
          'High-Risk Contacts: Household contacts of confirmed pulmonary TB patients, people living with HIV, and malnourished children.',
          'Action: Collect 2 sputum samples or refer to microscopy/GeneXpert testing center.',
        ],
        keyPoint: 'An untreated person with active pulmonary TB can infect 10 to 15 people each year.',
        question: {
          id: 'q5-3',
          prompt: 'What duration of persistent unexplained cough triggers presumptive Tuberculosis (TB) diagnostic investigation?',
          options: [
            'Cough lasting 2 weeks or longer',
            'Cough lasting only 1 day',
            'Cough that only occurs after exercise',
            'Occasional throat clearing',
          ],
          correctIndex: 0,
          explanation: 'A persistent cough lasting 2 weeks or longer is the standard WHO clinical screening threshold for presumptive TB evaluation (sputum GeneXpert / chest X-ray).',
        },
      },
    ],
  },
  {
    id: 'les-6',
    title: 'Infection Prevention, Field Safety & Sharps Handling',
    category: 'Clinical Practice',
    durationMinutes: 15,
    difficulty: 'Beginner',
    progress: 50,
    recommended: false,
    recommendationReason: null,
    slides: [
      {
        heading: 'The 5 Moments of Hand Hygiene & Effective Technique',
        stage: 'INFECTION PREVENTION',
        body: 'Hand hygiene is the single most effective measure to prevent healthcare-associated pathogen transmission.',
        points: [
          '1. Before touching a patient.',
          '2. Before clean/aseptic procedures (e.g. mRDT, dressing wounds).',
          '3. After body fluid exposure risk.',
          '4. After touching a patient.',
          '5. After touching patient surroundings.',
          'Technique: Rub all hand surfaces with alcohol rub for 20-30 seconds, or wash with soap and running clean water for 40-60 seconds.',
        ],
        keyPoint: 'Gloves are NOT a substitute for hand hygiene. Always clean hands before donning and after removing gloves.',
        question: {
          id: 'q6-1',
          prompt: 'When should a community health worker perform hand hygiene during patient encounters?',
          options: [
            'Only at the very end of the work day',
            'Before touching a patient, before clean procedures, after fluid risk, and after touching patient/surroundings',
            'Only if visible dirt is seen on hands',
            'Once a week',
          ],
          correctIndex: 1,
          explanation: 'The WHO "5 Moments for Hand Hygiene" outline the essential clinical points to stop transmission of pathogenic microorganisms.',
        },
      },
      {
        heading: 'Sharps Safety & Biohazard Waste Protocol',
        stage: 'OCCUPATIONAL SAFETY',
        body: 'Accidental needlesticks and lancet cuts expose health workers to bloodborne pathogens including HIV, Hepatitis B, and Hepatitis C.',
        points: [
          'Point-of-Use Disposal: Discard lancets and needles immediately into puncture-proof safety boxes at the point of care.',
          'NEVER Recap Needles: Two-handed recapping is the leading cause of healthcare worker needlestick injuries.',
          'Safety Box Limit: Seal and replace sharps safety boxes when 3/4 full. Never overfill or force sharps into the box.',
          'Post-Exposure Prophylaxis (PEP): In case of needlestick, wash area immediately with soap and water; report within 2 hours for PEP evaluation.',
        ],
        dangerAlert: 'Never recap, bend, or break used needles or lancets!',
        keyPoint: 'Seal sharps boxes at 3/4 full. HIV PEP is most effective when initiated within 2 hours of exposure (maximum 72 hours).',
        question: {
          id: 'q6-2',
          prompt: 'At what fill level must a cardboard sharps safety box be sealed and replaced?',
          options: [
            'When it is completely overflowing and compressed by hand',
            'When it is 3/4 full to prevent needlesticks from protruding sharps',
            'Only when it starts leaking liquid',
            'Sharps boxes never need replacement',
          ],
          correctIndex: 1,
          explanation: 'Safety boxes must be sealed when 3/4 full to ensure safe closure without danger of puncture injuries from overfilling.',
        },
      },
    ],
  },
  {
    id: 'les-7',
    title: 'Multilingual & Culturally Competent Patient Communication',
    category: 'Communication',
    durationMinutes: 15,
    difficulty: 'Beginner',
    progress: 0,
    recommended: false,
    recommendationReason: null,
    slides: [
      {
        heading: 'Empathetic Clinical Communication & Active Listening',
        stage: 'COMMUNICATION SKILLS',
        body: 'Frontline health workers must build trust and mutual respect with patients from diverse linguistic, ethnic, and socio-economic backgrounds.',
        points: [
          'Respectful Greeting: Greet the patient and family using local cultural norms and titles of respect.',
          'Active Listening: Give undivided attention, maintain culturally appropriate eye contact, and avoid interrupting.',
          'Language Concordance: Communicate in the patient\'s primary preferred language (or utilize Care Compass\'s multilingual translation tools).',
          'Open-Ended Questions: Use "Tell me about..." or "What concerns you most?" instead of yes/no interrogation.',
        ],
        keyPoint: 'Patients who feel respected and heard are 3x more likely to follow clinical referral recommendations.',
        question: {
          id: 'q7-1',
          prompt: 'What is the most effective approach when starting a home clinical assessment with an anxious caregiver?',
          options: [
            'Immediately demand vital signs without introducing yourself',
            'Greet respectfully using cultural norms, introduce yourself, and listen actively to their primary concerns',
            'Speak loudly in a foreign language they do not understand',
            'Scold them for not visiting the hospital sooner',
          ],
          correctIndex: 1,
          explanation: 'Establishing rapport through culturally respectful greetings and active listening alleviates anxiety and fosters honest clinical disclosure.',
        },
      },
      {
        heading: 'The Teach-Back Method for Health Education Verification',
        stage: 'PATIENT EDUCATION',
        body: 'Simply asking "Do you understand?" is ineffective because most patients nod politely out of embarrassment. The Teach-Back method verifies true comprehension.',
        points: [
          'Definition: Asking the patient or caregiver to explain back in their own words what they need to do.',
          'Example Prompt: "To make sure I explained the medication clearly, can you tell me how many times a day you will give this syrup to your baby?"',
          'No Blame: Frame the check as a test of your own explanation clarity, not the patient\'s intelligence.',
          'Clarify & Re-check: If misunderstandings exist, gently re-explain the concept and confirm comprehension once more.',
        ],
        keyPoint: 'Teach-back catches medication dosage errors before they happen in the home.',
        question: {
          id: 'q7-2',
          prompt: 'How should a health worker verify that a mother understands how to prepare Oral Rehydration Solution (ORS)?',
          options: [
            'Ask: "You understand everything, right?" and leave immediately',
            'Ask: "To make sure I explained clearly, could you show me how much clean water you will mix with one ORS packet?" (Teach-Back method)',
            'Assume she knows because she has older children',
            'Hand her a written pamphlet in a language she cannot read',
          ],
          correctIndex: 1,
          explanation: 'The Teach-Back technique asks patients to demonstrate or explain instructions in their own words, verifying actual comprehension without causing embarrassment.',
        },
      },
    ],
  },
  {
    id: 'les-8',
    title: 'Emergency First Aid & Field Trauma Stabilization',
    category: 'Emergency Care',
    durationMinutes: 20,
    difficulty: 'Intermediate',
    progress: 0,
    recommended: false,
    recommendationReason: null,
    slides: [
      {
        heading: 'The Primary Survey: ABCDE Emergency Algorithm',
        stage: 'EMERGENCY ALGORITHM',
        body: 'When arriving at an emergency trauma or collapse scene, perform the rapid ABCDE Primary Survey to detect and treat life-threatening conditions in order of priority.',
        points: [
          'A — Airway with cervical spine protection: Check for airway obstruction (stridor, foreign body, blood).',
          'B — Breathing: Assess chest rise, respiratory rate, and bilateral breath sounds.',
          'C — Circulation with Hemorrhage Control: Control catastrophic bleeding with direct pressure; check pulse rate and capillary refill.',
          'D — Disability: Rapid neurological assessment using AVPU scale (Alert, Voice, Pain, Unresponsive).',
          'E — Exposure & Environmental Control: Inspect for hidden injuries while preventing hypothermia.',
        ],
        dangerAlert: 'Catastrophic external bleeding takes immediate precedence — apply direct firm pressure instantly!',
        keyPoint: 'Airway and severe bleeding control must be managed before dealing with limb fractures.',
        question: {
          id: 'q8-1',
          prompt: 'In a trauma patient with severe arterial spurting blood from a leg wound, what is the immediate first-aid priority?',
          options: [
            'Splint the arm first',
            'Apply immediate, continuous direct firm pressure over the bleeding site with a clean dressing',
            'Give the patient a glass of cold water to drink',
            'Wait for an ambulance before touching the wound',
          ],
          correctIndex: 1,
          explanation: 'Severe external arterial hemorrhage can cause fatal hypovolemic cardiac arrest in minutes; immediate direct pressure (and tourniquet if needed) is the highest priority.',
        },
      },
      {
        heading: 'Thermal Burn First Aid & Recovery Position',
        stage: 'FIRST AID MANAGEMENT',
        body: 'Proper initial first aid for burns and unconscious breathing patients prevents disability and fatal airway obstruction.',
        points: [
          'Burn First Aid: Cool the burn immediately under cool running tap water for a full 20 minutes.',
          'DO NOT: Never apply ice, butter, oils, toothpaste, or mud to burns (causes severe infection and tissue necrosis).',
          'Cover: Cover cooled burn with clean, non-adherent sterile dressing or clean cloth.',
          'Recovery Position: For unconscious patients who are breathing normally, place them in the lateral Recovery Position to keep the tongue from blocking the airway and allow vomit to drain safely.',
        ],
        keyPoint: 'Cool running water for 20 minutes within 3 hours of burn injury dramatically reduces graft requirement and scarring.',
        question: {
          id: 'q8-2',
          prompt: 'What is the correct first-aid protocol for a fresh thermal burn on an arm?',
          options: [
            'Apply butter or cooking oil immediately over the blistered area',
            'Cool with clean running tap water for 20 minutes and cover loosely with a clean dressing',
            'Pop all blisters with a sewing needle',
            'Pack the burn in heavy freezing ice cubes',
          ],
          correctIndex: 1,
          explanation: 'Cool running water for 20 minutes dissipates heat, halts thermal tissue destruction, and reduces burn depth. Oils and ice worsen tissue damage and cause infections.',
        },
      },
    ],
  },
];

export const TrainingPage: React.FC = () => {
  const [lessons, setLessons] = useState<TrainingLesson[]>(comprehensiveLessons);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [activeLesson, setActiveLesson] = useState<TrainingLesson | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [toast, setToast] = useState('');

  // Interactive Real-Time Question / Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<Record<string, boolean>>({});
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  const fetchLessons = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/training/lessons`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge API lessons with comprehensive slides
          const merged = comprehensiveLessons.map(compLesson => {
            const apiMatch = data.find(d => d.id === compLesson.id || d.title === compLesson.title);
            if (apiMatch) {
              return {
                ...compLesson,
                progress: apiMatch.progress ?? compLesson.progress,
              };
            }
            return compLesson;
          });
          setLessons(merged);
        } else {
          setLessons(comprehensiveLessons);
        }
      })
      .catch(() => {
        setLessons(comprehensiveLessons);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const openLesson = (lesson: TrainingLesson) => {
    setActiveLesson(lesson);
    setCurrentSlideIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizScore({});
    setShowCompletionModal(false);
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
    setIsAnswerSubmitted(true);

    const currentSlide = activeLesson?.slides[currentSlideIndex];
    if (currentSlide?.question) {
      const isCorrect = index === currentSlide.question.correctIndex;
      setQuizScore(prev => ({
        ...prev,
        [currentSlide.question!.id]: isCorrect,
      }));
    }
  };

  const handleNextSlide = async () => {
    if (!activeLesson) return;
    const slides = activeLesson.slides || [];
    const totalSlides = slides.length || 1;
    const nextIndex = currentSlideIndex + 1;

    if (nextIndex < totalSlides) {
      setCurrentSlideIndex(nextIndex);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      const calculatedProgress = Math.round(((nextIndex + 1) / totalSlides) * 100);
      if (calculatedProgress > (activeLesson.progress || 0)) {
        saveProgress(activeLesson.id, calculatedProgress);
      }
    } else {
      await saveProgress(activeLesson.id, 100);
      setShowCompletionModal(true);
      setToast(`Module "${activeLesson.title}" Completed! 🎉`);
      setTimeout(() => setToast(''), 5000);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    }
  };

  const saveProgress = async (lessonId: string, progressValue: number) => {
    setSavingProgress(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${API_BASE}/training/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ progress: progressValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, progress: updated.progress } : l)));
        if (activeLesson && activeLesson.id === lessonId) {
          setActiveLesson(prev => (prev ? { ...prev, progress: updated.progress } : null));
        }
      }
    } catch {
      setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, progress: progressValue } : l)));
    }
    setSavingProgress(false);
  };

  const categories = ['ALL', ...Array.from(new Set(lessons.map(l => l.category)))];
  const filteredLessons = filterCategory === 'ALL'
    ? lessons
    : lessons.filter(l => l.category === filterCategory);

  const completedCount = lessons.filter(l => l.progress === 100).length;
  const inProgressCount = lessons.filter(l => l.progress > 0 && l.progress < 100).length;
  const avgProgress = lessons.length > 0
    ? Math.round(lessons.reduce((acc, l) => acc + (l.progress || 0), 0) / lessons.length)
    : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
            Clinical Training & Learning Pathways
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            Continuous medical education, accredited triage protocols, and real-time clinical knowledge checks
          </p>
        </div>
      </div>

      {toast && (
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          borderRadius: 'var(--radius)',
          border: '1px solid #86efac',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {toast}
        </div>
      )}

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL MODULES', value: lessons.length.toString(), sub: 'In clinical curriculum' },
          { label: 'IN PROGRESS', value: inProgressCount.toString(), sub: 'Active learning modules' },
          { label: 'COMPLETED', value: completedCount.toString(), sub: 'Accredited certificates' },
          { label: 'OVERALL PROGRESS', value: `${avgProgress}%`, sub: 'Curriculum mastery' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)' }}>{kpi.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: filterCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
              cursor: 'pointer',
              backgroundColor: filterCategory === cat ? 'var(--primary)' : 'var(--card)',
              color: filterCategory === cat ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommended Section */}
      {filteredLessons.some(l => l.recommended) && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⭐ Recommended for Your Caseload
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredLessons.filter(l => l.recommended).map(l => (
              <Card key={l.id} style={{ borderLeft: '4px solid var(--primary)', position: 'relative' }}>
                <CardContent style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <Badge variant="info">{l.category}</Badge>
                    <Badge variant="default">{l.difficulty}</Badge>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--foreground)' }}>
                    {l.title}
                  </h3>
                  {l.recommendationReason && (
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#0369a1',
                      backgroundColor: '#e0f2fe',
                      padding: '0.4rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.875rem',
                      fontWeight: 500,
                    }}>
                      💡 {l.recommendationReason}
                    </p>
                  )}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                      <span>Progress</span>
                      <strong style={{ color: l.progress === 100 ? '#16a34a' : 'var(--foreground)' }}>{l.progress || 0}%</strong>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--muted)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${l.progress || 0}%`,
                        height: '100%',
                        backgroundColor: l.progress === 100 ? '#16a34a' : 'var(--primary)',
                        borderRadius: '999px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      ⏱ {l.durationMinutes} mins · 📑 {l.slides.length} slides with questions
                    </span>
                    <Button
                      size="sm"
                      variant={l.progress === 100 ? 'outline' : 'primary'}
                      onClick={() => openLesson(l)}
                    >
                      {l.progress === 100 ? 'Review module' : l.progress > 0 ? 'Continue' : 'Start module →'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Available Modules */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
        All Learning Modules ({filteredLessons.length})
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {filteredLessons.map(l => (
          <Card key={l.id}>
            <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge variant="info">{l.category}</Badge>
                  <Badge variant="default">{l.difficulty}</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>⏱ {l.durationMinutes} min</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>📑 {l.slides.length} slides & quizzes</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>{l.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  <span style={{ fontSize: '0.85rem', color: l.progress === 100 ? '#16a34a' : 'var(--foreground)', fontWeight: 700 }}>
                    {l.progress || 0}%
                  </span>
                  <div style={{ width: '80px', height: '5px', backgroundColor: 'var(--muted)', borderRadius: '999px', overflow: 'hidden', marginTop: '3px' }}>
                    <div style={{
                      width: `${l.progress || 0}%`,
                      height: '100%',
                      backgroundColor: l.progress === 100 ? '#16a34a' : 'var(--primary)',
                    }} />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={l.progress === 100 ? 'outline' : 'primary'}
                  onClick={() => openLesson(l)}
                >
                  {l.progress === 100 ? 'Review' : l.progress > 0 ? 'Continue' : 'Start'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========================================================= */}
      {/* Interactive Lesson Slide Viewer Modal                     */}
      {/* ========================================================= */}
      {activeLesson && (() => {
        const slides = activeLesson.slides || [];
        const currentSlide: TrainingSlide = slides[currentSlideIndex] || {
          heading: `Slide ${currentSlideIndex + 1}`,
          body: '',
        };
        const slideTitle = currentSlide.heading || `Slide ${currentSlideIndex + 1}`;
        const question = currentSlide.question;
        const totalQuestions = slides.filter(s => s.question).length;
        const correctQuestions = Object.values(quizScore).filter(Boolean).length;

        return (
          <Modal
            isOpen={!!activeLesson}
            onClose={() => setActiveLesson(null)}
            title={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Badge variant="info">{activeLesson.category}</Badge>
                    <Badge variant="default">{activeLesson.difficulty}</Badge>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                      Slide {currentSlideIndex + 1} of {slides.length}
                    </span>
                  </div>
                  {totalQuestions > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '0.2rem 0.5rem', borderRadius: '9999px', border: '1px solid #bbf7d0' }}>
                      🎯 Knowledge Score: {correctQuestions}/{totalQuestions}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>{activeLesson.title}</h2>
              </div>
            }
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                >
                  ← Previous slide
                </Button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    onClick={() => saveProgress(activeLesson.id, 100)}
                    disabled={savingProgress || activeLesson.progress === 100}
                  >
                    {activeLesson.progress === 100 ? 'Completed ✓' : 'Mark Complete'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNextSlide}
                    disabled={savingProgress}
                  >
                    {currentSlideIndex + 1 < slides.length ? 'Next slide →' : 'Complete Module 🎉'}
                  </Button>
                </div>
              </div>
            }
          >
            {/* Completion Screen view */}
            {showCompletionModal ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🏆</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginBottom: '0.5rem' }}>
                  Congratulations! Module Certified
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  You have successfully completed <strong>{activeLesson.title}</strong> and mastered the clinical protocol checkpoints.
                </p>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: 'var(--radius)',
                  border: '1px solid #bbf7d0',
                  marginBottom: '1.5rem',
                  display: 'inline-block',
                }}>
                  <p style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                    Knowledge Check Result
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>
                    {correctQuestions} / {totalQuestions} Correct ({totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 100}%)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <Button variant="outline" onClick={() => { setShowCompletionModal(false); setCurrentSlideIndex(0); }}>
                    ↺ Review Slides
                  </Button>
                  <Button variant="primary" onClick={() => setActiveLesson(null)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* Stage Pill */}
                {currentSlide.stage && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      backgroundColor: 'var(--muted)',
                      color: 'var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      {currentSlide.stage}
                    </span>
                  </div>
                )}

                {/* Main Slide Content Box */}
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--radius)',
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                  marginBottom: '1.25rem',
                }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {slideTitle}
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--foreground)', lineHeight: 1.6, marginBottom: currentSlide.points ? '1rem' : 0 }}>
                    {currentSlide.body}
                  </p>

                  {/* Bullet points */}
                  {currentSlide.points && (
                    <ul style={{
                      paddingLeft: '1.25rem',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)',
                      lineHeight: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}>
                      {currentSlide.points.map((pt, idx) => (
                        <li key={idx}><strong style={{ color: 'var(--foreground)' }}>{pt.split(':')[0]}:</strong> {pt.split(':').slice(1).join(':')}</li>
                      ))}
                    </ul>
                  )}

                  {/* Danger Alert Box */}
                  {currentSlide.dangerAlert && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      borderLeft: '4px solid #ef4444',
                      padding: '0.75rem 1rem',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      fontSize: '0.85rem',
                      color: '#991b1b',
                      marginBottom: '0.75rem',
                      fontWeight: 600,
                    }}>
                      🚨 {currentSlide.dangerAlert}
                    </div>
                  )}

                  {/* Key Takeaway Box */}
                  {currentSlide.keyPoint && (
                    <div style={{
                      backgroundColor: '#eff6ff',
                      borderLeft: '4px solid #3b82f6',
                      padding: '0.75rem 1rem',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      fontSize: '0.85rem',
                      color: '#1e40af',
                    }}>
                      💡 <strong>Key Clinical Takeaway:</strong> {currentSlide.keyPoint}
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* REAL-TIME KNOWLEDGE CHECK / QUIZ QUESTION COMPONENT       */}
                {/* ========================================================= */}
                {question && (
                  <div style={{
                    backgroundColor: '#fafaf9',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    border: '1px solid #e7e5e4',
                    marginBottom: '1.25rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1rem' }}>❓</span>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Real-Time Knowledge Check
                      </h4>
                    </div>

                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem', lineHeight: 1.4 }}>
                      {question.prompt}
                    </p>

                    {/* Option Selection Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {question.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswer === oIdx;
                        const isCorrect = oIdx === question.correctIndex;
                        let optionBg = 'white';
                        let optionBorder = '1px solid var(--border)';
                        let optionColor = 'var(--foreground)';

                        if (isAnswerSubmitted) {
                          if (isCorrect) {
                            optionBg = '#f0fdf4';
                            optionBorder = '2px solid #22c55e';
                            optionColor = '#15803d';
                          } else if (isSelected && !isCorrect) {
                            optionBg = '#fef2f2';
                            optionBorder = '2px solid #ef4444';
                            optionColor = '#991b1b';
                          }
                        } else if (isSelected) {
                          optionBg = '#eff6ff';
                          optionBorder = '2px solid var(--primary)';
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectOption(oIdx)}
                            disabled={isAnswerSubmitted}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'left',
                              backgroundColor: optionBg,
                              border: optionBorder,
                              color: optionColor,
                              cursor: isAnswerSubmitted ? 'default' : 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.85rem',
                              fontWeight: isSelected || (isAnswerSubmitted && isCorrect) ? 600 : 400,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <span>{opt}</span>
                            {isAnswerSubmitted && isCorrect && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Correct</span>}
                            {isAnswerSubmitted && isSelected && !isCorrect && <span style={{ color: '#dc2626', fontWeight: 700 }}>✗ Incorrect</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Rationale & Explanation Feedback */}
                    {isAnswerSubmitted && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: selectedAnswer === question.correctIndex ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${selectedAnswer === question.correctIndex ? '#bbf7d0' : '#fde68a'}`,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        color: selectedAnswer === question.correctIndex ? '#14532d' : '#92400e',
                        lineHeight: 1.4,
                      }}>
                        <strong>{selectedAnswer === question.correctIndex ? '✓ Clinical Rationale:' : '💡 Protocol Guidance:'}</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress bar in modal */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                    <span>Module Slide Progress</span>
                    <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--muted)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round(((currentSlideIndex + 1) / slides.length) * 100)}%`,
                      height: '100%',
                      backgroundColor: 'var(--primary)',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
};

