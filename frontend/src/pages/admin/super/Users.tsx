import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

import { API_BASE } from '../../../config';

const statusVariant: Record<string, 'success' | 'info' | 'danger'> = {
  ACTIVE: 'success',
  INVITED: 'info',
  SUSPENDED: 'danger',
};

const roleVariant: Record<string, 'info' | 'warning' | 'danger' | 'success' | 'default'> = {
  SUPER_ADMIN: 'danger',
  REGIONAL_ADMIN: 'warning',
  PROGRAMME_MANAGER: 'info',
  MANAGER: 'info',
  SUPERVISOR: 'success',
  CHW: 'default',
};

export const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingRoleUser, setEditingRoleUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState('CHW');

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CHW');
  const [inviteOrgUnit, setInviteOrgUnit] = useState('FTA');
  const [toast, setToast] = useState('');

  const fetchUsers = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        } else {
          setUsers([
            { id: 'usr-adm-001', name: 'Admin User', email: 'demo-admin@example.com', role: 'SUPER_ADMIN', orgUnitId: 'RHA', status: 'ACTIVE', lastSignIn: 'Today', mfaEnabled: true },
            { id: 'usr-reg-001', name: 'Rachel Summers', email: 'demo-regional-admin@example.com', role: 'REGIONAL_ADMIN', orgUnitId: 'WR', status: 'ACTIVE', lastSignIn: 'Today', mfaEnabled: true },
            { id: 'usr-mgr-001', name: 'Daniel Whitfield', email: 'demo-manager@example.com', role: 'PROGRAMME_MANAGER', orgUnitId: 'RHA', status: 'ACTIVE', lastSignIn: 'Today', mfaEnabled: false },
            { id: 'usr-sup-001', name: 'Amara Okafor', email: 'demo-supervisor@example.com', role: 'SUPERVISOR', orgUnitId: 'RD', status: 'ACTIVE', lastSignIn: 'Today', mfaEnabled: false },
            { id: 'usr-chw-001', name: 'John Smith', email: 'demo-chw@example.com', role: 'CHW', orgUnitId: 'FTA', status: 'ACTIVE', lastSignIn: 'Today', mfaEnabled: false },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          orgUnitId: inviteOrgUnit,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setUsers(prev => [created, ...prev]);
        setShowInviteModal(false);
        setInviteName('');
        setInviteEmail('');
        setToast(`Invitation sent to ${inviteEmail}`);
        setTimeout(() => setToast(''), 3000);
      }
    } catch {}
  };

  const toggleStatus = async (user: any) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      }
    } catch {}
  };

  const toggleMfa = async (user: any) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/toggle-mfa`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, mfaEnabled: !u.mfaEnabled } : u));
      }
    } catch {}
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleUser) return;
    const token = localStorage.getItem('access_token');

    try {
      const res = await fetch(`${API_BASE}/admin/users/${editingRoleUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === editingRoleUser.id ? { ...u, role: newRole } : u));
        setEditingRoleUser(null);
      }
    } catch {}
  };

  const filtered = users.filter(u =>
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Platform Users</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>User identity management and role permissions across all health regions</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>+ Invite user</Button>
      </div>

      {toast && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ✓ {toast}
        </div>
      )}

      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1rem' }}>
          <input
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
          />
        </CardContent>
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {['Name', 'Email', 'Role', 'Org unit', 'Status', 'Last sign-in', 'MFA', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={roleVariant[u.role] || 'default'}>{u.role ? u.role.replace('_', ' ') : 'CHW'}</Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.orgUnitId || u.orgUnit || 'RHA'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={statusVariant[u.status] || 'default'}>{u.status}</Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{u.lastSignIn || 'Recently'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => toggleMfa(u)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: u.mfaEnabled ? 'var(--color-success)' : 'var(--color-text-light)',
                        textDecoration: 'underline',
                      }}
                    >
                      {u.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingRoleUser(u); setNewRole(u.role); }}
                      >
                        Change role
                      </Button>
                      <Button
                        size="sm"
                        variant={u.status === 'ACTIVE' ? 'ghost' : 'outline'}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No users found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite User Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite New User"
        footer={<>
          <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          <Button type="submit" form="invite-user-form" variant="primary">
            Send invitation
          </Button>
        </>}
      >
        <form id="invite-user-form" onSubmit={handleInviteUser}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Full Name</label>
              <input
                required
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="e.g. Dr. Maya Lin"
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Email Address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="e.g. maya.lin@healthauthority.org"
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Role Assignment</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="CHW">Community Health Worker (CHW)</option>
                <option value="SUPERVISOR">Clinical Supervisor</option>
                <option value="PROGRAMME_MANAGER">Programme Manager</option>
                <option value="REGIONAL_ADMIN">Regional Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Organizational Unit</label>
              <input
                value={inviteOrgUnit}
                onChange={e => setInviteOrgUnit(e.target.value)}
                placeholder="e.g. FTA, RD, or RHA"
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={!!editingRoleUser} onClose={() => setEditingRoleUser(null)} title="Update Role"
        footer={<>
          <Button type="button" variant="outline" onClick={() => setEditingRoleUser(null)}>
            Cancel
          </Button>
          <Button type="submit" form="change-role-form" variant="primary">
            Save role
          </Button>
        </>}
      >
        <form id="change-role-form" onSubmit={handleSaveRole}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Change system role permissions for <strong>{editingRoleUser?.name}</strong>:
          </p>
          <div style={{ marginBottom: '0.5rem' }}>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
            >
              <option value="CHW">Community Health Worker (CHW)</option>
              <option value="SUPERVISOR">Clinical Supervisor</option>
              <option value="PROGRAMME_MANAGER">Programme Manager</option>
              <option value="REGIONAL_ADMIN">Regional Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

