import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

import { API_BASE } from '../../../config';

export const RolesPage = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [newPerm, setNewPerm] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
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
            { role: 'SUPER_ADMIN', label: 'Super administrator', description: 'Full platform access. Manages all users, roles, audit logs, system settings, and all regions.', userCount: 1, permissions: ['platform.admin', 'users.all', 'roles.edit', 'audit.read', 'settings.edit', 'regions.all'] },
            { role: 'REGIONAL_ADMIN', label: 'Regional administrator', description: 'Manages users and org units within their assigned region. No clinical data access.', userCount: 1, permissions: ['users.region', 'org-units.region', 'accounts.manage'] },
            { role: 'PROGRAMME_MANAGER', label: 'Programme manager', description: 'Monitors programme metrics, regions, districts, and teams within their scope.', userCount: 1, permissions: ['programmes.read', 'reports.generate', 'regions.read', 'teams.read'] },
            { role: 'SUPERVISOR', label: 'Clinical Supervisor', description: 'Reviews escalated cases, manages their CHW team, approves referrals.', userCount: 1, permissions: ['cases.review', 'triage.manage', 'team.manage', 'referrals.approve'] },
            { role: 'CHW', label: 'Community health worker', description: 'Registers patients, runs assessments, submits referrals, manages their caseload.', userCount: 4, permissions: ['patients.own', 'assessments.run', 'referrals.submit', 'follow-ups.manage'] },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openEditor = (r: any) => {
    setEditingRole(r);
    setActivePermissions([...(r.permissions || [])]);
  };

  const addPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerm.trim()) return;
    if (!activePermissions.includes(newPerm.trim().toUpperCase())) {
      setActivePermissions(prev => [...prev, newPerm.trim().toUpperCase()]);
    }
    setNewPerm('');
  };

  const removePermission = (p: string) => {
    setActivePermissions(prev => prev.filter(x => x !== p));
  };

  const savePermissions = async () => {
    if (!editingRole) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/admin/roles/${editingRole.role}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ permissions: activePermissions })
      });
      if (res.ok) {
        setRoles(prev => prev.map(r => r.role === editingRole.role ? { ...r, permissions: activePermissions } : r));
        setToast(`Permissions updated for ${editingRole.label}`);
        setTimeout(() => setToast(''), 3000);
        setEditingRole(null);
      }
    } catch {}
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Role-Based Access Control (RBAC)</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Platform role definitions, active user counts, and security permission grants</p>
      </div>

      {toast && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {roles.map(r => (
          <Card key={r.role}>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{r.label}</h3>
                    <Badge variant="info">{r.userCount} user{r.userCount !== 1 ? 's' : ''}</Badge>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{r.description}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {Array.isArray(r.permissions) && r.permissions.map((p: string) => (
                      <span key={p} style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem',
                        backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)',
                        borderRadius: '4px', fontFamily: 'monospace', color: 'var(--color-text-muted)',
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openEditor(r)}>Edit permissions</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Editor Modal */}
      <Modal isOpen={!!editingRole} onClose={() => setEditingRole(null)} title={
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Permissions: {editingRole?.label}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Role Code: {editingRole?.role}</p>
        </div>
      }
      footer={<>
        <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
        <Button type="button" variant="primary" onClick={savePermissions}>Save changes</Button>
      </>}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Current Granted Permissions</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', minHeight: '60px', padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            {activePermissions.map(p => (
              <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'monospace' }}>
                {p}
                <button type="button" onClick={() => removePermission(p)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={addPermission} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={newPerm}
            onChange={e => setNewPerm(e.target.value)}
            placeholder="e.g. PATIENT_EXPORT or CLINICAL_AUDIT"
            style={{ flex: 1, height: '38px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase' }}
          />
          <Button type="submit" variant="outline">+ Add</Button>
        </form>
      </Modal>
    </div>
  );
};

