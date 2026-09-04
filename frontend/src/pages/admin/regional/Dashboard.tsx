import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { getAvatarForUser } from '../../../utils/avatars';
import { API_BASE } from '../../../config';

export const RegionalAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAccounts: 12,
    orgUnits: 4,
    pendingInvites: 2,
    suspendedAccounts: 0,
    coveragePercent: 88,
    activeChws: 28,
  });
  const [loading, setLoading] = useState(false);

  const mockDistricts = [
    { id: 'RD', name: 'Riverside District', manager: 'Daniel Whitfield', chws: 16, clinics: 4, coverage: 92 },
    { id: 'ND', name: 'North Highlands District', manager: 'Amara Okafor', chws: 12, clinics: 3, coverage: 84 },
  ];

  const mockRecentAccounts = [
    { id: 'usr-chw-001', name: 'John Smith', email: 'demo-chw@example.com', role: 'CHW', org: 'Field Team Alpha', status: 'ACTIVE', lastSeen: 'Today, 2:15 PM' },
    { id: 'usr-sup-001', name: 'Amara Okafor', email: 'demo-supervisor@example.com', role: 'SUPERVISOR', org: 'Riverside District', status: 'ACTIVE', lastSeen: 'Today, 1:40 PM' },
    { id: 'usr-chw-002', name: 'Aisha Patel', email: 'aisha.patel@chwcare.health', role: 'CHW', org: 'Riverside Clinic B', status: 'ACTIVE', lastSeen: 'Today, 12:30 PM' },
    { id: 'usr-chw-003', name: 'Emmanuel Diaz', email: 'emmanuel.diaz@chwcare.health', role: 'CHW', org: 'Field Team Alpha', status: 'INVITED', lastSeen: 'Pending' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/stats/regional`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setStats(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* ── Regional Command Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        padding: '1.5rem 1.75rem',
        borderRadius: '12px',
        color: 'white',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.2)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🏢</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
              Regional Operations Hub
            </h1>
            <Badge variant="info" style={{ marginLeft: '0.25rem' }}>WESTERN REGION</Badge>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.875rem', margin: 0 }}>
            Regional Administration scope · Personnel management, org units, account provisioning (strictly non-clinical data boundary)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/regional/accounts')}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
          >
            👥 Manage Accounts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/regional/org-units')}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            🏢 Org Hierarchy
          </Button>
        </div>
      </div>

      {/* ── Regional KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Accounts', value: stats.totalAccounts, sub: 'Active personnel', link: '/admin/regional/accounts', icon: '👥' },
          { label: 'Org Units', value: stats.orgUnits, sub: 'Districts & clinics', link: '/admin/regional/org-units', icon: '🏢' },
          { label: 'Pending Invites', value: stats.pendingInvites, sub: 'Awaiting first sign-in', link: '/admin/regional/accounts', icon: '⏳' },
          { label: 'Suspended', value: stats.suspendedAccounts, sub: 'Restricted accounts', link: '/admin/regional/accounts', icon: '🚫' },
          { label: 'CHW Field Capacity', value: stats.activeChws, sub: 'Active field workers', link: '/admin/regional/accounts', icon: '🩺' },
        ].map(kpi => (
          <Card
            key={kpi.label}
            onClick={() => navigate(kpi.link)}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <CardContent style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>
                  {kpi.label}
                </span>
                <span style={{ fontSize: '1rem' }}>{kpi.icon}</span>
              </div>
              <p style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.15, margin: 0 }}>
                {kpi.value}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.4rem' }}>{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Two Column Layout: District Breakdown + Recent Accounts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Managed Districts & Clinics */}
        <Card>
          <CardHeader style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle style={{ fontSize: '1.05rem', fontWeight: 700 }}>Operational Districts</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/regional/org-units')}>
              View All Org Units →
            </Button>
          </CardHeader>
          <CardContent style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {mockDistricts.map(d => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/admin/regional/org-units/${d.id}`)}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{d.name} ({d.id})</div>
                    <Badge variant="success">{d.coverage}% Coverage</Badge>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                    District Lead: <strong>{d.manager}</strong> · {d.chws} CHWs · {d.clinics} Field Clinics
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Accounts & Onboarding */}
        <Card>
          <CardHeader style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle style={{ fontSize: '1.05rem', fontWeight: 700 }}>Personnel Directory Snapshot</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/regional/accounts')}>
              All Accounts →
            </Button>
          </CardHeader>
          <CardContent style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {mockRecentAccounts.map(acct => (
                <div
                  key={acct.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar src={getAvatarForUser(acct)} name={acct.name} role={acct.role} size="sm" status={acct.status === 'ACTIVE' ? 'online' : 'offline'} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{acct.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{acct.org} · {acct.email}</div>
                    </div>
                  </div>
                  <Badge variant={acct.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {acct.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
