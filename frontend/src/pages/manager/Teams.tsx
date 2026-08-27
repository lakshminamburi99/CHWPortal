import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

const API_BASE = 'http://localhost:8000/api/v1';

export const TeamsPage = () => {
  const [searchParams] = useSearchParams();
  const districtId = searchParams.get('districtId');

  const [teams, setTeams] = useState<any[]>([]);
  const [districts, setDistricts] = useState<Record<string, string>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDistrict, setNewTeamDistrict] = useState(districtId || '');

  const [messagingTeam, setMessagingTeam] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  
  const [detailsTeam, setDetailsTeam] = useState<any | null>(null);

  const fetchTeams = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/manager/org-units`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const districtMap: Record<string, string> = {};
          data.filter((u: any) => u.type === 'DISTRICT').forEach((u: any) => {
            districtMap[u.id] = u.name;
          });
          setDistricts(districtMap);
          let fetchedTeams = data.filter((u: any) => u.type === 'TEAM');
          if (districtId) {
            fetchedTeams = fetchedTeams.filter((u: any) => u.parent_id === districtId || u.parentId === districtId);
          }
          setTeams(fetchedTeams);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleAddTeam = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/admin/org-units`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: newTeamName, type: 'TEAM', parentId: newTeamDistrict })
    }).then(res => {
      if (res.ok) {
        setShowAddModal(false);
        setNewTeamName('');
        setNewTeamDistrict('');
        fetchTeams();
      }
    });
  };

  const handleSendMessage = () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (messagingTeam) {
      fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ recipientId: messagingTeam.id, content: messageText })
      }).then(res => {
        if (res.ok) {
          setMessagingTeam(null);
          setMessageText('');
        }
      });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Field Teams</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Manage CHW teams across your districts</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Team</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {teams.map(t => (
          <Card key={t.id}>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{t.name}</h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {t.parentId && districts[t.parentId] ? districts[t.parentId] : t.parentId || 'Unknown District'}
                  </div>
                </div>
                <div style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--color-success-bg, #f0fdf4)', color: 'var(--color-success, #16a34a)', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                  {t.coveragePercent}% Perf.
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}><span style={{ color: 'var(--color-text-muted)' }}>Supervisor:</span> <strong>{t.managerName}</strong></p>
                <p style={{ fontSize: '0.875rem' }}><span style={{ color: 'var(--color-text-muted)' }}>Staffing:</span> <strong>{t.chwCount} CHWs</strong></p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Active Patients</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t.patientCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Open Cases</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-warning, #d97706)' }}>{t.openCases || 0}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setMessagingTeam(t)}>Message</Button>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setDetailsTeam(t)}>Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Team Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Team"
        footer={<>
          <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddTeam}>Create Team</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Team Name</label>
            <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }} placeholder="E.g. Alpha Team" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>District</label>
            <select value={newTeamDistrict} onChange={(e) => setNewTeamDistrict(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}>
              <option value="">Select a district...</option>
              {Object.entries(districts).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal isOpen={!!messagingTeam} onClose={() => setMessagingTeam(null)} title={`Message ${messagingTeam?.name || 'Team'}`}
        footer={<>
          <Button variant="outline" onClick={() => setMessagingTeam(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleSendMessage}>Send</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>Message content</label>
          <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={5} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }} placeholder="Type your message here..."></textarea>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={!!detailsTeam} onClose={() => setDetailsTeam(null)} title={`Team Details: ${detailsTeam?.name || ''}`}
        footer={<>
          <Button variant="outline" onClick={() => setDetailsTeam(null)}>Close</Button>
        </>}
      >
        {detailsTeam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p><strong>District:</strong> {detailsTeam.parentId && districts[detailsTeam.parentId] ? districts[detailsTeam.parentId] : detailsTeam.parentId || 'Unknown'}</p>
            <p><strong>Supervisor:</strong> {detailsTeam.managerName || 'N/A'}</p>
            <p><strong>CHW Count:</strong> {detailsTeam.chwCount}</p>
            <p><strong>Total Patients:</strong> {detailsTeam.patientCount}</p>
            <p><strong>Open Cases:</strong> {detailsTeam.openCases || 0}</p>
            <p><strong>Performance Coverage:</strong> {detailsTeam.coveragePercent}%</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
