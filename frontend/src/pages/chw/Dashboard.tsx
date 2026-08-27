import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

// ── Icons ────────────────────────────────────────────────────────────────────
const UserPlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
  </svg>
);

const StethoscopeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V12a6 6 0 0 0 12 0V2.6a.3.3 0 0 0-.3-.3h-1.4a.3.3 0 0 0-.3.3v7.4a4 4 0 0 1-8 0V2.6a.3.3 0 0 0-.3-.3z" />
    <path d="M18 10a6 6 0 0 1-12 0" /><circle cx="18" cy="20" r="3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

import { API_BASE } from '../../config';

export const ChwDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for metrics and priority cases
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    visitsPlanned: 2,
    flaggedCases: 1,
    overdueFollowups: 0,
    assignedPatients: 50,
  });

  const [priorityCases, setPriorityCases] = useState<any[]>([
    {
      id: 'CASE-02400',
      patientName: 'Ahmed Robinson',
      templateName: 'Child Illness Assessment',
      riskLevel: 'HIGH',
      status: 'SUPERVISOR_REVIEW',
      reason: 'Assessment criteria indicate this case requires clinical review.',
      createdAt: 'Aug 22, 2026',
    },
  ]);

  // Modal state for New Patient
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: 'Female',
    phone: '',
    address: '',
  });
  const [savingPatient, setSavingPatient] = useState(false);

  // Fetch metrics from backend API
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE}/patients`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/cases`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/follow-ups`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([patients, cases, followups]) => {
        setStats({
          visitsPlanned: Array.isArray(followups) ? followups.filter((f: any) => f.status === 'UPCOMING' || f.status === 'DUE_TODAY').length : 2,
          flaggedCases: Array.isArray(cases) ? cases.filter((c: any) => c.riskLevel === 'HIGH' || c.status === 'SUPERVISOR_REVIEW').length : 1,
          overdueFollowups: Array.isArray(followups) ? followups.filter((f: any) => f.status === 'OVERDUE').length : 0,
          assignedPatients: Array.isArray(patients) ? patients.length || 50 : 50,
        });

        if (Array.isArray(cases) && cases.length > 0) {
          const highRisk = cases.filter((c: any) => c.riskLevel === 'HIGH' || c.status === 'SUPERVISOR_REVIEW');
          if (highRisk.length > 0) {
            setPriorityCases(highRisk.map((c: any) => ({
              id: c.id,
              patientName: c.patientName || 'Ahmed Robinson',
              templateName: c.templateName || 'Child Illness Assessment',
              riskLevel: c.riskLevel || 'HIGH',
              status: c.status || 'SUPERVISOR_REVIEW',
              reason: c.protocolResult?.reason || 'Assessment criteria indicate this case requires clinical review.',
              createdAt: c.createdAt ? c.createdAt.slice(0, 10) : 'Aug 22, 2026',
            })));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreatePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPatient(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          firstName: newPatient.firstName,
          lastName: newPatient.lastName,
          dateOfBirth: newPatient.dateOfBirth || '2000-01-01',
          sex: newPatient.sex,
          preferredLanguage: 'en',
          phone: newPatient.phone || '+1-555-0100',
          address: newPatient.address || 'Riverside Community',
          emergencyContact: { name: 'Contact', relationship: 'Family', phone: newPatient.phone || '+1-555-0100' },
          assignedChwId: user?.id || 'usr-chw-001',
        }),
      });
      if (res.ok) {
        setShowNewPatientModal(false);
        setNewPatient({ firstName: '', lastName: '', dateOfBirth: '', sex: 'Female', phone: '', address: '' });
        navigate('/chw/patients');
      }
    } catch {
      // Fallback redirect
      setShowNewPatientModal(false);
      navigate('/chw/patients');
    } finally {
      setSavingPatient(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'var(--font-sans)' }}>

      {/* Greeting Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
            Good afternoon, {user?.name ? user.name.split(' ')[0] : 'John'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            {todayStr} · {stats.visitsPlanned} visits planned, {stats.flaggedCases} flagged case{stats.flaggedCases !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* KPI Cards Row — Clickable cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card
          onClick={() => navigate('/chw/follow-ups')}
          style={{ cursor: 'pointer', transition: 'transform 150ms ease, box-shadow 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <CardContent style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              VISITS PLANNED
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{stats.visitsPlanned}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>Follow-ups due today →</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate('/chw/cases')}
          style={{
            borderColor: stats.flaggedCases > 0 ? '#fecaca' : 'var(--border)',
            backgroundColor: stats.flaggedCases > 0 ? '#fef2f2' : 'var(--card)',
            cursor: 'pointer',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <CardContent style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: stats.flaggedCases > 0 ? '#991b1b' : 'var(--muted-foreground)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              FLAGGED CASES
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: stats.flaggedCases > 0 ? '#991b1b' : 'var(--foreground)', lineHeight: 1.1 }}>{stats.flaggedCases}</p>
            <p style={{ fontSize: '0.75rem', color: stats.flaggedCases > 0 ? '#b91c1c' : 'var(--muted-foreground)', marginTop: '0.35rem' }}>Awaiting supervisor review →</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate('/chw/follow-ups')}
          style={{ cursor: 'pointer', transition: 'transform 150ms ease, box-shadow 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <CardContent style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              OVERDUE FOLLOW-UPS
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{stats.overdueFollowups}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>Reschedule as soon as possible →</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate('/chw/patients')}
          style={{ cursor: 'pointer', transition: 'transform 150ms ease, box-shadow 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <CardContent style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              ASSIGNED PATIENTS
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{stats.assignedPatients}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>In your caseload →</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Row — 4 working buttons */}
      <div>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Button
            variant="outline"
            onClick={() => setShowNewPatientModal(true)}
            style={{
              height: '76px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <UserPlusIcon />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>New patient</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/chw/assessments')}
            style={{
              height: '76px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <StethoscopeIcon />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Start assessment</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/chw/patients')}
            style={{
              height: '76px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <SearchIcon />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Search patient</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/chw/referrals')}
            style={{
              height: '76px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <SendIcon />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>View referrals</span>
          </Button>
        </div>
      </div>

      {/* Priority Cases Section */}
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>Priority cases</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/chw/cases')}>
            All cases →
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {priorityCases.map(c => (
            <Card key={c.id}>
              <CardContent style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>#{c.id}</span>
                      <Badge variant="danger">{c.riskLevel} RISK</Badge>
                      <Badge variant="warning">Supervisor review</Badge>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                      {c.patientName}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.875rem' }}>
                      {c.templateName}
                    </p>
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.82rem',
                        color: '#991b1b',
                        maxWidth: '560px',
                      }}
                    >
                      {c.reason}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{c.createdAt}</span>
                    <Button variant="primary" onClick={() => navigate('/chw/cases')}>
                      View case →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── New Patient Modal ── */}
      <Modal isOpen={showNewPatientModal} onClose={() => setShowNewPatientModal(false)} title="Register new patient"
        footer={<>
          <Button variant="outline" type="button" onClick={() => setShowNewPatientModal(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="dashboard-patient-form" disabled={savingPatient}>
            {savingPatient ? 'Saving…' : 'Register patient'}
          </Button>
        </>}
      >
        <form id="dashboard-patient-form" onSubmit={handleCreatePatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>First name *</label>
              <input
                required
                type="text"
                value={newPatient.firstName}
                onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Last name *</label>
              <input
                required
                type="text"
                value={newPatient.lastName}
                onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Date of birth</label>
              <input
                type="date"
                value={newPatient.dateOfBirth}
                onChange={e => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Sex</label>
              <select
                value={newPatient.sex}
                onChange={e => setNewPatient({ ...newPatient, sex: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem', backgroundColor: 'white' }}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Phone number</label>
            <input
              type="text"
              placeholder="+1-555-0199"
              value={newPatient.phone}
              onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Community / Address</label>
            <input
              type="text"
              placeholder="Riverside Sector 4"
              value={newPatient.address}
              onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
            />
          </div>
        </form>
      </Modal>

    </div>
  );
};
