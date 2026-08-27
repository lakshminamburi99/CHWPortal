import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const API_BASE = 'http://localhost:8000/api/v1';

const typeVariant: Record<string, 'info' | 'warning' | 'success'> = {
  REGION: 'info',
  DISTRICT: 'warning',
  CLINIC: 'success',
};

export const OrgUnitDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orgUnit, setOrgUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrgUnit = async () => {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      try {
        const res = await fetch(`${API_BASE}/admin/org-units/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          if (res.status === 403) {
            setError('Access denied: Org Unit is outside your authorized region.');
          } else {
            setError('Failed to load Org Unit details.');
          }
          return;
        }
        const data = await res.json();
        setOrgUnit(data);
      } catch (err) {
        setError('Error connecting to the server.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOrgUnit();
    }
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading Org Unit details...</div>;
  if (error) return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>Error</h1>
      </div>
      <Card>
        <CardContent style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{error}</p>
        </CardContent>
      </Card>
    </div>
  );
  if (!orgUnit) return <div style={{ padding: '2rem' }}>Org Unit not found.</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Button variant="outline" onClick={() => navigate('/admin/regional/org-units')}>← Back to List</Button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{orgUnit.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>ID: {orgUnit.id} • Manager: {orgUnit.managerName || orgUnit.manager || 'N/A'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <CardHeader>
            <CardTitle>Unit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Code / ID</dt>
              <dd style={{ fontFamily: 'monospace' }}>{orgUnit.id}</dd>
              
              <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Type</dt>
              <dd><Badge variant={typeVariant[orgUnit.type] || 'default'}>{orgUnit.type}</Badge></dd>
              
              <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Parent Unit</dt>
              <dd>{orgUnit.parentId || orgUnit.parent || 'None'}</dd>
              
              <dt style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Manager</dt>
              <dd>{orgUnit.managerName || orgUnit.manager || 'Unassigned'}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metrics & Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total CHWs</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{orgUnit.chwCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Patients</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{orgUnit.patientCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Open Cases</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{orgUnit.openCases || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Coverage</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: (orgUnit.coveragePercent || orgUnit.coverage || 0) >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {orgUnit.coveragePercent || orgUnit.coverage || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
