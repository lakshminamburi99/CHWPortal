import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const priorityCases = [
  { id: 'CASE-02400', patient: 'Ahmed Robinson', chw: 'John Smith', assessment: 'Child Illness Assessment', risk: 'HIGH', status: 'SUPERVISOR_REVIEW', flagged: 'Aug 22, 2026', message: 'Assessment criteria indicate this case requires clinical review.' },
  { id: 'CASE-02395', patient: 'Maria Santos', chw: 'John Smith', assessment: 'Maternal Health Assessment', risk: 'HIGH', status: 'SUPERVISOR_REVIEW', flagged: 'Aug 21, 2026', message: 'Elevated blood pressure readings — obstetric escalation recommended.' },
];

export const SupervisorDashboard = () => (
  <div>
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Supervisor workspace</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Aug 22, 2026 · 2 cases pending your review</p>
    </div>

    {/* KPI Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {[
        { label: 'PENDING REVIEW', value: 2, sub: 'Cases awaiting action', variant: 'danger' },
        { label: 'ACTIVE CHWs', value: 6, sub: 'In your team', variant: null },
        { label: 'OPEN CASES', value: 24, sub: 'Across your team', variant: null },
        { label: 'FOLLOW-UPS DUE', value: 8, sub: 'This week', variant: 'warning' },
      ].map(kpi => (
        <Card key={kpi.label} style={kpi.variant === 'danger' ? { borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)' } : {}}>
          <CardContent style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: kpi.variant === 'danger' ? 'var(--color-danger)' : 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: kpi.variant === 'danger' ? 'var(--color-danger)' : 'var(--color-text)' }}>{kpi.value}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{kpi.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Priority Cases */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Priority cases requiring your review</h2>
      <Button variant="outline" size="sm">View all cases</Button>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {priorityCases.map(c => (
        <Card key={c.id} style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{c.id}</span>
                  <Badge variant="danger">HIGH RISK</Badge>
                  <Badge variant="warning">Supervisor review</Badge>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{c.patient}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{c.assessment} · CHW: {c.chw}</p>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>{c.message}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Flagged {c.flagged}</span>
                <Button variant="primary">Review case →</Button>
                <Button variant="outline" size="sm">Acknowledge</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
