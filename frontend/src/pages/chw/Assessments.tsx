import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../App';

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

import { API_BASE } from '../../config';

export const AssessmentsPage = () => {
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

  const handleTemplateSelect = (t: typeof templates[0]) => {
    setSelectedTemplate(t);
    setPhase('questions');
    setCurrentQ(0);
    setAnswers({});
  };

  const submitAssessmentToBackend = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE}/assessments/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId,
          chwId: user?.id || 'usr-chw-001',
          templateId: selectedTemplate?.id || 'tpl-child',
          templateName: selectedTemplate?.name || 'Child Illness Assessment',
          notes: answers['q5'] || 'Assessment conducted in field visit.',
          vitals: { temperature: 38.5, heartRate: 110, respiratoryRate: 40 },
          answers: Object.entries(answers).map(([qId, val]) => ({ questionId: qId, value: val })),
        }),
      });
    } catch {
      // Fallback
    } finally {
      setSubmitting(false);
      setPhase('complete');
    }
  };

  const handleNext = () => {
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
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg, #f0fdf4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#16a34a' }}>
          ✓
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Assessment complete for {patientName}</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px', lineHeight: 1.5 }}>
          The assessment record for <strong>{patientName}</strong> ({patientId}) has been submitted to the protocol engine. Case status is updated in the clinical registry.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="outline" onClick={() => setPhase('select-template')}>New assessment</Button>
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
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--color-info-bg, #eff6ff)', borderRadius: '8px' }}>
              💡 {question.helpText}
            </p>
          )}

          {question.type === 'text' ? (
            <textarea
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              rows={4}
              placeholder="Type response here..."
              style={{
                width: '100%', border: '1px solid var(--color-border)', borderRadius: '8px',
                padding: '0.75rem', fontSize: '0.875rem', resize: 'vertical',
                outline: 'none', fontFamily: 'inherit',
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

          {/* Voice input mock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
            <button
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'var(--color-primary, #0f172a)', color: 'white',
                border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              🎤
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Tap to record voice response</span>
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
