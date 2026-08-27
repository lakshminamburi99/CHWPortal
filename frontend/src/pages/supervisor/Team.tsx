import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

import { API_BASE } from '../../config';

const statusVariant: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  OFFLINE: 'warning',
  INACTIVE: 'default',
};

export const SupervisorTeamPage = () => {
  const navigate = useNavigate();
  const [chws, setChws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingChw, setMessagingChw] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sentToast, setSentToast] = useState('');

  const fetchChws = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/chws`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setChws(data);
        } else {
          setChws([
            { id: 'usr-chw-001', name: 'John Smith', status: 'ACTIVE', region: 'North District', assignedPatients: 50, openCases: 8, followUps: 3, highPriorityCases: 2, lastActive: 'Today, 2:15 PM', trainingProgress: 75 },
            { id: 'chw-2', name: 'Aisha Patel', status: 'ACTIVE', region: 'North District', assignedPatients: 45, openCases: 5, followUps: 2, highPriorityCases: 0, lastActive: 'Today, 1:30 PM', trainingProgress: 90 },
            { id: 'chw-3', name: 'Emmanuel Diaz', status: 'OFFLINE', region: 'North District', assignedPatients: 38, openCases: 3, followUps: 1, highPriorityCases: 1, lastActive: 'Yesterday, 5:00 PM', trainingProgress: 50 },
            { id: 'chw-4', name: 'Mei Lin Chen', status: 'ACTIVE', region: 'North District', assignedPatients: 52, openCases: 6, followUps: 4, highPriorityCases: 1, lastActive: 'Today, 12:45 PM', trainingProgress: 65 },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChws();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingChw || !messageText.trim()) return;

    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API_BASE}/chws/${messagingChw.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: messageText }),
      });
      setSentToast(`Message sent to ${messagingChw.name}`);
      setTimeout(() => setSentToast(''), 3000);
      setMessagingChw(null);
      setMessageText('');
    } catch {}
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Health Workers</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Your supervised CHW team — {chws.length} workers</p>
      </div>

      {sentToast && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ✓ {sentToast}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {chws.map(chw => (
          <Card key={chw.id}>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem',
                  }}>
                    {(chw.name || 'CHW').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{chw.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{chw.region}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                      <Badge variant={statusVariant[chw.status] || 'default'}>{chw.status}</Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Last active: {chw.lastActive}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Patients', value: chw.assignedPatients || chw.assigned_patients || 0 },
                    { label: 'Open cases', value: chw.openCases || chw.open_cases || 0 },
                    { label: 'Follow-ups', value: chw.followUps || chw.follow_ups || 0 },
                    { label: 'High priority', value: chw.highPriorityCases || chw.high_priority_cases || 0, danger: (chw.highPriorityCases || chw.high_priority_cases || 0) > 0 },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.danger ? 'var(--color-danger)' : 'var(--color-text)' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Button size="sm" variant="primary" onClick={() => navigate('/supervisor/cases')}>
                    View cases
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setMessagingChw(chw); setMessageText(''); }}>
                    Message
                  </Button>
                </div>
              </div>

              {/* Training progress */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>Training progress</span><span>{chw.trainingProgress || chw.training_progress || 0}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${chw.trainingProgress || chw.training_progress || 0}%`, height: '100%', backgroundColor: 'var(--color-secondary)', borderRadius: '999px' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Direct Messaging Modal */}
      <Modal isOpen={!!messagingChw} onClose={() => setMessagingChw(null)} title={`Message ${messagingChw?.name}`}
        footer={<>
          <Button type="button" variant="outline" onClick={() => setMessagingChw(null)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" form="message-form">
            Send message
          </Button>
        </>}
      >
        <form id="message-form" onSubmit={sendMessage}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Supervisor Clinical Guidance / Directive
            </label>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type a message or instruction for this health worker..."
              rows={4}
              required
              style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem' }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

