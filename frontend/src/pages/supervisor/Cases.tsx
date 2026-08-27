import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

const API_BASE = 'http://localhost:8000/api/v1';

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
};

const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'default'> = {
  SUPERVISOR_REVIEW: 'danger',
  FOLLOW_UP: 'warning',
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
};

export const SupervisorCasesPage = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCasesAndPatients = async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/cases`, { headers }),
        fetch(`${API_BASE}/patients`, { headers }),
      ]);

      const casesData = cRes.ok ? await cRes.json() : [];
      const patientsData = pRes.ok ? await pRes.json() : [];

      const pMap: Record<string, any> = {};
      if (Array.isArray(patientsData)) {
        patientsData.forEach(p => { pMap[p.id] = p; });
      }
      setPatients(pMap);
      setCases(Array.isArray(casesData) ? casesData : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCasesAndPatients();
  }, []);

  const handleSupervisorAction = async (actionType: string) => {
    if (!selectedCase) return;
    setSubmittingAction(true);
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${API_BASE}/cases/${selectedCase.id}/supervisor-action`, {
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

      if (res.ok) {
        const updated = await res.json();
        setCases(prev => prev.map(c => c.id === selectedCase.id ? updated : c));
        setSelectedCase(null);
        setActionComment('');
      }
    } catch {}
    setSubmittingAction(false);
  };

  const filtered = cases.filter(c => riskFilter === 'ALL' || c.riskLevel === riskFilter);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Supervisor Cases</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>All cases across your CHW team requiring clinical governance</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(r => (
          <Button key={r} size="sm" variant={riskFilter === r ? 'primary' : 'outline'} onClick={() => setRiskFilter(r)}>
            {r === 'ALL' ? 'All' : `${r} risk`}
          </Button>
        ))}
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {['Case ID', 'Patient', 'CHW', 'Assessment', 'Risk', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const patientObj = patients[c.patientId];
                const patientName = patientObj ? `${patientObj.firstName} ${patientObj.lastName}` : c.patientId;
                const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent';

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{c.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{patientName}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{c.chwId || 'John Smith'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{c.templateName || 'Assessment'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><Badge variant={riskVariant[c.riskLevel] || 'default'}>{c.riskLevel}</Badge></td>
                    <td style={{ padding: '0.75rem 1rem' }}><Badge variant={statusVariant[c.status] || 'default'}>{statusLabel[c.status] || c.status}</Badge></td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{createdDate}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedCase(c); setActionComment(''); }}>
                        Review
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No cases match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supervisor Review Modal */}
      <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title="Supervisor Clinical Review"
        footer={<>
          <Button variant="outline" disabled={submittingAction} onClick={() => handleSupervisorAction('REQUEST_INFO')}>
            Request info from CHW
          </Button>
          <Button variant="outline" disabled={submittingAction} onClick={() => handleSupervisorAction('ESCALATE')}>
            Escalate case
          </Button>
          <Button variant="primary" disabled={submittingAction} onClick={() => handleSupervisorAction('CLOSE')}>
            Close case
          </Button>
        </>}
      >
        {selectedCase && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Patient</p>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {patients[selectedCase.patientId] ? `${patients[selectedCase.patientId].firstName} ${patients[selectedCase.patientId].lastName}` : selectedCase.patientId}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Calculated Risk Level</p>
                <Badge variant={riskVariant[selectedCase.riskLevel] || 'default'}>{selectedCase.riskLevel}</Badge>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Status</p>
                <Badge variant={statusVariant[selectedCase.status] || 'default'}>{statusLabel[selectedCase.status] || selectedCase.status}</Badge>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Assessment</p>
                <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{selectedCase.templateName}</p>
              </div>
            </div>

            {/* Protocol Result & Reason */}
            {selectedCase.protocolResult && (
              <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.25rem' }}>Protocol Engine Reason</h4>
                <p style={{ fontSize: '0.825rem', color: '#1e3a8a' }}>{selectedCase.protocolResult.reason || 'Clinical criteria evaluated.'}</p>
              </div>
            )}

            {/* Supervisor feedback notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
                Supervisor Clinical Instructions / Comments
              </label>
              <textarea
                value={actionComment}
                onChange={e => setActionComment(e.target.value)}
                placeholder="Enter feedback for CHW or justification for clinical override..."
                rows={3}
                style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

