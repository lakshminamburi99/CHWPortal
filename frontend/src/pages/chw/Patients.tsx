import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../App';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { getAvatarForPatient } from '../../utils/avatars';
import { formatDate } from '../../utils/formatters';
import { API_BASE } from '../../config';

const initialPatients = [
  { id: 'PT-2026-0001', name: 'Maria Santos', age: 28, sex: 'Female', status: 'HIGH_PRIORITY', lastVisit: '2026-08-20', language: 'es', chw: 'John Smith', phone: '+1-555-0101', address: 'Sector 4, House 12', emergency: 'Juan Santos (+1-555-0191)' },
  { id: 'PT-2026-0002', name: 'Ahmed Robinson', age: 7, sex: 'Male', status: 'FOLLOW_UP', lastVisit: '2026-08-22', language: 'ar', chw: 'John Smith', phone: '+1-555-0102', address: 'North Block, Apt 3B', emergency: 'Amina Robinson (+1-555-0192)' },
  { id: 'PT-2026-0003', name: 'Priya Patel', age: 34, sex: 'Female', status: 'ACTIVE', lastVisit: '2026-08-18', language: 'hi', chw: 'John Smith', phone: '+1-555-0103', address: 'East Street, House 45', emergency: 'Raj Patel (+1-555-0193)' },
  { id: 'PT-2026-0004', name: 'James Wilson', age: 67, sex: 'Male', status: 'ACTIVE', lastVisit: '2026-08-15', language: 'en', chw: 'John Smith', phone: '+1-555-0104', address: 'West Road, House 8', emergency: 'Mary Wilson (+1-555-0194)' },
  { id: 'PT-2026-0005', name: 'Fatima Al-Rashid', age: 42, sex: 'Female', status: 'REFERRED', lastVisit: '2026-08-21', language: 'ar', chw: 'John Smith', phone: '+1-555-0105', address: 'Central Community, Unit 12', emergency: 'Tariq Al-Rashid (+1-555-0195)' },
  { id: 'PT-2026-0006', name: 'Carlos Rivera', age: 55, sex: 'Male', status: 'ACTIVE', lastVisit: '2026-08-19', language: 'es', chw: 'John Smith', phone: '+1-555-0106', address: 'South Sector, House 23', emergency: 'Elena Rivera (+1-555-0196)' },
];

const statusVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  HIGH_PRIORITY: 'danger',
  FOLLOW_UP: 'warning',
  REFERRED: 'info',
  ACTIVE: 'success',
  INACTIVE: 'default',
};

export const PatientsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState<typeof initialPatients[0] | null>(null);

  // New/Edit Patient Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: 'Female',
    phone: '',
    address: '',
    emergencyContact: '',
  });

  // Fetch real patients from API if available
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/patients`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            age: p.age || 30,
            sex: p.sex || 'Female',
            status: p.status || 'ACTIVE',
            lastVisit: p.lastVisit || '2026-08-20',
            language: p.preferredLanguage || 'en',
            chw: user?.name || 'John Smith',
            phone: p.phone || '+1-555-0100',
            address: p.address || 'Local Community',
            emergency: p.emergencyContact?.name ? `${p.emergencyContact.name} (${p.emergencyContact.phone})` : 'Family (+1-555-0100)',
          }));
          setPatients(mapped);
        }
      })
      .catch(() => {});
  }, [user, saving]);

  const openNewModal = () => {
    setIsEditing(false);
    setFormData({ firstName: '', lastName: '', dateOfBirth: '', sex: 'Female', phone: '', address: '', emergencyContact: '' });
    setShowModal(true);
  };

  const openEditModal = (patient: any) => {
    setIsEditing(true);
    const [first, ...rest] = patient.name.split(' ');
    setFormData({
      firstName: first || '',
      lastName: rest.join(' ') || '',
      dateOfBirth: '1995-01-01',
      sex: patient.sex || 'Female',
      phone: patient.phone || '',
      address: patient.address || '',
      emergencyContact: patient.emergency?.split('(')[0].trim() || '',
    });
    setSelectedPatient(null);
    setShowModal(true);
  };

  const handleCreatePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const birthYear = formData.dateOfBirth ? parseInt(formData.dateOfBirth.slice(0, 4)) : 1995;
    const age = Math.max(1, new Date().getFullYear() - birthYear);
    const id = isEditing && selectedPatient ? selectedPatient.id : `PT-2026-${String(patients.length + 1).padStart(4, '0')}`;
    const name = `${formData.firstName} ${formData.lastName}`.trim();

    const createdRecord = {
      id,
      name,
      age,
      sex: formData.sex,
      status: 'ACTIVE',
      lastVisit: new Date().toISOString().slice(0, 10),
      language: i18n.language || 'en',
      chw: user?.name || 'John Smith',
      phone: formData.phone || '+1-555-0199',
      address: formData.address || 'Riverside Community',
      emergency: formData.emergencyContact || 'Family Contact',
    };

    try {
      const token = localStorage.getItem('access_token');
      const method = isEditing ? 'PATCH' : 'POST';
      const endpoint = isEditing ? `${API_BASE}/patients/${id}` : `${API_BASE}/patients`;
      
      await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || '1995-01-01',
          sex: formData.sex,
          preferredLanguage: i18n.language || 'en',
          phone: formData.phone || '+1-555-0199',
          address: formData.address || 'Riverside Community',
          emergencyContact: { name: formData.emergencyContact || 'Contact', relationship: 'Family', phone: formData.phone || '+1-555-0199' },
          assignedChwId: user?.id || 'usr-chw-001',
        }),
      });
    } catch {}

    if (!isEditing) {
      setPatients([createdRecord, ...patients]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {t('patients.title')}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            {t('patients.subtitle', { count: patients.length })}
          </p>
        </div>
        <Button onClick={openNewModal}>+ {t('patients.new_patient')}</Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            placeholder={t('patients.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '200px', height: '40px',
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '0 0.75rem', fontSize: '0.875rem',
              backgroundColor: 'var(--card)', color: 'var(--foreground)',
            }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '0 0.75rem', height: '40px', fontSize: '0.875rem',
              backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
            }}
          >
            <option value="ALL">{t('patients.all_statuses')}</option>
            <option value="ACTIVE">{t('patients.status_active')}</option>
            <option value="HIGH_PRIORITY">{t('patients.status_high_priority')}</option>
            <option value="FOLLOW_UP">{t('patients.status_follow_up')}</option>
            <option value="REFERRED">{t('patients.status_referred')}</option>
          </select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                {[
                  t('patients.th_id'),
                  t('patients.th_name'),
                  t('patients.th_age_sex'),
                  t('patients.th_language'),
                  t('patients.th_status'),
                  t('patients.th_last_visit'),
                  ''
                ].map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => setSelectedPatient(p)}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{p.id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar
                        src={getAvatarForPatient(p.name, p.sex)}
                        name={p.name}
                        size="sm"
                        shape="circle"
                      />
                      <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)' }}>{p.age} / {p.sex}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>{p.language}</span></td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={statusVariant[p.status] || 'default'}>
                      {p.status === 'HIGH_PRIORITY' ? t('patients.status_high_priority') :
                       p.status === 'FOLLOW_UP' ? t('patients.status_follow_up') :
                       p.status === 'REFERRED' ? t('patients.status_referred') :
                       t('patients.status_active')}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--muted-foreground)' }}>
                    {formatDate(p.lastVisit, i18n.language)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedPatient(p); }}>
                      {t('common.view')}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    {t('patients.no_patients')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── New/Edit Patient Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? t('patients.edit_title') : t('patients.modal_title')}
        footer={<>
          <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="patient-form" disabled={saving}>
            {saving ? t('patients.saving') : isEditing ? t('common.save') : t('patients.save_patient')}
          </Button>
        </>}
      >
        <form id="patient-form" onSubmit={handleCreatePatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                {t('patients.first_name')} *
              </label>
              <input
                required
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                {t('patients.last_name')} *
              </label>
              <input
                required
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                {t('patients.dob')}
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                {t('patients.sex')}
              </label>
              <select
                value={formData.sex}
                onChange={e => setFormData({ ...formData, sex: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
              >
                <option value="Female">{t('patients.sex_female')}</option>
                <option value="Male">{t('patients.sex_male')}</option>
                <option value="Other">{t('patients.sex_other')}</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
              {t('patients.phone')}
            </label>
            <input
              type="text"
              placeholder="+1-555-0199"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
              {t('patients.address')}
            </label>
            <input
              type="text"
              placeholder="Riverside Sector 4"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
              {t('patients.emergency_contact')}
            </label>
            <input
              type="text"
              placeholder="Relative Name (+1-555-0000)"
              value={formData.emergencyContact}
              onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
            />
          </div>
        </form>
      </Modal>

      {/* ── Patient Detail Modal ── */}
      <Modal isOpen={!!selectedPatient} onClose={() => setSelectedPatient(null)} title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {selectedPatient && (
            <Avatar
              src={getAvatarForPatient(selectedPatient.name, selectedPatient.sex)}
              name={selectedPatient.name}
              size="lg"
              shape="circle"
              border={true}
              borderColor="var(--primary)"
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>{selectedPatient?.id}</span>
              {selectedPatient && <Badge variant={statusVariant[selectedPatient.status] || 'default'}>{selectedPatient.status}</Badge>}
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>{selectedPatient?.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{selectedPatient?.age} yrs · {selectedPatient?.sex} · Language: {selectedPatient?.language.toUpperCase()}</span>
          </div>
        </div>
      }
      footer={<>
        <Button variant="outline" onClick={() => setSelectedPatient(null)}>
          {t('common.close')}
        </Button>
        <Button variant="outline" onClick={() => openEditModal(selectedPatient!)}>
          {t('common.edit')}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            const targetPatient = selectedPatient!;
            setSelectedPatient(null);
            navigate(`/chw/assessments?patientId=${targetPatient.id}&patientName=${encodeURIComponent(targetPatient.name)}`);
          }}
        >
          {t('patients.start_assessment')} →
        </Button>
      </>}
      >
        {selectedPatient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>{t('patients.phone')}</span>
              <strong style={{ color: 'var(--foreground)' }}>{selectedPatient.phone}</strong>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>{t('patients.address')}</span>
              <strong style={{ color: 'var(--foreground)' }}>{selectedPatient.address}</strong>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>{t('patients.emergency_contact')}</span>
              <strong style={{ color: 'var(--foreground)' }}>{selectedPatient.emergency}</strong>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>{t('roles.CHW')}</span>
              <strong style={{ color: 'var(--foreground)' }}>{selectedPatient.chw}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
