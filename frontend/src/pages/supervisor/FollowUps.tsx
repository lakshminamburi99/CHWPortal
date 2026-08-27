import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

import { API_BASE } from '../../config';

const statusLabel: Record<string, string> = { DUE_TODAY: 'Due today', UPCOMING: 'Upcoming', OVERDUE: 'Overdue', COMPLETED: 'Completed' };
const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
  DUE_TODAY: 'warning', UPCOMING: 'info', OVERDUE: 'danger', COMPLETED: 'success',
};
const priorityVariant: Record<string, 'danger' | 'warning' | 'success'> = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };

export const SupervisorFollowUpsPage = () => {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/follow_ups`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFollowUps(data.filter(f => f.status !== 'COMPLETED'));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleAction = (id: string, endpoint: string, payload?: any) => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/follow_ups/${id}/${endpoint}`, {
      method: 'POST',
      headers,
      body: payload ? JSON.stringify(payload) : undefined
    }).then(res => {
      if (res.ok) {
        fetchFollowUps();
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Follow-ups</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Scheduled follow-up visits across your CHW team</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {followUps.map(f => (
          <Card key={f.id} style={{ borderLeft: f.status === 'OVERDUE' ? '4px solid var(--color-danger)' : f.status === 'DUE_TODAY' ? '4px solid var(--color-warning)' : '' }}>
            <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge variant={statusVariant[f.status] || 'info'}>{statusLabel[f.status] || f.status}</Badge>
                  <Badge variant={priorityVariant[f.priority] || 'success'}>{f.priority}</Badge>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Patient: {f.patientId}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{f.reason}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>CHW: {f.chwId} · Due: {f.dueDate}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button size="sm" variant="outline" onClick={() => handleAction(f.id, 'reassign', { chwId: prompt('Enter new CHW ID:') })}>Reassign</Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(f.id, 'reschedule', { days: 7 })}>Reschedule (+7d)</Button>
                {f.priority !== 'HIGH' && (
                  <Button size="sm" variant="danger" onClick={() => handleAction(f.id, 'escalate')}>Escalate</Button>
                )}
                <Button size="sm" variant="primary" onClick={() => handleAction(f.id, 'complete')}>Mark Complete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {followUps.length === 0 && !loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            No pending follow-ups.
          </div>
        )}
      </div>
    </div>
  );
};
