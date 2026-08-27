import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

const API_BASE = 'http://localhost:8000/api/v1';

const typeVariant: Record<string, 'info' | 'warning' | 'success'> = {
  REGION: 'info',
  DISTRICT: 'warning',
  CLINIC: 'success',
};

export const OrgUnitsPage = () => {
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
            { id: 'FTA', name: 'Field Team Alpha', type: 'CLINIC', parentId: 'RD', managerName: 'Amara Okafor', chwCount: 4, patientCount: 185, coveragePercent: 94 },
            { id: 'RD', name: 'Riverside District', type: 'DISTRICT', parentId: 'WR', managerName: 'Daniel Whitfield', chwCount: 28, patientCount: 1420, coveragePercent: 88 },
            { id: 'WR', name: 'Western Region', type: 'REGION', parentId: 'RHA', managerName: 'Rachel Summers', chwCount: 142, patientCount: 6800, coveragePercent: 82 },
            { id: 'RHA', name: 'Riverside Health Authority', type: 'REGION', parentId: null, managerName: 'Admin User', chwCount: 350, patientCount: 17500, coveragePercent: 86 },
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
  const [formData, setFormData] = useState({ name: '', type: 'CLINIC', parentId: '', managerName: '' });
  const [saving, setSaving] = useState(false);

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
        setShowModal(false);
        setFormData({ name: '', type: 'CLINIC', parentId: '', managerName: '' });
        fetchOrgUnits();
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Organisational Units</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Hierarchy of health regions, operational districts, and field teams</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ New Org Unit</Button>
      </div>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {['Unit Code', 'Name', 'Type', 'Parent', 'Manager', 'CHWs', 'Patients', 'Coverage'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgUnits.map(u => (
                <tr 
                  key={u.id} 
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} 
                  onClick={() => navigate(`/admin/regional/org-units/${u.id}`)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background-hover, #f9fafb)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>{u.id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><Badge variant={typeVariant[u.type] || 'default'}>{u.type}</Badge></td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.parentId || u.parent || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.managerName || u.manager}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{u.chwCount}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{u.patientCount}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontWeight: 600, color: (u.coveragePercent || u.coverage || 0) >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {u.coveragePercent || u.coverage || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Organisational Unit"
        footer={<>
          <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="org-unit-form" disabled={saving}>
            {saving ? 'Creating…' : 'Create unit'}
          </Button>
        </>}
      >
        <form id="org-unit-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0 0.6rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Type</label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0 0.6rem', backgroundColor: 'white' }}>
              <option value="CLINIC">Field Team / Clinic</option>
              <option value="DISTRICT">District</option>
              <option value="REGION">Region</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Parent Unit ID (Optional)</label>
            <input type="text" value={formData.parentId} onChange={e => setFormData({ ...formData, parentId: e.target.value })} placeholder="e.g. RD, WR" style={{ width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0 0.6rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Manager Name</label>
            <input type="text" value={formData.managerName} onChange={e => setFormData({ ...formData, managerName: e.target.value })} style={{ width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0 0.6rem' }} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

