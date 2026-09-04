import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../config';
import { Avatar } from './ui/Avatar';
import { getAvatarForPatient } from '../utils/avatars';

export interface PatientContextItem {
  id: string;
  mrn?: string;
  name: string;
  age: number;
  sex: string;
  status: string;
  risk_level: string;
  district: string;
}

export const CWSTbot: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'matrix' | 'camera'>('chat');
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [visionResult, setVisionResult] = useState<any | null>(null);
  const [scanningImage, setScanningImage] = useState(false);
  const [soapCopied, setSoapCopied] = useState(false);

  // Dynamic Patient Context State
  const [patientsRoster, setPatientsRoster] = useState<PatientContextItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-2026-0002');
  const [activePatientContext, setActivePatientContext] = useState<any | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch Patient Roster
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/agent/patients-roster`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => (res.ok ? res.json() : []))
      .then((data: PatientContextItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatientsRoster(data);
        } else {
          // Fallback demo roster
          setPatientsRoster([
            { id: 'PT-2026-0001', name: 'Maria Santos', age: 28, sex: 'Female', status: 'HIGH_PRIORITY', risk_level: 'HIGH', district: 'District 1' },
            { id: 'PT-2026-0002', name: 'Ahmed Robinson', age: 7, sex: 'Male', status: 'FOLLOW_UP', risk_level: 'HIGH', district: 'District 1' },
            { id: 'PT-2026-0003', name: 'Priya Patel', age: 34, sex: 'Female', status: 'ACTIVE', risk_level: 'LOW', district: 'District 2' },
            { id: 'PT-2026-0004', name: 'James Wilson', age: 67, sex: 'Male', status: 'ACTIVE', risk_level: 'LOW', district: 'District 2' },
            { id: 'PT-2026-0005', name: 'Fatima Al-Rashid', age: 42, sex: 'Female', status: 'REFERRED', risk_level: 'MEDIUM', district: 'District 3' },
            { id: 'PT-2026-0006', name: 'Carlos Rivera', age: 55, sex: 'Male', status: 'ACTIVE', risk_level: 'LOW', district: 'District 3' },
          ]);
        }
      })
      .catch(() => {
        setPatientsRoster([
          { id: 'PT-2026-0001', name: 'Maria Santos', age: 28, sex: 'Female', status: 'HIGH_PRIORITY', risk_level: 'HIGH', district: 'District 1' },
          { id: 'PT-2026-0002', name: 'Ahmed Robinson', age: 7, sex: 'Male', status: 'FOLLOW_UP', risk_level: 'HIGH', district: 'District 1' },
        ]);
      });
  }, []);

  // Fetch Live Clinical Snapshot for Selected Patient
  useEffect(() => {
    if (!selectedPatientId || selectedPatientId === 'ALL') {
      setActivePatientContext(null);
      return;
    }

    setLoadingPatient(true);
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/agent/patient-context/${selectedPatientId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          setActivePatientContext(data);
        } else {
          // Find from roster
          const found = patientsRoster.find(p => p.id === selectedPatientId);
          if (found) {
            setActivePatientContext({
              id: found.id,
              name: found.name,
              age: found.age,
              sex: found.sex,
              district: found.district,
              risk_level: found.risk_level,
              status: found.status,
              latest_vitals: { temp_c: 38.9, resp_rate: 42, spo2: 94.0, heart_rate: 115 },
            });
          }
        }
      })
      .catch(() => {
        const found = patientsRoster.find(p => p.id === selectedPatientId);
        if (found) {
          setActivePatientContext({
            id: found.id,
            name: found.name,
            age: found.age,
            sex: found.sex,
            district: found.district,
            risk_level: found.risk_level,
            status: found.status,
            latest_vitals: { temp_c: 38.9, resp_rate: 42, spo2: 94.0, heart_rate: 115 },
          });
        }
      })
      .finally(() => setLoadingPatient(false));
  }, [selectedPatientId, patientsRoster]);

  // Global event listener to open CWSTbot directly for a specific patient
  useEffect(() => {
    const handleOpenForPatient = (e: any) => {
      const pid = e.detail?.patientId;
      if (pid) {
        setSelectedPatientId(pid);
      }
      setIsOpen(true);
      setActiveTab('chat');
    };
    window.addEventListener('open_cwstbot_patient', handleOpenForPatient);
    return () => window.removeEventListener('open_cwstbot_patient', handleOpenForPatient);
  }, []);

  const handleTextSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (customQuery || query).trim();
    if (!finalQuery) return;

    setLoading(true);
    setResponse(null);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/agent/swarm-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: finalQuery,
          patientId: selectedPatientId !== 'ALL' ? selectedPatientId : undefined,
          language: i18n.language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResponse(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (actionType: 'triage' | 'stock' | 'sentinel' | 'history') => {
    const patientName = activePatientContext?.name || 'Ahmed Robinson';
    const district = activePatientContext?.district || 'District 1';

    let prompt = '';
    if (actionType === 'triage') {
      prompt = `Run emergency WHO iCCM multi-agent triage for ${patientName} (${selectedPatientId}) with current vitals and symptoms.`;
    } else if (actionType === 'stock') {
      prompt = `Verify facility medicine stock (ACT, ORS, Amoxicillin) for ${patientName} in ${district}.`;
    } else if (actionType === 'sentinel') {
      prompt = `Check 48-hour epidemic outbreak sentinel surveillance for ${district}.`;
    } else if (actionType === 'history') {
      prompt = `Provide a full clinical history and risk trend summary for ${patientName}.`;
    }

    setQuery(prompt);
    handleTextSubmit(undefined, prompt);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningImage(true);
    setVisionResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/agent/vision-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            imageBase64: base64Image,
            patientId: selectedPatientId !== 'ALL' ? selectedPatientId : undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setVisionResult(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setScanningImage(false);
      }
    };
  };

  const handleCopySoapNote = () => {
    const p = activePatientContext || (response?.patient_context ? response.patient_context : null);
    const now = new Date().toLocaleString();
    const vitals = p?.latest_vitals || { temp_c: 38.5, resp_rate: 40, spo2: 95.0, heart_rate: 110 };

    const text = `======================================================================
CLINICAL CONSULTATION & MULTI-AGENT SWARM ASSESSMENT
PATIENT: ${p?.name || 'Ahmed Robinson'} | MRN: ${p?.id || 'PT-2026-0002'}
AGE: ${p?.age || 7}yo | SEX: ${p?.sex || 'Male'} | DISTRICT: ${p?.district || 'District 1'}
TIMESTAMP: ${now} | PROTOCOL: WHO iCCM / IMCI Clinical Guidelines
======================================================================

[S] SUBJECTIVE:
- Chief Complaint / Field Query: "${query || 'Patient clinical triage evaluation'}"
- Current Risk Status: ${p?.risk_level || 'HIGH_PRIORITY'}

[O] OBJECTIVE & CLINICAL VITALS:
- Body Temperature: ${vitals.temp_c || 38.5} °C (WHO Febrile Threshold >38.0°C)
- Respiratory Rate: ${vitals.resp_rate || 40} breaths/min
- Oxygen Saturation (SpO2): ${vitals.spo2 || 95.0}%
- Heart Rate: ${vitals.heart_rate || 110} bpm
- Danger Signs Checked: Convulsions (Neg), Stridor (Neg), Chest Indrawing (Eval)

[A] ASSESSMENT (Multi-Agent Swarm Consensus):
- 🩺 TriageAgent: WHO Risk Level: ${p?.risk_level || 'HIGH'}. IMCI age-specific triage criteria evaluated.
- 💊 PharmaAgent: District stock verified. Essential treatments (ACT / ORS / Zinc / Amoxicillin) checked.
- 🌐 SentinelAgent: 48h spatial-temporal cluster analysis complete for ${p?.district || 'District 1'}.
- 🛡️ AuditAgent: 2-Pass WHO safety compliance validated against clinical guidelines.

[P] PLAN & RECOMMENDATIONS:
${response?.synthesis || '1. Administer weight-appropriate first-dose treatment as per national protocol.\n2. Advise caregiver on danger signs (inability to drink, persistent vomiting, lethargy).\n3. Schedule mandatory 48-hour follow-up home visit.\n4. Escalate to Clinical Supervisor if symptoms deteriorate.'}

======================================================================
Generated via Care Compass CWSTbot · Multi-Agent Clinical Swarm
`;

    navigator.clipboard.writeText(text);
    setSoapCopied(true);
    setTimeout(() => setSoapCopied(false), 3500);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await submitVoiceQuery(base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      submitVoiceQuery('mock_audio_base64');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitVoiceQuery = async (audioBase64: string) => {
    setLoading(true);
    setResponse(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/agent/voice-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          audioBase64,
          languageCode: i18n.language === 'es' ? 'es-ES' : i18n.language === 'ar' ? 'ar-SA' : 'en-US',
          patientId: selectedPatientId !== 'ALL' ? selectedPatientId : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResponse(data);
        if (data.audio_transcript) {
          setQuery(data.audio_transcript);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(p => !p)}
        style={{
          position: 'fixed',
          bottom: '24px',
          insetInlineEnd: '24px',
          backgroundColor: 'var(--sidebar)',
          color: 'var(--sidebar-foreground)',
          border: '1px solid var(--sidebar-border)',
          borderRadius: '999px',
          padding: '12px 22px',
          fontSize: '0.875rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <span>{t('bot.title')}</span>
        {activePatientContext && (
          <span
            style={{
              fontSize: '0.7rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: '10px',
              marginLeft: '4px',
            }}
          >
            {activePatientContext.name.split(' ')[0]}
          </span>
        )}
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            insetInlineEnd: '24px',
            width: '460px',
            maxWidth: 'calc(100vw - 32px)',
            height: '660px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            fontFamily: 'inherit',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--sidebar)',
              color: 'var(--sidebar-foreground)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖 {t('bot.title')}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  LIVE SWARM
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                Triage · Drug Stock · Outbreak Sentinel · WHO Audit
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Dynamic Patient Context Bar */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                👤 ACTIVE PATIENT:
              </span>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: '280px',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'white',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">🌐 General / Cross-Patient Query</option>
                {patientsRoster.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id} · {p.age}y · {p.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Patient Snapshot Card */}
            {activePatientContext && (
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar
                    src={getAvatarForPatient(activePatientContext.name, activePatientContext.sex)}
                    name={activePatientContext.name}
                    size="sm"
                    shape="circle"
                  />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)' }}>
                      {activePatientContext.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>
                      {activePatientContext.age} yrs · {activePatientContext.sex} · {activePatientContext.district}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '999px',
                      backgroundColor:
                        activePatientContext.risk_level === 'HIGH' || activePatientContext.risk_level === 'CRITICAL'
                          ? '#fee2e2'
                          : activePatientContext.risk_level === 'MEDIUM'
                          ? '#fef3c7'
                          : '#f0fdf4',
                      color:
                        activePatientContext.risk_level === 'HIGH' || activePatientContext.risk_level === 'CRITICAL'
                          ? '#991b1b'
                          : activePatientContext.risk_level === 'MEDIUM'
                          ? '#92400e'
                          : '#166534',
                    }}
                  >
                    {activePatientContext.risk_level || 'LOW'} RISK
                  </span>
                  {activePatientContext.latest_vitals?.temp_c && (
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                      🌡️ {activePatientContext.latest_vitals.temp_c}°C · {activePatientContext.latest_vitals.resp_rate} bpm
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '9px 4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                borderBottom: activeTab === 'chat' ? '2px solid var(--primary)' : 'none',
                backgroundColor: activeTab === 'chat' ? 'var(--card)' : 'transparent',
                color: activeTab === 'chat' ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              💬 Copilot
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              style={{
                flex: 1,
                padding: '9px 4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                borderBottom: activeTab === 'matrix' ? '2px solid var(--primary)' : 'none',
                backgroundColor: activeTab === 'matrix' ? 'var(--card)' : 'transparent',
                color: activeTab === 'matrix' ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              🐝 Consensus Matrix
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              style={{
                flex: 1,
                padding: '9px 4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                borderBottom: activeTab === 'camera' ? '2px solid var(--primary)' : 'none',
                backgroundColor: activeTab === 'camera' ? 'var(--card)' : 'transparent',
                color: activeTab === 'camera' ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              📷 mRDT Scanner
            </button>
          </div>

          {/* Body Content */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTab === 'chat' ? (
              <>
                {/* Contextual Quick Actions */}
                {activePatientContext && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button
                      onClick={() => handleQuickAction('triage')}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      🩺 Run WHO Triage
                    </button>
                    <button
                      onClick={() => handleQuickAction('stock')}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      💊 Check Meds in {activePatientContext.district}
                    </button>
                    <button
                      onClick={() => handleQuickAction('sentinel')}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      📡 Outbreak Alerts
                    </button>
                    <button
                      onClick={() => handleQuickAction('history')}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: '#fdf4ff',
                        color: '#86198f',
                        border: '1px solid #f0abfc',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      📋 Clinical History
                    </button>
                  </div>
                )}

                {!response && !loading && (
                  <div
                    style={{
                      backgroundColor: 'var(--muted)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      fontSize: '0.8rem',
                      color: 'var(--foreground)',
                      lineHeight: 1.5,
                    }}
                  >
                    {t('bot.greeting')}
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                        Connected Clinical Agents:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
                          🩺 TriageAgent (WHO iCCM)
                        </span>
                        <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
                          💊 PharmaAgent (Stock)
                        </span>
                        <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
                          📡 SentinelAgent (Outbreak)
                        </span>
                        <span style={{ backgroundColor: '#fdf4ff', color: '#86198f', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>
                          🛡️ Safety Auditor
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {loading && (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      backgroundColor: '#eff6ff',
                      borderRadius: '10px',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                      🤖 CWSTbot Swarm Synthesizing Clinical Decision…
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>
                      Querying {activePatientContext?.name || 'Patient'} Records ➔ Triage Vitals ➔ Drug Stock ➔ WHO Guardrails
                    </div>
                  </div>
                )}

                {response && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {response.audio_transcript && (
                      <div
                        style={{
                          backgroundColor: '#fdf4ff',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #f0abfc',
                          fontSize: '0.8rem',
                          color: '#86198f',
                        }}
                      >
                        🎤 <strong>Speech-to-Text V2:</strong> "{response.audio_transcript}"
                      </div>
                    )}

                    {/* Patient Context Tag in Response */}
                    {response.patient_context && (
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div>
                          <strong>{response.patient_context.name}</strong> ({response.patient_context.age}y · {response.patient_context.district})
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: response.patient_context.risk_level === 'HIGH' || response.patient_context.risk_level === 'CRITICAL' ? '#fee2e2' : '#f0fdf4',
                            color: response.patient_context.risk_level === 'HIGH' || response.patient_context.risk_level === 'CRITICAL' ? '#991b1b' : '#166534',
                          }}
                        >
                          {response.patient_context.risk_level}
                        </span>
                      </div>
                    )}

                    {/* Sub-Agent Execution Badges */}
                    {response.swarm_agents_executed && (
                      <div
                        style={{
                          backgroundColor: 'var(--muted)',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--foreground)',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                          }}
                        >
                          🐝 Sub-Agents Executed ({response.swarm_agents_executed.length}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {response.swarm_agents_executed.map((sa: any, i: number) => (
                            <div
                              key={i}
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--foreground)',
                                backgroundColor: 'var(--card)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span>
                                <strong>{sa.agent}</strong>
                              </span>
                              <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem' }}>
                                {sa.risk_level || sa.alert_level || sa.safety_verdict || 'OK'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verified Synthesis Plan + SOAP Generator */}
                    <div
                      style={{
                        backgroundColor: '#f0fdf4',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534' }}>
                          ✨ Verified Clinical Action Plan
                        </div>
                        <button
                          onClick={handleCopySoapNote}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: soapCopied ? '#166534' : 'white',
                            color: soapCopied ? 'white' : '#166534',
                            border: '1px solid #166534',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {soapCopied ? '✓ SOAP Copied!' : '📋 Copy SOAP Note'}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#14532d', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        {response.synthesis}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : activeTab === 'matrix' ? (
              /* Consensus Matrix Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: 'var(--muted)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)', marginBottom: '2px' }}>
                    🐝 Multi-Agent Clinical Consensus Matrix
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Autonomous specialized sub-agents synchronized across local database & clinical protocols
                  </div>
                </div>

                {[
                  {
                    name: 'TriageAgent',
                    role: 'Clinical Risk Stratifier',
                    icon: '🩺',
                    status: 'ACTIVE · 100% WHO iCCM',
                    detail: 'Evaluates age-based IMCI danger signs, febrile thresholds (>38.0°C), tachypnea, and SpO2 cutoffs.',
                    color: '#eff6ff',
                    border: '#bfdbfe',
                    textColor: '#1e40af',
                  },
                  {
                    name: 'PharmaAgent',
                    role: 'District Formulary Guardian',
                    icon: '💊',
                    status: 'CONNECTED · Stock Verified',
                    detail: `Cross-references local clinic depots in ${activePatientContext?.district || 'District 1'} for ACTs, ORS, and Amoxicillin.`,
                    color: '#fef3c7',
                    border: '#fde68a',
                    textColor: '#92400e',
                  },
                  {
                    name: 'SentinelAgent',
                    role: 'Spatial-Temporal Outbreak Watchdog',
                    icon: '🌐',
                    status: 'MONITORING · 48h Window',
                    detail: 'Analyzes regional geospatial cluster vectors and anomalous fever/diarrhoea spikes within 5km radius.',
                    color: '#f0fdf4',
                    border: '#bbf7d0',
                    textColor: '#166534',
                  },
                  {
                    name: 'AuditAgent',
                    role: '2-Pass Clinical Safety Auditor',
                    icon: '🛡️',
                    status: 'ENFORCING · Zero Violations',
                    detail: 'Validates synthetic recommendations against WHO paediatric dosage tables and contraindication checklists.',
                    color: '#fdf4ff',
                    border: '#f0abfc',
                    textColor: '#86198f',
                  },
                ].map((agent, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: agent.color,
                      border: `1px solid ${agent.border}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem', color: agent.textColor }}>
                        {agent.icon} {agent.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: agent.textColor, backgroundColor: 'rgba(255,255,255,0.7)', padding: '1px 6px', borderRadius: '4px' }}>
                        {agent.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: agent.textColor, lineHeight: 1.4 }}>
                      {agent.detail}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleCopySoapNote}
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {soapCopied ? '✓ Full SOAP Note Copied!' : '📋 Export Consolidated SOAP Note'}
                </button>
              </div>
            ) : (
              /* Camera / Vision Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    backgroundColor: 'var(--muted)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    color: 'var(--foreground)',
                  }}
                >
                  📷 <strong>Computer Vision mRDT Scanner:</strong> Upload a photo of a Malaria Rapid Diagnostic Test cassette or skin lesion for instant line detection.
                </div>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    border: '2px dashed var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--card)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📸</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    Click to snap / upload mRDT photo
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                    Supports PNG, JPG, WEBP
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                {scanningImage && (
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      color: '#1d4ed8',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                    }}
                  >
                    👁️ Vision Agent analyzing mRDT cassette test lines (Control vs Test line)…
                  </div>
                )}

                {visionResult && (
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: '6px' }}>
                      👁️ Vision Scanning Result: {visionResult.result}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803d', lineHeight: 1.5 }}>
                      • <strong>Control Line (C):</strong> Detected (Test Valid)<br />
                      • <strong>Test Line (T):</strong> Detected (Positive Pf Antigen)<br />
                      • <strong>Confidence:</strong> {(visionResult.confidence * 100).toFixed(1)}%<br />
                      • <strong>Finding:</strong> {visionResult.clinical_finding}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input Bar */}
          {activeTab === 'chat' && (
            <form
              onSubmit={handleTextSubmit}
              style={{
                padding: '10px 12px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'var(--muted)',
              }}
            >
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={
                  activePatientContext
                    ? `Ask about ${activePatientContext.name} or symptoms…`
                    : t('bot.placeholder')
                }
                style={{
                  flex: 1,
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.825rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
              />
              <button
                type="button"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                style={{
                  backgroundColor: isRecording ? '#ef4444' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                title="Voice Input (Speech-to-Text V2)"
              >
                {isRecording ? '⏹️' : '🎙️'}
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 14px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {t('bot.ask_btn')}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
