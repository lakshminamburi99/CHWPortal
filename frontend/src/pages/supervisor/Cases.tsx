import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

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

  const handleGenerateSummary = async (caseId: string) => {
    setLoadingAi(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/cases/${caseId}/summarize`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

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
        setSelectedCase(null);
        setActionComment('');
        setAiSummary(null);
        fetchCasesAndPatients();
      }
    } catch {}
    setSubmittingAction(false);
  };

  const filteredCases = cases.filter(c => {
    if (riskFilter === 'ALL') return true;
    return c.riskLevel === riskFilter;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Clinical Triage Queue</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Review escalated cases, assign supervisor actions, and monitor clinical risks.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(rf => (
            <Button
              key={rf}
              variant={riskFilter === rf ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRiskFilter(rf)}
            >
              {rf === 'ALL' ? 'All Risks' : `${rf} Risk`}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Case ID</th>
                <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Assessment</th>
                <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Risk Level</th>
                <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(c => {
                const p = patients[c.patientId];
                const pName = p ? `${p.firstName} ${p.lastName}` : c.patientId;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>{c.id}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>{pName}</td>
                    <td style={{ padding: '0.875rem 1.25rem', color: '#64748b' }}>{c.templateName}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <Badge variant={riskVariant[c.riskLevel] || 'default'}>{c.riskLevel}</Badge>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <Badge variant={statusVariant[c.status] || 'default'}>{statusLabel[c.status] || c.status}</Badge>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedCase(c); setAiSummary(null); setActionComment(''); }}>
                        Review Case
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supervisor Review Modal */}
      <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title="Supervisor Clinical Review"
        footer={<>
          <Button variant="outline" disabled={submittingAction} onClick={() => handleSupervisorAction('REQUEST_INFO')}>
            Request info
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

            {/* AI Case Summary trigger & panel */}
            <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
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
                  onClick={() => handleGenerateSummary(selectedCase.id)}
                  style={{ borderColor: '#166534', color: '#166534', fontSize: '0.78rem' }}
                >
                  {loadingAi ? 'Generating…' : (aiSummary ? 'Refresh Brief' : 'Generate Brief')}
                </Button>
              </div>
              {aiSummary && (
                <div style={{ fontSize: '0.825rem', color: '#14532d', whiteSpace: 'pre-line', lineHeight: 1.6, backgroundColor: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                  {aiSummary}
                </div>
              )}
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

