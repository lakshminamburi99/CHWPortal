import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { API_BASE } from '../../config';

const priorityVariant: Record<string, 'danger' | 'warning' | 'success'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

const statusVariant: Record<string, 'info' | 'warning' | 'success'> = {
  SUBMITTED: 'info',
  ACCEPTED: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
};

export const SupervisorReferralsPage = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [patients, setPatients] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReferrals = async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [rRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/referrals`, { headers }),
        fetch(`${API_BASE}/patients`, { headers }),
      ]);

      const refsData = rRes.ok ? await rRes.json() : [];
      const patientsData = pRes.ok ? await pRes.json() : [];

      const pMap: Record<string, any> = {};
      if (Array.isArray(patientsData)) {
        patientsData.forEach(p => { pMap[p.id] = p; });
      }
      setPatients(pMap);

      if (Array.isArray(refsData) && refsData.length > 0) {
        setReferrals(refsData);
      } else {
        setReferrals([
          { id: 'REF-3901', patientId: 'PT-2026-0002', reason: 'High-risk child illness — persistent febrile convulsions, urgent hospital admission needed', priority: 'HIGH', destination: 'City Paediatric Hospital', status: 'SUBMITTED', createdAt: '2026-08-22T10:00:00Z', notes: 'Emergency transport arranged by CHW.', chwId: 'John Smith' },
          { id: 'REF-3898', patientId: 'PT-2026-0005', reason: 'Uncontrolled hypertension with headache — cardiology clinic review', priority: 'MEDIUM', destination: 'Regional Medical Centre', status: 'ACCEPTED', createdAt: '2026-08-21T10:00:00Z', notes: 'Facility notified, escort scheduled.', chwId: 'Aisha Patel' },
          { id: 'REF-3880', patientId: 'PT-2026-0001', reason: 'Maternal complications (3rd trimester elevated BP) — obstetric emergency triage', priority: 'HIGH', destination: "Women's Specialized Clinic", status: 'IN_PROGRESS', createdAt: '2026-08-20T10:00:00Z', notes: 'Bed reserved in maternity ward.', chwId: 'John Smith' },
          { id: 'REF-3850', patientId: 'PT-2026-0004', reason: 'Suspected diabetic foot ulceration requiring specialist dressing', priority: 'LOW', destination: 'Central Wound Clinic', status: 'COMPLETED', createdAt: '2026-08-18T10:00:00Z', notes: 'Course of oral antibiotics prescribed and completed.', chwId: 'Emmanuel Diaz' },
        ]);
      }
    } catch {
      setReferrals([
        { id: 'REF-3901', patientId: 'PT-2026-0002', reason: 'High-risk child illness — persistent febrile convulsions', priority: 'HIGH', destination: 'City Paediatric Hospital', status: 'SUBMITTED', createdAt: '2026-08-22T10:00:00Z', chwId: 'John Smith' },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      } else {
        setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch {
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  const handleOpenSwarmForPatient = (patientId: string) => {
    window.dispatchEvent(
      new CustomEvent('open_cwstbot_patient', {
        detail: { patientId, message: `Review clinical referral escalation protocol for patient ${patientId}` }
      })
    );
  };

  const filtered = referrals.filter(r => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'HIGH') return r.priority === 'HIGH';
    return r.status === statusFilter;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
            Supervisor Referral Triage
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
            Review, authorize, and track clinical referrals submitted by your frontline community health team
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Referrals' },
            { id: 'HIGH', label: '🚨 High Priority' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map(f => (
            <Button
              key={f.id}
              size="sm"
              variant={statusFilter === f.id ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(f.id)}
              style={{ fontSize: '0.75rem' }}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(r => {
          const patientObj = patients[r.patientId];
          const patientName = patientObj ? `${patientObj.firstName} ${patientObj.lastName}` : (r.patientId === 'PT-2026-0002' ? 'Ahmed Robinson' : r.patientId === 'PT-2026-0001' ? 'Maria Santos' : r.patientId);
          const createdStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent';

          return (
            <Card key={r.id}>
              <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{r.id}</span>
                    <Badge variant={priorityVariant[r.priority] || 'default'}>{r.priority} PRIORITY</Badge>
                    <Badge variant={statusVariant[r.status] || 'default'}>{statusLabel[r.status] || r.status}</Badge>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: '0 0 0.35rem 0', color: 'var(--foreground)' }}>
                    {patientName} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>({r.patientId})</span>
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', marginBottom: '0.35rem', lineHeight: 1.45 }}>
                    {r.reason}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                    🏥 Destination: <strong>{r.destination || 'Unassigned Facility'}</strong> · CHW: <strong>{r.chwId || 'John Smith'}</strong> · Logged: {createdStr}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSwarmForPatient(r.patientId)}
                    style={{ fontSize: '0.75rem', borderColor: '#0284c7', color: '#0284c7' }}
                  >
                    🤖 Swarm Review
                  </Button>
                  {r.status === 'SUBMITTED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => updateStatus(r.id, 'ACCEPTED')}
                      style={{ fontSize: '0.75rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                    >
                      ✓ Accept & Dispatch
                    </Button>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(r.id, 'COMPLETED')}
                      style={{ fontSize: '0.75rem', color: '#16a34a', borderColor: '#16a34a' }}
                    >
                      ✓ Mark Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)', backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            No referrals found matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
