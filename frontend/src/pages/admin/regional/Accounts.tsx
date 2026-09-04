import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Avatar } from '../../../components/ui/Avatar';
import { getAvatarForUser } from '../../../utils/avatars';

import { API_BASE } from '../../../config';

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  INVITED: 'info',
  SUSPENDED: 'danger',
};

export const AccountsPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CHW');
  const [inviteOrgUnit, setInviteOrgUnit] = useState('');
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
            { id: 'usr-chw-001', name: 'John Smith', email: 'demo-chw@example.com', role: 'CHW', status: 'ACTIVE', lastSignIn: 'Today, 2:00 PM', mfaEnabled: false },
            { id: 'usr-sup-001', name: 'Amara Okafor', email: 'demo-supervisor@example.com', role: 'SUPERVISOR', status: 'ACTIVE', lastSignIn: 'Today, 1:00 PM', mfaEnabled: true },
            { id: 'usr-chw-002', name: 'Aisha Patel', email: 'aisha.patel@chwcare.health', role: 'CHW', status: 'ACTIVE', lastSignIn: 'Today, 12:30 PM', mfaEnabled: false },
            { id: 'usr-chw-003', name: 'Emmanuel Diaz', email: 'emmanuel.diaz@chwcare.health', role: 'CHW', status: 'INVITED', lastSignIn: 'Never', mfaEnabled: false },
          ]);
        }
      })
      .catch(() => {});
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
        setInviteOrgUnit('');
        setToast(`Regional invitation sent to ${inviteEmail}`);
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

  const filtered = users.filter(a =>
    (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
    (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Regional Accounts</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>User accounts in Western Region — governance and provisioning</p>
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
            placeholder="Search regional accounts by name or email..."
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
                {['Name', 'Email', 'Role', 'Status', 'Last sign-in', 'MFA', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar
                        src={a.avatar || getAvatarForUser(a)}
                        name={a.name}
                        role={a.role}
                        size="sm"
                        status={a.status === 'ACTIVE' ? 'online' : 'offline'}
                      />
                      <span style={{ fontWeight: 600 }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{a.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><Badge variant="info">{(a.role || '').replace('_', ' ')}</Badge></td>
                  <td style={{ padding: '0.75rem 1rem' }}><Badge variant={statusVariant[a.status] || 'default'}>{a.status}</Badge></td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{a.lastSignIn || 'Recently'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: a.mfaEnabled ? 'var(--color-success)' : 'var(--color-text-light)' }}>
                      {a.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Button size="sm" variant={a.status === 'ACTIVE' ? 'ghost' : 'outline'} onClick={() => toggleStatus(a)}>
                      {a.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Regional User"
        footer={<>
          <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" form="invite-form">
            Send invitation
          </Button>
        </>}
      >
        <form id="invite-form" onSubmit={handleInviteUser}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Full Name</label>
              <input
                required
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="e.g. Samuel K. Osei"
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
                placeholder="e.g. samuel.osei@westernhealth.gov"
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="CHW">Community Health Worker (CHW)</option>
                <option value="SUPERVISOR">Clinical Supervisor</option>
                <option value="PROGRAMME_MANAGER">Programme Manager</option>
                <option value="REGIONAL_ADMIN">Regional Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Organizational Unit ID</label>
              <input
                required
                value={inviteOrgUnit}
                onChange={e => setInviteOrgUnit(e.target.value)}
                placeholder="e.g. WR, RD"
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
