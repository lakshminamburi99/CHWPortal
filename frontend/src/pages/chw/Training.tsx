import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

import { API_BASE } from '../../config';

export const TrainingPage = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [toast, setToast] = useState('');

  const fetchLessons = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/training/lessons`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLessons(data);
        } else {
          setLessons([
            {
              id: 'les-1',
              title: 'Pediatric Danger Sign Triage (iCCM)',
              category: 'Child Health',
              durationMinutes: 15,
              difficulty: 'Beginner',
              progress: 65,
              recommended: true,
              recommendationReason: 'High frequency of pediatric cases this week',
              slides: [
                { heading: 'Introduction to iCCM Protocol', body: 'Integrated Community Case Management (iCCM) equips frontline health workers to identify and triage life-threatening childhood illnesses in rural and underserved areas.', keyPoint: 'Early recognition prevents severe complications.' },
                { heading: 'Recognizing General Danger Signs', body: 'Immediate danger signs include inability to drink or breastfeed, continuous vomiting, convulsions during illness, and severe lethargy or unconsciousness.', keyPoint: 'Any general danger sign requires immediate referral.' },
                { heading: 'Respiratory Assessment & Fast Breathing', body: 'Count respiratory rate for a full 60 seconds with child calm. Thresholds: >= 50 breaths/min for 2-11 months, >= 40 breaths/min for 12-59 months.', keyPoint: 'Use a timer and ensure child is calm.' },
                { heading: 'Immediate Actions for High Risk', body: 'For high-risk findings, initiate pre-referral treatment (e.g. rectal artesunate if fever >38.5°C in malaria zone), arrange emergency transport, and notify clinical supervisor immediately.', keyPoint: 'Do not delay transport for administrative tasks.' },
              ],
            },
            {
              id: 'les-2',
              title: 'Antenatal Care: Danger Signs & Referral Criteria',
              category: 'Maternal Health',
              durationMinutes: 20,
              difficulty: 'Intermediate',
              progress: 100,
              recommended: false,
              recommendationReason: null,
              slides: [
                { heading: 'ANC Schedule & Core Objectives', body: 'WHO recommends at least 8 ANC contacts. Ensure early first trimester registration and screening for pre-eclampsia and gestational diabetes.', keyPoint: '8 contacts minimum for positive pregnancy experience.' },
                { heading: 'Hypertensive Disorders of Pregnancy', body: 'Systolic BP >= 140 mmHg or Diastolic >= 90 mmHg after 20 weeks indicates pre-eclampsia risk. Check for severe headaches, visual disturbances, and epigastric pain.', keyPoint: 'Elevated BP + headache = urgent escalation.' },
                { heading: 'Obstetric Hemorrhage & Warning Signs', body: 'Any vaginal bleeding in second or third trimester is an obstetric emergency requiring immediate transfer to a comprehensive EmONC facility.', keyPoint: 'Prepare emergency transport without delay.' },
              ],
            },
            {
              id: 'les-3',
              title: 'Community Hypertension Screening & Adherence',
              category: 'Chronic Disease',
              durationMinutes: 12,
              difficulty: 'Beginner',
              progress: 0,
              recommended: true,
              recommendationReason: 'New protocol guidelines updated for NCD surveillance',
              slides: [
                { heading: 'Accurate Blood Pressure Measurement', body: 'Ensure patient has rested for 5 minutes. Use appropriately sized cuff at heart level. Record two readings spaced 2 minutes apart.', keyPoint: 'Rest for 5 minutes prior to reading.' },
                { heading: 'Lifestyle Modification & Salt Intake', body: 'Counsel patients on sodium reduction, increased physical activity, and maintaining a healthy body weight.', keyPoint: 'Behavioral counseling improves long-term outcomes.' },
                { heading: 'Medication Adherence Support', body: 'Assess barriers to daily compliance, manage side-effect concerns, and schedule regular monthly refills before supply exhaustion.', keyPoint: 'Remind patients never to stop treatment abruptly.' },
              ],
            },
            {
              id: 'les-4',
              title: 'Infection Prevention & Field Clinical Safety',
              category: 'Clinical Practice',
              durationMinutes: 10,
              difficulty: 'Beginner',
              progress: 40,
              recommended: false,
              recommendationReason: null,
              slides: [
                { heading: 'Hand Hygiene Protocols', body: 'Perform hand hygiene before and after every patient interaction using alcohol-based rub or soap and clean water for at least 20 seconds.', keyPoint: '20 seconds friction with clean water and soap.' },
                { heading: 'Personal Protective Equipment (PPE)', body: 'Wear clean gloves during wound inspection, rapid diagnostic testing, and vital measurements where fluid contact is possible.', keyPoint: 'Change gloves between patients.' },
                { heading: 'Safe Sharps & Waste Disposal', body: 'Dispose of lancets and test cartridges immediately into puncture-proof safety boxes. Never recap needles.', keyPoint: 'Never recap or bend used sharps.' },
              ],
            },
            {
              id: 'les-5',
              title: 'Severe Acute Malnutrition (SAM) Screening via MUAC',
              category: 'Nutrition',
              durationMinutes: 18,
              difficulty: 'Intermediate',
              progress: 25,
              recommended: false,
              recommendationReason: null,
              slides: [
                { heading: 'Mid-Upper Arm Circumference (MUAC) Technique', body: 'Locate midpoint between shoulder and elbow on left arm. Apply color-coded MUAC tape without pinching.', keyPoint: 'Left arm relaxed at side.' },
                { heading: 'Triage Color Codes', body: 'Red (<11.5 cm): Severe Acute Malnutrition (SAM). Yellow (11.5 - 12.4 cm): Moderate Acute Malnutrition (MAM). Green (>= 12.5 cm): Normal.', keyPoint: 'Red indicates emergency malnutrition protocol.' },
                { heading: 'Bilateral Pitting Edema Check', body: 'Apply gentle thumb pressure to both feet for 3 seconds. Pitting edema indicates severe malnutrition regardless of MUAC measurement.', keyPoint: 'Edema + fever = inpatient referral.' },
              ],
            },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const openLesson = (lesson: any) => {
    setActiveLesson(lesson);
    setCurrentSlideIndex(0);
  };

  const handleNextSlide = async () => {
    if (!activeLesson) return;
    const slides = activeLesson.slides || [];
    const totalSlides = slides.length || 1;
    const nextIndex = currentSlideIndex + 1;

    if (nextIndex < totalSlides) {
      setCurrentSlideIndex(nextIndex);
      const calculatedProgress = Math.round(((nextIndex + 1) / totalSlides) * 100);
      if (calculatedProgress > (activeLesson.progress || 0)) {
        saveProgress(activeLesson.id, calculatedProgress);
      }
    } else {
      await saveProgress(activeLesson.id, 100);
      setToast(`Completed "${activeLesson.title}"! 🎉`);
      setTimeout(() => setToast(''), 4000);
      setActiveLesson(null);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
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
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, progress: updated.progress } : l));
        if (activeLesson && activeLesson.id === lessonId) {
          setActiveLesson((prev: any) => prev ? { ...prev, progress: updated.progress } : null);
        }
      }
    } catch {
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, progress: progressValue } : l));
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Clinical Training & Learning Pathways</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Continuous medical education, accredited protocols, and triage competencies</p>
        </div>
      </div>

      {toast && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ✓ {toast}
        </div>
      )}

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL MODULES', value: lessons.length.toString(), sub: 'In curriculum' },
          { label: 'IN PROGRESS', value: inProgressCount.toString(), sub: 'Active modules' },
          { label: 'COMPLETED', value: completedCount.toString(), sub: 'Certified skills' },
          { label: 'OVERALL PROGRESS', value: `${avgProgress}%`, sub: 'Curriculum mastery' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{kpi.label}</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{kpi.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{kpi.sub}</p>
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
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filterCategory === cat ? 'white' : 'var(--color-text-muted)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommended Section */}
      {filteredLessons.some(l => l.recommended) && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>⭐ Recommended for Your Caseload</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {filteredLessons.filter(l => l.recommended).map(l => (
              <Card key={l.id} style={{ borderLeft: '4px solid var(--color-primary)' }}>
                <CardContent style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <Badge variant="info">{l.category}</Badge>
                    <Badge variant="default">{l.difficulty}</Badge>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem' }}>{l.title}</h3>
                  {l.recommendationReason && (
                    <p style={{ fontSize: '0.8rem', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.35rem 0.6rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                      💡 {l.recommendationReason}
                    </p>
                  )}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      <span>Progress</span><span>{l.progress || 0}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${l.progress || 0}%`, height: '100%', backgroundColor: l.progress === 100 ? 'var(--color-success)' : 'var(--color-secondary)', borderRadius: '999px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>⏱ {l.durationMinutes || 15} mins · {l.slides?.length || 4} slides</span>
                    <Button
                      size="sm"
                      variant={l.progress === 100 ? 'outline' : 'primary'}
                      onClick={() => openLesson(l)}
                    >
                      {l.progress === 100 ? 'Review module' : l.progress > 0 ? 'Continue' : 'Start module'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Available Modules */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>All Modules ({filteredLessons.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredLessons.map(l => (
          <Card key={l.id}>
            <CardContent style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge variant="info">{l.category}</Badge>
                  <Badge variant="default">{l.difficulty}</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>⏱ {l.durationMinutes || 15} min</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📑 {l.slides?.length || 4} slides</span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{l.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: l.progress === 100 ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                    {l.progress || 0}%
                  </span>
                  <div style={{ width: '80px', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden', marginTop: '3px' }}>
                    <div style={{ width: `${l.progress || 0}%`, height: '100%', backgroundColor: l.progress === 100 ? 'var(--color-success)' : 'var(--color-secondary)' }} />
                  </div>
                </div>
                <Button size="sm" variant={l.progress === 100 ? 'outline' : 'primary'} onClick={() => openLesson(l)}>
                  {l.progress === 100 ? 'Review' : l.progress > 0 ? 'Continue' : 'Start'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Lesson Slide Viewer Modal */}
      {activeLesson && (() => {
        const slides = activeLesson.slides || [];
        const currentSlide = slides[currentSlideIndex] || {};
        const slideTitle = currentSlide.title || currentSlide.heading || `Slide ${currentSlideIndex + 1}`;
        const slideBody = currentSlide.content || currentSlide.body || 'Follow protocol instructions.';
        const keyPoint = currentSlide.keyPoint;

        return (
          <Modal isOpen={!!activeLesson} onClose={() => setActiveLesson(null)} title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                <Badge variant="info">{activeLesson.category}</Badge>
                <Badge variant="default">{activeLesson.difficulty}</Badge>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Slide {currentSlideIndex + 1} of {slides.length || 1}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeLesson.title}</h2>
            </div>
          }
          footer={<>
            <Button
              variant="outline"
              onClick={handlePrevSlide}
              disabled={currentSlideIndex === 0}
            >
              Previous slide
            </Button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                onClick={() => saveProgress(activeLesson.id, 100)}
                disabled={savingProgress || activeLesson.progress === 100}
              >
                {activeLesson.progress === 100 ? 'Completed ✓' : 'Mark 100% complete'}
              </Button>
              <Button
                variant="primary"
                onClick={handleNextSlide}
                disabled={savingProgress}
              >
                {currentSlideIndex + 1 < slides.length ? 'Next slide →' : 'Complete lesson ✓'}
              </Button>
            </div>
          </>}
          >
            {/* Slide content box */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0', minHeight: '200px', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                {slideTitle}
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, marginBottom: keyPoint ? '1rem' : 0 }}>
                {slideBody}
              </p>
              {keyPoint && (
                <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', color: '#1e40af' }}>
                  <strong>Key Clinical Takeaway:</strong> {keyPoint}
                </div>
              )}
            </div>

            {/* Progress Bar in modal */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                <span>Lesson Completion</span>
                <span>{activeLesson.progress || 0}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${activeLesson.progress || 0}%`, height: '100%', backgroundColor: activeLesson.progress === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
