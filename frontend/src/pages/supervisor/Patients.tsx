import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// Supervisor shares the same patient list view, with additional CHW column
const mockPatients = [
  { id: 'PT-2026-0001', name: 'Maria Santos', age: 28, sex: 'Female', status: 'HIGH_PRIORITY', lastVisit: 'Aug 20, 2026', chw: 'John Smith' },
  { id: 'PT-2026-0002', name: 'Ahmed Robinson', age: 7, sex: 'Male', status: 'FOLLOW_UP', lastVisit: 'Aug 22, 2026', chw: 'John Smith' },
  { id: 'PT-2026-0003', name: 'Priya Patel', age: 34, sex: 'Female', status: 'ACTIVE', lastVisit: 'Aug 18, 2026', chw: 'John Smith' },
  { id: 'PT-2026-0004', name: 'James Wilson', age: 67, sex: 'Male', status: 'ACTIVE', lastVisit: 'Aug 15, 2026', chw: 'John Smith' },
  { id: 'PT-2026-0005', name: 'Fatima Al-Rashid', age: 42, sex: 'Female', status: 'REFERRED', lastVisit: 'Aug 21, 2026', chw: 'Aisha Patel' },
  { id: 'PT-2026-0006', name: 'Carlos Rivera', age: 55, sex: 'Male', status: 'ACTIVE', lastVisit: 'Aug 19, 2026', chw: 'Aisha Patel' },
];

const statusVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  HIGH_PRIORITY: 'danger', FOLLOW_UP: 'warning', REFERRED: 'info', ACTIVE: 'success', INACTIVE: 'default',
};
const statusLabel: Record<string, string> = {
  HIGH_PRIORITY: 'High priority', FOLLOW_UP: 'Follow-up', REFERRED: 'Referred', ACTIVE: 'Active', INACTIVE: 'Inactive',
};

export const SupervisorPatientsPage = () => {
  const [search, setSearch] = React.useState('');
  const filtered = mockPatients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search));

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Patients</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>All patients across your CHW team</p>
      </div>

      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1rem' }}>
          <input
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
          />
        </CardContent>
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {['Patient ID', 'Name', 'Age / Sex', 'CHW', 'Status', 'Last visit', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{p.age} / {p.sex}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{p.chw}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><Badge variant={statusVariant[p.status]}>{statusLabel[p.status]}</Badge></td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{p.lastVisit}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><Button size="sm" variant="outline">View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
