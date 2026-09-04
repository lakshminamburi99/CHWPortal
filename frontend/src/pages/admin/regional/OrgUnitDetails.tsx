import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { getAvatarForUser } from '../../../utils/avatars';
import { API_BASE } from '../../../config';

const typeVariant: Record<string, 'info' | 'warning' | 'success'> = {
  REGION: 'info',
  DISTRICT: 'warning',
  CLINIC: 'success',
};

const typeIconMap: Record<string, string> = {
  REGION: '🌍',
  DISTRICT: '🏙️',
  CLINIC: '🏥',
};

export const OrgUnitDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [orgUnit, setOrgUnit] = useState<any>(null);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'personnel' | 'subunits'>('overview');

  // Detect route prefix
  const isSuperAdmin = location.pathname.includes('/super/');
  const listRoute = isSuperAdmin ? '/admin/super/org-units' : '/admin/regional/org-units';

  useEffect(() => {
    const fetchOrgUnit = async () => {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      try {
        const res = await fetch(`${API_BASE}/admin/org-units/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          if (res.status === 403) {
            setError('Access denied: Org Unit is outside your authorized region.');
          } else {
            // Local fallback
            setOrgUnit({
              id: id || 'FTA',
              name: id === 'FTA' ? 'Field Team Alpha' : id === 'RD' ? 'Riverside District' : id === 'WR' ? 'Western Region' : `Unit ${id}`,
              type: id === 'WR' ? 'REGION' : id === 'RD' ? 'DISTRICT' : 'CLINIC',
              parentId: id === 'FTA' ? 'RD' : id === 'RD' ? 'WR' : null,
              managerName: id === 'FTA' ? 'Amara Okafor' : id === 'RD' ? 'Daniel Whitfield' : 'Rachel Summers',
              managerRole: id === 'FTA' ? 'SUPERVISOR' : id === 'RD' ? 'PROGRAMME_MANAGER' : 'REGIONAL_ADMIN',
              chwCount: id === 'FTA' ? 4 : id === 'RD' ? 28 : 142,
              patientCount: id === 'FTA' ? 185 : id === 'RD' ? 1420 : 6800,
              openCases: id === 'FTA' ? 12 : id === 'RD' ? 48 : 210,
              coveragePercent: id === 'FTA' ? 94 : id === 'RD' ? 88 : 82,
              address: 'Riverside Community Health Center, Sector 4',
              contactPhone: '+233 24 555 0100',
            });
          }
          return;
        }
        const data = await res.json();
        setOrgUnit(data);
      } catch (err) {
        // Local fallback
        setOrgUnit({
          id: id || 'FTA',
          name: id === 'FTA' ? 'Field Team Alpha' : id === 'RD' ? 'Riverside District' : id === 'WR' ? 'Western Region' : `Unit ${id}`,
          type: id === 'WR' ? 'REGION' : id === 'RD' ? 'DISTRICT' : 'CLINIC',
          parentId: id === 'FTA' ? 'RD' : id === 'RD' ? 'WR' : null,
          managerName: id === 'FTA' ? 'Amara Okafor' : id === 'RD' ? 'Daniel Whitfield' : 'Rachel Summers',
          managerRole: id === 'FTA' ? 'SUPERVISOR' : id === 'RD' ? 'PROGRAMME_MANAGER' : 'REGIONAL_ADMIN',
          chwCount: id === 'FTA' ? 4 : id === 'RD' ? 28 : 142,
          patientCount: id === 'FTA' ? 185 : id === 'RD' ? 1420 : 6800,
          openCases: id === 'FTA' ? 12 : id === 'RD' ? 48 : 210,
          coveragePercent: id === 'FTA' ? 94 : id === 'RD' ? 88 : 82,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchAllUnits = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const res = await fetch(`${API_BASE}/admin/org-units`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setAllUnits(data);
        }
      } catch {}
    };

    if (id) {
      fetchOrgUnit();
      fetchAllUnits();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading unit dossier...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Button variant="outline" onClick={() => navigate(listRoute)}>← Back to Units</Button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', margin: 0 }}>Error</h1>
        </div>
        <Card>
          <CardContent style={{ padding: '2rem' }}>
            <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orgUnit) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Org Unit not found</h2>
        <Button onClick={() => navigate(listRoute)}>Return to List</Button>
      </div>
    );
  }

  const subUnits = allUnits.filter(u => u.parentId === orgUnit.id);
  const cov = orgUnit.coveragePercent || orgUnit.coverage || 85;
  const covColor = cov >= 85 ? '#16a34a' : cov >= 70 ? '#d97706' : '#dc2626';

  const mockStaff = [
    { id: 'usr-1', name: orgUnit.managerName || 'Amara Okafor', role: orgUnit.managerRole || 'SUPERVISOR', email: 'lead@carecompass.org', status: 'ACTIVE', caseload: 32 },
    { id: 'usr-2', name: 'John Smith', role: 'CHW', email: 'demo-chw@example.com', status: 'ACTIVE', caseload: 45 },
    { id: 'usr-3', name: 'Aisha Patel', role: 'CHW', email: 'aisha.patel@chwcare.health', status: 'ACTIVE', caseload: 52 },
    { id: 'usr-4', name: 'Emmanuel Diaz', role: 'CHW', email: 'emmanuel.diaz@chwcare.health', status: 'INVITED', caseload: 0 },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Breadcrumb Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="outline" size="sm" onClick={() => navigate(listRoute)}>
            ← Back to Organisational Hierarchy
          </Button>
          <span style={{ color: 'var(--color-text-muted)' }}>/</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{orgUnit.id}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" variant="outline" onClick={() => alert(`Exporting dossier package for unit ${orgUnit.id}`)}>
            📥 Export Unit Dossier
          </Button>
        </div>
      </div>

      {/* Hero Unit Profile Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                {typeIconMap[orgUnit.type] || '📍'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{orgUnit.name}</h1>
                  <Badge variant={typeVariant[orgUnit.type] || 'default'}>{orgUnit.type}</Badge>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Node Code: <strong style={{ fontFamily: 'monospace', color: 'var(--color-text)' }}>{orgUnit.id}</strong></span>
                  <span>Parent Hierarchy: <strong style={{ fontFamily: 'monospace', color: 'var(--color-text)' }}>{orgUnit.parentId || 'Top Root'}</strong></span>
                </div>
              </div>
            </div>

            {/* Manager Avatar Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <Avatar
                src={getAvatarForUser({ name: orgUnit.managerName, role: orgUnit.managerRole || 'SUPERVISOR' })}
                name={orgUnit.managerName || 'Manager'}
                role={orgUnit.managerRole || 'SUPERVISOR'}
                size="md"
              />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Unit Administrator / Lead
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  {orgUnit.managerName || 'Unassigned'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <Button
          size="sm"
          variant={activeTab === 'overview' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('overview')}
        >
          📊 Operational Overview & Metrics
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'personnel' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('personnel')}
        >
          👥 Assigned Personnel ({orgUnit.chwCount || mockStaff.length})
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'subunits' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('subunits')}
        >
          🏢 Sub-Units & Clinics ({subUnits.length})
        </Button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Field Capacity & Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Allocated Frontline CHWs</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>{orgUnit.chwCount}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Registered Catchment Population</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{(orgUnit.patientCount || 0).toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Active Triage & Open Cases</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ea580c' }}>{orgUnit.openCases || 12}</span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Target Coverage Health</span>
                    <span style={{ fontWeight: 800, color: covColor }}>{cov}% Target Met</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${cov}%`, height: '100%', backgroundColor: covColor, borderRadius: '999px' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unit Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic & Administrative Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <dl style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem', fontSize: '0.875rem', margin: 0 }}>
                <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Unit ID</dt>
                <dd style={{ margin: 0, fontFamily: 'monospace', fontWeight: 700 }}>{orgUnit.id}</dd>

                <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Jurisdiction Type</dt>
                <dd style={{ margin: 0 }}><Badge variant={typeVariant[orgUnit.type] || 'default'}>{orgUnit.type}</Badge></dd>

                <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Parent Authority</dt>
                <dd style={{ margin: 0, fontFamily: 'monospace' }}>{orgUnit.parentId || 'None (Top Level Root)'}</dd>

                <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Primary Contact</dt>
                <dd style={{ margin: 0 }}>{orgUnit.contactPhone || '+233 24 555 0100'}</dd>

                <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Dispatch Facility</dt>
                <dd style={{ margin: 0 }}>{orgUnit.address || 'District Health Secretariat, Sector 2'}</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Personnel */}
      {activeTab === 'personnel' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                  {['Staff Member', 'Role', 'Email', 'Active Caseload', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockStaff.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar
                          src={getAvatarForUser(s)}
                          name={s.name}
                          role={s.role}
                          size="sm"
                          status={s.status === 'ACTIVE' ? 'online' : 'offline'}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}><Badge variant="info">{s.role}</Badge></td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>{s.email}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{s.caseload} patients</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Sub-Units */}
      {activeTab === 'subunits' && (
        <div>
          {subUnits.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {subUnits.map(sub => (
                <Card
                  key={sub.id}
                  style={{ cursor: 'pointer', transition: 'transform 150ms ease, box-shadow 150ms ease' }}
                  onClick={() => navigate(`${listRoute}/${sub.id}`)}
                >
                  <CardContent style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{typeIconMap[sub.type] || '🏥'}</span>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{sub.name}</h4>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub.id}</span>
                        </div>
                      </div>
                      <Badge variant={typeVariant[sub.type] || 'default'}>{sub.type}</Badge>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                      <span>Lead: <strong>{sub.managerName || 'Unassigned'}</strong></span>
                      <span><strong>{sub.chwCount || 0}</strong> CHWs</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏥</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>No child sub-units attached</div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  This unit is a terminal clinic node in the organizational hierarchy.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
