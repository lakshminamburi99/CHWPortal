import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export interface DistrictSurveillanceData {
  id: string;
  name: string;
  region: string;
  coordinates: { x: number; y: number; width: number; height: number; path: string };
  activeCases: number;
  positivityRate: number;
  stockLevelPercent: number;
  chwCount: number;
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'LOW';
  primaryThreat: string;
  sentinelSummary: string;
  recommendedAction: string;
  lastUpdated: string;
}

const initialDistricts: DistrictSurveillanceData[] = [
  {
    id: 'DST-KASAMA',
    name: 'Kasama North District',
    region: 'Northern Region',
    coordinates: {
      x: 320,
      y: 40,
      width: 140,
      height: 100,
      path: 'M 320,50 L 440,40 L 460,110 L 370,140 L 310,100 Z',
    },
    activeCases: 42,
    positivityRate: 18.4,
    stockLevelPercent: 32, // Low stock -> Alert
    chwCount: 24,
    riskLevel: 'CRITICAL',
    primaryThreat: 'Waterborne / Cholera Cluster (48h Surge)',
    sentinelSummary: 'SentinelAgent detected 8 clustered severe diarrhoea cases within 3km of Kasama Market water point in past 36h.',
    recommendedAction: 'Dispatch rapid response team with ORS + Zinc stockpiles. Issue boil-water health advisory via SMS broadcast.',
    lastUpdated: '12 min ago',
  },
  {
    id: 'DST-NDOLA',
    name: 'Ndola Urban District',
    region: 'Copperbelt Region',
    coordinates: {
      x: 220,
      y: 110,
      width: 110,
      height: 90,
      path: 'M 220,120 L 320,110 L 330,190 L 240,210 L 210,160 Z',
    },
    activeCases: 68,
    positivityRate: 14.2,
    stockLevelPercent: 64,
    chwCount: 38,
    riskLevel: 'ELEVATED',
    primaryThreat: 'Malaria P. falciparum Peak',
    sentinelSummary: 'Post-rainfall mosquito breeding index +40%. 19 positive mRDTs confirmed by CHWs in past 48 hours.',
    recommendedAction: 'Requisition 250 ACT blister packs from central depot. Expedite long-lasting insecticidal net (LLIN) distribution.',
    lastUpdated: '25 min ago',
  },
  {
    id: 'DST-LUSAKA',
    name: 'Lusaka Metro Hub',
    region: 'Central Region',
    coordinates: {
      x: 240,
      y: 210,
      width: 120,
      height: 90,
      path: 'M 240,210 L 350,200 L 370,270 L 270,300 L 230,260 Z',
    },
    activeCases: 89,
    positivityRate: 8.5,
    stockLevelPercent: 88,
    chwCount: 65,
    riskLevel: 'MODERATE',
    primaryThreat: 'Seasonal Viral Respiratory Infections',
    sentinelSummary: 'Paediatric pneumonia presentations steady. High facility bed capacity and adequate Amoxicillin supply.',
    recommendedAction: 'Maintain routine IMCI screening at household level. Triage pulse-oximetry thresholds strictly enforced.',
    lastUpdated: '5 min ago',
  },
  {
    id: 'DST-CHOMA',
    name: 'Choma Valley District',
    region: 'Southern Region',
    coordinates: {
      x: 180,
      y: 290,
      width: 130,
      height: 95,
      path: 'M 190,290 L 290,280 L 320,360 L 210,380 L 170,330 Z',
    },
    activeCases: 19,
    positivityRate: 5.1,
    stockLevelPercent: 92,
    chwCount: 28,
    riskLevel: 'LOW',
    primaryThreat: 'Stable Baseline / Maternal ANC Focus',
    sentinelSummary: 'Zero epidemiological outbreak anomalies detected in last 7 days. High 2nd trimester ANC screening coverage (94%).',
    recommendedAction: 'Continue preventative nutritional supplementation and routine postnatal home visits.',
    lastUpdated: '40 min ago',
  },
  {
    id: 'DST-MONGU',
    name: 'Mongu Floodplain District',
    region: 'Western Region',
    coordinates: {
      x: 60,
      y: 180,
      width: 150,
      height: 120,
      path: 'M 80,180 L 200,170 L 220,270 L 120,310 L 50,250 Z',
    },
    activeCases: 31,
    positivityRate: 11.8,
    stockLevelPercent: 45,
    chwCount: 22,
    riskLevel: 'ELEVATED',
    primaryThreat: 'Waterlogged Zone Cutoff & Malaria',
    sentinelSummary: 'High seasonal river levels restricting clinic road access. CHW mobile boat clinics active.',
    recommendedAction: 'Deploy solar-powered cold chain resupply and pre-position oral rehydration salts at island health posts.',
    lastUpdated: '1 hr ago',
  },
  {
    id: 'DST-CHIPATA',
    name: 'Chipata Eastern Border',
    region: 'Eastern Region',
    coordinates: {
      x: 360,
      y: 150,
      width: 130,
      height: 110,
      path: 'M 370,160 L 480,140 L 490,230 L 400,260 L 350,210 Z',
    },
    activeCases: 27,
    positivityRate: 6.9,
    stockLevelPercent: 78,
    chwCount: 30,
    riskLevel: 'LOW',
    primaryThreat: 'Cross-Border Screening Surveillance',
    sentinelSummary: 'Cross-border transit screening operational. Zero uncontained febrile outbreaks reported.',
    recommendedAction: 'Continue weekly syndromic data exchange with district border health inspection units.',
    lastUpdated: '18 min ago',
  },
];

const riskColors: Record<string, { fill: string; stroke: string; text: string; bg: string; badge: 'danger' | 'warning' | 'info' | 'success' }> = {
  CRITICAL: {
    fill: 'rgba(239, 68, 68, 0.45)',
    stroke: '#ef4444',
    text: '#ef4444',
    bg: '#fee2e2',
    badge: 'danger',
  },
  ELEVATED: {
    fill: 'rgba(245, 158, 11, 0.4)',
    stroke: '#f59e0b',
    text: '#f59e0b',
    bg: '#fef3c7',
    badge: 'warning',
  },
  MODERATE: {
    fill: 'rgba(59, 130, 246, 0.35)',
    stroke: '#3b82f6',
    text: '#3b82f6',
    bg: '#dbeafe',
    badge: 'info',
  },
  LOW: {
    fill: 'rgba(16, 185, 129, 0.35)',
    stroke: '#10b981',
    text: '#10b981',
    bg: '#d1fae5',
    badge: 'success',
  },
};

export const GeospatialOutbreakMap: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [districts, setDistricts] = useState<DistrictSurveillanceData[]>(initialDistricts);
  const [selectedId, setSelectedId] = useState<string>('DST-KASAMA');
  const [activeLayer, setActiveLayer] = useState<'all' | 'malaria' | 'waterborne' | 'respiratory'>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSurgeSuccess, setSimulatedSurgeSuccess] = useState(false);

  const selectedDistrict = districts.find(d => d.id === selectedId) || districts[0];

  const handleSimulateSurge = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setDistricts(prev =>
        prev.map(d => {
          if (d.id === 'DST-CHOMA') {
            return {
              ...d,
              activeCases: 48,
              positivityRate: 19.2,
              stockLevelPercent: 28,
              riskLevel: 'CRITICAL',
              primaryThreat: '⚡ Simulated Rapid Outbreak Surge: Waterborne Cluster',
              sentinelSummary: '🚨 SIMULATION: +29 acute waterborne cases reported in Choma Valley. Sentinel threshold tripped.',
              recommendedAction: 'Immediate dispatch of 100L Ringer Lactate and 500 ORS sachets. Activate emergency CHW vector protocol.',
              lastUpdated: 'Just now (Simulated)',
            };
          }
          return d;
        })
      );
      setSelectedId('DST-CHOMA');
      setIsSimulating(false);
      setSimulatedSurgeSuccess(true);
      setTimeout(() => setSimulatedSurgeSuccess(false), 5000);
    }, 900);
  };

  const handleResetMap = () => {
    setDistricts(initialDistricts);
    setSelectedId('DST-KASAMA');
  };

  return (
    <Card style={{ overflow: 'hidden', border: '1px solid var(--border)' }}>
      <CardHeader style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🌐</span>
              <CardTitle style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                Real-Time Sentinel Geospatial Outbreak & Surveillance GIS
              </CardTitle>
              <Badge variant="danger" style={{ animation: 'pulse 2s infinite' }}>LIVE CLUSTER SCAN</Badge>
            </div>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              48-hour spatial-temporal outbreak detection powered by SentinelAgent & WHO syndromic risk algorithms
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSimulateSurge}
              disabled={isSimulating}
              style={{ backgroundColor: '#dc2626', color: 'white', borderColor: '#b91c1c', fontSize: '0.75rem', fontWeight: 600 }}
            >
              {isSimulating ? '⚡ Tripping Sentinel Sensors...' : '⚡ Simulate Epidemic Surge'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetMap}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}
            >
              ↺ Reset
            </Button>
          </div>
        </div>

        {/* Filter Layers */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: '🌍 All Disease Signals', icon: '🌐' },
            { id: 'waterborne', label: '💧 Waterborne / Cholera', icon: '💧' },
            { id: 'malaria', label: '🦟 Malaria Vector Index', icon: '🦟' },
            { id: 'respiratory', label: '🫁 Acute Respiratory (ARI)', icon: '🫁' },
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as any)}
              style={{
                background: activeLayer === layer.id ? '#0284c7' : 'rgba(255,255,255,0.08)',
                color: 'white',
                border: activeLayer === layer.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent style={{ padding: '1.25rem' }}>
        {simulatedSurgeSuccess && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
            <div>
              <strong>Sentinel Surveillance Alert Triggered:</strong> Immediate surge simulated in <em>Choma Valley</em>. Multi-Agent Swarm flagged risk escalation and low stock warning.
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'minmax(320px, 1.4fr) minmax(280px, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}>
          {/* Interactive GIS Vector Map */}
          <div style={{
            background: '#090d16',
            borderRadius: '10px',
            padding: '1rem',
            border: '1px solid #1e293b',
            position: 'relative',
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Operational Health Zones GIS · Click District for Telemetry
              </span>
              <span style={{ color: '#38bdf8', fontSize: '0.7rem' }}>
                Projection: WGS84 Web Mercator
              </span>
            </div>

            <svg
              viewBox="0 0 540 420"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '340px',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
              }}
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="gis-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
                </pattern>
                {/* Outbreak Heat Glow Filters */}
                <filter id="glow-critical" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#gis-grid)" />

              {/* District Polygons */}
              {districts.map(d => {
                const colors = riskColors[d.riskLevel];
                const isSelected = d.id === selectedId;

                return (
                  <g
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <path
                      d={d.coordinates.path}
                      fill={colors.fill}
                      stroke={isSelected ? '#ffffff' : colors.stroke}
                      strokeWidth={isSelected ? 3 : 1.5}
                      strokeDasharray={isSelected ? 'none' : 'none'}
                      filter={d.riskLevel === 'CRITICAL' ? 'url(#glow-critical)' : undefined}
                      style={{
                        transition: 'transform 0.2s ease, fill 0.2s ease',
                      }}
                    />

                    {/* District Center Marker & Text */}
                    <circle
                      cx={d.coordinates.x + d.coordinates.width / 2}
                      cy={d.coordinates.y + d.coordinates.height / 2}
                      r={isSelected ? 6 : 4}
                      fill={colors.stroke}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />

                    <text
                      x={d.coordinates.x + d.coordinates.width / 2}
                      y={d.coordinates.y + d.coordinates.height / 2 - 10}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight={isSelected ? '800' : '600'}
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {d.name.split(' ')[0]}
                    </text>

                    <text
                      x={d.coordinates.x + d.coordinates.width / 2}
                      y={d.coordinates.y + d.coordinates.height / 2 + 14}
                      fill={colors.stroke}
                      fontSize="9"
                      fontWeight="700"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {d.activeCases} cases ({d.positivityRate}%)
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              background: 'rgba(15, 23, 42, 0.75)',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #1e293b',
              marginTop: '0.5rem',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Risk Stratification:</span>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem' }}>
                <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Critical
                </span>
                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Elevated
                </span>
                <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Moderate
                </span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Low / Stable
                </span>
              </div>
            </div>
          </div>

          {/* District Telemetry & Sentinel Dossier */}
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  {selectedDistrict.region}
                </span>
                <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  {selectedDistrict.name}
                </h3>
              </div>
              <Badge variant={riskColors[selectedDistrict.riskLevel].badge}>
                {selectedDistrict.riskLevel} RISK
              </Badge>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
              <div style={{ background: 'var(--muted)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', display: 'block' }}>Active Cases</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--foreground)' }}>{selectedDistrict.activeCases}</strong>
                <span style={{ fontSize: '0.7rem', color: '#ef4444', marginLeft: '0.35rem' }}>({selectedDistrict.positivityRate}% Pos)</span>
              </div>
              <div style={{ background: 'var(--muted)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', display: 'block' }}>Depot Stock Index</span>
                <strong style={{
                  fontSize: '1.15rem',
                  color: selectedDistrict.stockLevelPercent < 40 ? '#ef4444' : selectedDistrict.stockLevelPercent < 70 ? '#f59e0b' : '#10b981'
                }}>
                  {selectedDistrict.stockLevelPercent}%
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginLeft: '0.35rem' }}>
                  ({selectedDistrict.stockLevelPercent < 40 ? 'Depleted' : 'Supplied'})
                </span>
              </div>
              <div style={{ background: 'var(--muted)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', display: 'block' }}>Field CHWs Active</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--foreground)' }}>{selectedDistrict.chwCount}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginLeft: '0.35rem' }}>Workers</span>
              </div>
              <div style={{ background: 'var(--muted)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', display: 'block' }}>Primary Vector / Threat</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: riskColors[selectedDistrict.riskLevel].text, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedDistrict.primaryThreat.split(' ')[0]} {selectedDistrict.primaryThreat.split(' ')[1] || ''}
                </span>
              </div>
            </div>

            {/* Sentinel Agent Findings Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(15, 23, 42, 0.04) 100%)',
              borderLeft: `4px solid ${riskColors[selectedDistrict.riskLevel].stroke}`,
              borderRadius: '0 8px 8px 0',
              padding: '0.85rem 1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.9rem' }}>🤖</span>
                <strong style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>SentinelAgent Spatial AI Assessment</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                  {selectedDistrict.lastUpdated}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--foreground)', lineHeight: 1.45 }}>
                {selectedDistrict.sentinelSummary}
              </p>
            </div>

            {/* Action Protocol Recommendation */}
            <div style={{ background: 'var(--muted)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.9rem' }}>📋</span>
                <strong style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>Recommended Clinical / Supply Action</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
                {selectedDistrict.recommendedAction}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <Button
                variant="primary"
                size="sm"
                style={{ flex: 1, fontSize: '0.75rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('open_cwstbot_patient', {
                      detail: { patientId: 'ALL', message: `Query Sentinel outbreak telemetry for ${selectedDistrict.name}` }
                    })
                  );
                }}
              >
                🤖 Consult Swarm for {selectedDistrict.name.split(' ')[0]}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
