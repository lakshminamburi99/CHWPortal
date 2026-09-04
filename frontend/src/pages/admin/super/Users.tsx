import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Avatar } from '../../../components/ui/Avatar';
import { getAvatarForUser } from '../../../utils/avatars';
import { API_BASE } from '../../../config';

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  INVITED: 'warning',
  SUSPENDED: 'danger',
};

const roleVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  SUPER_ADMIN: 'danger',
  REGIONAL_ADMIN: 'warning',
  PROGRAMME_MANAGER: 'info',
  MANAGER: 'info',
  SUPERVISOR: 'success',
  CHW: 'default',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: 'Full platform administration across all regions, roles, services, and system telemetry.',
  REGIONAL_ADMIN: 'Regional personnel and organizational unit management without clinical patient data access.',
  PROGRAMME_MANAGER: 'Strategic health programme oversight, population metrics, districts, and reporting.',
  SUPERVISOR: 'Clinical triage, case review, referral approvals, and health worker coaching.',
  CHW: 'Community outreach, household visits, protocol assessments, and referrals.',
};

export const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inspectUser, setInspectUser] = useState<any | null>(null);
  const [editingRoleUser, setEditingRoleUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState('CHW');
  const userFileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CHW');
  const [inviteOrgUnit, setInviteOrgUnit] = useState('FTA');
  const [toast, setToast] = useState('');

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inspectUser) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const token = localStorage.getItem('access_token');
      try {
        await fetch(`${API_BASE}/admin/users/${inspectUser.id}/avatar`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ avatar: dataUrl }),
        });
        setUsers(prev => prev.map(u => u.id === inspectUser.id ? { ...u, avatar: dataUrl } : u));
        setInspectUser((prev: any) => ({ ...prev, avatar: dataUrl }));
        setToast(`Profile photo updated from local computer for ${inspectUser.name} ✓`);
        setTimeout(() => setToast(''), 3000);
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUserAvatar = async (targetUser: any) => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/admin/users/${targetUser.id}/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ avatar: null }),
      });
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, avatar: undefined } : u));
      if (inspectUser && inspectUser.id === targetUser.id) {
        setInspectUser((prev: any) => ({ ...prev, avatar: undefined }));
      }
      setToast(`Profile photo removed for ${targetUser.name} ✓`);
      setTimeout(() => setToast(''), 3000);
    } catch {}
  };

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
            { id: 'usr-adm-001', name: 'Dr. Anthony Vance', email: 'demo-admin@example.com', role: 'SUPER_ADMIN', orgUnitId: 'RHA', orgUnit: 'Riverside Health Authority', status: 'ACTIVE', lastSignIn: 'Today, 2:45 PM', mfaEnabled: true, phone: '+1-555-0190' },
            { id: 'usr-reg-001', name: 'Rachel Summers', email: 'demo-regional-admin@example.com', role: 'REGIONAL_ADMIN', orgUnitId: 'WR', orgUnit: 'Western Region', status: 'ACTIVE', lastSignIn: 'Today, 1:10 PM', mfaEnabled: true, phone: '+1-555-0191' },
            { id: 'usr-mgr-001', name: 'Daniel Whitfield', email: 'demo-manager@example.com', role: 'PROGRAMME_MANAGER', orgUnitId: 'RD', orgUnit: 'Riverside District', status: 'ACTIVE', lastSignIn: 'Today, 11:30 AM', mfaEnabled: true, phone: '+1-555-0192' },
            { id: 'usr-sup-001', name: 'Amara Okafor', email: 'demo-supervisor@example.com', role: 'SUPERVISOR', orgUnitId: 'RD', orgUnit: 'Riverside District', status: 'ACTIVE', lastSignIn: 'Today, 1:40 PM', mfaEnabled: true, phone: '+1-555-0193' },
            { id: 'usr-chw-001', name: 'John Smith', email: 'demo-chw@example.com', role: 'CHW', orgUnitId: 'FTA', orgUnit: 'Field Team Alpha', status: 'ACTIVE', lastSignIn: 'Today, 2:15 PM', mfaEnabled: false, phone: '+1-555-0194' },
            { id: 'usr-chw-002', name: 'Aisha Patel', email: 'aisha.patel@chwcare.health', role: 'CHW', orgUnitId: 'FTA', orgUnit: 'Field Team Alpha', status: 'ACTIVE', lastSignIn: 'Today, 12:20 PM', mfaEnabled: false, phone: '+1-555-0195' },
            { id: 'usr-chw-003', name: 'Emmanuel Diaz', email: 'emmanuel.diaz@chwcare.health', role: 'CHW', orgUnitId: 'FTA', orgUnit: 'Field Team Alpha', status: 'INVITED', lastSignIn: 'Never', mfaEnabled: false, phone: '+1-555-0196' },
            { id: 'usr-chw-004', name: 'Mei Lin Chen', email: 'meilin.chen@chwcare.health', role: 'CHW', orgUnitId: 'FTA', orgUnit: 'Field Team Alpha', status: 'ACTIVE', lastSignIn: 'Yesterday, 4:00 PM', mfaEnabled: false, phone: '+1-555-0197' },
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
      } else {
        // Optimistic addition
        const fakeUser = {
          id: `usr-new-${Date.now().toString().slice(-4)}`,
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          orgUnitId: inviteOrgUnit,
          status: 'INVITED',
          lastSignIn: 'Never',
          mfaEnabled: false,
        };
        setUsers(prev => [fakeUser, ...prev]);
      }
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setToast(`Invitation successfully dispatched to ${inviteEmail} ✓`);
      setTimeout(() => setToast(''), 3500);
    } catch {
      setShowInviteModal(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRoleUser) return;
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/admin/users/${editingRoleUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(prev => prev.map(u => u.id === editingRoleUser.id ? { ...u, role: newRole } : u));
      if (inspectUser && inspectUser.id === editingRoleUser.id) {
        setInspectUser((prev: any) => ({ ...prev, role: newRole }));
      }
      setToast(`Updated role for ${editingRoleUser.name} to ${newRole} ✓`);
      setTimeout(() => setToast(''), 3000);
      setEditingRoleUser(null);
    } catch {}
  };

  const toggleStatus = async (user: any) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      if (inspectUser && inspectUser.id === user.id) {
        setInspectUser((prev: any) => ({ ...prev, status: nextStatus }));
      }
      setToast(`User ${user.name} is now ${nextStatus} ✓`);
      setTimeout(() => setToast(''), 3000);
    } catch {}
  };

  const toggleMfa = async (user: any) => {
    const nextMfa = !user.mfaEnabled;
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/admin/users/${user.id}/mfa`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, mfaEnabled: nextMfa } : u));
      if (inspectUser && inspectUser.id === user.id) {
        setInspectUser((prev: any) => ({ ...prev, mfaEnabled: nextMfa }));
      }
      setToast(`MFA requirement ${nextMfa ? 'enabled' : 'disabled'} for ${user.name}`);
      setTimeout(() => setToast(''), 3000);
    } catch {}
  };

  const exportCSV = () => {
    const headers = 'ID,Name,Email,Role,OrgUnit,Status,LastSignIn,MFAEnabled\n';
    const rows = filteredUsers.map(u => `"${u.id}","${u.name}","${u.email}","${u.role}","${u.orgUnitId || ''}","${u.status}","${u.lastSignIn || ''}","${u.mfaEnabled}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const mfaCount = users.filter(u => u.mfaEnabled).length;
  const mfaPercent = users.length > 0 ? Math.round((mfaCount / users.length) * 100) : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            User & Access Management
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            Global user directory, role assignments, security credentials, and organization bindings
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={exportCSV}>
            📥 Export CSV
          </Button>
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            + Invite New User
          </Button>
        </div>
      </div>

      {toast && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ✓ {toast}
        </div>
      )}

      {/* Overview Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Users', value: users.length, sub: 'Registered accounts' },
          { label: 'Active Status', value: activeCount, sub: `${Math.round((activeCount / (users.length || 1)) * 100)}% active rate` },
          { label: 'Pending Invites', value: users.filter(u => u.status === 'INVITED').length, sub: 'Awaiting activation' },
          { label: 'Suspended', value: users.filter(u => u.status === 'SUSPENDED').length, sub: 'Restricted access' },
          { label: 'MFA Enforced', value: `${mfaPercent}%`, sub: `${mfaCount} accounts with 2FA` },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent style={{ padding: '1rem 1.25rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>
                {stat.label}
              </span>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0 0.1rem', color: 'var(--foreground)' }}>
                {stat.value}
              </p>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{stat.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search users by name, email, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              height: '40px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0 0.85rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              height: '40px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0 0.75rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="REGIONAL_ADMIN">Regional Admin</option>
            <option value="PROGRAMME_MANAGER">Programme Manager</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="CHW">CHW</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              height: '40px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0 0.75rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                {['User Profile', 'Email', 'Role', 'Org Unit', 'Status', 'Last Sign-in', 'MFA Status', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr
                  key={u.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar
                        src={u.avatar || getAvatarForUser(u)}
                        name={u.name}
                        role={u.role}
                        size="sm"
                        status={u.status === 'ACTIVE' ? 'online' : 'offline'}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)', fontSize: '0.82rem' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={roleVariant[u.role] || 'default'}>
                      {(u.role || 'CHW').replace('_', ' ')}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{u.orgUnitId || 'RHA'}</span>
                    <div style={{ fontSize: '0.7rem' }}>{u.orgUnit || 'Regional Authority'}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={statusVariant[u.status] || 'default'}>
                      {u.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
                    {u.lastSignIn || 'Recently'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => toggleMfa(u)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: u.mfaEnabled ? '#16a34a' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                      title="Click to toggle MFA"
                    >
                      {u.mfaEnabled ? '🔒 Enabled' : '🔓 Disabled'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInspectUser(u)}
                      >
                        Inspect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingRoleUser(u); setNewRole(u.role); }}
                      >
                        Role
                      </Button>
                      <Button
                        size="sm"
                        variant={u.status === 'ACTIVE' ? 'outline' : 'primary'}
                        onClick={() => toggleStatus(u)}
                        style={{ color: u.status === 'ACTIVE' ? '#dc2626' : undefined }}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    No users matching your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modal: Inspect Full User Profile ── */}
      <Modal
        isOpen={!!inspectUser}
        onClose={() => setInspectUser(null)}
        title="User Account Details"
        footer={<>
          <Button variant="outline" onClick={() => setInspectUser(null)}>Close</Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingRoleUser(inspectUser);
              setNewRole(inspectUser.role);
            }}
          >
            Change Role
          </Button>
        </>}
      >
        {inspectUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <input
              type="file"
              ref={userFileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--muted)', borderRadius: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar
                    src={inspectUser.avatar || getAvatarForUser(inspectUser)}
                    name={inspectUser.name}
                    role={inspectUser.role}
                    size="xl"
                    status={inspectUser.status === 'ACTIVE' ? 'online' : 'offline'}
                    border={true}
                    borderColor="var(--primary)"
                  />
                  <button
                    type="button"
                    onClick={() => userFileInputRef.current?.click()}
                    title="Upload photo from local computer"
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#0284c7',
                      color: 'white',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    📷
                  </button>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{inspectUser.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Badge variant={roleVariant[inspectUser.role] || 'default'}>{inspectUser.role}</Badge>
                    <Badge variant={statusVariant[inspectUser.status] || 'default'}>{inspectUser.status}</Badge>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => userFileInputRef.current?.click()}
                >
                  📁 Upload Photo
                </Button>
                {inspectUser.avatar && (
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleRemoveUserAvatar(inspectUser)}
                  >
                    🗑️ Remove
                  </Button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <label style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Email Address</label>
                <strong>{inspectUser.email}</strong>
              </div>
              <div>
                <label style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Account ID</label>
                <code style={{ fontFamily: 'monospace' }}>{inspectUser.id}</code>
              </div>
              <div>
                <label style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Assigned Org Unit</label>
                <strong>{inspectUser.orgUnit || inspectUser.orgUnitId || 'RHA (Regional)'}</strong>
              </div>
              <div>
                <label style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>MFA Multi-Factor Authentication</label>
                <span style={{ color: inspectUser.mfaEnabled ? '#16a34a' : '#f59e0b', fontWeight: 700 }}>
                  {inspectUser.mfaEnabled ? '✓ Enforced (2FA Authenticator)' : '⚠️ Disabled'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <label style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Role Scope & Permissions:
              </label>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', margin: 0 }}>
                {ROLE_DESCRIPTIONS[inspectUser.role] || 'Standard healthcare platform permissions.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Change User Role ── */}
      <Modal
        isOpen={!!editingRoleUser}
        onClose={() => setEditingRoleUser(null)}
        title={`Change Role: ${editingRoleUser?.name}`}
        footer={<>
          <Button variant="outline" onClick={() => setEditingRoleUser(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdateRole}>Save Role Assignment</Button>
        </>}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Select New Platform Role
          </label>
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            style={{ width: '100%', height: '42px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.9rem', marginBottom: '1rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          >
            <option value="SUPER_ADMIN">Super Administrator (Full Platform)</option>
            <option value="REGIONAL_ADMIN">Regional Administrator (Org & Accounts)</option>
            <option value="PROGRAMME_MANAGER">Programme Manager (Regional Analytics)</option>
            <option value="SUPERVISOR">Clinical Supervisor (Triage & Approvals)</option>
            <option value="CHW">Community Health Worker (Field Assessments)</option>
          </select>

          <div style={{ padding: '0.85rem', backgroundColor: 'var(--muted)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
            <strong>Permissions Scope:</strong> {ROLE_DESCRIPTIONS[newRole]}
          </div>
        </div>
      </Modal>

      {/* ── Modal: Invite New User ── */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Platform User"
        footer={<>
          <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="invite-user-form">Send Platform Invite</Button>
        </>}
      >
        <form id="invite-user-form" onSubmit={handleInviteUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Full Name *</label>
            <input
              required
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              placeholder="e.g. Dr. Jane Mwangi"
              style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Email Address *</label>
            <input
              required
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="jane.mwangi@chwcare.health"
              style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Platform Role *</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)' }}
            >
              <option value="CHW">Community Health Worker (CHW)</option>
              <option value="SUPERVISOR">Clinical Supervisor</option>
              <option value="PROGRAMME_MANAGER">Programme Manager</option>
              <option value="REGIONAL_ADMIN">Regional Administrator</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Assigned Org Unit Code</label>
            <input
              value={inviteOrgUnit}
              onChange={e => setInviteOrgUnit(e.target.value)}
              placeholder="e.g. FTA, RD, WR"
              style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
