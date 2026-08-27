import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../App';

import { API_BASE } from '../../config';

const categoryVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  HIGH_PRIORITY: 'danger',
  SUPERVISOR: 'warning',
  FOLLOW_UP: 'warning',
  REFERRAL: 'info',
  TRAINING: 'success',
  SYSTEM: 'default',
};

export const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    const audience = (user?.role === 'CHW' || user?.role === 'SUPERVISOR') ? user.role : user?.role || 'CHW';
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/notifications?audience=${audience}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
        } else {
          setNotifications([
            { id: 'ntf-1', title: 'Case CASE-02400 flagged for supervisor review', body: "Ahmed Robinson's Child Illness Assessment has been evaluated as HIGH RISK and sent for supervisor review.", category: 'HIGH_PRIORITY', createdAt: '2 hours ago', read: false },
            { id: 'ntf-2', title: 'Follow-up due today', body: 'Scheduled follow-up with Ahmed Robinson is due today.', category: 'FOLLOW_UP', createdAt: '4 hours ago', read: false },
            { id: 'ntf-3', title: 'Referral REF-3901 accepted', body: 'City Paediatric Hospital has accepted the referral for Ahmed Robinson.', category: 'REFERRAL', createdAt: '1 day ago', read: true },
            { id: 'ntf-4', title: 'Training module recommended', body: 'Your supervisor has recommended the "Danger Signs in Children" training module.', category: 'TRAINING', createdAt: '2 days ago', read: true },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAllRead = async () => {
    const audience = user?.role === 'SUPERVISOR' ? 'SUPERVISOR' : 'CHW';
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE}/notifications/mark-all-read?audience=${audience}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ read: true }),
      });
    } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Notifications</h1>
          {unread > 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {unread} unread notification{unread !== 1 ? 's' : ''}
            </p>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              All notifications read
            </p>
          )}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notifications.map(n => {
          const createdStr = n.createdAt && n.createdAt.includes('T')
            ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(n.createdAt).toLocaleDateString()
            : n.createdAt || 'Recent';

          return (
            <Card
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                cursor: 'pointer',
                opacity: n.read ? 0.75 : 1,
                borderLeft: !n.read ? '4px solid #3b82f6' : '4px solid transparent',
                backgroundColor: !n.read ? '#f8fafc' : 'white',
              }}
            >
              <CardContent style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Badge variant={categoryVariant[n.category] || 'default'}>{n.category ? n.category.replace('_', ' ') : 'ALERT'}</Badge>
                    {!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }} />}
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#0f172a' }}>{n.title}</h3>
                  <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.4 }}>{n.body}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '0.35rem' }}>{createdStr}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {n.caseId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/chw/cases');
                      }}
                    >
                      View case
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={(e) => dismissNotification(n.id, e)}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {notifications.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            No notifications at this time.
          </div>
        )}
      </div>
    </div>
  );
};

