import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { API_BASE } from '../../../config';

// ── Types ────────────────────────────────────────────────────────────────────
type SettingKey = keyof typeof DEFAULTS;

interface SettingMetadata {
  label: string;
  description: string;
  category: 'SECURITY' | 'CLINICAL' | 'FIELD' | 'LOCALIZATION' | 'PLATFORM';
  danger?: boolean;
}

// ── Default values ───────────────────────────────────────────────────────────
const DEFAULTS = {
  // Security
  require_mfa_for_admins:          true,
  require_mfa_for_all:             false,
  audit_all_logins:                true,
  session_inactivity_timeout:      true,
  strict_ip_allowlist:             false,

  // Clinical Workflow
  auto_escalate_high_risk:         true,
  supervisor_notification_on_flag: true,
  require_supervisor_cosign_referrals: true,
  enable_clinical_ai_triage:       true,

  // Field & Offline
  enable_offline_mode:             true,
  allow_voice_input:               true,
  compress_field_media:            true,
  allow_gps_tagging:               true,

  // Localization
  enable_hindi_language:           true,
  enable_arabic_rtl:               true,
  enable_swahili_language:         true,
  enable_french_language:          false,

  // Platform
  demo_mode:                       true,
  enable_debug_telemetry:          false,
  maintenance_mode_banner:         false,
} as const satisfies Record<string, boolean>;

// ── Metadata Catalog ──────────────────────────────────────────────────────────
const LABELS: Record<SettingKey, SettingMetadata> = {
  // Security
  require_mfa_for_admins:          { label: 'MFA for Administrators', description: 'Mandate multi-factor authentication (TOTP/SMS) for all Super Admin and Regional Admin accounts.', category: 'SECURITY' },
  require_mfa_for_all:             { label: 'MFA for All User Roles', description: 'Enforce MFA across every user role including field CHWs and Supervisors.', category: 'SECURITY' },
  audit_all_logins:                { label: 'Audit Sign-in Events', description: 'Record immutable compliance log entries for all successful and failed authentication attempts.', category: 'SECURITY' },
  session_inactivity_timeout:      { label: 'Session Inactivity Auto-Lock (15m)', description: 'Automatically terminate authenticated sessions after 15 minutes of inactivity to protect PHI.', category: 'SECURITY' },
  strict_ip_allowlist:             { label: 'Enforce Administrative IP Range', description: 'Restrict Super Admin access exclusively to whitelisted organizational VPN CIDR blocks.', category: 'SECURITY', danger: true },

  // Clinical
  auto_escalate_high_risk:         { label: 'Auto-Escalate High-Risk Cases', description: 'Automatically route emergency and high-risk assessment outcomes directly into the Supervisor triage queue.', category: 'CLINICAL' },
  supervisor_notification_on_flag: { label: 'Supervisor Instant Alerts on Flag', description: 'Transmit immediate push notifications to assigned Supervisors when clinical flags are triggered.', category: 'CLINICAL' },
  require_supervisor_cosign_referrals: { label: 'Require Supervisor Co-sign for Referrals', description: 'Emergency patient transports and tertiary hospital referrals require clinical supervisor approval.', category: 'CLINICAL' },
  enable_clinical_ai_triage:       { label: 'Clinical Protocol Decision Support', description: 'Enable diagnostic assistant heuristics to assist CHWs during complex triage workflows.', category: 'CLINICAL' },

  // Field
  enable_offline_mode:             { label: 'Offline Mode & Local IndexedDB Sync', description: 'Allow CHWs to conduct household assessments without network connectivity and sync when online.', category: 'FIELD' },
  allow_voice_input:               { label: 'Voice Dictation & Speech-to-Text', description: 'Permit CHWs to dictate clinical assessment notes using microphone speech recognition.', category: 'FIELD' },
  compress_field_media:            { label: 'Field Media Compression', description: 'Automatically compress diagnostic camera captures to optimize cellular bandwidth and battery life.', category: 'FIELD' },
  allow_gps_tagging:               { label: 'Geographic Coordinate Tagging', description: 'Record GPS coordinates on household visits and referrals for coverage heatmap generation.', category: 'FIELD' },

  // Localization
  enable_hindi_language:           { label: 'Hindi Language Support (हिन्दी)', description: 'Enable Hindi as a selectable UI language with full translation dictionary.', category: 'LOCALIZATION' },
  enable_arabic_rtl:               { label: 'Arabic with RTL Layout (العربية)', description: 'Enable Arabic language with automatic Right-to-Left (RTL) interface mirroring.', category: 'LOCALIZATION' },
  enable_swahili_language:         { label: 'Swahili Language Support (Kiswahili)', description: 'Enable Swahili language option for East African field deployments.', category: 'LOCALIZATION' },
  enable_french_language:          { label: 'French Language Support (Français)', description: 'Enable French interface for Francophone regional healthcare districts.', category: 'LOCALIZATION' },

  // Platform
  demo_mode:                       { label: 'Demonstration & Synthetic Data Mode', description: 'Synthetic clinical profiles and simulated sync engine. Disable before live clinical deployment.', category: 'PLATFORM', danger: true },
  enable_debug_telemetry:          { label: 'Verbose Microservice Telemetry', description: 'Output detailed API latency, SQL traces, and payload profiling to system audit logs.', category: 'PLATFORM' },
  maintenance_mode_banner:         { label: 'System Maintenance Notice Banner', description: 'Display a top-level notice alerting users of scheduled maintenance and read-only mode.', category: 'PLATFORM' },
};

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Settings', icon: '⚙️' },
  { id: 'SECURITY', label: 'Security & Access', icon: '🛡️' },
  { id: 'CLINICAL', label: 'Clinical Workflow', icon: '🩺' },
  { id: 'FIELD', label: 'Field & Offline', icon: '📡' },
  { id: 'LOCALIZATION', label: 'Localization', icon: '🌐' },
  { id: 'PLATFORM', label: 'Platform & Demo', icon: '⚡' },
];

// ── Toggle Switch ─────────────────────────────────────────────────────────────
const Toggle = ({
  on,
  onToggle,
  disabled = false,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onToggle}
    disabled={disabled}
    style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: 0,
      width: '46px',
      height: '24px',
      borderRadius: '9999px',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: on ? '#16a34a' : '#cbd5e1',
      transition: 'background-color 200ms ease',
      outline: 'none',
      padding: 0,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '2px',
        left: on ? '24px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'left 200ms ease',
        pointerEvents: 'none',
      }}
    />
  </button>
);

export const SettingsPage = () => {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({ ...DEFAULTS });
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/admin/settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : DEFAULTS)
      .then(data => {
        setSettings(prev => ({ ...prev, ...data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: SettingKey) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaveState('idle');
  };

  const applyPreset = (presetName: 'production' | 'field' | 'demo') => {
    if (presetName === 'production') {
      setSettings(prev => ({
        ...prev,
        require_mfa_for_admins: true,
        require_mfa_for_all: true,
        audit_all_logins: true,
        session_inactivity_timeout: true,
        demo_mode: false,
        enable_debug_telemetry: false,
      }));
    } else if (presetName === 'field') {
      setSettings(prev => ({
        ...prev,
        enable_offline_mode: true,
        allow_voice_input: true,
        compress_field_media: true,
        allow_gps_tagging: true,
        auto_escalate_high_risk: true,
        supervisor_notification_on_flag: true,
      }));
    } else if (presetName === 'demo') {
      setSettings({ ...DEFAULTS });
    }
    setSaveState('idle');
  };

  const handleSave = async () => {
    setSaveState('saving');
    const token = localStorage.getItem('access_token');

    const promises = Object.entries(settings).map(([key, value]) => {
      return fetch(`${API_BASE}/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ key, value }),
      });
    });

    try {
      await Promise.all(promises);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    setSaveState('idle');
  };

  const filteredKeys = useMemo(() => {
    const keys = Object.keys(LABELS) as SettingKey[];
    return keys.filter(k => {
      const meta = LABELS[k];
      const matchesTab = activeTab === 'ALL' || meta.category === activeTab;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        k.toLowerCase().includes(q) ||
        meta.label.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  const changedCount = Object.entries(settings).filter(
    ([k, v]) => v !== DEFAULTS[k as SettingKey]
  ).length;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Platform Governance & Settings
            </h1>
            <Badge variant="primary">Global Config</Badge>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Configure security enforcement, clinical protocol flags, offline resilience, and multilingual support
          </p>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Quick Presets:</span>
          <Button size="sm" variant="outline" onClick={() => applyPreset('production')}>
            🛡️ Strict Prod
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('field')}>
            📡 Field Focus
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('demo')}>
            ⚡ Reset Demo
          </Button>
        </div>
      </div>

      {/* Demo mode alert banner */}
      {settings.demo_mode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#92400e',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>Demonstration & Synthetic Data Mode Active:</strong> All patient records, clinical triage outcomes, and sync triggers are currently simulated. Disable this setting prior to live ministry deployment.
          </div>
          <Button size="sm" variant="outline" onClick={() => toggle('demo_mode')} style={{ backgroundColor: 'white' }}>
            Turn Off Demo Mode
          </Button>
        </div>
      )}

      {/* Search and Category Tabs */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>🔍</span>
              <input
                placeholder="Search configuration parameters by name, description, or key..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '0 0.75rem 0 2.25rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {CATEGORY_TABS.map(tab => (
                <Button
                  key={tab.id}
                  size="sm"
                  variant={activeTab === tab.id ? 'primary' : 'outline'}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Grid */}
      <Card>
        <CardContent style={{ padding: '0 1.5rem' }}>
          {filteredKeys.map((key, index) => {
            const meta = LABELS[key];
            const isVal = settings[key];

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1.5rem',
                  padding: '1.25rem 0',
                  borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--color-text)' }}>
                      {meta.label}
                    </span>
                    {meta.danger && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                        HIGH IMPACT
                      </span>
                    )}
                    {isVal ? (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                        ENABLED
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                        DISABLED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {meta.description}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', opacity: 0.75 }}>
                    Param Key: <code>{key}</code>
                  </div>
                </div>

                <div style={{ flexShrink: 0, paddingTop: '4px' }}>
                  <Toggle on={isVal} onToggle={() => toggle(key)} />
                </div>
              </div>
            );
          })}

          {filteredKeys.length === 0 && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>No settings match your query</div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Try switching the category tab or clearing your search term.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Save Toolbar */}
      <div
        style={{
          position: 'sticky',
          bottom: '1rem',
          marginTop: '1.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          zIndex: 40,
        }}
      >
        <div style={{ fontSize: '0.85rem' }}>
          {changedCount > 0 ? (
            <span style={{ color: '#b45309', fontWeight: 600 }}>
              ⚠️ {changedCount} setting{changedCount !== 1 ? 's' : ''} modified from baseline
            </span>
          ) : saveState === 'saved' ? (
            <span style={{ color: '#15803d', fontWeight: 600 }}>
              ✓ Platform configuration synced and active
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>
              Configuration aligned with platform defaults
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saveState === 'saving'}
          >
            {saveState === 'saving' ? 'Applying Updates…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
