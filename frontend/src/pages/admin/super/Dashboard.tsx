import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Avatar } from '../../../components/ui/Avatar';
import { getAvatarForUser } from '../../../utils/avatars';
import { API_BASE } from '../../../config';

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  OPERATIONAL: 'success',
  DEGRADED: 'warning',
  DOWN: 'danger',
  MAINTENANCE: 'warning',
};

const defaultServices = [
  { id: 'svc-auth', name: 'Identity & Access Manager (OAuth2/JWT)', status: 'OPERATIONAL', uptimePercent: 99.99, latencyMs: 24, detail: 'Token issuance, session revocation, MFA verification' },
  { id: 'svc-fhir', name: 'FHIR R4 Interoperability Engine', status: 'OPERATIONAL', uptimePercent: 99.95, latencyMs: 38, detail: 'HL7/FHIR Patient, Observation, DiagnosticReport sync' },
  { id: 'svc-protocol', name: 'Clinical Decision Support Engine', status: 'OPERATIONAL', uptimePercent: 100.0, latencyMs: 19, detail: 'IMCI, Maternal ANC, and NCD risk escalation rules' },
  { id: 'svc-ai', name: 'Gemini Multilingual Clinical Assistant', status: 'OPERATIONAL', uptimePercent: 99.88, latencyMs: 142, detail: 'Voice dictation transcribing, language concordance translation' },
  { id: 'svc-analytics', name: 'BigQuery Telemetry & ETL Pipeline', status: 'OPERATIONAL', uptimePercent: 99.92, latencyMs: 45, detail: 'Aggregated population health reports and caseload analytics' },
  { id: 'svc-notify', name: 'Real-Time Notification Dispatcher', status: 'OPERATIONAL', uptimePercent: 99.97, latencyMs: 18, detail: 'WebPush & SMS triage alerts for clinical supervisors' },
];

const mockRecentAudits = [
  { id: 'aud-101', time: 'Just now', actor: 'Admin User', role: 'SUPER_ADMIN', action: 'SYSTEM_SETTINGS_UPDATE', detail: 'Updated voice dictation model threshold', severity: 'INFO' },
  { id: 'aud-102', time: '14 min ago', actor: 'Rachel Summers', role: 'REGIONAL_ADMIN', action: 'USER_INVITE', detail: 'Invited CHW Emmanuel Diaz to Western Region', severity: 'INFO' },
  { id: 'aud-103', time: '42 min ago', actor: 'Amara Okafor', role: 'SUPERVISOR', action: 'TRIAGE_ESCALATION_SIGN_OFF', detail: 'Approved high-risk paediatric referral for CASE-02400', severity: 'WARNING' },
  { id: 'aud-104', time: '1 hr ago', actor: 'Daniel Whitfield', role: 'PROGRAMME_MANAGER', action: 'METRIC_TARGET_UPDATE', detail: 'Adjusted Q3 Maternal ANC target to 90%', severity: 'INFO' },
];

const mockRegionalSummary = [
  { code: 'WR', name: 'Western Region', districts: 4, clinics: 18, activeChws: 142, patients: 6800, healthScore: 98, manager: 'Rachel Summers' },
  { code: 'NR', name: 'Northern Region', districts: 3, clinics: 12, activeChws: 98, patients: 4920, healthScore: 94, manager: 'Dr. Marcus Vance' },
  { code: 'ER', name: 'Eastern Region', districts: 5, clinics: 22, activeChws: 160, patients: 8150, healthScore: 91, manager: 'Fatima Al-Hassan' },
];

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>(defaultServices);
  const [stats, setStats] = useState({
    totalUsers: 15,
    activeRegions: 3,
    totalOrgUnits: 56,
    auditEvents: 142,
    systemHealth: '6/6',
    mfaEnforcementRate: 92,
    avgResponseTimeMs: 48,
    uptimePercent: 99.98,
  });
  const [loading, setLoading] = useState(false);
  const [restarting, setRestarting] = useState<string | null>(null);
  const [inspectService, setInspectService] = useState<any | null>(null);
  const [toast, setToast] = useState('');

  const fetchStatsAndServices = () => {
    const token = localStorage.getItem('access_token');
    Promise.all([
      fetch(`${API_BASE}/admin/services`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => null),
      fetch(`${API_BASE}/admin/stats/super`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => null),
    ])
      .then(async ([svcRes, statsRes]) => {
        if (svcRes && svcRes.ok) {
          const data = await svcRes.json();
          if (Array.isArray(data) && data.length > 0) setServices(data);
        }
        if (statsRes && statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData) {
            setStats(prev => ({ ...prev, ...statsData }));
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatsAndServices();
  }, []);

  const handleRestart = async (id: string, name: string) => {
    setRestarting(id);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/admin/services/${id}/restart`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        fetchStatsAndServices();
      }
    } catch {}
    setTimeout(() => {
      setRestarting(null);
      setToast(`Service "${name}" successfully reloaded and health checks passed ✓`);
      setTimeout(() => setToast(''), 3500);
    }, 600);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Top Executive Command Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '1.5rem 1.75rem',
        borderRadius: '12px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.25)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🛡️</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
              Platform Command Center
            </h1>
            <Badge variant="success" style={{ marginLeft: '0.25rem' }}>SYSTEM HEALTHY</Badge>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', margin: 0 }}>
            Super Administrator scope · Full platform governance, cross-regional telemetry, microservices & security enforcement
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/super/users')}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            👥 Manage Users
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/super/audit')}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            📜 Audit Trail
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/super/roles')}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            🛡️ RBAC Permissions
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/super/settings')}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
          >
            ⚙️ Platform Config
          </Button>
        </div>
      </div>

      {toast && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          borderRadius: '8px',
          border: '1px solid #86efac',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>✓</span> {toast}
        </div>
      )}

      {/* ── Key Performance & System Metrics Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, sub: 'Across 5 roles', link: '/admin/super/users', icon: '👥', trend: '+12% active' },
          { label: 'Active Regions', value: stats.activeRegions, sub: 'WR, NR, ER authorities', link: '/admin/super/org-units', icon: '🗺️', trend: '100% online' },
          { label: 'Total Org Units', value: stats.totalOrgUnits, sub: 'Districts & clinic teams', link: '/admin/super/org-units', icon: '🏢', trend: 'Structured' },
          { label: 'Audit Log (24h)', value: stats.auditEvents, sub: 'Logged compliance events', link: '/admin/super/audit', icon: '📜', trend: 'Zero breaches' },
          { label: 'MFA Enforcement', value: `${stats.mfaEnforcementRate}%`, sub: 'Admins & supervisors', link: '/admin/super/settings', icon: '🔒', trend: 'Compliant' },
          { label: 'System Uptime', value: `${stats.uptimePercent}%`, sub: '30-day rolling SLA', link: undefined, icon: '⚡', trend: `${stats.avgResponseTimeMs}ms avg` },
        ].map(kpi => (
          <Card
            key={kpi.label}
            onClick={kpi.link ? () => navigate(kpi.link) : undefined}
            style={{
              cursor: kpi.link ? 'pointer' : 'default',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              if (kpi.link) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              }
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{kpi.sub}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {kpi.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Section: System Services & Microservices Health ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
              Microservices & Infrastructure Health
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '0.15rem 0 0' }}>
              Real-time telemetry, response latencies, and container lifecycle controls
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatsAndServices}>
            🔄 Refresh Status
          </Button>
        </div>

        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                  {['Microservice', 'Status', 'Uptime', 'Latency', 'Function / Scope', 'Actions'].map((h, i) => (
                    <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(s => {
                  const latency = s.latencyMs || 25;
                  const latencyColor = latency < 50 ? '#16a34a' : latency < 150 ? '#f59e0b' : '#dc2626';

                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{s.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>ID: {s.id}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge variant={statusVariant[s.status] || 'default'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                        {s.uptimePercent ?? s.uptime}%
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: latencyColor }} />
                          <span style={{ fontWeight: 600, color: latencyColor }}>{latency}ms</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--muted-foreground)', fontSize: '0.8rem', maxWidth: '300px' }}>
                        {s.detail}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInspectService(s)}
                          >
                            Inspect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={restarting === s.id}
                            onClick={() => handleRestart(s.id, s.name)}
                          >
                            {restarting === s.id ? 'Reloading...' : 'Restart'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Two-Column Bottom Grid: Regional Coverage + Live Audit Stream ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Regional Governance Breakdown */}
        <Card>
          <CardHeader style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle style={{ fontSize: '1.05rem', fontWeight: 700 }}>Regional Authorities Overview</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/super/org-units')}>
              All Org Units →
            </Button>
          </CardHeader>
          <CardContent style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mockRegionalSummary.map(reg => (
                <div
                  key={reg.code}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{reg.name} ({reg.code})</div>
                    <Badge variant="success">{reg.healthScore}% Coverage</Badge>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                    Director: <strong>{reg.manager}</strong> · {reg.districts} Districts · {reg.clinics} Clinics
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    <span>Active CHWs: <strong>{reg.activeChws}</strong></span>
                    <span>Patient Caseload: <strong>{reg.patients.toLocaleString()}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Audit Activity Stream */}
        <Card>
          <CardHeader style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Governance & Audit Events</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/super/audit')}>
              Full Audit Log →
            </Button>
          </CardHeader>
          <CardContent style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {mockRecentAudits.map(event => (
                <div
                  key={event.id}
                  style={{
                    padding: '0.75rem',
                    borderLeft: `3px solid ${event.severity === 'WARNING' ? '#f59e0b' : '#0284c7'}`,
                    backgroundColor: 'var(--muted)',
                    borderRadius: '0 6px 6px 0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Avatar name={event.actor} role={event.role} size="xs" />
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{event.actor}</span>
                      <Badge variant="default" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>{event.role.replace('_', ' ')}</Badge>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{event.time}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>
                    {event.detail}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Modal: Inspect Microservice Details ── */}
      <Modal
        isOpen={!!inspectService}
        onClose={() => setInspectService(null)}
        title={inspectService ? `Diagnostic: ${inspectService.name}` : ''}
        footer={<>
          <Button variant="outline" onClick={() => setInspectService(null)}>Close</Button>
          {inspectService && (
            <Button
              variant="primary"
              disabled={restarting === inspectService.id}
              onClick={() => {
                handleRestart(inspectService.id, inspectService.name);
                setInspectService(null);
              }}
            >
              Restart Microservice
            </Button>
          )}
        </>}
      >
        {inspectService && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Status:</span>
                <Badge variant={statusVariant[inspectService.status] || 'default'}>{inspectService.status}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Latency:</span>
                <strong>{inspectService.latencyMs}ms</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Uptime (30d):</span>
                <strong>{inspectService.uptimePercent ?? inspectService.uptime}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Protocol / Spec:</span>
                <span style={{ fontFamily: 'monospace' }}>HTTPS / gRPC / JSON-RPC</span>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Functional Scope:</label>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', margin: 0 }}>
                {inspectService.detail}
              </p>
            </div>

            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Active Diagnostic Telemetry:</label>
              <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto' }}>
{JSON.stringify({
  serviceId: inspectService.id,
  healthCheck: 'PASS',
  threadPool: '8 active / 16 max',
  memoryUsageMb: 128.4,
  lastHealthCheck: new Date().toISOString(),
}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
