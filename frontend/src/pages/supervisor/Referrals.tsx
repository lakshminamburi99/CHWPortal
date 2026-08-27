import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

import { API_BASE } from '../../config';

const priorityVariant: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

const statusVariant: Record<string, 'info' | 'warning' | 'success'> = {
  SUBMITTED: 'info',
  ACCEPTED: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
};

export const SupervisorReferralsPage = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [rRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/referrals`, { headers }),
        fetch(`${API_BASE}/patients`, { headers }),
      ]);

      const refsData = rRes.ok ? await rRes.json() : [];
      const patientsData = pRes.ok ? await pRes.json() : [];

      const pMap: Record<string, any> = {};
      if (Array.isArray(patientsData)) {
        patientsData.forEach(p => { pMap[p.id] = p; });
      }
      setPatients(pMap);
      setReferrals(Array.isArray(refsData) ? refsData : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch {}
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Supervisor Referrals</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Referrals submitted by your CHW team requiring clinical triage</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {referrals.map(r => {
          const patientObj = patients[r.patientId];
          const patientName = patientObj ? `${patientObj.firstName} ${patientObj.lastName}` : r.patientId;
          const createdStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent';

          return (
            <Card key={r.id}>
              <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.id}</span>
                    <Badge variant={priorityVariant[r.priority] || 'default'}>{r.priority}</Badge>
                    <Badge variant={statusVariant[r.status] || 'default'}>{statusLabel[r.status] || r.status}</Badge>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{patientName}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{r.reason}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    → {r.destination || 'Unassigned Facility'} · CHW: {r.chwId || 'John Smith'} · {createdStr}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {r.status === 'SUBMITTED' && (
                    <Button size="sm" variant="primary" onClick={() => updateStatus(r.id, 'ACCEPTED')}>
                      Accept referral
                    </Button>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'COMPLETED')}>
                      Mark completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {referrals.length === 0 && !loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            No referrals recorded.
          </div>
        )}
      </div>
    </div>
  );
};

