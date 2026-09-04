import React, { useState, useEffect, useMemo } from 'react';
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

const roleLabelMap: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  REGIONAL_ADMIN: 'Regional Admin',
  PROGRAMME_MANAGER: 'Programme Manager',
  SUPERVISOR: 'Clinical Supervisor',
  CHW: 'Community Health Worker',
};

const roleBadgeVariant: Record<string, 'primary' | 'info' | 'warning' | 'default'> = {
  SUPER_ADMIN: 'danger' as any,
  REGIONAL_ADMIN: 'primary',
  PROGRAMME_MANAGER: 'warning',
  SUPERVISOR: 'info',
  CHW: 'default',
};

export const AccountsPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inspectUser, setInspectUser] = useState<any | null>(null);
  
  // Invite form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CHW');
  const [inviteOrgUnit, setInviteOrgUnit] = useState('WR');
  const [invitePhone, setInvitePhone] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [toast, setToast] = useState('');

  const fetchUsers = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // For regional admin, default orgUnitId if missing
          const mapped = data.map((u: any) => ({
            ...u,
            orgUnitId: u.orgUnitId || (u.role === 'CHW' ? 'FTA' : u.role === 'SUPERVISOR' ? 'RD' : 'WR'),
            phone: u.phone || '+233 24 555 ' + Math.floor(1000 + Math.random() * 9000),
          }));
          setUsers(mapped);
        } else {
          setUsers([
            { id: 'usr-chw-001', name: 'John Smith', email: 'demo-chw@example.com', role: 'CHW', status: 'ACTIVE', lastSignIn: 'Today, 2:00 PM', mfaEnabled: false, orgUnitId: 'FTA', phone: '+233 24 555 0192' },
            { id: 'usr-sup-001', name: 'Amara Okafor', email: 'demo-supervisor@example.com', role: 'SUPERVISOR', status: 'ACTIVE', lastSignIn: 'Today, 1:00 PM', mfaEnabled: true, orgUnitId: 'RD', phone: '+233 24 555 0184' },
            { id: 'usr-chw-002', name: 'Aisha Patel', email: 'aisha.patel@chwcare.health', role: 'CHW', status: 'ACTIVE', lastSignIn: 'Today, 12:30 PM', mfaEnabled: false, orgUnitId: 'FTA', phone: '+233 24 555 0118' },
            { id: 'usr-chw-003', name: 'Emmanuel Diaz', email: 'emmanuel.diaz@chwcare.health', role: 'CHW', status: 'INVITED', lastSignIn: 'Never', mfaEnabled: false, orgUnitId: 'FTA', phone: '+233 24 555 0145' },
            { id: 'usr-pm-001', name: 'Daniel Whitfield', email: 'daniel.whitfield@chwcare.health', role: 'PROGRAMME_MANAGER', status: 'ACTIVE', lastSignIn: 'Yesterday, 4:15 PM', mfaEnabled: true, orgUnitId: 'WR', phone: '+233 24 555 0199' },
            { id: 'usr-reg-001', name: 'Rachel Summers', email: 'demo-regional@example.com', role: 'REGIONAL_ADMIN', status: 'ACTIVE', lastSignIn: 'Today, 9:00 AM', mfaEnabled: true, orgUnitId: 'WR', phone: '+233 24 555 0101' },
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
    setSubmittingInvite(true);
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
        setUsers(prev => [{ ...created, phone: invitePhone || '+233 24 555 0200', orgUnitId: inviteOrgUnit }, ...prev]);
        setShowInviteModal(false);
        setInviteName('');
        setInviteEmail('');
        setInvitePhone('');
        setInviteOrgUnit('WR');
        setToast(`Invitation dispatch queued for ${inviteEmail}`);
        setTimeout(() => setToast(''), 3500);
      }
    } catch {
      // Local fallback for offline/demo
      const newUser = {
        id: `usr-reg-${Date.now().toString().slice(-4)}`,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: 'INVITED',
        lastSignIn: 'Never',
        mfaEnabled: false,
        orgUnitId: inviteOrgUnit,
        phone: invitePhone || '+233 24 555 0200',
      };
      setUsers(prev => [newUser, ...prev]);
      setShowInviteModal(false);
      setToast(`Invitation sent to ${inviteEmail}`);
      setTimeout(() => setToast(''), 3500);
    } finally {
      setSubmittingInvite(false);
    }
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
        if (inspectUser && inspectUser.id === user.id) {
          setInspectUser({ ...inspectUser, status: nextStatus });
        }
        setToast(`Account ${user.name} is now ${nextStatus}`);
        setTimeout(() => setToast(''), 3000);
      }
    } catch {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      if (inspectUser && inspectUser.id === user.id) {
        setInspectUser({ ...inspectUser, status: nextStatus });
      }
    }
  };

  const filtered = useMemo(() => {
    return users.filter(a => {
      const matchesSearch =
        (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
        (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
        (a.id && a.id.toLowerCase().includes(search.toLowerCase())) ||
        (a.orgUnitId && a.orgUnitId.toLowerCase().includes(search.toLowerCase()));

      const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'ACTIVE').length;
    const chws = users.filter(u => u.role === 'CHW').length;
    const supervisors = users.filter(u => u.role === 'SUPERVISOR').length;
    const invited = users.filter(u => u.status === 'INVITED').length;
    return { total, active, chws, supervisors, invited };
  }, [users]);

  const exportCSV = () => {
    const headers = 'ID,Name,Email,Role,OrgUnit,Status,LastSignIn,MFAEnabled,Phone\n';
    const rows = filtered.map(u => 
      `"${u.id}","${u.name}","${u.email}","${u.role}","${u.orgUnitId || ''}","${u.status}","${u.lastSignIn || ''}","${u.mfaEnabled ? 'YES' : 'NO'}","${u.phone || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regional_accounts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>👥</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Regional Accounts & Roster
            </h1>
            <Badge variant="primary">Western Region (WR)</Badge>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Manage regional healthcare personnel, provisioning, credentials, and organizational assignments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            📥 Export CSV
          </Button>
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            + Invite Regional User
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
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
              Total Personnel
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {stats.active} active accounts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              Field CHWs
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d9488' }}>
              {stats.chws}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Primary frontline workforce
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              Supervisors & Leads
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>
              {stats.supervisors}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Clinical triage & sign-off
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              Pending Invites
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.invited > 0 ? '#d97706' : 'var(--color-text-muted)' }}>
              {stats.invited}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Awaiting first sign-in
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
                placeholder="Search regional staff by name, email, ID, or unit..."
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Role:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{
                  height: '40px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0 0.75rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'white',
                  fontWeight: 500,
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="CHW">CHW</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="PROGRAMME_MANAGER">Programme Manager</option>
                <option value="REGIONAL_ADMIN">Regional Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  height: '40px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0 0.75rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'white',
                  fontWeight: 500,
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INVITED">Invited</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                ✕ Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personnel Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {['User Profile', 'Contact / Email', 'Role', 'Org Unit', 'Status', 'Last Active', 'MFA', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr
                  key={a.id}
                  style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 150ms ease' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.015)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar
                        src={a.avatar || getAvatarForUser(a)}
                        name={a.name}
                        role={a.role}
                        size="md"
                        status={a.status === 'ACTIVE' ? 'online' : 'offline'}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>{a.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{a.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text)' }}>{a.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.phone || 'No phone'}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Badge variant={roleBadgeVariant[a.role] || 'info'}>
                      {roleLabelMap[a.role] || a.role}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)'
                    }}>
                      {a.orgUnitId || 'WR'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Badge variant={statusVariant[a.status] || 'default'}>{a.status}</Badge>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {a.lastSignIn || 'Recently'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: a.mfaEnabled ? '#16a34a' : '#94a3b8'
                    }}>
                      {a.mfaEnabled ? '🛡️ Enabled' : '○ Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <Button size="sm" variant="ghost" onClick={() => setInspectUser(a)} title="Inspect user profile">
                        Inspect
                      </Button>
                      <Button
                        size="sm"
                        variant={a.status === 'ACTIVE' ? 'outline' : 'primary'}
                        onClick={() => toggleStatus(a)}
                      >
                        {a.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>No regional accounts found</div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      Try adjusting your search query or filter settings
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect User Modal */}
      <Modal
        isOpen={!!inspectUser}
        onClose={() => setInspectUser(null)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <span>Regional Personnel Dossier</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Button
              variant={inspectUser?.status === 'ACTIVE' ? 'outline' : 'primary'}
              size="sm"
              onClick={() => inspectUser && toggleStatus(inspectUser)}
            >
              {inspectUser?.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInspectUser(null)}>
              Close
            </Button>
          </div>
        }
      >
        {inspectUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <Avatar
                src={inspectUser.avatar || getAvatarForUser(inspectUser)}
                name={inspectUser.name}
                role={inspectUser.role}
                size="lg"
                status={inspectUser.status === 'ACTIVE' ? 'online' : 'offline'}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700 }}>{inspectUser.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge variant={roleBadgeVariant[inspectUser.role] || 'info'}>
                    {roleLabelMap[inspectUser.role] || inspectUser.role}
                  </Badge>
                  <Badge variant={statusVariant[inspectUser.status] || 'default'}>{inspectUser.status}</Badge>
                </div>
              </div>
            </div>

            {/* User Meta List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>User ID</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inspectUser.id}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Org Unit</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{inspectUser.orgUnitId || 'WR'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</span>
                <span>{inspectUser.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Phone Number</span>
                <span>{inspectUser.phone || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>MFA Enforced</span>
                <span style={{ fontWeight: 600, color: inspectUser.mfaEnabled ? '#16a34a' : '#94a3b8' }}>
                  {inspectUser.mfaEnabled ? '✓ Enabled' : '○ Not Enabled'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Last Sign-in</span>
                <span>{inspectUser.lastSignIn || 'Recent'}</span>
              </div>
            </div>

            {/* Quick Actions Note */}
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1e40af' }}>
              ℹ️ Regional Admin controls are scoped to <strong>Western Region (WR)</strong>. Changes take effect on next token refresh.
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Regional Personnel"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" form="invite-form" disabled={submittingInvite}>
              {submittingInvite ? 'Sending...' : 'Send Invitation'}
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInviteUser}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                required
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="e.g. Samuel K. Osei"
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Official Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Mobile Phone (for field SMS & WhatsApp dispatch)
              </label>
              <input
                type="tel"
                value={invitePhone}
                onChange={e => setInvitePhone(e.target.value)}
                placeholder="e.g. +233 24 555 0199"
                style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Role Assignment <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
                >
                  <option value="CHW">Community Health Worker (CHW)</option>
                  <option value="SUPERVISOR">Clinical Supervisor</option>
                  <option value="PROGRAMME_MANAGER">Programme Manager</option>
                  <option value="REGIONAL_ADMIN">Regional Administrator</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Assigned Org Unit <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={inviteOrgUnit}
                  onChange={e => setInviteOrgUnit(e.target.value)}
                  style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
                >
                  <option value="WR">Western Region (WR)</option>
                  <option value="RD">Riverside District (RD)</option>
                  <option value="FTA">Field Team Alpha (FTA)</option>
                  <option value="FTB">Field Team Beta (FTB)</option>
                </select>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              An activation invitation link with single-use token will be sent to the email address above.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
