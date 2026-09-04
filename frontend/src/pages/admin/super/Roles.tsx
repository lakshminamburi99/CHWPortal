import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { API_BASE } from '../../../config';

interface SystemPermission {
  key: string;
  label: string;
  description: string;
  category: 'CLINICAL' | 'OPERATIONS' | 'GOVERNANCE' | 'SECURITY';
  critical?: boolean;
}

const SYSTEM_PERMISSIONS: SystemPermission[] = [
  // Clinical & PHI
  { key: 'patients.read', label: 'View Patients', description: 'Access patient records, medical history, and demographics', category: 'CLINICAL' },
  { key: 'patients.write', label: 'Create/Edit Patients', description: 'Register new patients and update demographics', category: 'CLINICAL' },
  { key: 'assessments.run', label: 'Conduct Assessments', description: 'Execute clinical protocol checklists and diagnostic triage', category: 'CLINICAL' },
  { key: 'cases.review', label: 'Review High-Risk Cases', description: 'Conduct clinical case reviews and supervisor sign-offs', category: 'CLINICAL' },
  { key: 'referrals.submit', label: 'Submit Referrals', description: 'Create referral orders to health facilities', category: 'CLINICAL' },
  { key: 'referrals.approve', label: 'Approve Referrals', description: 'Authorize referral dispatches and emergency transports', category: 'CLINICAL' },
  { key: 'follow-ups.manage', label: 'Manage Follow-ups', description: 'Schedule and resolve post-assessment patient check-ins', category: 'CLINICAL' },

  // Operations
  { key: 'triage.manage', label: 'Manage Triage Queue', description: 'Reassign severity levels and triage workflows', category: 'OPERATIONS' },
  { key: 'team.manage', label: 'Team Supervision', description: 'Assign CHWs, manage caseloads, and monitor shifts', category: 'OPERATIONS' },
  { key: 'programmes.read', label: 'Programme Insights', description: 'View maternal, child health, and immunization indicators', category: 'OPERATIONS' },
  { key: 'reports.generate', label: 'Generate Reports', description: 'Compile and export epidemiological and district reports', category: 'OPERATIONS' },
  { key: 'regions.read', label: 'View Regions', description: 'Inspect regional summaries and operational districts', category: 'OPERATIONS' },

  // Governance & Personnel
  { key: 'users.all', label: 'Global User Management', description: 'Create, modify, and deactivate accounts across all regions', category: 'GOVERNANCE', critical: true },
  { key: 'users.region', label: 'Regional User Management', description: 'Manage accounts and personnel within assigned region', category: 'GOVERNANCE' },
  { key: 'org-units.all', label: 'Manage All Org Units', description: 'Create and modify regions, districts, and clinics globally', category: 'GOVERNANCE', critical: true },
  { key: 'org-units.region', label: 'Manage Regional Org Units', description: 'Configure clinics and operational teams in region', category: 'GOVERNANCE' },
  { key: 'accounts.manage', label: 'Account Provisioning', description: 'Issue activation invitations and manage credentials', category: 'GOVERNANCE' },
  { key: 'roles.edit', label: 'Configure RBAC Roles', description: 'Modify permission grants and security roles', category: 'GOVERNANCE', critical: true },

  // Security & Platform
  { key: 'platform.admin', label: 'Platform Superuser', description: 'Unrestricted administrative authority across all sub-systems', category: 'SECURITY', critical: true },
  { key: 'audit.read', label: 'Read Audit Logs', description: 'Inspect immutable audit logs and compliance event streams', category: 'SECURITY' },
  { key: 'audit.export', label: 'Export Audit Records', description: 'Download compliance and forensic security data', category: 'SECURITY' },
  { key: 'settings.edit', label: 'Modify Platform Settings', description: 'Configure global security policies, MFA, and feature flags', category: 'SECURITY', critical: true },
  { key: 'services.manage', label: 'Manage Microservices', description: 'Trigger service restarts, cache purges, and telemetry diagnostics', category: 'SECURITY', critical: true },
];

const CATEGORY_META = {
  CLINICAL: { label: 'Clinical & PHI Data', icon: '🩺', badge: 'info', color: '#0284c7' },
  OPERATIONS: { label: 'Field Operations & Supervision', icon: '📋', badge: 'warning', color: '#d97706' },
  GOVERNANCE: { label: 'Governance & Personnel', icon: '👥', badge: 'primary', color: '#4f46e5' },
  SECURITY: { label: 'Security & Platform Infrastructure', icon: '🛡️', badge: 'danger', color: '#dc2626' },
} as const;

export const RolesPage = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');
  const [newCustomPerm, setNewCustomPerm] = useState('');
  const [toast, setToast] = useState('');

  const fetchRoles = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/roles`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRoles(data);
        } else {
          setRoles([
            {
              role: 'SUPER_ADMIN',
              label: 'Super Administrator',
              description: 'Full platform access. Manages all users, roles, security policies, audit logs, system settings, microservices, and regional authorities.',
              userCount: 1,
              permissions: ['platform.admin', 'users.all', 'roles.edit', 'audit.read', 'audit.export', 'settings.edit', 'services.manage', 'org-units.all', 'regions.read'],
            },
            {
              role: 'REGIONAL_ADMIN',
              label: 'Regional Administrator',
              description: 'Governance authority over regional personnel, org unit structures, and account provisioning. Strictly zero direct clinical PHI data access.',
              userCount: 1,
              permissions: ['users.region', 'org-units.region', 'accounts.manage', 'regions.read', 'reports.generate'],
            },
            {
              role: 'PROGRAMME_MANAGER',
              label: 'Programme Manager',
              description: 'Monitors public health initiatives, epidemiological performance indicators, regional coverage targets, and district team metrics.',
              userCount: 1,
              permissions: ['programmes.read', 'reports.generate', 'regions.read', 'districts.read'],
            },
            {
              role: 'SUPERVISOR',
              label: 'Clinical Supervisor',
              description: 'Supervises field CHWs, conducts clinical triage reviews, signs off on high-risk cases, and approves referral transports.',
              userCount: 1,
              permissions: ['cases.review', 'triage.manage', 'team.manage', 'referrals.approve', 'follow-ups.manage', 'patients.read'],
            },
            {
              role: 'CHW',
              label: 'Community Health Worker',
              description: 'Frontline field health provider. Registers households, conducts clinical protocol assessments, submits referrals, and tracks patient follow-ups.',
              userCount: 4,
              permissions: ['patients.read', 'patients.write', 'assessments.run', 'referrals.submit', 'follow-ups.manage'],
            },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openEditor = (r: any) => {
    setEditingRole(r);
    setActivePermissions([...(r.permissions || [])]);
    setPermSearch('');
  };

  const togglePermission = (key: string) => {
    setActivePermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleCategoryAll = (category: keyof typeof CATEGORY_META) => {
    const categoryKeys = SYSTEM_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
    const allSelected = categoryKeys.every(k => activePermissions.includes(k));

    if (allSelected) {
      setActivePermissions(prev => prev.filter(k => !categoryKeys.includes(k)));
    } else {
      setActivePermissions(prev => Array.from(new Set([...prev, ...categoryKeys])));
    }
  };

  const addCustomPermission = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newCustomPerm.trim().toLowerCase();
    if (!formatted) return;
    if (!activePermissions.includes(formatted)) {
      setActivePermissions(prev => [...prev, formatted]);
    }
    setNewCustomPerm('');
  };

  const savePermissions = async () => {
    if (!editingRole) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/admin/roles/${editingRole.role}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ permissions: activePermissions }),
      });
      if (res.ok) {
        setRoles(prev => prev.map(r => r.role === editingRole.role ? { ...r, permissions: activePermissions } : r));
        setToast(`RBAC permissions updated for ${editingRole.label}`);
        setTimeout(() => setToast(''), 3500);
        setEditingRole(null);
      }
    } catch {
      // Local fallback
      setRoles(prev => prev.map(r => r.role === editingRole.role ? { ...r, permissions: activePermissions } : r));
      setToast(`RBAC permissions updated for ${editingRole.label}`);
      setTimeout(() => setToast(''), 3500);
      setEditingRole(null);
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!permSearch) return SYSTEM_PERMISSIONS;
    const q = permSearch.toLowerCase();
    return SYSTEM_PERMISSIONS.filter(p =>
      p.key.toLowerCase().includes(q) ||
      p.label.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [permSearch]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔐</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Role-Based Access Control (RBAC)
            </h1>
            <Badge variant="primary">{roles.length} System Roles</Badge>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Configure granular permission grants, clinical PHI boundaries, and administrative governance policies
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          <Button
            size="sm"
            variant={viewMode === 'cards' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('cards')}
          >
            📇 Role Cards
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'matrix' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('matrix')}
          >
            📊 Permissions Matrix
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

      {/* Security Scope Callout */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.25rem' }}>🛡️</span>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
          <strong>PHI & Governance Policy:</strong> Community Health Workers and Clinical Supervisors are granted clinical data access. Regional Administrators have governance authority over accounts and organizational units but are strictly prevented from querying protected health information (PHI).
        </div>
      </div>

      {/* View Mode: Cards */}
      {viewMode === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {roles.map(r => {
            const rolePerms = r.permissions || [];
            const isSuperAdmin = r.role === 'SUPER_ADMIN';

            return (
              <Card key={r.role}>
                <CardContent style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{r.label}</h3>
                        <Badge variant={isSuperAdmin ? 'danger' as any : 'info'}>
                          {r.userCount} active account{r.userCount !== 1 ? 's' : ''}
                        </Badge>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)', backgroundColor: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {r.role}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                        {r.description}
                      </p>

                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                          Active Permissions ({rolePerms.length})
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {rolePerms.map((p: string) => {
                            const found = SYSTEM_PERMISSIONS.find(s => s.key === p);
                            const category = found?.category || 'GOVERNANCE';
                            const meta = CATEGORY_META[category] || CATEGORY_META.GOVERNANCE;

                            return (
                              <span
                                key={p}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  padding: '0.2rem 0.55rem',
                                  backgroundColor: '#ffffff',
                                  border: `1px solid ${found?.critical ? '#fca5a5' : '#cbd5e1'}`,
                                  color: found?.critical ? '#b91c1c' : meta.color,
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                                title={found?.description || p}
                              >
                                {found?.critical && <span>⚠️</span>}
                                {p}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <Button size="sm" variant="outline" onClick={() => openEditor(r)}>
                        ⚙️ Configure Permissions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Mode: Matrix Table */}
      {viewMode === 'matrix' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, minWidth: '240px' }}>
                    Permission Scope
                  </th>
                  {roles.map(r => (
                    <th key={r.role} style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 700, minWidth: '120px' }}>
                      <div>{r.label}</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{r.role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['CLINICAL', 'OPERATIONS', 'GOVERNANCE', 'SECURITY'] as const).map(category => {
                  const catPerms = SYSTEM_PERMISSIONS.filter(p => p.category === category);
                  const meta = CATEGORY_META[category];

                  return (
                    <React.Fragment key={category}>
                      <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                        <td colSpan={roles.length + 1} style={{ padding: '0.6rem 1rem', fontWeight: 700, fontSize: '0.8rem', color: meta.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {meta.icon} {meta.label}
                        </td>
                      </tr>
                      {catPerms.map(perm => (
                        <tr key={perm.key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{perm.label}</span>
                              {perm.critical && <span style={{ fontSize: '0.65rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>CRITICAL</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{perm.key}</div>
                          </td>
                          {roles.map(r => {
                            const isGranted = (r.permissions || []).includes(perm.key);
                            return (
                              <td key={r.role} style={{ padding: '0.75rem', textAlign: 'center' }}>
                                {isGranted ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>
                                    ✓
                                  </span>
                                ) : (
                                  <span style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Permissions Configuration Modal */}
      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              RBAC Configuration: {editingRole?.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Role Code: <code style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{editingRole?.role}</code>
            </div>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {activePermissions.length} permissions active
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={savePermissions}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '68vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {/* Search catalog */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              placeholder="Search permission grants..."
              value={permSearch}
              onChange={e => setPermSearch(e.target.value)}
              style={{
                flex: 1,
                height: '38px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0 0.75rem',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Grouped Permissions Catalog */}
          {(['CLINICAL', 'OPERATIONS', 'GOVERNANCE', 'SECURITY'] as const).map(cat => {
            const catPerms = filteredCatalog.filter(p => p.category === cat);
            if (catPerms.length === 0) return null;
            const meta = CATEGORY_META[cat];
            const allSelected = catPerms.every(p => activePermissions.includes(p.key));

            return (
              <div key={cat} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: meta.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleCategoryAll(cat)}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {catPerms.map(perm => {
                    const isChecked = activePermissions.includes(perm.key);

                    return (
                      <label
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: isChecked ? '#f0fdf4' : 'transparent',
                          transition: 'background-color 150ms ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.key)}
                          style={{ marginTop: '0.25rem', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{perm.label}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              ({perm.key})
                            </span>
                            {perm.critical && (
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                                CRITICAL
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Custom Tag input */}
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Add Ad-hoc / Scoped Permission
            </div>
            <form onSubmit={addCustomPermission} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={newCustomPerm}
                onChange={e => setNewCustomPerm(e.target.value)}
                placeholder="e.g. telemetry.export or regional.billing"
                style={{
                  flex: 1,
                  height: '36px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '0 0.75rem',
                  fontSize: '0.85rem',
                }}
              />
              <Button type="submit" variant="outline" size="sm">
                + Add Scope
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};
