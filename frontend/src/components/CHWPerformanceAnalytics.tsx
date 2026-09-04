import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export interface CHWLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  zone: string;
  assessmentsCount: number;
  referralsResolved: number;
  protocolAdherence: number;
  cpdPoints: number;
  kudosCount: number;
  badges: { icon: string; title: string; color: string }[];
}

export const initialCHWRoster: CHWLeaderboardEntry[] = [
  {
    id: 'chw-1',
    rank: 1,
    name: 'Amina Diallo',
    zone: 'Zone 2 Central',
    assessmentsCount: 142,
    referralsResolved: 28,
    protocolAdherence: 99.2,
    cpdPoints: 480,
    kudosCount: 34,
    badges: [
      { icon: '🥇', title: 'Top Sentinel', color: '#fbbf24' },
      { icon: '👶', title: 'iCCM Master', color: '#38bdf8' },
      { icon: '🤰', title: 'Maternal Shield', color: '#ec4899' },
    ],
  },
  {
    id: 'chw-2',
    rank: 2,
    name: 'Grace Mwangi',
    zone: 'Zone 4 East',
    assessmentsCount: 128,
    referralsResolved: 24,
    protocolAdherence: 98.6,
    cpdPoints: 450,
    kudosCount: 29,
    badges: [
      { icon: '🥈', title: 'Silver Healer', color: '#94a3b8' },
      { icon: '🦟', title: 'Malaria Sentinel', color: '#10b981' },
      { icon: '⚡', title: 'Zero Delay', color: '#f59e0b' },
    ],
  },
  {
    id: 'chw-3',
    rank: 3,
    name: 'David Ochieng',
    zone: 'Zone 1 North',
    assessmentsCount: 115,
    referralsResolved: 19,
    protocolAdherence: 97.4,
    cpdPoints: 420,
    kudosCount: 22,
    badges: [
      { icon: '🥉', title: 'Bronze Responder', color: '#b45309' },
      { icon: '💧', title: 'ORS Champion', color: '#06b6d4' },
    ],
  },
  {
    id: 'chw-4',
    rank: 4,
    name: 'Zainab Robinson',
    zone: 'Zone 3 South',
    assessmentsCount: 98,
    referralsResolved: 16,
    protocolAdherence: 96.8,
    cpdPoints: 390,
    kudosCount: 18,
    badges: [
      { icon: '🩺', title: 'NCD Vigilant', color: '#8b5cf6' },
      { icon: '🏆', title: '100 Club', color: '#10b981' },
    ],
  },
  {
    id: 'chw-5',
    rank: 5,
    name: 'Kwame Mensah',
    zone: 'Zone 1 North',
    assessmentsCount: 92,
    referralsResolved: 14,
    protocolAdherence: 95.5,
    cpdPoints: 360,
    kudosCount: 15,
    badges: [
      { icon: '🌟', title: 'Rising Star', color: '#f59e0b' },
    ],
  },
];

export const CHWPerformanceAnalytics: React.FC = () => {
  const [roster, setRoster] = useState<CHWLeaderboardEntry[]>(initialCHWRoster);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [toast, setToast] = useState<string>('');

  const handleGiveKudos = (id: string, name: string) => {
    setRoster(prev => prev.map(chw => chw.id === id ? { ...chw, kudosCount: chw.kudosCount + 1 } : chw));
    setToast(`Sent Kudos ⭐ to ${name}!`);
    setTimeout(() => setToast(''), 3500);
  };

  const filteredRoster = selectedZone === 'ALL' ? roster : roster.filter(c => c.zone === selectedZone);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: '12px',
        padding: '1.5rem 1.75rem',
        color: 'white',
        boxShadow: '0 4px 18px rgba(30, 27, 75, 0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🏆</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Community Coverage & Gamified CHW Performance Analytics
              </h2>
              <Badge variant="warning">MOH PERFORMANCE CERTIFIED</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
              Real-time household coverage density, protocol adherence milestones, and frontline peer recognition
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.85rem', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Total Households Reached:</div>
              <strong style={{ fontSize: '1.1rem', color: '#fbbf24' }}>1,420 Homes (91.4% Avg)</strong>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          color: '#92400e',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}>
          {toast}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'TRIAGE PROTOCOL ADHERENCE', value: '98.4%', sub: 'WHO iCCM compliance' },
          { label: 'TIMELY REFERRAL DISPATCH', value: '96.2%', sub: '< 24 hours resolution' },
          { label: 'CPD TRAINING MASTERY', value: '2,100 pts', sub: 'Accredited modules completed' },
          { label: 'PEER KUDOS CELEBRATED', value: '118 ⭐', sub: 'Supervisor recognitions' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {kpi.label}
              </span>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--foreground)' }}>
                {kpi.value}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{kpi.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Zone Household Coverage Density Breakdown */}
      <Card>
        <CardContent style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem' }}>
            📍 Zone Household Coverage Density
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[
              { zone: 'Zone 1 North', coverage: 88, target: 90, homes: '360/409', color: '#3b82f6' },
              { zone: 'Zone 2 Central', coverage: 96, target: 92, homes: '412/429', color: '#10b981' },
              { zone: 'Zone 3 South', coverage: 79, target: 85, homes: '298/377', color: '#f59e0b' },
              { zone: 'Zone 4 East', coverage: 92, target: 90, homes: '350/380', color: '#8b5cf6' },
            ].map(z => (
              <div key={z.zone} style={{ backgroundColor: 'var(--muted)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{z.zone}</strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: z.coverage >= z.target ? '#16a34a' : '#b45309' }}>
                    {z.coverage}% {z.coverage >= z.target ? '⭐ Target Met' : '⚠️ Below Target'}
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                  <div style={{ width: `${z.coverage}%`, height: '100%', backgroundColor: z.color, borderRadius: '999px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                  <span>Homes: {z.homes}</span>
                  <span>Target: {z.target}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gamified Leaderboard Table */}
      <Card>
        <CardContent style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              🏅 Top Performing Community Health Workers
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['ALL', 'Zone 1 North', 'Zone 2 Central', 'Zone 3 South', 'Zone 4 East'].map(zone => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: selectedZone === zone ? '1px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: selectedZone === zone ? 'var(--primary)' : 'var(--card)',
                    color: selectedZone === zone ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    cursor: 'pointer',
                  }}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>RANK</th>
                  <th style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>HEALTH WORKER</th>
                  <th style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>ZONE</th>
                  <th style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>ASSESSMENTS</th>
                  <th style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>ADHERENCE</th>
                  <th style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>BADGES EARNED</th>
                  <th style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map(chw => (
                  <tr key={chw.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 800 }}>
                      {chw.rank === 1 ? '🥇 #1' : chw.rank === 2 ? '🥈 #2' : chw.rank === 3 ? '🥉 #3' : `#${chw.rank}`}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: 'var(--foreground)' }}>{chw.name}</strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                        {chw.cpdPoints} CPD Points
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--muted-foreground)' }}>{chw.zone}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{chw.assessmentsCount}</strong> ({chw.referralsResolved} referrals)
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>{chw.protocolAdherence}%</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {chw.badges.map((b, idx) => (
                          <span
                            key={idx}
                            title={b.title}
                            style={{
                              backgroundColor: 'var(--muted)',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <span>{b.icon}</span> {b.title}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGiveKudos(chw.id, chw.name)}
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <span>⭐</span> Kudos ({chw.kudosCount})
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
