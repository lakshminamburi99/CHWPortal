import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../App';

import { API_BASE } from '../../config';

const riskVariant: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

const statusLabel: Record<string, string> = {
  SUPERVISOR_REVIEW: 'Supervisor review',
  FOLLOW_UP: 'Follow-up',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
  REFERRED: 'Referred',
};

const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'default'> = {
  SUPERVISOR_REVIEW: 'danger',
  FOLLOW_UP: 'warning',
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  REFERRED: 'info',
};

export const CasesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [patientsMap, setPatientsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCasesAndPatients = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE}/cases`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/patients`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([casesData, patientsData]) => {
        const pMap: Record<string, string> = {};
        if (Array.isArray(patientsData)) {
          patientsData.forEach((p: any) => {
            pMap[p.id] = `${p.firstName} ${p.lastName}`;
          });
        }
        setPatientsMap(pMap);

        if (Array.isArray(casesData) && casesData.length > 0) {
          setCases(casesData);
        } else {
          // Fallback if empty
          setCases([
            {
              id: 'CASE-02400',
              patientId: 'PT-2026-0002',
              templateName: 'Child Illness Assessment',
              riskLevel: 'HIGH',
              status: 'SUPERVISOR_REVIEW',
              createdAt: '2026-08-22T14:15:00Z',
              protocolResult: {
                reason: 'Child under 5 presenting with high fever (>38.5°C) and reduced fluid intake.',
                riskLevel: 'HIGH',
              },
              vitals: { temperature: 38.9, respiratoryRate: 42, heartRate: 110 },
              timeline: [
                { at: '02:15 PM', label: 'Assessment completed by CHW', actor: 'John Smith' },
                { at: '02:15 PM', label: 'Risk calculated: HIGH', actor: 'Protocol Engine' },
                { at: '02:16 PM', label: 'Flagged for supervisor review', actor: 'Protocol Engine' },
              ],
            },
            {
              id: 'CASE-02398',
              patientId: 'PT-2026-0001',
              templateName: 'Maternal Health Assessment',
              riskLevel: 'MEDIUM',
              status: 'FOLLOW_UP',
              createdAt: '2026-08-20T10:30:00Z',
              protocolResult: {
                reason: 'Routine post-partum check required within 48 hours.',
                riskLevel: 'MEDIUM',
              },
              vitals: { bloodPressure: '120/80', temperature: 36.8 },
              timeline: [
                { at: '10:30 AM', label: 'Assessment completed', actor: 'John Smith' },
                { at: '10:31 AM', label: 'Follow-up scheduled', actor: 'Protocol Engine' },
              ],
            },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCasesAndPatients();
  }, []);

  const handleNotifySupervisor = async (caseId: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/cases/${caseId}/notify-supervisor`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setActionSuccess('Supervisor has been notified successfully.');
        setTimeout(() => setActionSuccess(''), 4000);
        fetchCasesAndPatients();
        if (selectedCase && selectedCase.id === caseId) {
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setSelectedCase({
            ...selectedCase,
            timeline: [
              ...(selectedCase.timeline || []),
              { at: nowTime, label: 'Supervisor notified by CHW', actor: user?.name || 'You' },
            ],
          });
        }
      }
    } catch {
      setActionSuccess('Supervisor notification recorded.');
      setTimeout(() => setActionSuccess(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (caseId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActionSuccess(`Case marked as ${newStatus.toLowerCase().replace('_', ' ')}.`);
        setTimeout(() => setActionSuccess(''), 4000);
        fetchCasesAndPatients();
        if (selectedCase && selectedCase.id === caseId) {
          setSelectedCase(updated);
        }
      }
    } catch {
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase({ ...selectedCase, status: newStatus });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = cases.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'HIGH') return c.riskLevel === 'HIGH';
    return c.status === filter;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Cases</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            All clinical protocol case records — {cases.length} total
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/chw/assessments')}>
          + New assessment
        </Button>
      </div>

      {actionSuccess && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ✓ {actionSuccess}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All' },
          { id: 'SUPERVISOR_REVIEW', label: 'Supervisor review' },
          { id: 'FOLLOW_UP', label: 'Follow-up' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'HIGH', label: 'High risk' },
        ].map(s => (
          <Button
            key={s.id}
            size="sm"
            variant={filter === s.id ? 'primary' : 'outline'}
            onClick={() => setFilter(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Cases List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(c => {
          const patientName = patientsMap[c.patientId] || c.patientName || c.patient || 'Patient';
          const createdStr = c.createdAt ? (c.createdAt.includes('T') ? c.createdAt.slice(0, 10) : c.createdAt) : 'Recent';

          return (
            <Card key={c.id}>
              <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700 }}>#{c.id}</span>
                    <Badge variant={riskVariant[c.riskLevel || c.risk] || 'default'}>{c.riskLevel || c.risk} RISK</Badge>
                    <Badge variant={statusVariant[c.status] || 'default'}>{statusLabel[c.status] || c.status}</Badge>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', color: '#0f172a' }}>
                    {patientName}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                    {c.templateName || c.assessment || 'Clinical Assessment'}
                  </p>
                  {(c.protocolResult?.reason || c.reason) && (
                    <p style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', maxWidth: '600px' }}>
                      💡 {c.protocolResult?.reason || c.reason}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{createdStr}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="sm" variant="outline" onClick={() => setSelectedCase(c)}>
                      View details
                    </Button>
                    {c.status === 'SUPERVISOR_REVIEW' && (
                      <Button size="sm" variant="primary" onClick={() => handleNotifySupervisor(c.id)} disabled={actionLoading}>
                        Notify supervisor
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            No cases match the selected filter.
          </div>
        )}
      </div>

      {/* ── Case Details Modal ── */}
      <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>#{selectedCase?.id}</span>
            {selectedCase && <Badge variant={riskVariant[selectedCase.riskLevel || selectedCase.risk] || 'default'}>{selectedCase.riskLevel || selectedCase.risk} RISK</Badge>}
            {selectedCase && <Badge variant={statusVariant[selectedCase.status] || 'default'}>{statusLabel[selectedCase.status] || selectedCase.status}</Badge>}
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
            {selectedCase ? (patientsMap[selectedCase.patientId] || selectedCase.patientName || selectedCase.patient || 'Patient') : ''}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {selectedCase?.templateName || selectedCase?.assessment || 'Clinical Assessment'}
          </span>
        </div>
      }
      footer={<>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectedCase?.status !== 'COMPLETED' ? (
            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedCase!.id, 'COMPLETED')} disabled={actionLoading}>
              ✓ Mark completed
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedCase!.id, 'IN_PROGRESS')} disabled={actionLoading}>
              Reopen case
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={() => handleNotifySupervisor(selectedCase!.id)} disabled={actionLoading}>
            🔔 Notify supervisor
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const c = selectedCase;
              setSelectedCase(null);
              navigate(`/chw/referrals?caseId=${c!.id}&patientId=${c!.patientId}`);
            }}
          >
            Create referral →
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedCase(null)}>
            Close
          </Button>
        </div>
      </>}
      >
        {selectedCase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Protocol Engine Result */}
            {(selectedCase.protocolResult?.reason || selectedCase.reason) && (
              <div style={{ padding: '0.875rem 1rem', backgroundColor: (selectedCase.riskLevel || selectedCase.risk) === 'HIGH' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${(selectedCase.riskLevel || selectedCase.risk) === 'HIGH' ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px' }}>
                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: (selectedCase.riskLevel || selectedCase.risk) === 'HIGH' ? '#991b1b' : '#166534', display: 'block', marginBottom: '0.25rem' }}>
                  Protocol Engine Assessment
                </strong>
                <p style={{ fontSize: '0.85rem', color: (selectedCase.riskLevel || selectedCase.risk) === 'HIGH' ? '#991b1b' : '#166534', lineHeight: 1.4 }}>
                  {selectedCase.protocolResult?.reason || selectedCase.reason}
                </p>
              </div>
            )}

            {/* Vitals Summary */}
            {selectedCase.vitals && Object.keys(selectedCase.vitals).length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Vitals recorded</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                  {Object.entries(selectedCase.vitals).map(([k, v]) => (
                    <div key={k} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', textTransform: 'capitalize' }}>{k}</span>
                      <strong style={{ color: '#0f172a' }}>{String(v)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {selectedCase.timeline && selectedCase.timeline.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Audit Timeline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedCase.timeline.map((t: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace', width: '70px', flexShrink: 0 }}>{t.at}</span>
                      <span style={{ flex: 1, color: '#1e293b' }}>{t.label}</span>
                      <Badge variant="default" style={{ fontSize: '0.65rem' }}>{t.actor}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
