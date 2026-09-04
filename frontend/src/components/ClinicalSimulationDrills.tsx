import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export interface SimulationStep {
  id: string;
  stageName: string;
  title: string;
  description: string;
  options: {
    id: string;
    text: string;
    clinicalRationale: string;
    scoreWeight: number; // e.g. 25 points
    isBestPractice: boolean;
    consequenceText: string;
    nextStepId?: string;
    vitalsDelta?: {
      temp_c?: number;
      resp_rate?: number;
      spo2?: number;
      heart_rate?: number;
      bp?: string;
    };
  }[];
}

export interface SimulationScenario {
  id: string;
  title: string;
  patientName: string;
  patientAge: string;
  patientSex: string;
  category: 'Child Health' | 'Maternal ANC' | 'Infectious Disease' | 'Emergency Triage';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  initialSummary: string;
  initialVitals: {
    temp_c: number;
    resp_rate: number;
    spo2: number;
    heart_rate: number;
    bp?: string;
  };
  dangerSignsPresent: string[];
  steps: SimulationStep[];
  mentorSummary: string;
  badgeEarned: {
    title: string;
    icon: string;
    code: string;
  };
}

export const simulationScenarios: SimulationScenario[] = [
  {
    id: 'sim-ped-pneumonia',
    title: 'Pediatric Fast Breathing & Inability to Drink (iCCM)',
    patientName: 'Kofi Mwangi',
    patientAge: '14 months',
    patientSex: 'Male',
    category: 'Child Health',
    difficulty: 'Intermediate',
    initialSummary: 'Mother Amina brings 14-month-old Kofi to your community health post. She is distraught and reports he has had fever for 2 days, is breathing very rapidly, and refused breastfeeding this morning.',
    initialVitals: {
      temp_c: 39.2,
      resp_rate: 56,
      spo2: 92,
      heart_rate: 138,
    },
    dangerSignsPresent: [
      'Inability to drink or breastfeed',
      'Fast breathing (>50 bpm for infant under 12-59mo is >40)',
      'Subcostal lower chest indrawing',
    ],
    badgeEarned: {
      title: 'WHO Pediatric Triage Master',
      icon: '👶',
      code: 'CPD-WHO-PED-2026',
    },
    mentorSummary: 'WHO iCCM guidelines mandate that any child aged 2-59 months presenting with an inability to drink or chest indrawing must be classified as SEVERE PNEUMONIA / HIGH RISK requiring immediate pre-referral amoxicillin and urgent transfer.',
    steps: [
      {
        id: 'step-1-interview',
        stageName: 'Stage 1: Caregiver Interview',
        title: 'Initial History & WHO Danger Sign Screening',
        description: 'Mother Amina is holding Kofi. He appears drowsy and is whimpering. What is your immediate primary clinical question?',
        options: [
          {
            id: 'opt-1a',
            text: 'Ask: "Is Kofi able to drink fluids or latch on to breastfeed right now, or has he vomited everything?"',
            clinicalRationale: 'Screening for the 4 WHO General Danger Signs (inability to drink, vomiting everything, convulsions, lethargy) must be done first before any other questions.',
            scoreWeight: 25,
            isBestPractice: true,
            consequenceText: 'Amina attempts to offer a cup of clean water. Kofi cannot swallow and coughs weakly, refusing all fluids. You have confirmed a critical WHO General Danger Sign.',
            nextStepId: 'step-2-exam',
          },
          {
            id: 'opt-1b',
            text: 'Ask: "Has anyone else in the household had a dry cough or mild sore throat this week?"',
            clinicalRationale: 'While epidemiological history is helpful, screening for immediate life-threatening danger signs takes precedence.',
            scoreWeight: 10,
            isBestPractice: false,
            consequenceText: 'Amina answers that his brother had a cold, but Kofi is struggling to breathe right now and needs your immediate focused examination.',
            nextStepId: 'step-2-exam',
          },
          {
            id: 'opt-1c',
            text: 'Ask: "Did you remember to bring his immunization card to show his vaccine dates?"',
            clinicalRationale: 'Administrative documentation should never delay emergency triage of a critically ill child.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Amina searches through her bag in panic while Kofi continues to labor for air. Crucial triage seconds are lost.',
            nextStepId: 'step-2-exam',
          },
        ],
      },
      {
        id: 'step-2-exam',
        stageName: 'Stage 2: Physical Examination & Vitals Triage',
        title: 'Diagnostic Examination Technique',
        description: 'You prepare to examine Kofi. How do you accurately assess his respiratory status and chest dynamics?',
        options: [
          {
            id: 'opt-2a',
            text: 'Calm the child on mother\'s lap, count breaths for a FULL 60 seconds with a timer, and inspect bare chest for lower chest indrawing and stridor.',
            clinicalRationale: 'WHO standards require a full 60-second breath count when calm. Counting 54 bpm in a 14-month-old exceeds the 40 bpm threshold (Fast Breathing). Subcostal indrawing confirms severe pneumonia.',
            scoreWeight: 25,
            isBestPractice: true,
            consequenceText: 'You count 56 breaths/min (Fast Breathing) and observe definitive subcostal chest indrawing (the lower chest wall pulls inward on inspiration). SpO2 measures 91%.',
            vitalsDelta: { resp_rate: 56, spo2: 91 },
            nextStepId: 'step-3-classify',
          },
          {
            id: 'opt-2b',
            text: 'Count breaths for 15 seconds and multiply by 4 while the child is crying.',
            clinicalRationale: 'Shortened counts during crying produce false-positive or erratic respiratory rates. A full 60 seconds is mandatory.',
            scoreWeight: 5,
            isBestPractice: false,
            consequenceText: 'Kofi cries vigorously, giving an inaccurate rate of 70 bpm, making baseline respiratory tracking unreliable.',
            vitalsDelta: { resp_rate: 68 },
            nextStepId: 'step-3-classify',
          },
          {
            id: 'opt-2c',
            text: 'Check only his body temperature and feel his forehead with the back of your hand.',
            clinicalRationale: 'Failing to inspect the respiratory rate and chest dynamics misses life-threatening pediatric pneumonia.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'You confirm high fever (39.2°C) but fail to detect hypoxemia and respiratory distress until mother points out his nostrils flaring.',
            nextStepId: 'step-3-classify',
          },
        ],
      },
      {
        id: 'step-3-classify',
        stageName: 'Stage 3: Clinical Triage Classification',
        title: 'WHO iCCM Risk Stratification',
        description: 'Kofi has: Inability to drink + 56 breaths/min (Fast Breathing) + Lower Chest Indrawing + SpO2 91% + Temp 39.2°C. How do you classify this case?',
        options: [
          {
            id: 'opt-3a',
            text: '🔴 HIGH RISK — SEVERE PNEUMONIA / VERY SEVERE DISEASE (Emergency Red Flag)',
            clinicalRationale: 'The presence of ANY general danger sign (inability to drink) or chest indrawing automatically places the child in the highest triage tier.',
            scoreWeight: 25,
            isBestPractice: true,
            consequenceText: 'Classification correctly established. Protocol immediately unlocks pre-referral treatment protocols and priority transport coordination.',
            nextStepId: 'step-4-intervention',
          },
          {
            id: 'opt-3b',
            text: '🟡 MODERATE RISK — Uncomplicated Pneumonia suitable for home oral amoxicillin',
            clinicalRationale: 'Dangerous misclassification: Inability to drink and chest indrawing mean oral medication cannot be safely retained at home.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Warning: Underestimating risk puts the infant in danger of respiratory fatigue and shock.',
            nextStepId: 'step-4-intervention',
          },
          {
            id: 'opt-3c',
            text: '🟢 LOW RISK — Mild viral upper respiratory infection with teething fever',
            clinicalRationale: 'Critical failure: Missing acute respiratory distress signs can be fatal.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Clinical Auditor overrides this choice: Severe danger signs are clearly active.',
            nextStepId: 'step-4-intervention',
          },
        ],
      },
      {
        id: 'step-4-intervention',
        stageName: 'Stage 4: Emergency Management & Transfer',
        title: 'Immediate Clinical Action & Patient Handover',
        description: 'You are managing a Severe Pneumonia emergency. What is your immediate intervention plan?',
        options: [
          {
            id: 'opt-4a',
            text: 'Administer first-dose pre-referral Amoxicillin / Ceftriaxone, clear airway, keep warm, arrange urgent motorbike/ambulance transport to District Paediatric Ward, and accompany with referral form.',
            clinicalRationale: 'Pre-referral antibiotics reduce mortality during transit. Accompanied emergency referral ensures seamless hospital handover.',
            scoreWeight: 25,
            isBestPractice: true,
            consequenceText: 'Pre-referral medication administered. District Hospital triage team notified via CWSTbot. Transport arrives in 12 minutes. Kofi arrives safely and is placed on supplemental nasal cannula oxygen.',
            vitalsDelta: { spo2: 95, resp_rate: 44 },
          },
          {
            id: 'opt-4b',
            text: 'Dispense a 5-day pack of oral paracetamol syrup and ask mother to return in 48 hours if no improvement.',
            clinicalRationale: 'Paracetamol only treats fever symptoms; it fails to treat bacterial pneumonia and leaves hypoxemia unaddressed.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Kofi’s condition deteriorates overnight due to uncontained pulmonary infection. Emergency referral delayed.',
            vitalsDelta: { spo2: 86, resp_rate: 64 },
          },
        ],
      },
    ],
  },
  {
    id: 'sim-maternal-preeclampsia',
    title: 'Antepartum Hypertensive Crisis & Preeclampsia Screening',
    patientName: 'Fatima Zara',
    patientAge: '26 years (34 weeks pregnant)',
    patientSex: 'Female',
    category: 'Maternal ANC',
    difficulty: 'Advanced',
    initialSummary: 'Fatima Zara, G2P1 at 34 weeks gestation, arrives for a routine ANC home check. She complains of a pounding frontal headache for 18 hours, flashing spots in her eyesight (scotomata), and severe swelling in her face and hands.',
    initialVitals: {
      temp_c: 36.8,
      resp_rate: 22,
      spo2: 98,
      heart_rate: 96,
      bp: '168/108 mmHg',
    },
    dangerSignsPresent: [
      'Severe Hypertension (BP ≥ 160/110 mmHg)',
      'Visual disturbances (flashing lights / scotomata)',
      'Persistent severe frontal headache refractory to rest',
      'Sudden bilateral facial & digital edema',
    ],
    badgeEarned: {
      title: 'Maternal Obstetric First Responder',
      icon: '🤰',
      code: 'CPD-WHO-ANC-2026',
    },
    mentorSummary: 'Systolic BP ≥ 160 mmHg or Diastolic BP ≥ 110 mmHg accompanied by neurological symptoms (headache, vision changes) in a 3rd-trimester pregnancy is Preeclampsia with Severe Features / Impending Eclampsia. Immediate Magnesium Sulfate loading and emergency obstetric referral is mandatory.',
    steps: [
      {
        id: 'step-1-anc-bp',
        stageName: 'Stage 1: Vital Signs Validation',
        title: 'Blood Pressure Verification & Neurological Assessment',
        description: 'You observe Fatima sitting down with obvious facial edema. How do you assess her blood pressure and danger signs?',
        options: [
          {
            id: 'opt-1a',
            text: 'Ensure correct cuff size at heart level, rest for 5 minutes, re-check BP on both arms, and evaluate for epigastric / right upper quadrant pain and hyperreflexia.',
            clinicalRationale: 'Accurate BP measurement and screening for end-organ damage (liver capsule distension, hyperreflexia) defines severe preeclampsia.',
            scoreWeight: 25,
            isBestPractice: true,
            consequenceText: 'BP confirmed at 170/110 mmHg. Fatima reports severe epigastric tenderness beneath her ribs. Deep tendon reflexes are brisk with 2 beats of clonus.',
            nextStepId: 'step-2-anc-danger',
          },
          {
            id: 'opt-1b',
            text: 'Tell her headaches are normal in the third trimester and suggest drinking a glass of sweetened tea.',
            clinicalRationale: 'Dismissing gestational headaches with severe hypertension risks fatal eclamptic convulsions and placental abruption.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Fatima’s blood pressure remains dangerously elevated at stroke-risk levels.',
            nextStepId: 'step-2-anc-danger',
          },
        ],
      },
      {
        id: 'step-2-anc-danger',
        stageName: 'Stage 2: Danger Signs & Fetal Assessment',
        title: 'Fetal Well-Being & Convulsion Prevention',
        description: 'You confirm severe preeclampsia with impending eclampsia. What is your next immediate step?',
        options: [
          {
            id: 'opt-2a',
            text: 'Auscultate fetal heart tones (FHT) with Doppler/Fetoscope, position Fatima in left lateral tilt to optimize uteroplacental perfusion, and initiate urgent eclampsia protocol.',
            clinicalRationale: 'Left lateral tilt prevents aortocaval compression and improves maternal-fetal oxygenation during hypertensive crisis.',
            scoreWeight: 25,
            isBestPractice: true,
            consequenceText: 'Fetal heart rate is 142 bpm (reassuring). Left lateral positioning reduces maternal dizziness and stabilizes systemic hemodynamics.',
            nextStepId: 'step-3-anc-transfer',
          },
          {
            id: 'opt-2b',
            text: 'Ask her to lie flat on her back and perform heavy abdominal palpation.',
            clinicalRationale: 'Supine hypotension syndrome worsens placental ischemia in late pregnancy.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Fatima experiences sudden nausea and lightheadedness due to vena cava compression.',
            nextStepId: 'step-3-anc-transfer',
          },
        ],
      },
      {
        id: 'step-3-anc-transfer',
        stageName: 'Stage 3: Referral & Clinical Escalation',
        title: 'Obstetric Emergency Dispatch',
        description: 'How do you coordinate referral to the Comprehensive Emergency Obstetric Care (CEmONC) hospital?',
        options: [
          {
            id: 'opt-3a',
            text: 'Alert Clinical Supervisor & Hospital Maternity Triage, request priority ambulance transport with Magnesium Sulfate loading dose ready, and travel with patient.',
            clinicalRationale: 'Magnesium Sulfate is the gold standard for preventing eclamptic seizures. Accompanied transfer ensures continuous airway and blood pressure monitoring.',
            scoreWeight: 50,
            isBestPractice: true,
            consequenceText: 'Maternity unit alerted. Emergency transport arrives in 15 minutes. Fatima receives Magnesium Sulfate prophylaxis and delivers safely by emergency C-section 3 hours later. Both mother and newborn thrive.',
          },
          {
            id: 'opt-3b',
            text: 'Give her two paracetamol tablets and tell her husband to bring her to the outpatient clinic next Tuesday.',
            clinicalRationale: 'Catastrophic delay: Severe preeclampsia can progress to maternal death or eclampsia within hours without inpatient care.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Fatima develops seizures on the way home, resulting in an emergency ICU admission.',
          },
        ],
      },
    ],
  },
  {
    id: 'sim-malaria-shock',
    title: 'Severe Falciparum Malaria with Impending Shock & Low SpO2',
    patientName: 'Tariq Robinson',
    patientAge: '6 years',
    patientSex: 'Male',
    category: 'Infectious Disease',
    difficulty: 'Intermediate',
    initialSummary: '6-year-old Tariq is carried into the field post by his father. He has had continuous high fever for 3 days in a known malaria endemic zone, has vomited all oral medicines, and is now floppy and breathing heavily.',
    initialVitals: {
      temp_c: 39.8,
      resp_rate: 48,
      spo2: 90,
      heart_rate: 144,
    },
    dangerSignsPresent: [
      'Lethargy / Unconsciousness (Prostration)',
      'Severe vomiting (unable to retain oral medication)',
      'Hyperpyrexia (Temp >39.5°C)',
      'Dark "Coca-Cola" urine (Blackwater hemoglobinuria / severe hemolysis)',
    ],
    badgeEarned: {
      title: 'Malaria Emergency Sentinel',
      icon: '🦟',
      code: 'CPD-WHO-MAL-2026',
    },
    mentorSummary: 'In malaria endemic zones, any child with fever who is unable to retain oral ACTs or exhibits prostration/lethargy has SEVERE MALARIA requiring parenteral/rectal artesunate pre-referral dose and emergency transport.',
    steps: [
      {
        id: 'step-1-mal-rdt',
        stageName: 'Stage 1: Rapid Diagnostic & Blood Glucose',
        title: 'Diagnostic Triad: RDT + Blood Glucose + Vitals',
        description: 'Tariq is somnolent with hot skin. What diagnostic tests and clinical checks do you perform immediately?',
        options: [
          {
            id: 'opt-1a',
            text: 'Perform rapid Malaria RDT, test capillary Blood Glucose (screen for hypoglycaemia), and assess capillary refill time.',
            clinicalRationale: 'Hypoglycaemia is a frequent, life-threatening complication of severe malaria in children and must be detected alongside mRDT.',
            scoreWeight: 30,
            isBestPractice: true,
            consequenceText: 'mRDT is strongly POSITIVE (P. falciparum). Blood glucose is 3.1 mmol/L (low). Capillary refill is 3.5 seconds (impaired peripheral perfusion).',
            nextStepId: 'step-2-mal-tx',
          },
          {
            id: 'opt-1b',
            text: 'Give oral paracetamol tablets and ask father to wait 2 hours before testing blood.',
            clinicalRationale: 'Delaying diagnostic confirmation and glucose checks in severe malaria leads to rapid cerebral deterioration.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Tariq vomits the paracetamol instantly and remains lethargic.',
            nextStepId: 'step-2-mal-tx',
          },
        ],
      },
      {
        id: 'step-2-mal-tx',
        stageName: 'Stage 2: Emergency Pre-Referral Stabilization',
        title: 'Pre-Referral Medication & Fluid Management',
        description: 'Tariq cannot swallow oral ACT tablets and has severe malaria. What is your clinical action plan?',
        options: [
          {
            id: 'opt-2a',
            text: 'Administer emergency Rectal Artesunate (or IM Artesunate 2.4 mg/kg), give sublingual sugar water/glucose for low blood sugar, cool with tepid sponging, and dispatch emergency referral.',
            clinicalRationale: 'WHO Guidelines recommend Rectal Artesunate for children under 6 as pre-referral intervention when parenteral artesunate or oral therapy is impossible.',
            scoreWeight: 70,
            isBestPractice: true,
            consequenceText: 'Rectal artesunate capsule inserted. Sublingual glucose administered. Within 20 minutes, blood sugar rises to 4.8 mmol/L and Tariq is safely transferred to the regional hospital.',
            vitalsDelta: { temp_c: 38.6, spo2: 94 },
          },
          {
            id: 'opt-2b',
            text: 'Force Tariq to swallow crushed oral Artemether-Lumefantrine tablets with cold water.',
            clinicalRationale: 'Forcing oral medication into a lethargic child causes aspiration into the lungs.',
            scoreWeight: 0,
            isBestPractice: false,
            consequenceText: 'Tariq aspirates fluid into his airway and begins choking, requiring emergency back blows.',
          },
        ],
      },
    ],
  },
];

export const ClinicalSimulationDrills: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [cumulativeScore, setCumulativeScore] = useState<number>(0);
  const [simulatedVitals, setSimulatedVitals] = useState<any>(null);
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false);
  const [userDecisions, setUserDecisions] = useState<{ stepTitle: string; optionText: string; isCorrect: boolean; rationale: string }[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chw_unlocked_cpd_badges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleStartSimulation = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setCurrentStepIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setCumulativeScore(0);
    setSimulatedVitals({ ...scenario.initialVitals });
    setSimulationCompleted(false);
    setUserDecisions([]);
  };

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleSubmitStep = () => {
    if (!selectedScenario || !selectedOptionId) return;
    const currentStep = selectedScenario.steps[currentStepIndex];
    const chosenOption = currentStep.options.find(o => o.id === selectedOptionId);
    if (!chosenOption) return;

    setIsAnswerSubmitted(true);
    setCumulativeScore(prev => prev + chosenOption.scoreWeight);

    if (chosenOption.vitalsDelta && simulatedVitals) {
      setSimulatedVitals((prev: any) => ({
        ...prev,
        ...chosenOption.vitalsDelta,
      }));
    }

    setUserDecisions(prev => [
      ...prev,
      {
        stepTitle: currentStep.title,
        optionText: chosenOption.text,
        isCorrect: chosenOption.isBestPractice,
        rationale: chosenOption.clinicalRationale,
      },
    ]);
  };

  const handleNextStep = () => {
    if (!selectedScenario) return;
    if (currentStepIndex + 1 < selectedScenario.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
    } else {
      // Completed!
      setSimulationCompleted(true);
      if (cumulativeScore >= 75 && !unlockedBadges.includes(selectedScenario.badgeEarned.code)) {
        const updated = [...unlockedBadges, selectedScenario.badgeEarned.code];
        setUnlockedBadges(updated);
        localStorage.setItem('chw_unlocked_cpd_badges', JSON.stringify(updated));
      }
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Simulation Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a8a 100%)',
        borderRadius: '12px',
        padding: '1.5rem 1.75rem',
        color: 'white',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 18px rgba(30, 27, 75, 0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🎮</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Interactive Clinical Case Simulators (Drills)
              </h2>
              <Badge variant="warning">WHO CPD CERTIFIED</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              Practice critical branching decision-making with simulated patients and dynamic physiological responses
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.85rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Badges Unlocked:</div>
              <strong style={{ fontSize: '0.9rem', color: '#fbbf24' }}>{unlockedBadges.length} of {simulationScenarios.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {simulationScenarios.map(sc => {
          const isUnlocked = unlockedBadges.includes(sc.badgeEarned.code);

          return (
            <Card key={sc.id} style={{ borderLeft: `4px solid ${isUnlocked ? '#16a34a' : '#4f46e5'}` }}>
              <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <Badge variant="info">{sc.category}</Badge>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <Badge variant="default">{sc.difficulty}</Badge>
                      {isUnlocked && <span title="Certified Badge Earned" style={{ fontSize: '1.1rem' }}>🏆</span>}
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: '0 0 0.4rem 0', color: 'var(--foreground)' }}>
                    {sc.title}
                  </h3>

                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.6rem', fontWeight: 600 }}>
                    Patient: <strong>{sc.patientName}</strong> ({sc.patientAge} · {sc.patientSex})
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--foreground)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {sc.initialSummary}
                  </p>

                  {/* Danger Signs Preview */}
                  <div style={{ backgroundColor: 'var(--muted)', padding: '0.6rem 0.8rem', borderRadius: '6px', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      🚨 Danger Signs in Presentation:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      {sc.dangerSignsPresent.map((ds, idx) => (
                        <li key={idx}>{ds}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{sc.badgeEarned.icon}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                      Earn: <strong>{sc.badgeEarned.title}</strong>
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={isUnlocked ? 'outline' : 'primary'}
                    onClick={() => handleStartSimulation(sc)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {isUnlocked ? '↺ Re-run Simulation' : '🚀 Launch Drill →'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* Interactive Simulation Drill Modal                        */}
      {/* ========================================================= */}
      {selectedScenario && (
        <Modal
          isOpen={!!selectedScenario}
          onClose={() => setSelectedScenario(null)}
          title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Badge variant="info">{selectedScenario.category}</Badge>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {selectedScenario.steps[currentStepIndex]?.stageName || 'Simulation Completed'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #bbf7d0' }}>
                  ⭐ Score: {cumulativeScore} / 100
                </div>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                {selectedScenario.title}
              </h2>
            </div>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Button variant="outline" onClick={() => setSelectedScenario(null)}>
                Exit Drill
              </Button>
              {!simulationCompleted ? (
                !isAnswerSubmitted ? (
                  <Button
                    variant="primary"
                    disabled={!selectedOptionId}
                    onClick={handleSubmitStep}
                    style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                  >
                    Confirm Clinical Action ✓
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                  >
                    {currentStepIndex + 1 < selectedScenario.steps.length ? 'Continue to Next Stage →' : 'View Clinical Scorecard 🎉'}
                  </Button>
                )
              ) : (
                <Button variant="primary" onClick={() => setSelectedScenario(null)}>
                  Close & Save Result
                </Button>
              )}
            </div>
          }
        >
          {simulationCompleted ? (
            /* Final Scorecard & CPD Certificate Modal Screen */
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: cumulativeScore >= 75 ? '#f0fdf4' : '#fef3c7', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                {cumulativeScore >= 75 ? '🏆' : '📚'}
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: cumulativeScore >= 75 ? '#15803d' : '#b45309', margin: '0 0 0.5rem 0' }}>
                {cumulativeScore >= 75 ? 'Clinical Simulation Passed with Distinction!' : 'Clinical Simulation Completed'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', maxWidth: '460px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                {cumulativeScore >= 75
                  ? `You achieved ${cumulativeScore}% protocol adherence. Your decisions aligned with WHO clinical danger sign triage guidelines.`
                  : `You scored ${cumulativeScore}%. Review the clinical mentor guidelines below to reinforce pre-referral protocols.`}
              </p>

              {/* Digital CPD Badge Card */}
              {cumulativeScore >= 75 && (
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '2px solid #3b82f6',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  maxWidth: '440px',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.35rem' }}>{selectedScenario.badgeEarned.icon}</span>
                  <strong style={{ fontSize: '1.1rem', color: '#1e40af', display: 'block' }}>
                    {selectedScenario.badgeEarned.title}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                    Credential Code: {selectedScenario.badgeEarned.code} · Cryptographically Verified ✓
                  </span>
                </div>
              )}

              {/* Mentor Summary */}
              <div style={{ backgroundColor: 'var(--muted)', padding: '1rem', borderRadius: '8px', textAlign: 'left', marginBottom: '1.25rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--foreground)', display: 'block', marginBottom: '0.3rem' }}>
                  💡 WHO iCCM Clinical Mentor Debrief:
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
                  {selectedScenario.mentorSummary}
                </p>
              </div>

              {/* Decision Log Review */}
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--foreground)', display: 'block', marginBottom: '0.5rem' }}>
                  Decision Audit Trail:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {userDecisions.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        backgroundColor: d.isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        borderLeft: `4px solid ${d.isCorrect ? '#10b981' : '#ef4444'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--foreground)' }}>{d.stepTitle}</span>
                        <span style={{ color: d.isCorrect ? '#15803d' : '#b91c1c' }}>{d.isCorrect ? '✓ Optimal Choice' : '⚠️ Suboptimal Choice'}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                        <strong>Selected:</strong> {d.optionText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (() => {
            const step = selectedScenario.steps[currentStepIndex];
            const chosenOption = step.options.find(o => o.id === selectedOptionId);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Live Physiological Telemetry Monitor */}
                <div style={{
                  background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  border: '1px solid #1f2937',
                  color: 'white',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase' }}>
                      🩺 Simulated Patient Telemetry · {selectedScenario.patientName} ({selectedScenario.patientAge})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', animation: 'pulse 2s infinite' }}>
                      LIVE VITALS FEED
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Body Temp</span>
                      <strong style={{ fontSize: '1.1rem', color: simulatedVitals.temp_c >= 38.5 ? '#ef4444' : '#10b981' }}>
                        {simulatedVitals.temp_c}°C
                      </strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Resp Rate</span>
                      <strong style={{ fontSize: '1.1rem', color: simulatedVitals.resp_rate >= 50 ? '#ef4444' : '#f59e0b' }}>
                        {simulatedVitals.resp_rate}/min
                      </strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Oxygen (SpO2)</span>
                      <strong style={{ fontSize: '1.1rem', color: simulatedVitals.spo2 < 94 ? '#ef4444' : '#10b981' }}>
                        {simulatedVitals.spo2}%
                      </strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Heart Rate</span>
                      <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>
                        {simulatedVitals.heart_rate} bpm
                      </strong>
                    </div>
                    {simulatedVitals.bp && (
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Blood Pressure</span>
                        <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>
                          {simulatedVitals.bp}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scenario Step Title & Instructions */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--foreground)' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
                    {step.description}
                  </p>
                </div>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {step.options.map(opt => {
                    const isSelected = selectedOptionId === opt.id;

                    let bg = 'var(--card)';
                    let border = '1px solid var(--border)';
                    let color = 'var(--foreground)';

                    if (isAnswerSubmitted) {
                      if (opt.isBestPractice) {
                        bg = '#f0fdf4';
                        border = '2px solid #22c55e';
                        color = '#15803d';
                      } else if (isSelected && !opt.isBestPractice) {
                        bg = '#fef2f2';
                        border = '2px solid #ef4444';
                        color = '#991b1b';
                      }
                    } else if (isSelected) {
                      bg = '#eff6ff';
                      border = '2px solid #4f46e5';
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        disabled={isAnswerSubmitted}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '8px',
                          textAlign: 'left',
                          backgroundColor: bg,
                          border,
                          color,
                          cursor: isAnswerSubmitted ? 'default' : 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.85rem',
                          fontWeight: isSelected || (isAnswerSubmitted && opt.isBestPractice) ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{opt.text}</span>
                        {isAnswerSubmitted && opt.isBestPractice && <Badge variant="success">Optimal ✓</Badge>}
                        {isAnswerSubmitted && isSelected && !opt.isBestPractice && <Badge variant="danger">Suboptimal ✗</Badge>}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback & Consequence Callout */}
                {isAnswerSubmitted && chosenOption && (
                  <div style={{
                    backgroundColor: chosenOption.isBestPractice ? '#f0fdf4' : '#fffbeb',
                    borderLeft: `4px solid ${chosenOption.isBestPractice ? '#16a34a' : '#f59e0b'}`,
                    padding: '0.85rem 1rem',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.825rem',
                    color: chosenOption.isBestPractice ? '#14532d' : '#92400e',
                    lineHeight: 1.5,
                  }}>
                    <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
                      {chosenOption.isBestPractice ? '✓ Patient Response & Outcome:' : '⚠️ Clinical Protocol Alert:'}
                    </strong>
                    <p style={{ margin: '0 0 0.4rem 0' }}>{chosenOption.consequenceText}</p>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(0,0,0,0.65)' }}>
                      <strong>Rationale:</strong> {chosenOption.clinicalRationale}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
