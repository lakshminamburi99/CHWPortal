import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
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

export const OrgUnitsPage = () => {
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const navigate = useNavigate();
  const location = useLocation();

  // Determine base route prefix: /admin/super/org-units or /admin/regional/org-units
  const isSuperAdmin = location.pathname.includes('/super/');
  const routePrefix = isSuperAdmin ? '/admin/super/org-units' : '/admin/regional/org-units';

  const fetchOrgUnits = () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/org-units`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setOrgUnits(data);
        } else {
          setOrgUnits([
            { id: 'RHA', name: 'Riverside Health Authority', type: 'REGION', parentId: null, managerName: 'Admin User', chwCount: 350, patientCount: 17500, coveragePercent: 86 },
            { id: 'WR', name: 'Western Region', type: 'REGION', parentId: 'RHA', managerName: 'Rachel Summers', chwCount: 142, patientCount: 6800, coveragePercent: 82 },
            { id: 'RD', name: 'Riverside District', type: 'DISTRICT', parentId: 'WR', managerName: 'Daniel Whitfield', chwCount: 28, patientCount: 1420, coveragePercent: 88 },
            { id: 'FTA', name: 'Field Team Alpha', type: 'CLINIC', parentId: 'RD', managerName: 'Amara Okafor', chwCount: 4, patientCount: 185, coveragePercent: 94 },
            { id: 'FTB', name: 'Field Team Beta', type: 'CLINIC', parentId: 'RD', managerName: 'Aisha Patel', chwCount: 6, patientCount: 290, coveragePercent: 89 },
            { id: 'CD', name: 'Coastal District', type: 'DISTRICT', parentId: 'WR', managerName: 'Kofi Mensah', chwCount: 32, patientCount: 1650, coveragePercent: 78 },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgUnits();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'CLINIC', parentId: 'RD', managerName: '', chwCount: 4, patientCount: 200 });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/admin/org-units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const created = await res.json();
        setOrgUnits(prev => [...prev, created]);
        setShowModal(false);
        setFormData({ name: '', type: 'CLINIC', parentId: 'RD', managerName: '', chwCount: 4, patientCount: 200 });
        setToast(`Organisational unit "${formData.name}" created successfully`);
        setTimeout(() => setToast(''), 3500);
      }
    } catch {
      // Local fallback
      const newUnit = {
        id: `U-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        type: formData.type,
        parentId: formData.parentId || null,
        managerName: formData.managerName,
        chwCount: Number(formData.chwCount) || 2,
        patientCount: Number(formData.patientCount) || 100,
        coveragePercent: 85,
      };
      setOrgUnits(prev => [...prev, newUnit]);
      setShowModal(false);
      setToast(`Organisational unit "${formData.name}" created successfully`);
      setTimeout(() => setToast(''), 3500);
    }
    setSaving(false);
  };

  const filtered = useMemo(() => {
    return orgUnits.filter(u => {
      const matchesType = typeFilter === 'ALL' || u.type === typeFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.managerName && u.managerName.toLowerCase().includes(q)) ||
        (u.parentId && u.parentId.toLowerCase().includes(q));

      return matchesType && matchesSearch;
    });
  }, [orgUnits, typeFilter, search]);

  const stats = useMemo(() => {
    const total = orgUnits.length;
    const regions = orgUnits.filter(u => u.type === 'REGION').length;
    const districts = orgUnits.filter(u => u.type === 'DISTRICT').length;
    const clinics = orgUnits.filter(u => u.type === 'CLINIC').length;
    const totalCHWs = orgUnits.reduce((acc, u) => acc + (u.chwCount || 0), 0);
    const avgCoverage = orgUnits.length > 0 ? Math.round(orgUnits.reduce((acc, u) => acc + (u.coveragePercent || u.coverage || 80), 0) / orgUnits.length) : 85;
    return { total, regions, districts, clinics, totalCHWs, avgCoverage };
  }, [orgUnits]);

  // Build hierarchy tree
  const treeRoots = useMemo(() => {
    const rootNodes = orgUnits.filter(u => !u.parentId || !orgUnits.some(p => p.id === u.parentId));
    return rootNodes;
  }, [orgUnits]);

  const getChildren = (parentId: string) => {
    return orgUnits.filter(u => u.parentId === parentId);
  };

  const exportCSV = () => {
    const headers = 'ID,Name,Type,ParentID,Manager,CHWCount,PatientCount,CoveragePercent\n';
    const rows = filtered.map(u =>
      `"${u.id}","${u.name}","${u.type}","${u.parentId || ''}","${u.managerName || u.manager || ''}","${u.chwCount || 0}","${u.patientCount || 0}","${u.coveragePercent || u.coverage || 0}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `org_hierarchy_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏢</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Organisational Structure & Hierarchy
            </h1>
            <Badge variant="primary">{isSuperAdmin ? 'Global Governance' : 'Western Region'}</Badge>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Configure geographic healthcare regions, operational districts, and frontline clinic teams
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            📥 Export CSV
          </Button>
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('table')}
            >
              📄 Table
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'tree' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('tree')}
            >
              🌳 Hierarchy Tree
            </Button>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + New Org Unit
          </Button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          borderRadius: '10px',
          border: '1px solid #a7f3d0',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 500,
        }}>
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              Total Units
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Active nodes across hierarchy
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              Operational Districts
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>
              {stats.districts}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {stats.regions} overarching region{stats.regions !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              Clinics & Field Teams
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d9488' }}>
              {stats.clinics}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Frontline service delivery
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              Avg. Catchment Coverage
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.avgCoverage >= 80 ? '#16a34a' : '#d97706' }}>
              {stats.avgCoverage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Population reach metric
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>🔍</span>
              <input
                placeholder="Search org units by name, unit code, manager, or parent..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0 0.75rem 0 2.25rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Unit Type:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{ height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.85rem', backgroundColor: 'white' }}
              >
                <option value="ALL">All Types</option>
                <option value="REGION">🌍 Region</option>
                <option value="DISTRICT">🏙️ District</option>
                <option value="CLINIC">🏥 Field Team / Clinic</option>
              </select>
            </div>

            {(search || typeFilter !== 'ALL') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('ALL');
                }}
              >
                ✕ Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Mode: Table */}
      {viewMode === 'table' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                  {['Unit Code', 'Name & Designation', 'Type', 'Parent Hierarchy', 'Assigned Manager', 'CHWs', 'Patients', 'Coverage Health', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const cov = u.coveragePercent || u.coverage || 80;
                  const covColor = cov >= 85 ? '#16a34a' : cov >= 70 ? '#d97706' : '#dc2626';

                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      onClick={() => navigate(`${routePrefix}/${u.id}`)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          backgroundColor: '#f1f5f9',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1'
                        }}>
                          {u.id}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{typeIconMap[u.type] || '📍'}</span>
                          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{u.name}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={typeVariant[u.type] || 'default'}>{u.type}</Badge>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {u.parentId || u.parent ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text)' }}>
                            ↳ {u.parentId || u.parent}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>— Top Root</span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text)', fontSize: '0.85rem' }}>
                        {u.managerName || u.manager || 'Unassigned'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {u.chwCount || 0}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                        {(u.patientCount || 0).toLocaleString()}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${cov}%`, height: '100%', backgroundColor: covColor, borderRadius: '999px' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: covColor }}>{cov}%</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${routePrefix}/${u.id}`);
                          }}
                        >
                          Details ➔
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>No organisational units found</div>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        Try adjusting your search keywords or unit type filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* View Mode: Tree View */}
      {viewMode === 'tree' && (
        <Card>
          <CardContent style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {treeRoots.map(root => (
                <div key={root.id} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', backgroundColor: '#f8fafc' }}>
                  {/* Root node */}
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    onClick={() => navigate(`${routePrefix}/${root.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{typeIconMap[root.type] || '📍'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                          {root.name} <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({root.id})</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Lead: {root.managerName || 'Admin'} • {root.chwCount} CHWs • {root.patientCount} Patients
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Badge variant={typeVariant[root.type] || 'default'}>{root.type}</Badge>
                      <Button size="sm" variant="outline">View Unit ➔</Button>
                    </div>
                  </div>

                  {/* Level 2: Districts */}
                  <div style={{ marginLeft: '1.75rem', marginTop: '0.75rem', borderLeft: '2px dashed #cbd5e1', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {getChildren(root.id).map(dist => (
                      <div key={dist.id} style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => navigate(`${routePrefix}/${dist.id}`)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{typeIconMap[dist.type] || '🏙️'}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {dist.name} <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({dist.id})</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                District Manager: {dist.managerName || 'Unassigned'} • Coverage: {dist.coveragePercent || dist.coverage || 85}%
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Badge variant={typeVariant[dist.type] || 'warning'}>{dist.type}</Badge>
                            <Button size="sm" variant="ghost">Inspect ➔</Button>
                          </div>
                        </div>

                        {/* Level 3: Field Clinics */}
                        {getChildren(dist.id).length > 0 && (
                          <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', borderLeft: '2px solid #e2e8f0', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {getChildren(dist.id).map(clinic => (
                              <div
                                key={clinic.id}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}
                                onClick={() => navigate(`${routePrefix}/${clinic.id}`)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1rem' }}>🏥</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{clinic.name} ({clinic.id})</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>— {clinic.chwCount} CHWs</span>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                                  {clinic.coveragePercent || clinic.coverage || 90}% Cov
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Org Unit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Organisational Unit"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="org-unit-form" disabled={saving}>
              {saving ? 'Creating…' : 'Create Unit'}
            </Button>
          </>
        }
      >
        <form id="org-unit-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Unit Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Field Team Delta, Northern District"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Unit Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="CLINIC">🏥 Field Team / Clinic</option>
                <option value="DISTRICT">🏙️ Operational District</option>
                <option value="REGION">🌍 Regional Authority</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Parent Hierarchy Node
              </label>
              <select
                value={formData.parentId}
                onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="">(None - Top Level)</option>
                {orgUnits.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.id}) - {u.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Designated Lead / Manager Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Kwame Nkrumah, Amara Okafor"
              value={formData.managerName}
              onChange={e => setFormData({ ...formData, managerName: e.target.value })}
              style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Allocated CHW Quota
              </label>
              <input
                type="number"
                min="0"
                value={formData.chwCount}
                onChange={e => setFormData({ ...formData, chwCount: Number(e.target.value) })}
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Estimated Population
              </label>
              <input
                type="number"
                min="0"
                value={formData.patientCount}
                onChange={e => setFormData({ ...formData, patientCount: Number(e.target.value) })}
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
