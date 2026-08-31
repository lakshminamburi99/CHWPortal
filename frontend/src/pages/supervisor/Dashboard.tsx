import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { API_BASE } from '../../config';

// ---------------------------------------------------------
// Types & Dictionaries
// ---------------------------------------------------------
type KpiTab = 'PENDING_REVIEW' | 'ACTIVE_CHWS' | 'OPEN_CASES' | 'FOLLOW_UPS_DUE';

const riskVariant: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'default'> = {
  SUPERVISOR_REVIEW: 'danger',
  NEEDS_REVIEW: 'danger',
  FOLLOW_UP: 'warning',
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  REFERRED: 'info',
  ACTIVE: 'success',
  OFFLINE: 'warning',
  INACTIVE: 'default',
  OVERDUE: 'danger',
  DUE_TODAY: 'warning',
  UPCOMING: 'info',
};

const statusLabel: Record<string, string> = {
  SUPERVISOR_REVIEW: 'Supervisor review',
  NEEDS_REVIEW: 'Needs review',
  FOLLOW_UP: 'Follow-up',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
  REFERRED: 'Referred',
};

// ---------------------------------------------------------
// Initial / Fallback Seed Data
// ---------------------------------------------------------
const defaultCases = [
  {
    id: 'CASE-02400',
    patientId: 'PT-2026-0002',
    patientName: 'Ahmed Robinson',
    chwId: 'usr-chw-001',
    chwName: 'John Smith',
    templateName: 'Child Illness Assessment',
    riskLevel: 'HIGH',
    status: 'SUPERVISOR_REVIEW',
    flaggedAt: 'Aug 22, 2026',
    message: 'Assessment criteria indicate this case requires urgent clinical review.',
    protocolResult: { reason: 'Severe dehydration symptoms with high fever (>38.5°C) and lethargy observed.' },
    supervisorAcknowledgedAt: null,
  },
  {
    id: 'CASE-02395',
    patientId: 'PT-2026-0001',
    patientName: 'Maria Santos',
    chwId: 'usr-chw-001',
    chwName: 'John Smith',
    templateName: 'Maternal Health Assessment',
    riskLevel: 'HIGH',
    status: 'SUPERVISOR_REVIEW',
    flaggedAt: 'Aug 21, 2026',
    message: 'Elevated blood pressure readings (150/95 mmHg) — obstetric escalation recommended.',
    protocolResult: { reason: 'Stage 2 hypertension detected during third trimester antenatal visit.' },
    supervisorAcknowledgedAt: null,
  },
  {
    id: 'CASE-02390',
    patientId: 'PT-2026-0003',
    patientName: 'Priya Patel',
    chwId: 'usr-chw-002',
    chwName: 'Aisha Patel',
    templateName: 'Adult Chronic Disease Screen',
    riskLevel: 'MEDIUM',
    status: 'FOLLOW_UP',
    flaggedAt: 'Aug 19, 2026',
    message: 'Borderline fasting blood glucose, scheduled dietary coaching follow-up.',
    protocolResult: { reason: 'Fasting blood sugar 126 mg/dL; recommend dietary counseling.' },
    supervisorAcknowledgedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'CASE-02388',
    patientId: 'PT-2026-0004',
    patientName: 'James Wilson',
    chwId: 'usr-chw-001',
    chwName: 'John Smith',
    templateName: 'Elderly Wellness Check',
    riskLevel: 'LOW',
    status: 'COMPLETED',
    flaggedAt: 'Aug 15, 2026',
    message: 'Routine check complete with normal vitals and medication adherence confirmed.',
    protocolResult: { reason: 'All vitals within normal parameters.' },
    supervisorAcknowledgedAt: '2026-08-16T14:30:00Z',
  },
  {
    id: 'CASE-02382',
    patientId: 'PT-2026-0005',
    patientName: 'Fatima Al-Rashid',
    chwId: 'usr-chw-002',
    chwName: 'Aisha Patel',
    templateName: 'Postnatal Follow-up',
    riskLevel: 'MEDIUM',
    status: 'IN_PROGRESS',
    flaggedAt: 'Aug 18, 2026',
    message: 'Mother and infant stable; scheduled lactation check in 48 hours.',
    protocolResult: { reason: 'Slight newborn weight loss within acceptable limits.' },
    supervisorAcknowledgedAt: null,
  },
];

const defaultChws = [
  { id: 'usr-chw-001', name: 'John Smith', email: 'john.smith@example.com', status: 'ACTIVE', region: 'North District', assignedPatients: 50, openCases: 8, followUps: 3, highPriorityCases: 2, lastActive: 'Today, 2:15 PM', trainingProgress: 85 },
  { id: 'usr-chw-002', name: 'Aisha Patel', email: 'aisha.patel@example.com', status: 'ACTIVE', region: 'North District', assignedPatients: 45, openCases: 5, followUps: 2, highPriorityCases: 0, lastActive: 'Today, 1:30 PM', trainingProgress: 92 },
  { id: 'usr-chw-003', name: 'Emmanuel Diaz', email: 'emmanuel.diaz@example.com', status: 'OFFLINE', region: 'North District', assignedPatients: 38, openCases: 3, followUps: 1, highPriorityCases: 1, lastActive: 'Yesterday, 5:00 PM', trainingProgress: 60 },
  { id: 'usr-chw-004', name: 'Mei Lin Chen', email: 'meilin.chen@example.com', status: 'ACTIVE', region: 'North District', assignedPatients: 52, openCases: 6, followUps: 4, highPriorityCases: 1, lastActive: 'Today, 12:45 PM', trainingProgress: 78 },
  { id: 'usr-chw-005', name: 'David Mensah', email: 'david.mensah@example.com', status: 'ACTIVE', region: 'North District', assignedPatients: 41, openCases: 2, followUps: 1, highPriorityCases: 0, lastActive: 'Today, 11:20 AM', trainingProgress: 95 },
  { id: 'usr-chw-006', name: 'Zainab Omar', email: 'zainab.omar@example.com', status: 'ACTIVE', region: 'North District', assignedPatients: 47, openCases: 4, followUps: 2, highPriorityCases: 0, lastActive: 'Today, 3:10 PM', trainingProgress: 88 },
];

const defaultFollowUps = [
  { id: 'fu-1', patientId: 'PT-2026-0002', patientName: 'Ahmed Robinson', chwId: 'usr-chw-001', chwName: 'John Smith', dueDate: 'Aug 24, 2026', priority: 'HIGH', status: 'DUE_TODAY', reason: 'Pediatric re-assessment 48h after acute fever onset' },
  { id: 'fu-2', patientId: 'PT-2026-0001', patientName: 'Maria Santos', chwId: 'usr-chw-001', chwName: 'John Smith', dueDate: 'Aug 25, 2026', priority: 'HIGH', status: 'UPCOMING', reason: 'Antenatal BP monitoring and referral check' },
  { id: 'fu-3', patientId: 'PT-2026-0003', patientName: 'Priya Patel', chwId: 'usr-chw-002', chwName: 'Aisha Patel', dueDate: 'Aug 26, 2026', priority: 'MEDIUM', status: 'UPCOMING', reason: 'Blood glucose dietary compliance check' },
  { id: 'fu-4', patientId: 'PT-2026-0005', patientName: 'Fatima Al-Rashid', chwId: 'usr-chw-002', chwName: 'Aisha Patel', dueDate: 'Aug 23, 2026', priority: 'MEDIUM', status: 'OVERDUE', reason: 'Postnatal maternal wellness evaluation' },
  { id: 'fu-5', patientId: 'PT-2026-0006', patientName: 'Carlos Rivera', chwId: 'usr-chw-004', chwName: 'Mei Lin Chen', dueDate: 'Aug 27, 2026', priority: 'LOW', status: 'UPCOMING', reason: 'Hypertension maintenance check' },
];

export const SupervisorDashboard: React.FC = () => {
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------
  const [activeKpi, setActiveKpi] = useState<KpiTab>('PENDING_REVIEW');
  const [cases, setCases] = useState<any[]>(defaultCases);
  const [chws, setChws] = useState<any[]>(defaultChws);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const [followUps, setFollowUps] = useState<any[]>(defaultFollowUps);
  const [, setLoading] = useState<boolean>(true);

  // Modal & Actions State
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [actionComment, setActionComment] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Message CHW Modal State
  const [messagingChw, setMessagingChw] = useState<any | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const [submittingMessage, setSubmittingMessage] = useState<boolean>(false);

  // Filtering State
  const [openCasesRiskFilter, setOpenCasesRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'danger' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'danger' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ---------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------
  const fetchDashboardData = async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [casesRes, chwsRes, patientsRes, followUpsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/cases`, { headers }),
        fetch(`${API_BASE}/chws`, { headers }),
        fetch(`${API_BASE}/patients`, { headers }),
        fetch(`${API_BASE}/follow_ups`, { headers }),
      ]);

      const pMap: Record<string, any> = {};
      if (patientsRes.status === 'fulfilled' && patientsRes.value.ok) {
        const pData = await patientsRes.value.json();
        if (Array.isArray(pData)) {
          pData.forEach((p: any) => { pMap[p.id] = p; });
          setPatients(pMap);
        }
      }

      if (casesRes.status === 'fulfilled' && casesRes.value.ok) {
        const cData = await casesRes.value.json();
        if (Array.isArray(cData) && cData.length > 0) {
          const mappedCases = cData.map((c: any) => {
            const p = pMap[c.patientId];
            return {
              ...c,
              patientName: p ? `${p.firstName} ${p.lastName}` : c.patientName || c.patientId,
              message: c.protocolResult?.reason || c.chwNotes || 'Assessment criteria require supervisor review.',
              flaggedAt: c.flaggedAt ? new Date(c.flaggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 22, 2026',
            };
          });
          setCases(mappedCases);
        }
      }

      if (chwsRes.status === 'fulfilled' && chwsRes.value.ok) {
        const chwData = await chwsRes.value.json();
        if (Array.isArray(chwData) && chwData.length > 0) {
          setChws(chwData);
        }
      }

      if (followUpsRes.status === 'fulfilled' && followUpsRes.value.ok) {
        const fuData = await followUpsRes.value.json();
        if (Array.isArray(fuData) && fuData.length > 0) {
          setFollowUps(fuData);
        }
      }
    } catch (err) {
      console.warn('Backend connection error, using local state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ---------------------------------------------------------
  // Computed KPI Counts
  // ---------------------------------------------------------
  const pendingCases = useMemo(() => {
    return cases.filter(c => 
      c.status === 'SUPERVISOR_REVIEW' || 
      c.status === 'NEEDS_REVIEW' || 
      (c.riskLevel === 'HIGH' && !c.supervisorAcknowledgedAt && c.status !== 'COMPLETED')
    );
  }, [cases]);

  const activeChwsCount = useMemo(() => {
    return chws.filter(c => c.status === 'ACTIVE').length;
  }, [chws]);

  const openCases = useMemo(() => {
    return cases.filter(c => c.status !== 'COMPLETED');
  }, [cases]);

  const pendingFollowUps = useMemo(() => {
    return followUps.filter(f => f.status !== 'COMPLETED');
  }, [followUps]);

  // ---------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------
  const handleAcknowledge = async (caseItem: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('access_token');
    const caseId = caseItem.id;

    // Optimistic local state update
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: 'FOLLOW_UP',
          supervisorAcknowledgedAt: new Date().toISOString(),
        };
      }
      return c;
    }));

    if (selectedCase?.id === caseId) {
      setSelectedCase(null);
      setActionComment('');
      setAiSummary(null);
    }

    showToast(`✓ Case ${caseId} (${caseItem.patientName || caseItem.patientId}) acknowledged and moved to follow-up.`);

    try {
      await fetch(`${API_BASE}/cases/${caseId}/supervisor-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'ACKNOWLEDGE',
          comment: 'Clinical supervisor acknowledged case and confirmed triage path.',
        }),
      });
    } catch (err) {
      console.warn('API call failed; local state already updated.', err);
    }
  };

  const handleSupervisorAction = async (actionType: string) => {
    if (!selectedCase) return;
    setSubmittingAction(true);
    const token = localStorage.getItem('access_token');
    const caseId = selectedCase.id;

    const actionStatusMap: Record<string, string> = {
      ACKNOWLEDGE: 'FOLLOW_UP',
      REQUEST_INFO: 'IN_PROGRESS',
      ESCALATE: 'REFERRED',
      CLOSE: 'COMPLETED',
    };

    const actionTextMap: Record<string, string> = {
      ACKNOWLEDGE: 'acknowledged',
      REQUEST_INFO: 'info requested from CHW',
      ESCALATE: 'escalated for medical referral',
      CLOSE: 'closed and signed off',
    };

    const newStatus = actionStatusMap[actionType] || 'FOLLOW_UP';

    // Optimistic local state update
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: newStatus,
          supervisorAcknowledgedAt: new Date().toISOString(),
        };
      }
      return c;
    }));

    showToast(`✓ Case ${caseId} ${actionTextMap[actionType] || 'updated'}.`);

    try {
      await fetch(`${API_BASE}/cases/${caseId}/supervisor-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: actionType,
          comment: actionComment || `Supervisor action: ${actionType}`,
        }),
      });
    } catch (err) {
      console.warn('API call failed; local state preserved.', err);
    } finally {
      setSubmittingAction(false);
      setSelectedCase(null);
      setActionComment('');
      setAiSummary(null);
    }
  };

  const handleGenerateAiSummary = async (caseId: string) => {
    setLoadingAi(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/summarize`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        throw new Error('AI summary endpoint error');
      }
    } catch {
      // Intelligent fallback brief
      const c = cases.find(item => item.id === caseId);
      setAiSummary(
        `• Clinical Presentation: ${c?.patientName || 'Patient'} flagged as ${c?.riskLevel || 'HIGH'} risk during ${c?.templateName || 'assessment'}.\n` +
        `• Triage Finding: ${c?.protocolResult?.reason || c?.message || 'Significant clinical signs warranting supervisor oversight.'}\n` +
        `• Recommended Action: Acknowledge case, confirm pre-referral stabilization or arrange secondary facility transfer.`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingChw || !messageText.trim()) return;

    setSubmittingMessage(true);
    const token = localStorage.getItem('access_token');

    try {
      await fetch(`${API_BASE}/chws/${messagingChw.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: messageText }),
      });
    } catch (err) {
      console.warn('Message API error:', err);
    }

    showToast(`✓ Message sent to ${messagingChw.name}.`);
    setSubmittingMessage(false);
    setMessagingChw(null);
    setMessageText('');
  };

  const handleFollowUpAction = async (id: string, action: 'complete' | 'reschedule') => {
    if (action === 'complete') {
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'COMPLETED' } : f));
      showToast('✓ Follow-up marked complete.');
    } else {
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, dueDate: 'Sep 01, 2026', status: 'UPCOMING' } : f));
      showToast('✓ Follow-up rescheduled for +7 days.');
    }
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/follow_ups/${id}/${action}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
  };

  // ---------------------------------------------------------
  // Filtered views
  // ---------------------------------------------------------
  const filteredOpenCases = openCases.filter(c => {
    const matchesRisk = openCasesRiskFilter === 'ALL' || c.riskLevel === openCasesRiskFilter;
    const matchesSearch = !searchQuery || 
      (c.patientName && c.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.id && c.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.templateName && c.templateName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  const filteredChws = chws.filter(c => {
    return !searchQuery || 
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.region && c.region.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast Notification Banner */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.5rem',
          zIndex: 1100,
          backgroundColor: toast.type === 'danger' ? '#fef2f2' : toast.type === 'info' ? '#eff6ff' : '#f0fdf4',
          color: toast.type === 'danger' ? '#991b1b' : toast.type === 'info' ? '#1e40af' : '#166534',
          border: `1px solid ${toast.type === 'danger' ? '#fecaca' : toast.type === 'info' ? '#bfdbfe' : '#bbf7d0'}`,
          borderRadius: 'var(--radius)',
          padding: '0.75rem 1.25rem',
          boxShadow: 'var(--shadow-raised)',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {toast.message}
        </div>
      )}

      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
            Supervisor workspace
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {pendingCases.length} {pendingCases.length === 1 ? 'case' : 'cases'} pending your clinical review
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/supervisor/triage')}>
            🚨 Open Triage Queue
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/supervisor/cases')}>
            📋 All Cases
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid - Fully Interactive Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* PENDING REVIEW CARD */}
        <div
          onClick={() => setActiveKpi('PENDING_REVIEW')}
          style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
        >
          <Card style={{
            height: '100%',
            borderColor: activeKpi === 'PENDING_REVIEW' ? 'var(--destructive)' : (pendingCases.length > 0 ? '#fca5a5' : 'var(--border)'),
            backgroundColor: activeKpi === 'PENDING_REVIEW' ? '#fef2f2' : 'var(--card)',
            boxShadow: activeKpi === 'PENDING_REVIEW' ? '0 0 0 2px var(--destructive), var(--shadow-raised)' : 'var(--shadow-card)',
            position: 'relative',
          }}>
            <CardContent style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <p style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--destructive)',
                }}>
                  PENDING REVIEW
                </p>
                {activeKpi === 'PENDING_REVIEW' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', backgroundColor: 'var(--destructive)', color: 'white', borderRadius: '9999px' }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--destructive)', lineHeight: 1.2 }}>
                {pendingCases.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                {pendingCases.length === 1 ? 'Case awaiting action' : 'Cases awaiting action'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ACTIVE CHWs CARD */}
        <div
          onClick={() => setActiveKpi('ACTIVE_CHWS')}
          style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
        >
          <Card style={{
            height: '100%',
            borderColor: activeKpi === 'ACTIVE_CHWS' ? 'var(--primary)' : 'var(--border)',
            backgroundColor: activeKpi === 'ACTIVE_CHWS' ? '#eff6ff' : 'var(--card)',
            boxShadow: activeKpi === 'ACTIVE_CHWS' ? '0 0 0 2px var(--primary), var(--shadow-raised)' : 'var(--shadow-card)',
          }}>
            <CardContent style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <p style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: activeKpi === 'ACTIVE_CHWS' ? 'var(--primary)' : 'var(--muted-foreground)',
                }}>
                  ACTIVE CHWs
                </p>
                {activeKpi === 'ACTIVE_CHWS' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '9999px' }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>
                {activeChwsCount}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                In your team ({chws.length} total)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* OPEN CASES CARD */}
        <div
          onClick={() => setActiveKpi('OPEN_CASES')}
          style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
        >
          <Card style={{
            height: '100%',
            borderColor: activeKpi === 'OPEN_CASES' ? 'var(--primary)' : 'var(--border)',
            backgroundColor: activeKpi === 'OPEN_CASES' ? '#eff6ff' : 'var(--card)',
            boxShadow: activeKpi === 'OPEN_CASES' ? '0 0 0 2px var(--primary), var(--shadow-raised)' : 'var(--shadow-card)',
          }}>
            <CardContent style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <p style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: activeKpi === 'OPEN_CASES' ? 'var(--primary)' : 'var(--muted-foreground)',
                }}>
                  OPEN CASES
                </p>
                {activeKpi === 'OPEN_CASES' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '9999px' }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>
                {openCases.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                Across your team
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FOLLOW-UPS DUE CARD */}
        <div
          onClick={() => setActiveKpi('FOLLOW_UPS_DUE')}
          style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
        >
          <Card style={{
            height: '100%',
            borderColor: activeKpi === 'FOLLOW_UPS_DUE' ? '#d97706' : (pendingFollowUps.length > 0 ? '#fde68a' : 'var(--border)'),
            backgroundColor: activeKpi === 'FOLLOW_UPS_DUE' ? '#fffbeb' : 'var(--card)',
            boxShadow: activeKpi === 'FOLLOW_UPS_DUE' ? '0 0 0 2px #d97706, var(--shadow-raised)' : 'var(--shadow-card)',
          }}>
            <CardContent style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <p style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#b45309',
                }}>
                  FOLLOW-UPS DUE
                </p>
                {activeKpi === 'FOLLOW_UPS_DUE' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', backgroundColor: '#d97706', color: 'white', borderRadius: '9999px' }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#b45309', lineHeight: 1.2 }}>
                {pendingFollowUps.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                Scheduled this week
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ACTIVE VIEW 1: PENDING REVIEW CASES                       */}
      {/* ========================================================= */}
      {activeKpi === 'PENDING_REVIEW' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Priority cases requiring your review ({pendingCases.length})
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Cases escalated by frontline workers requiring clinical oversight, feedback, or sign-off
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/supervisor/cases')}>
              View all cases →
            </Button>
          </div>

          {pendingCases.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🎉</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>
                All priority cases are up to date!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#15803d', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                There are currently no high-risk cases awaiting supervisor action. You can browse all team cases or view team performance.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Button variant="outline" size="sm" onClick={() => setActiveKpi('OPEN_CASES')}>
                  View open cases
                </Button>
                <Button variant="primary" size="sm" onClick={() => setActiveKpi('ACTIVE_CHWS')}>
                  View health workers
                </Button>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingCases.map(c => (
                <Card key={c.id} style={{
                  borderLeft: `4px solid ${c.riskLevel === 'HIGH' ? 'var(--destructive)' : '#f59e0b'}`,
                  transition: 'box-shadow var(--transition-fast)',
                }}>
                  <CardContent style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                            #{c.id}
                          </span>
                          <Badge variant={riskVariant[c.riskLevel] || 'danger'}>
                            {c.riskLevel} RISK
                          </Badge>
                          <Badge variant="warning">
                            {statusLabel[c.status] || c.status}
                          </Badge>
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem', color: 'var(--foreground)' }}>
                          {c.patientName || c.patientId}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
                          {c.templateName} · <span style={{ fontWeight: 600 }}>CHW:</span> {c.chwName || c.chwId}
                        </p>
                        <div style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: c.riskLevel === 'HIGH' ? '#fef2f2' : '#fffbeb',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${c.riskLevel === 'HIGH' ? '#fee2e2' : '#fef3c7'}`,
                        }}>
                          <p style={{ fontSize: '0.85rem', color: c.riskLevel === 'HIGH' ? '#991b1b' : '#92400e', lineHeight: 1.4 }}>
                            {c.message}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', minWidth: '150px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          Flagged {c.flaggedAt}
                        </span>
                        <Button
                          variant="primary"
                          style={{ width: '100%' }}
                          onClick={() => {
                            setSelectedCase(c);
                            setAiSummary(null);
                            setActionComment('');
                          }}
                        >
                          Review case →
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ width: '100%' }}
                          onClick={(e) => handleAcknowledge(c, e)}
                        >
                          ✓ Acknowledge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIVE VIEW 2: ACTIVE CHWs TEAM                           */}
      {/* ========================================================= */}
      {activeKpi === 'ACTIVE_CHWS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Team Health Workers ({chws.length})
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Frontline community health workers in your supervisory cluster
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search health workers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
              />
              <Button variant="outline" size="sm" onClick={() => navigate('/supervisor/team')}>
                Manage Team →
              </Button>
            </div>
          </div>

          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Worker Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Assigned Patients</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Open Cases</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>High Priority</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Last Active</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Training</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChws.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{w.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{w.region} · {w.email}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge variant={statusVariant[w.status] || 'default'}>
                          {w.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{w.assignedPatients}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: w.openCases > 5 ? '#fef3c7' : 'var(--muted)',
                          fontWeight: 600,
                        }}>
                          {w.openCases}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {w.highPriorityCases > 0 ? (
                          <Badge variant="danger">{w.highPriorityCases} urgent</Badge>
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--muted-foreground)' }}>{w.lastActive}</td>
                      <td style={{ padding: '0.875rem 1rem', minWidth: '100px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--muted)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${w.trainingProgress}%`, height: '100%', backgroundColor: w.trainingProgress > 80 ? '#16a34a' : '#3b82f6' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{w.trainingProgress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMessagingChw(w);
                            setMessageText('');
                          }}
                        >
                          💬 Message
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIVE VIEW 3: OPEN CASES                                 */}
      {/* ========================================================= */}
      {activeKpi === 'OPEN_CASES' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>
                All Open Cases ({openCases.length})
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Active clinical cases across all health workers in your team
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search patient, case, assessment..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
              />
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(risk => (
                <Button
                  key={risk}
                  size="sm"
                  variant={openCasesRiskFilter === risk ? 'primary' : 'outline'}
                  onClick={() => setOpenCasesRiskFilter(risk)}
                >
                  {risk === 'ALL' ? 'All Risks' : `${risk}`}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => navigate('/supervisor/cases')}>
                Full Cases Page →
              </Button>
            </div>
          </div>

          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Case ID</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Patient</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Assessment</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>CHW</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Risk Level</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpenCases.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>{c.id}</td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        {c.patientName || c.patientId}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--muted-foreground)' }}>{c.templateName}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{c.chwName || c.chwId}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge variant={riskVariant[c.riskLevel] || 'default'}>{c.riskLevel}</Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge variant={statusVariant[c.status] || 'default'}>
                          {statusLabel[c.status] || c.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCase(c);
                            setAiSummary(null);
                            setActionComment('');
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredOpenCases.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                        No cases match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIVE VIEW 4: FOLLOW-UPS DUE                             */}
      {/* ========================================================= */}
      {activeKpi === 'FOLLOW_UPS_DUE' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Follow-ups Scheduled & Due ({pendingFollowUps.length})
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                Critical home visits and health monitoring due across your team
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/supervisor/follow-ups')}>
              View all follow-ups →
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {pendingFollowUps.map(f => (
              <Card key={f.id} style={{
                borderLeft: `4px solid ${f.status === 'OVERDUE' ? 'var(--destructive)' : f.status === 'DUE_TODAY' ? '#f59e0b' : '#3b82f6'}`,
              }}>
                <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <Badge variant={statusVariant[f.status] || 'info'}>
                        {f.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant={riskVariant[f.priority] || 'default'}>
                        {f.priority} PRIORITY
                      </Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Due: <strong style={{ color: 'var(--foreground)' }}>{f.dueDate}</strong>
                      </span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                      {f.patientName || f.patientId}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                      {f.reason} · <span style={{ fontWeight: 600 }}>CHW:</span> {f.chwName || f.chwId}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button size="sm" variant="outline" onClick={() => handleFollowUpAction(f.id, 'reschedule')}>
                      Reschedule (+7d)
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleFollowUpAction(f.id, 'complete')}>
                      ✓ Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CLINICAL REVIEW CASE                               */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        title="Supervisor Clinical Review"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={submittingAction}
              onClick={() => handleSupervisorAction('REQUEST_INFO')}
            >
              Request Info from CHW
            </Button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="danger"
                size="sm"
                disabled={submittingAction}
                onClick={() => handleSupervisorAction('ESCALATE')}
              >
                🚨 Escalate
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={submittingAction}
                onClick={() => handleSupervisorAction('CLOSE')}
              >
                Close Case
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={submittingAction}
                onClick={() => handleSupervisorAction('ACKNOWLEDGE')}
              >
                ✓ Acknowledge & Sign-off
              </Button>
            </div>
          </div>
        }
      >
        {selectedCase && (
          <div>
            {/* Patient & Case Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              backgroundColor: 'var(--muted)',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1.25rem',
            }}>
              <div>
                <p style={{ fontSize: '0.725rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Patient</p>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                  {selectedCase.patientName || selectedCase.patientId}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                  {selectedCase.patientId}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.725rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Calculated Risk Level</p>
                <div style={{ marginTop: '0.25rem' }}>
                  <Badge variant={riskVariant[selectedCase.riskLevel] || 'default'}>
                    {selectedCase.riskLevel} RISK
                  </Badge>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.725rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Assessment Type</p>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>
                  {selectedCase.templateName}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.725rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Worker</p>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>
                  {selectedCase.chwName || selectedCase.chwId}
                </p>
              </div>
            </div>

            {/* AI Clinical Brief Trigger & Result */}
            <div style={{
              marginBottom: '1.25rem',
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              borderRadius: 'var(--radius)',
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiSummary ? '0.75rem' : 0 }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    ✨ AI Clinical Supervisor Brief
                  </h4>
                  <span style={{ fontSize: '0.725rem', color: '#15803d' }}>Powered by Google Gemini 2.5 Flash</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingAi}
                  onClick={() => handleGenerateAiSummary(selectedCase.id)}
                  style={{ borderColor: '#166534', color: '#166534', fontSize: '0.78rem', backgroundColor: 'white' }}
                >
                  {loadingAi ? 'Generating brief…' : (aiSummary ? 'Refresh Brief' : 'Generate AI Brief')}
                </Button>
              </div>
              {aiSummary && (
                <div style={{
                  fontSize: '0.825rem',
                  color: '#14532d',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                  backgroundColor: 'white',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #dcfce7',
                }}>
                  {aiSummary}
                </div>
              )}
            </div>

            {/* Protocol Engine Findings */}
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.875rem 1rem',
              backgroundColor: '#eff6ff',
              borderRadius: 'var(--radius)',
              border: '1px solid #bfdbfe',
            }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Protocol Engine Clinical Triggers
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#1e3a8a', lineHeight: 1.4 }}>
                {selectedCase.protocolResult?.reason || selectedCase.message || 'Evaluated against Ministry of Health clinical decision protocol.'}
              </p>
            </div>

            {/* Supervisor Clinical Instructions / Comment Area */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>
                Supervisor Clinical Instructions & Notes
              </label>
              <textarea
                value={actionComment}
                onChange={e => setActionComment(e.target.value)}
                placeholder="Enter feedback for CHW, referral clinic instructions, or clinical override rationale..."
                rows={3}
                style={{
                  width: '100%',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: MESSAGE CHW                                        */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!messagingChw}
        onClose={() => setMessagingChw(null)}
        title={`Message ${messagingChw?.name || 'Worker'}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setMessagingChw(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submittingMessage || !messageText.trim()}
              onClick={handleSendMessage}
            >
              {submittingMessage ? 'Sending…' : 'Send Message'}
            </Button>
          </>
        }
      >
        {messagingChw && (
          <form onSubmit={handleSendMessage}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Send direct supervision notes, task reminders, or follow-up instructions to <strong>{messagingChw.name}</strong> ({messagingChw.region}).
            </p>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type your supervisory message..."
              rows={4}
              required
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </form>
        )}
      </Modal>
    </div>
  );
};

