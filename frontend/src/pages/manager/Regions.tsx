import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

import { API_BASE } from '../../config';

export const RegionsPage = () => {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/manager/org-units`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRegions(data.filter((u: any) => u.type === 'REGION'));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Regions</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Geographic regions in your programme scope</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {regions.map(r => (
          <Card key={r.id}>
            <CardContent style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{r.name}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Manager: {r.managerName}</p>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{r.chwCount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CHWs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{r.patientCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Patients</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{r.coveragePercent}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Coverage</div>
                </div>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ width: `${r.coveragePercent}%`, height: '100%', backgroundColor: r.coveragePercent >= 70 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: '999px' }} />
              </div>
              <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/manager/districts?regionId=' + r.id)}>View districts</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
