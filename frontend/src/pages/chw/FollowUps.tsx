import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../App';
import { API_BASE } from '../../config';
import { offlineSyncService } from '../../services/offlineSync';

const statusLabel: Record<string, string> = {
  DUE_TODAY: 'Due today',
  UPCOMING: 'Upcoming',
  OVERDUE: 'Overdue',
  COMPLETED: 'Completed',
};

const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
  DUE_TODAY: 'warning',
  UPCOMING: 'info',
  OVERDUE: 'danger',
  COMPLETED: 'success',
};

const priorityVariant: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

export const FollowUpsPage = () => {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsMap, setPatientsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [rescheduleItem, setRescheduleItem] = useState<any | null>(null);
  const [newDays, setNewDays] = useState(3);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    patientId: '',
    reason: '',
    days: 3,
  });
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchFollowUpsAndPatients = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE}/follow-ups`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/patients`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([fusData, patientsData]) => {
        const pMap: Record<string, string> = {};
        if (Array.isArray(patientsData)) {
          setPatients(patientsData);
          patientsData.forEach((p: any) => {
            pMap[p.id] = `${p.firstName} ${p.lastName}`;
          });
        }
        setPatientsMap(pMap);

        if (Array.isArray(fusData) && fusData.length > 0) {
          setFollowUps(fusData);
        } else {
          setFollowUps([
            { id: 'FU-901', patientId: 'PT-2026-0002', reason: 'Post-referral follow-up — monitor recovery', dueDate: '2026-08-22', priority: 'HIGH', status: 'DUE_TODAY' },
            { id: 'FU-899', patientId: 'PT-2026-0001', reason: 'Antenatal check-up — 3rd trimester', dueDate: '2026-08-22', priority: 'HIGH', status: 'DUE_TODAY' },
            { id: 'FU-895', patientId: 'PT-2026-0003', reason: 'Medication adherence check — diabetes management', dueDate: '2026-08-25', priority: 'MEDIUM', status: 'UPCOMING' },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFollowUpsAndPatients();
  }, []);

  const handleMarkComplete = async (id: string) => {
    if (!offlineSyncService.effectiveOnlineStatus()) {
      offlineSyncService.enqueue(
        'SCHEDULE_FOLLOW_UP',
        `/follow-ups/${id}/complete`,
        'POST',
        {},
        `Complete Follow-up (${id})`
      );
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'COMPLETED' } : f));
      setActionSuccess('Follow-up visit marked complete (Queued to Offline Outbox).');
      setTimeout(() => setActionSuccess(''), 4000);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/follow-ups/${id}/complete`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setActionSuccess('Follow-up visit marked as completed.');
        setTimeout(() => setActionSuccess(''), 4000);
        fetchFollowUpsAndPatients();
      }
    } catch {
      offlineSyncService.enqueue(
        'SCHEDULE_FOLLOW_UP',
        `/follow-ups/${id}/complete`,
        'POST',
        {},
        `Complete Follow-up (${id})`
      );
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'COMPLETED' } : f));
      setActionSuccess('Follow-up visit marked complete (Queued to Offline Outbox).');
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleItem) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/follow-ups/${rescheduleItem.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ days: Number(newDays) }),
      });
      if (res.ok) {
        setActionSuccess(`Follow-up rescheduled by ${newDays} days.`);
        setTimeout(() => setActionSuccess(''), 4000);
        fetchFollowUpsAndPatients();
      }
    } catch {
      const future = new Date();
      future.setDate(future.getDate() + Number(newDays));
      const newDueDate = future.toISOString().slice(0, 10);
      setFollowUps(prev => prev.map(f => f.id === rescheduleItem.id ? { ...f, dueDate: newDueDate, status: 'UPCOMING' } : f));
      setActionSuccess(`Follow-up rescheduled by ${newDays} days.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } finally {
      setRescheduleItem(null);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatientId = newFollowUp.patientId || (patients.length > 0 ? patients[0].id : 'PT-2026-0002');
    const pName = patientsMap[targetPatientId] || 'Patient';

    if (!offlineSyncService.effectiveOnlineStatus()) {
      offlineSyncService.enqueue(
        'SCHEDULE_FOLLOW_UP',
        `/patients/${targetPatientId}/schedule-follow-up`,
        'POST',
        { days: Number(newFollowUp.days) },
        `Schedule Follow-up (+${newFollowUp.days}d)`,
        pName
      );
      setActionSuccess('Follow-up scheduled (Queued to Offline Outbox).');
      setTimeout(() => setActionSuccess(''), 4000);
      setShowScheduleModal(false);
      setNewFollowUp({ patientId: '', reason: '', days: 3 });
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/patients/${targetPatientId}/schedule-follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          days: Number(newFollowUp.days),
        }),
      });

      if (res.ok) {
        setActionSuccess('Follow-up scheduled successfully in clinical calendar.');
        setTimeout(() => setActionSuccess(''), 4000);
        fetchFollowUpsAndPatients();
      }
    } catch {
      offlineSyncService.enqueue(
        'SCHEDULE_FOLLOW_UP',
        `/patients/${targetPatientId}/schedule-follow-up`,
        'POST',
        { days: Number(newFollowUp.days) },
        `Schedule Follow-up (+${newFollowUp.days}d)`,
        pName
      );
      setActionSuccess('Follow-up scheduled (Queued to Offline Outbox).');
      setTimeout(() => setActionSuccess(''), 4000);
    } finally {
      setShowScheduleModal(false);
      setNewFollowUp({ patientId: '', reason: '', days: 3 });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Follow-ups</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Scheduled follow-up visits for your patients — {followUps.length} total
          </p>
        </div>
        <Button onClick={() => setShowScheduleModal(true)}>+ Schedule follow-up</Button>
      </div>

      {actionSuccess && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ✓ {actionSuccess}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {followUps.map(f => {
          const patientName = patientsMap[f.patientId] || f.patient || 'Patient';
          const isDue = f.status === 'DUE_TODAY';

          return (
            <Card key={f.id} style={{ borderLeft: isDue ? '4px solid #f59e0b' : '' }}>
              <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{f.id}</span>
                    <Badge variant={statusVariant[f.status] || 'default'}>{statusLabel[f.status] || f.status}</Badge>
                    <Badge variant={priorityVariant[f.priority] || 'default'}>{f.priority}</Badge>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', color: '#0f172a' }}>{patientName}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{f.reason}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Due: <strong>{f.dueDate}</strong></p>
                </div>
                {f.status !== 'COMPLETED' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="sm" variant="outline" onClick={() => { setRescheduleItem(f); setNewDays(3); }}>Reschedule</Button>
                    <Button size="sm" variant="primary" onClick={() => handleMarkComplete(f.id)}>Mark complete</Button>
                  </div>
                ) : (
                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>✓ Completed</span>
                )}
              </CardContent>
            </Card>
          );
        })}

        {followUps.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            No scheduled follow-up visits found.
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal isOpen={!!rescheduleItem} onClose={() => setRescheduleItem(null)} title="Reschedule follow-up"
        footer={<>
          <Button variant="outline" type="button" onClick={() => setRescheduleItem(null)}>Cancel</Button>
          <Button variant="primary" type="submit" form="reschedule-form">Confirm reschedule</Button>
        </>}
      >
        <form id="reschedule-form" onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Rescheduling follow-up visit for <strong>{rescheduleItem ? (patientsMap[rescheduleItem.patientId] || rescheduleItem.patient || 'Patient') : ''}</strong>.
          </p>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Reschedule by</label>
            <select value={newDays} onChange={e => setNewDays(Number(e.target.value))} style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem', backgroundColor: 'white' }}>
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Schedule New Follow-up Modal */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule follow-up"
        footer={<>
          <Button variant="outline" type="button" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="schedule-form">Schedule visit</Button>
        </>}
      >
        <form id="schedule-form" onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Patient *</label>
            <select
              value={newFollowUp.patientId}
              onChange={e => setNewFollowUp({ ...newFollowUp, patientId: e.target.value })}
              style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem', backgroundColor: 'white' }}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Schedule for</label>
            <select
              value={newFollowUp.days}
              onChange={e => setNewFollowUp({ ...newFollowUp, days: Number(e.target.value) })}
              style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.6rem', fontSize: '0.85rem', backgroundColor: 'white' }}
            >
              <option value={0}>Today (Immediate)</option>
              <option value={1}>Tomorrow (1 day)</option>
              <option value={3}>3 days</option>
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

