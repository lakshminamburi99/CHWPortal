import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../App';
import { API_BASE } from '../../config';
import { offlineSyncService } from '../../services/offlineSync';

const templates = [
  { id: 'tpl-maternal', name: 'Maternal Health Assessment', category: 'MATERNAL', description: 'Comprehensive assessment for pregnant and post-partum women.', duration: 15 },
  { id: 'tpl-child', name: 'Child Illness Assessment', category: 'CHILD', description: 'Assess children under 5 for common illnesses and malnutrition.', duration: 10 },
  { id: 'tpl-chronic', name: 'Chronic Disease Assessment', category: 'CHRONIC', description: 'Monitor patients with diabetes, hypertension, and heart conditions.', duration: 12 },
  { id: 'tpl-surveillance', name: 'Disease Surveillance', category: 'SURVEILLANCE', description: 'Community-level surveillance for infectious disease monitoring.', duration: 8 },
];

const assessmentQuestions = [
  { id: 'q1', text: 'What is the patient\'s primary complaint today?', helpText: 'Ask the patient to describe their main symptom in their own words.', type: 'text' },
  { id: 'q2', text: 'Is the patient experiencing fever?', helpText: 'A fever is a body temperature above 38°C (100.4°F).', type: 'choice', options: ['Yes', 'No', 'Unknown'] },
  { id: 'q3', text: 'How long have symptoms been present?', helpText: 'Record the duration as accurately as possible.', type: 'choice', options: ['Less than 24 hours', '1-3 days', '4-7 days', 'More than 1 week'] },
  { id: 'q4', text: 'Is the patient able to eat and drink normally?', helpText: 'Inability to eat or drink is a danger sign.', type: 'choice', options: ['Yes, normally', 'Reduced intake', 'Unable to eat/drink'] },
  { id: 'q5', text: 'Any additional clinical notes?', helpText: 'Record any observations not captured by the questions above.', type: 'text' },
];

const getSpeechLocale = (lang: string) => {
  switch (lang) {
    case 'ar': return 'ar-SA';
    case 'es': return 'es-ES';
    case 'hi': return 'hi-IN';
    default: return 'en-US';
  }
};

export const AssessmentsPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const patientId = searchParams.get('patientId') || 'PT-2026-0002';
  const patientName = searchParams.get('patientName') || 'Ahmed Robinson';

  const [phase, setPhase] = useState<'select-template' | 'select-patient' | 'questions' | 'complete'>('select-template');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  // Real-time Voice Recording & Speech-to-Text State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const baseAnswerRef = useRef<string>('');
  const timerRef = useRef<any>(null);

  // Clean up recognition & timers on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // Timer effect for recording duration
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    setSpeechError(null);
    setInterimTranscript('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. Triggering Gemini Voice Assistant.');
      triggerGeminiVoiceAssistant();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getSpeechLocale(i18n.language);

      baseAnswerRef.current = currentAnswer;

      recognition.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const fullSpoken = (finalTranscript + interim).trim();
        setInterimTranscript(interim);

        const currentQuestion = assessmentQuestions[currentQ];
        if (currentQuestion.type === 'text') {
          const base = baseAnswerRef.current ? baseAnswerRef.current.trim() : '';
          const combined = base ? `${base} ${fullSpoken}` : fullSpoken;
          setCurrentAnswer(combined);
        } else if (currentQuestion.type === 'choice') {
          // Real-time matching against available choice options
          const lower = fullSpoken.toLowerCase();
          const matched = currentQuestion.options?.find(opt =>
            lower.includes(opt.toLowerCase()) || opt.toLowerCase().includes(lower)
          );
          if (matched) {
            setCurrentAnswer(matched);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser.');
          stopRecording();
        } else if (event.error === 'no-speech') {
          // Keep listening
        } else {
          setSpeechError(`Voice notice: ${event.error}. You can also type or use the Gemini AI Assistant.`);
          stopRecording();
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch {
            setIsRecording(false);
            isRecordingRef.current = false;
          }
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setSpeechError('Microphone access failed. Triggering AI Voice Assistant fallback.');
      setIsRecording(false);
      isRecordingRef.current = false;
      triggerGeminiVoiceAssistant();
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setInterimTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const triggerGeminiVoiceAssistant = async () => {
    const question = assessmentQuestions[currentQ];
    try {
      const res = await fetch(`${API_BASE}/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: question.options || [] }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestedOption && question.type === 'choice') {
          setCurrentAnswer(data.suggestedOption);
        } else if (data.transcript && question.type === 'text') {
          setCurrentAnswer(prev => prev ? `${prev} ${data.transcript}` : data.transcript);
        }
      }
    } catch (e) {
      console.error('Gemini Voice Assistant error:', e);
    }
  };

  const handleTemplateSelect = (t: typeof templates[0]) => {
    stopRecording();
    setSelectedTemplate(t);
    setPhase('questions');
    setCurrentQ(0);
    setAnswers({});
  };

  const submitAssessmentToBackend = async () => {
    stopRecording();
    setSubmitting(true);

    const payload = {
      patientId,
      chwId: user?.id || 'usr-chw-001',
      templateId: selectedTemplate?.id || 'tpl-child',
      templateName: selectedTemplate?.name || 'Child Illness Assessment',
      notes: answers['q5'] || 'Assessment conducted in field visit.',
      vitals: { temperature: 38.5, heartRate: 110, respiratoryRate: 40 },
      answers: Object.entries(answers).map(([qId, val]) => ({ questionId: qId, value: val })),
    };

    if (!offlineSyncService.effectiveOnlineStatus()) {
      offlineSyncService.enqueue(
        'SUBMIT_ASSESSMENT',
        '/assessments/submit',
        'POST',
        payload,
        `Assessment (${selectedTemplate?.name || 'Protocol'})`,
        patientName
      );
      setSavedOffline(true);
      setSubmitting(false);
      setPhase('complete');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/assessments/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setSavedOffline(false);
    } catch {
      // Graceful offline outbox fallback
      offlineSyncService.enqueue(
        'SUBMIT_ASSESSMENT',
        '/assessments/submit',
        'POST',
        payload,
        `Assessment (${selectedTemplate?.name || 'Protocol'})`,
        patientName
      );
      setSavedOffline(true);
    } finally {
      setSubmitting(false);
      setPhase('complete');
    }
  };

  const handleNext = () => {
    stopRecording();
    const updated = { ...answers };
    if (currentAnswer) {
      updated[assessmentQuestions[currentQ].id] = currentAnswer;
      setAnswers(updated);
    }
    setCurrentAnswer('');

    if (currentQ < assessmentQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      submitAssessmentToBackend();
    }
  };

  const handleBack = () => {
    stopRecording();
    if (currentQ > 0) {
      setCurrentQ(prev => prev - 1);
      setCurrentAnswer(answers[assessmentQuestions[currentQ - 1].id] || '');
    } else {
      setPhase('select-template');
    }
  };

  if (phase === 'select-template') {
    return (
      <div>
        {/* Patient Selection Banner */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-info-bg, #eff6ff)',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SELECTED PATIENT
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                {patientName} <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>({patientId})</span>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/chw/patients')}>
            Change patient
          </Button>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Assessments</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Select a protocol template to begin assessment for <strong>{patientName}</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {templates.map(t => (
            <Card
              key={t.id}
              style={{ cursor: 'pointer', transition: 'box-shadow 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-lg)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
            >
              <CardContent style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <Badge variant="info">{t.category}</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.duration} min</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{t.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{t.description}</p>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => handleTemplateSelect(t)}>
                  Start assessment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: savedOffline ? '#fef3c7' : 'var(--color-success-bg, #f0fdf4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: savedOffline ? '#d97706' : '#16a34a'
        }}>
          {savedOffline ? '📶' : '✓'}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {savedOffline ? 'Assessment Queued to Offline Outbox' : `Assessment complete for ${patientName}`}
        </h2>
        {savedOffline ? (
          <div style={{ maxWidth: '480px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem', color: '#92400e', fontSize: '0.875rem', lineHeight: 1.5 }}>
            <strong>Offline Mode Active:</strong> This assessment has been saved securely to your device's local outbox. It will automatically synchronize with the central registry once internet connectivity is restored.
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px', lineHeight: 1.5 }}>
            The assessment record for <strong>{patientName}</strong> ({patientId}) has been submitted to the protocol engine. Case status is updated in the clinical registry.
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="outline" onClick={() => { setSavedOffline(false); setPhase('select-template'); }}>New assessment</Button>
          <Button variant="primary" onClick={() => navigate('/chw/cases')}>View cases →</Button>
        </div>
      </div>
    );
  }

  const question = assessmentQuestions[currentQ];
  const progress = ((currentQ + 1) / assessmentQuestions.length) * 100;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* Patient Indicator Header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
        }}
      >
        <span>Patient: <strong style={{ color: '#0f172a' }}>{patientName}</strong> ({patientId})</span>
        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{selectedTemplate?.name}</span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          <span>{selectedTemplate?.name}</span>
          <span>Question {currentQ + 1} of {assessmentQuestions.length}</span>
        </div>
        <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-secondary, #3b82f6)', transition: 'width 300ms ease', borderRadius: '999px' }} />
        </div>
      </div>

      <Card>
        <CardContent style={{ padding: '2.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            Question {currentQ + 1}
          </p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.4 }}>
            {question.text}
          </h2>
          {question.helpText && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--color-info-bg, #eff6ff)', borderRadius: '8px' }}>
              💡 {question.helpText}
            </p>
          )}

          {/* AI Voice Assistant trigger */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerGeminiVoiceAssistant}
              style={{ fontSize: '0.8rem', gap: '0.4rem', borderColor: '#3b82f6', color: '#1d4ed8' }}
            >
              ✨ AI Voice Simulation (Gemini)
            </Button>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Powered by Google Gemini</span>
          </div>

          {question.type === 'text' ? (
            <textarea
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              rows={4}
              placeholder={isRecording ? "Listening to your voice in real-time..." : "Type response here or tap the microphone below to speak..."}
              style={{
                width: '100%',
                border: isRecording ? '2px solid #ef4444' : '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.875rem',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                backgroundColor: isRecording ? '#fffafa' : 'white',
                transition: 'all 200ms ease',
                boxShadow: isRecording ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {question.options?.map(opt => (
                <button
                  key={opt}
                  onClick={() => setCurrentAnswer(opt)}
                  style={{
                    padding: '0.875rem 1rem', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500,
                    border: currentAnswer === opt ? '2px solid #1e3a5f' : '1px solid #e2e8f0',
                    backgroundColor: currentAnswer === opt ? '#f1f5f9' : 'white',
                    color: currentAnswer === opt ? '#0f172a' : '#334155',
                    transition: 'all 150ms',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Real-time Voice Input Button & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <button
                onClick={toggleVoiceRecording}
                type="button"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: isRecording ? '#ef4444' : 'var(--color-primary, #0f172a)',
                  color: 'white',
                  border: isRecording ? '3px solid #fecaca' : 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease',
                  boxShadow: isRecording ? '0 0 0 4px rgba(239, 68, 68, 0.35), 0 4px 12px rgba(239, 68, 68, 0.4)' : 'var(--shadow-sm)',
                  transform: isRecording ? 'scale(1.05)' : 'scale(1)',
                }}
                title={isRecording ? 'Click to stop recording' : 'Click to start real-time voice recording'}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isRecording ? '#dc2626' : 'var(--color-foreground, #0f172a)' }}>
                    {isRecording ? '🔴 Listening... speak into microphone' : 'Tap to record voice response'}
                  </span>
                  {isRecording && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '9999px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}>
                      {formatDuration(recordingDuration)}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {isRecording
                    ? 'Real-time speech-to-text converts directly into the message box above. Tap button again when done.'
                    : 'Click microphone to dictate response in real time.'}
                </span>
              </div>
            </div>

            {/* Live Streaming Transcript Feedback Banner */}
            {isRecording && (
              <div style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: '#fef2f2',
                border: '1px dashed #fca5a5',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>🎙️</span>
                <span>
                  <strong>Live Stream:</strong> {currentAnswer || interimTranscript || 'Listening for your voice...'}
                </span>
              </div>
            )}

            {speechError && (
              <div style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                fontSize: '0.775rem',
                color: '#92400e',
              }}>
                ⚠️ {speechError}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button variant="primary" onClick={handleNext} disabled={submitting}>
          {submitting ? 'Submitting…' : currentQ < assessmentQuestions.length - 1 ? 'Next →' : `Submit assessment for ${patientName.split(' ')[0]}`}
        </Button>
      </div>
    </div>
  );
};

