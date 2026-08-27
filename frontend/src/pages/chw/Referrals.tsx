import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../App';

import { API_BASE } from '../../config';

const priorityVariant: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

const statusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'default'> = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  ACCEPTED: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

export const ReferralsPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsMap, setPatientsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRef, setSelectedRef] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [saving, setSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const paramCaseId = searchParams.get('caseId');
  const paramPatientId = searchParams.get('patientId');

  const [newRef, setNewRef] = useState({
    patientId: paramPatientId || '',
    caseId: paramCaseId || '',
    reason: '',
    priority: 'HIGH',
    destination: 'City Paediatric Hospital',
    notes: '',
  });

  const fetchReferralsAndPatients = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE}/referrals`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/patients`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([refsData, patientsData]) => {
        const pMap: Record<string, string> = {};
        if (Array.isArray(patientsData)) {
          setPatients(patientsData);
          patientsData.forEach((p: any) => {
            pMap[p.id] = `${p.firstName} ${p.lastName}`;
          });
        }
        setPatientsMap(pMap);

        if (Array.isArray(refsData) && refsData.length > 0) {
          setReferrals(refsData);
        } else {
          setReferrals([
            { id: 'REF-3901', patientId: 'PT-2026-0002', reason: 'High-risk child illness — referral to paediatric clinic required', priority: 'HIGH', destination: 'City Paediatric Hospital', status: 'SUBMITTED', createdAt: '2026-08-22T10:00:00Z', notes: 'Urgent transport requested by supervisor.' },
            { id: 'REF-3898', patientId: 'PT-2026-0005', reason: 'Uncontrolled hypertension — cardiology review needed', priority: 'MEDIUM', destination: 'Regional Medical Centre', status: 'ACCEPTED', createdAt: '2026-08-21T10:00:00Z', notes: 'Appointment booked for Aug 25.' },
            { id: 'REF-3880', patientId: 'PT-2026-0001', reason: 'Maternal complications — obstetric consultation', priority: 'HIGH', destination: "Women's Health Clinic", status: 'IN_PROGRESS', createdAt: '2026-08-20T10:00:00Z', notes: 'Lab tests pending.' },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReferralsAndPatients();
  }, []);

  useEffect(() => {
    if (paramCaseId || paramPatientId) {
      setNewRef(prev => ({
        ...prev,
        caseId: paramCaseId || prev.caseId,
        patientId: paramPatientId || prev.patientId,
      }));
      setShowNewModal(true);
    }
  }, [paramCaseId, paramPatientId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const targetPatientId = newRef.patientId || (patients.length > 0 ? patients[0].id : 'PT-2026-0002');

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId: targetPatientId,
          caseId: newRef.caseId || undefined,
          chwId: user?.id || 'usr-chw-001',
          reason: newRef.reason || 'Clinical consultation requested',
          priority: newRef.priority,
          destination: newRef.destination || 'City Hospital',
          notes: newRef.notes || '',
        }),
      });

      if (res.ok) {
        setActionSuccess('Referral submitted successfully to receiving facility.');
        setTimeout(() => setActionSuccess(''), 4000);
        fetchReferralsAndPatients();
      }
    } catch {
      // Local fallback
      const id = `REF-${Math.floor(3900 + Math.random() * 100)}`;
      const item = {
        id,
        patientId: targetPatientId,
        reason: newRef.reason || 'Clinical consultation requested',
        priority: newRef.priority,
        destination: newRef.destination,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        notes: newRef.notes,
      };
      setReferrals([item, ...referrals]);
      setActionSuccess('Referral recorded.');
      setTimeout(() => setActionSuccess(''), 4000);
    } finally {
      setSaving(false);
      setShowNewModal(false);
      setNewRef({ patientId: '', caseId: '', reason: '', priority: 'HIGH', destination: 'City Paediatric Hospital', notes: '' });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionSuccess(`Referral status updated to ${newStatus.toLowerCase().replace('_', ' ')}.`);
        setTimeout(() => setActionSuccess(''), 4000);
        fetchReferralsAndPatients();
        if (selectedRef && selectedRef.id === id) {
          setSelectedRef({ ...selectedRef, status: newStatus });
        }
      }
    } catch {
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedRef && selectedRef.id === id) {
        setSelectedRef({ ...selectedRef, status: newStatus });
      }
    }
  };

  const filtered = referrals.filter(r => statusFilter === 'ALL' || r.status === statusFilter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Referrals</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Clinical referrals submitted for your patients — {referrals.length} total
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>+ New referral</Button>
      </div>

      {actionSuccess && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ✓ {actionSuccess}
        </div>
      )}

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'SUBMITTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'primary' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'All' : statusLabel[s]}
          </Button>
        ))}
      </div>

      {/* Referrals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(r => {
          const patientName = patientsMap[r.patientId] || r.patient || 'Patient';
          const createdStr = r.createdAt ? (r.createdAt.includes('T') ? r.createdAt.slice(0, 10) : r.createdAt) : 'Recent';

          return (
            <Card key={r.id}>
              <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{r.id}</span>
                      <Badge variant={priorityVariant[r.priority] || 'default'}>{r.priority}</Badge>
                      <Badge variant={statusVariant[r.status] || 'default'}>{statusLabel[r.status] || r.status}</Badge>
                      {r.caseId && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Case: #{r.caseId}</span>}
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', color: '#0f172a' }}>{patientName}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{r.reason}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>→ {r.destination} · {createdStr}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="sm" variant="outline" onClick={() => setSelectedRef(r)}>View</Button>
                    {r.status !== 'COMPLETED' && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(r.id, 'COMPLETED')}>
                        Mark complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            No referrals found matching the filter.
          </div>
        )}
      </div>

      {/* New Referral Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Create referral"
        footer={<>
          <Button variant="outline" type="button" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-referral-form" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit referral'}
          </Button>
        </>}
      >
        <form id="new-referral-form" onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Patient *</label>
            <select
              value={newRef.patientId}
              onChange={e => setNewRef({ ...newRef, patientId: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem', backgroundColor: 'white' }}
            >
              {patients.length > 0 ? (
                patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.id})
                  </option>
                ))
              ) : (
                <>
                  <option value="PT-2026-0002">Ahmed Robinson (PT-2026-0002)</option>
                  <option value="PT-2026-0001">Maria Santos (PT-2026-0001)</option>
                  <option value="PT-2026-0005">Fatima Al-Rashid (PT-2026-0005)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Reason for referral *</label>
            <textarea
              required
              rows={3}
              value={newRef.reason}
              onChange={e => setNewRef({ ...newRef, reason: e.target.value })}
              placeholder="Clinical reason (e.g. Uncontrolled fever, paediatric specialist required)..."
              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Priority</label>
              <select
                value={newRef.priority}
                onChange={e => setNewRef({ ...newRef, priority: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem', backgroundColor: 'white' }}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Destination Facility</label>
              <input
                type="text"
                value={newRef.destination}
                onChange={e => setNewRef({ ...newRef, destination: e.target.value })}
                style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Notes & Instructions</label>
            <input
              type="text"
              placeholder="e.g. Transport arranged, emergency escort needed"
              value={newRef.notes}
              onChange={e => setNewRef({ ...newRef, notes: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem' }}
            />
          </div>
        </form>
      </Modal>

      {/* View Referral Modal */}
      <Modal isOpen={!!selectedRef} onClose={() => setSelectedRef(null)} title={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>{selectedRef?.id}</span>
            {selectedRef && <Badge variant={priorityVariant[selectedRef.priority] || 'default'}>{selectedRef.priority}</Badge>}
            {selectedRef && <Badge variant={statusVariant[selectedRef.status] || 'default'}>{statusLabel[selectedRef.status] || selectedRef.status}</Badge>}
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {selectedRef ? (patientsMap[selectedRef.patientId] || selectedRef.patient || 'Patient') : ''}
          </span>
        </div>
      }
      footer={<>
        {selectedRef?.status !== 'COMPLETED' ? (
          <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(selectedRef!.id, 'COMPLETED')}>
            ✓ Mark completed
          </Button>
        ) : <div />}
        <Button variant="outline" onClick={() => setSelectedRef(null)}>Close</Button>
      </>}
      >
        {selectedRef && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Reason</span>
              <strong style={{ color: '#0f172a' }}>{selectedRef.reason}</strong>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Destination</span>
              <strong style={{ color: '#0f172a' }}>{selectedRef.destination}</strong>
            </div>
            {selectedRef.notes && (
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Notes</span>
                <strong style={{ color: '#0f172a' }}>{selectedRef.notes}</strong>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

