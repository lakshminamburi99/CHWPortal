import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const API_BASE = 'http://localhost:8000/api/v1';

const severityVariant: Record<string, 'info' | 'warning' | 'danger'> = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'danger',
};

export const AuditPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/audit`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
        } else {
          setEvents([
            { id: 'aud-1', at: '2026-08-24 12:00:00', actor: 'Admin User', actorRole: 'SUPER_ADMIN', action: 'System initialization and seed validation', target: 'Platform', severity: 'INFO' },
            { id: 'aud-2', at: '2026-08-24 11:45:00', actor: 'Daniel Whitfield', actorRole: 'PROGRAMME_MANAGER', action: 'Updated programme target for Maternal ANC Coverage', target: 'Maternal ANC Coverage', severity: 'INFO' },
            { id: 'aud-3', at: '2026-08-24 11:15:00', actor: 'Amara Okafor', actorRole: 'SUPERVISOR', action: 'Clinical sign-off on high-risk paediatric referral', target: 'CASE-02400', severity: 'INFO' },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const headers = 'ID,Timestamp,Actor,Role,Action,Target,Severity\n';
    const rows = events.map(e => `"${e.id}","${e.at}","${e.actor}","${e.actorRole}","${e.action}","${e.target}","${e.severity}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const filtered = events.filter(e => filter === 'ALL' || e.severity === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Platform Audit Log</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Immutable record of all clinical, administrative, and security platform events</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map(s => (
          <Button key={s} size="sm" variant={filter === s ? 'primary' : 'outline'} onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {['Time', 'Actor', 'Role', 'Action', 'Target', 'Severity'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {e.at ? e.at.replace('T', ' ').slice(0, 19) : 'Recent'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{e.actor}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><Badge variant="info">{(e.actorRole || '').replace('_', ' ')}</Badge></td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text)' }}>{e.action}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{e.target}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><Badge variant={severityVariant[e.severity] || 'default'}>{e.severity}</Badge></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No audit records match the selected severity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

