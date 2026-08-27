import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

import { API_BASE } from '../../../config';

// NOTE: Regional Admin has NO clinical data access
export const RegionalAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    orgUnits: 0,
    pendingInvites: 0,
    suspendedAccounts: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/stats/regional`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Administration workspace</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Accounts and org units · no clinical data</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
        { label: 'TOTAL ACCOUNTS', value: stats.totalAccounts, sub: 'Active users in region', link: '/admin/regional/accounts' },
        { label: 'ORG UNITS', value: stats.orgUnits, sub: 'Regions, districts, clinics', link: '/admin/regional/org-units' },
        { label: 'PENDING INVITES', value: stats.pendingInvites, sub: 'Awaiting activation', link: '/admin/regional/accounts' },
        { label: 'SUSPENDED ACCOUNTS', value: stats.suspendedAccounts, sub: 'Requires review', link: '/admin/regional/accounts' },
      ].map(kpi => (
        <Card key={kpi.label} onClick={() => navigate(kpi.link)} style={{ cursor: 'pointer' }}>
          <CardContent style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{kpi.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{kpi.value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{kpi.sub}</p>
          </CardContent>
        </Card>
      ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => navigate('/admin/regional/accounts')}>Manage accounts</Button>
        <Button variant="outline" onClick={() => navigate('/admin/regional/org-units')}>Manage org units</Button>
      </div>
    </div>
  );
};
