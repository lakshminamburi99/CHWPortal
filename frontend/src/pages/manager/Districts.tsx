import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import { API_BASE } from '../../config';

export const DistrictsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const regionId = searchParams.get('regionId');
  
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/manager/org-units`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const regionMap: Record<string, string> = {};
          data.filter((u: any) => u.type === 'REGION').forEach((u: any) => {
            regionMap[u.id] = u.name;
          });
          setRegions(regionMap);
          let dists = data.filter((u: any) => u.type === 'DISTRICT');
          if (regionId) {
            dists = dists.filter((u: any) => u.parent_id === regionId || u.parentId === regionId);
          }
          setDistricts(dists);
        }
      })
      .catch(() => {});
  }, [regionId]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Districts {regionId && regions[regionId] ? `in ${regions[regionId]}` : ''}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sub-regional units within your programme</p>
      </div>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {['District', 'Region', 'Manager', 'CHWs', 'Patients', 'Coverage', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {districts.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{d.parentId && regions[d.parentId] ? regions[d.parentId] : d.parentId || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{d.managerName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{d.chwCount}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{d.patientCount}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.coveragePercent}%`, height: '100%', backgroundColor: d.coveragePercent >= 70 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: '999px' }} />
                      </div>
                      <span>{d.coveragePercent}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}><Button size="sm" variant="outline" onClick={() => navigate('/manager/teams?districtId=' + d.id)}>View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
