import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

import { API_BASE } from '../../config';

export const TriagePage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/cases/priority-queue`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCases(data.filter(c => c.status === 'NEEDS_REVIEW' || c.status === 'REFERRED'));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleAction = (id: string, action: string) => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/cases/${id}/supervisor-action`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action })
    }).then(res => {
      if (res.ok) {
        fetchCases();
      }
    });
  };

  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});

  const handleGenerateSummary = async (caseId: string) => {
    setLoadingAi(prev => ({ ...prev, [caseId]: true }));
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/cases/${caseId}/summarize`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummaries(prev => ({ ...prev, [caseId]: data.summary }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(prev => ({ ...prev, [caseId]: false }));
    }
  };

  const highRiskCount = cases.filter(c => c.riskLevel === 'HIGH').length;
  const mediumRiskCount = cases.filter(c => c.riskLevel === 'MEDIUM').length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Triage Queue</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cases escalated from your CHW team requiring clinical review</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {highRiskCount > 0 && <Badge variant="danger">{highRiskCount} HIGH RISK</Badge>}
        {mediumRiskCount > 0 && <Badge variant="warning">{mediumRiskCount} MEDIUM RISK</Badge>}
        {cases.length === 0 && !loading && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No cases require triage.</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cases.map(c => (
          <Card key={c.id} style={{ borderLeft: `4px solid ${c.riskLevel === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)'}` }}>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{c.id}</span>
                    <Badge variant={c.riskLevel === 'HIGH' ? 'danger' : 'warning'}>{c.riskLevel} RISK</Badge>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Patient: {c.patientId}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{c.templateName} · CHW: {c.chwId}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.75rem' }}>🚩 Flagged: {new Date(c.flaggedAt || c.createdAt).toLocaleString()}</p>
                  <div style={{ padding: '0.75rem', backgroundColor: c.riskLevel === 'HIGH' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.875rem', color: c.riskLevel === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                      {c.protocolResult?.escalationReason || 'Review requested by CHW'}
                    </p>
                  </div>

                  {/* AI Summary Box */}
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiSummaries[c.id] ? '0.5rem' : 0 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>✨ AI Supervisor Brief (Google Gemini)</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingAi[c.id]}
                        onClick={() => handleGenerateSummary(c.id)}
                        style={{ fontSize: '0.75rem', color: '#166534', borderColor: '#166534' }}
                      >
                        {loadingAi[c.id] ? 'Generating…' : (aiSummaries[c.id] ? 'Refresh Brief' : 'Generate AI Brief')}
                      </Button>
                    </div>
                    {aiSummaries[c.id] && (
                      <div style={{ fontSize: '0.8rem', color: '#14532d', whiteSpace: 'pre-line', lineHeight: 1.5, backgroundColor: 'white', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                        {aiSummaries[c.id]}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '140px' }}>
                  <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/supervisor/cases')}>Review case</Button>
                  <Button variant="outline" size="sm" style={{ width: '100%' }} onClick={() => handleAction(c.id, 'ACKNOWLEDGE')}>Acknowledge</Button>
                  <Button variant="danger" size="sm" style={{ width: '100%' }} onClick={() => handleAction(c.id, 'ESCALATE')}>Escalate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
