import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

// ── Types ────────────────────────────────────────────────────────────────────
type SettingKey = keyof typeof DEFAULTS;

interface SettingGroup {
  title: string;
  description: string;
  keys: SettingKey[];
}

import { API_BASE } from '../../../config';

// ── Default values ───────────────────────────────────────────────────────────
const DEFAULTS = {
  allow_voice_input:              true,
  require_mfa_for_admins:         true,
  require_mfa_for_all:            false,
  enable_offline_mode:            true,
  auto_escalate_high_risk:        true,
  supervisor_notification_on_flag: true,
  demo_mode:                      true,
  audit_all_logins:               true,
  enable_hindi_language:          true,
  enable_arabic_rtl:              true,
} as const satisfies Record<string, boolean>;

// ── Metadata ─────────────────────────────────────────────────────────────────
const LABELS: Record<SettingKey, { label: string; description: string }> = {
  allow_voice_input:               { label: 'Voice input', description: 'Allow CHWs to dictate assessment answers using the device microphone.' },
  require_mfa_for_admins:          { label: 'MFA for administrators', description: 'Require multi-factor authentication for all Admin and Super Admin accounts.' },
  require_mfa_for_all:             { label: 'MFA for all users', description: 'Require MFA for every user role including CHWs and Supervisors.' },
  enable_offline_mode:             { label: 'Offline mode for CHWs', description: 'Allow CHWs to work without an internet connection and sync when reconnected.' },
  auto_escalate_high_risk:         { label: 'Auto-escalate high-risk cases', description: 'Automatically flag high-risk assessments to the assigned Supervisor queue.' },
  supervisor_notification_on_flag: { label: 'Supervisor alerts on flag', description: 'Send a push notification to the Supervisor when a case is escalated.' },
  demo_mode:                       { label: 'Demonstration mode', description: 'All patient records are fictional. Clinical decisions are simulated.' },
  audit_all_logins:                { label: 'Audit login events', description: 'Write an audit log entry for every successful and failed sign-in attempt.' },
  enable_hindi_language:           { label: 'Hindi language (हिन्दी)', description: 'Enable Hindi as a selectable interface language for all users.' },
  enable_arabic_rtl:               { label: 'Arabic — right-to-left (العربية)', description: 'Enable Arabic language support with automatic RTL layout switching.' },
};

const GROUPS: SettingGroup[] = [
  {
    title: 'Security',
    description: 'Authentication and access control requirements.',
    keys: ['require_mfa_for_admins', 'require_mfa_for_all', 'audit_all_logins'],
  },
  {
    title: 'Clinical workflow',
    description: 'Protocol engine behaviour and escalation rules.',
    keys: ['auto_escalate_high_risk', 'supervisor_notification_on_flag'],
  },
  {
    title: 'Field experience',
    description: 'Features available to CHWs in the field.',
    keys: ['allow_voice_input', 'enable_offline_mode'],
  },
  {
    title: 'Languages',
    description: 'Localisation options available to all users.',
    keys: ['enable_hindi_language', 'enable_arabic_rtl'],
  },
  {
    title: 'Platform',
    description: 'Global platform configuration.',
    keys: ['demo_mode'],
  },
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
      width: '44px',
      height: '24px',
      borderRadius: '9999px',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: on ? '#16a34a' : '#d1d5db',
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
        left: on ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 200ms ease',
        pointerEvents: 'none',
      }}
    />
  </button>
);

// ── Setting Row ───────────────────────────────────────────────────────────────
const SettingRow = ({
  settingKey,
  value,
  isFirst,
  onToggle,
}: {
  settingKey: SettingKey;
  value: boolean;
  isFirst: boolean;
  onToggle: () => void;
}) => {
  const meta = LABELS[settingKey];
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1.5rem',
        padding: '1rem 0',
        borderTop: isFirst ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.2rem',
          }}
        >
          <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--foreground)' }}>
            {meta.label}
          </span>
          {value && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              On
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
          {meta.description}
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.68rem',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            opacity: 0.7,
          }}
        >
          {settingKey}
        </div>
      </div>
      <div style={{ paddingTop: '2px', flexShrink: 0 }}>
        <Toggle on={value} onToggle={onToggle} />
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const SettingsPage = () => {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({ ...DEFAULTS });
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

  const handleSave = async () => {
    setSaveState('saving');
    const token = localStorage.getItem('access_token');
    
    // We'll just save them one by one for simplicity, or we can assume there's a bulk endpoint.
    // The backend only has POST /settings which updates a single setting.
    // Wait, let's just update all changed settings sequentially.
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
    } catch {
      setSaveState('idle');
    }
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    setSaveState('idle');
  };

  const changedCount = Object.entries(settings).filter(
    ([k, v]) => v !== DEFAULTS[k as SettingKey]
  ).length;

  return (
    <div style={{ maxWidth: '760px', fontFamily: 'var(--font-sans)' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.35rem' }}>
          Platform settings
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
          Global configuration for the Care Compass platform. Changes apply to all regions and users.
        </p>
      </div>

      {/* Demo mode banner */}
      {settings.demo_mode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            backgroundColor: '#fef9c3',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius)',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            color: '#92400e',
          }}
        >
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <span>
            <strong>Demonstration mode is active.</strong> All patient and clinical records are fictional.
            Disable before deploying to production.
          </span>
        </div>
      )}

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {GROUPS.map(group => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
                {group.description}
              </p>
            </CardHeader>
            <CardContent style={{ padding: '0 1.5rem 1rem' }}>
              {group.keys.map((key, i) => (
                <SettingRow
                  key={key}
                  settingKey={key}
                  value={settings[key]}
                  isFirst={i === 0}
                  onToggle={() => toggle(key)}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-card)',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
          {changedCount > 0 ? (
            <span style={{ color: '#92400e', fontWeight: 500 }}>
              {changedCount} unsaved change{changedCount !== 1 ? 's' : ''}
            </span>
          ) : saveState === 'saved' ? (
            <span style={{ color: '#15803d', fontWeight: 500 }}>✓ All changes saved</span>
          ) : (
            <span>No changes</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saveState === 'saving'}
          >
            {saveState === 'saving' ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};
