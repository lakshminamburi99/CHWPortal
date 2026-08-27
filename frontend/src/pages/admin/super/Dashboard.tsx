import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const API_BASE = 'http://localhost:8000/api/v1';

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = { OPERATIONAL: 'success', DEGRADED: 'warning', DOWN: 'danger' };

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRegions: 0,
    totalOrgUnits: 0,
    auditEvents: 0,
    systemHealth: '0/0'
  });
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState<string | null>(null);

  const fetchServices = () => {
    const token = localStorage.getItem('access_token');
    
    Promise.all([
      fetch(`${API_BASE}/admin/services`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      fetch(`${API_BASE}/admin/stats/super`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    ])
      .then(async ([svcRes, statsRes]) => {
        if (svcRes.ok) {
          const data = await svcRes.json();
          if (Array.isArray(data) && data.length > 0) setServices(data);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData) setStats(statsData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleRestart = async (id: string) => {
    setRestarting(id);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/admin/services/${id}/restart`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        fetchServices();
      }
    } catch {}
    setRestarting(null);
  };

  return (
    <div>
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Platform administration</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Super administrator · entire platform, all regions</p>
    </div>

    {/* KPIs */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {[
        { label: 'TOTAL USERS', value: stats.totalUsers, sub: 'Across all regions', link: '/admin/super/users' },
        { label: 'ACTIVE REGIONS', value: stats.activeRegions, sub: 'North, East, South', link: '/admin/super/org-units' },
        { label: 'TOTAL ORG UNITS', value: stats.totalOrgUnits, sub: 'Regions + districts + clinics', link: '/admin/super/org-units' },
        { label: 'AUDIT EVENTS (24h)', value: stats.auditEvents, sub: 'Logged today', link: '/admin/super/audit' },
        { label: 'SYSTEM HEALTH', value: stats.systemHealth, sub: 'Services operational' },
      ].map(kpi => (
        <Card key={kpi.label} onClick={kpi.link ? () => navigate(kpi.link) : undefined} style={{ cursor: kpi.link ? 'pointer' : 'default' }}>
          <CardContent style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{kpi.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{kpi.value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{kpi.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* System services */}
    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>System services</h2>
    <Card>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
              {['Service', 'Status', 'Uptime', 'Latency', 'Detail', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '0.75rem 1rem' }}><Badge variant={statusVariant[s.status]}>{s.status}</Badge></td>
                <td style={{ padding: '0.75rem 1rem' }}>{s.uptimePercent ?? s.uptime}%</td>
                <td style={{ padding: '0.75rem 1rem' }}>{s.latencyMs}ms</td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{s.detail}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <Button size="sm" variant="outline" disabled={restarting === s.id} onClick={() => handleRestart(s.id)}>
                    {restarting === s.id ? 'Restarting...' : 'Restart'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
  );
};
