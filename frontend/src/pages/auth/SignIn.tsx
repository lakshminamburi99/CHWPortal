import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../App';

// ─── Icon helpers ────────────────────────────────────────────────────────────
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const HelpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

const FlagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const UsersCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// ─── Demo accounts data ──────────────────────────────────────────────────────
const demoAccounts = [
  {
    role: 'CHW' as const,
    label: 'Community health worker',
    email: 'demo-chw@example.com',
    workspace: 'Field workspace: assessments, referrals, follow-ups',
    scope: 'Scope: Own assigned caseload',
  },
  {
    role: 'SUPERVISOR' as const,
    label: 'Supervisor',
    email: 'demo-supervisor@example.com',
    workspace: 'Supervisor workspace: triage, case review, coaching',
    scope: 'Scope: Own CHW team and their patients',
  },
  {
    role: 'PROGRAMME_MANAGER' as const,
    label: 'Programme manager',
    email: 'demo-manager@example.com',
    workspace: 'Programme workspace: regions, districts, reports',
    scope: 'Scope: Assigned regions and districts',
  },
  {
    role: 'REGIONAL_ADMIN' as const,
    label: 'Regional administrator',
    email: 'demo-regional-admin@example.com',
    workspace: 'Administration workspace: accounts and org units, no clinical data',
    scope: 'Scope: All org units in the assigned region',
  },
  {
    role: 'SUPER_ADMIN' as const,
    label: 'Super administrator',
    email: 'demo-admin@example.com',
    workspace: 'Administration workspace: platform-wide configuration',
    scope: 'Scope: Entire platform, all regions',
  },
];

const langOptions = [
  { value: 'en', label: 'English', abbr: 'EN' },
  { value: 'es', label: 'Español', abbr: 'ES' },
  { value: 'ar', label: 'العربية', abbr: 'AR' },
  { value: 'hi', label: 'हिन्दी', abbr: 'HI' },
];

import { API_BASE } from '../../config';

// ─── Component ───────────────────────────────────────────────────────────────
export const SignIn = () => {
  const { i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [email, setEmail] = useState('demo-admin@example.com');
  const [password, setPassword] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentLang = langOptions.find(l => l.value === i18n.language) || langOptions[0];

  const performLogin = async (targetEmail: string, targetPassword: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || data?.detail?.message || data?.detail || 'Invalid email or password';
        throw new Error(msg);
      }
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      login({
        id: data.user.id,
        name: data.user.display_name,
        email: data.user.email,
        role: data.user.role,
      });
      navigate('/redirect');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (targetEmail: string) => {
    setEmail(targetEmail);
    performLogin(targetEmail, 'demo');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: '0 0 52%',
        background: 'linear-gradient(160deg, #0c1220 0%, #0f172a 60%, #111827 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top branding */}
        <div style={{ padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px', height: '32px',
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldIcon />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>CHW Care</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>Community health worker support platform</div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Main content */}
        <div style={{ padding: '0 2.5rem 2.5rem' }}>


          <h1 style={{
            fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2,
            marginBottom: '1rem', letterSpacing: '-0.02em',
            color: 'white',
          }}>
            Frontline care, backed<br />by clinical precision.
          </h1>

          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '440px' }}>
            Register patients, run structured assessments with voice-assisted entry, and act on protocol-based risk flags — while supervisors review priority cases live.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { icon: <ClipboardIcon />, title: 'Guided assessments', sub: 'One question at a time with help text.' },
              { icon: <FlagIcon />, title: 'Protocol risk flags', sub: 'Clinical engine results, explained.' },
              { icon: <UsersCheckIcon />, title: 'Supervisor review', sub: 'Priority cases escalated in real time.' },
              { icon: <MicIcon />, title: 'Voice & 4 languages', sub: 'English, Spanish, Arabic (RTL), Hindi.' },
            ].map(f => (
              <div key={f.title} style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '10px',
                backdropFilter: 'blur(4px)',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.15rem', color: 'white' }}>{f.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Top-right language selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.25rem 1.75rem' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.75rem', borderRadius: '6px',
                border: '1px solid #e2e8f0', backgroundColor: 'white',
                fontSize: '0.82rem', fontWeight: 500, color: '#334155',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <GlobeIcon />
              {currentLang.label} <span style={{ color: '#94a3b8', fontWeight: 700 }}>{currentLang.abbr}</span>
            </button>
            {showLangMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                backgroundColor: 'white', border: '1px solid #e2e8f0',
                borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                zIndex: 100, minWidth: '140px', overflow: 'hidden',
              }}>
                {langOptions.map(l => (
                  <button
                    key={l.value}
                    onClick={() => { i18n.changeLanguage(l.value); setShowLangMenu(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '0.6rem 1rem', fontSize: '0.85rem',
                      backgroundColor: l.value === i18n.language ? '#f1f5f9' : 'transparent',
                      fontWeight: l.value === i18n.language ? 600 : 400,
                      border: 'none', cursor: 'pointer', color: '#1e293b', fontFamily: 'inherit',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, padding: '0 2rem 2rem', maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Sign in</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>
            Authenticates directly against the FastAPI / Argon2id security layer.
          </p>

          {error && (
            <div style={{
              padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', color: '#991b1b', fontSize: '0.82rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.35rem' }}>
                Email or username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', height: '42px',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  padding: '0 0.75rem', fontSize: '0.875rem',
                  outline: 'none', fontFamily: 'inherit', color: '#1e293b',
                  backgroundColor: 'white', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#374151', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', height: '42px',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  padding: '0 0.75rem', fontSize: '0.875rem',
                  outline: 'none', fontFamily: 'inherit', color: '#1e293b',
                  backgroundColor: 'white', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '46px',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginTop: '0.25rem', opacity: loading ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(15,23,42,0.3)',
              }}
            >
              {loading ? 'Authenticating…' : 'Sign in'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              <a href="#" style={{ fontSize: '0.82rem', color: '#3b82f6', textDecoration: 'none' }}>Forgot password</a>
              <a href="#" style={{ fontSize: '0.82rem', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <HelpIcon /> Need help?
              </a>
            </div>
          </form>

          {/* Demo accounts section */}
          <div style={{ marginTop: '1.75rem' }}>
            <div style={{
              backgroundColor: 'white', border: '1px solid #e2e8f0',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>Demo accounts</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                  Authenticates with real Argon2id hash against backend API. Password: <strong>demo</strong>.
                </p>
              </div>

              {demoAccounts.map((acct, i) => (
                <div
                  key={acct.role}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', marginBottom: '0.15rem' }}>{acct.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.1rem' }}>{acct.email}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{acct.workspace}</div>
                  </div>
                  <button
                    onClick={() => handleDemoLogin(acct.email)}
                    style={{
                      padding: '0.3rem 0.75rem', borderRadius: '6px',
                      border: '1px solid #e2e8f0', backgroundColor: 'white',
                      fontSize: '0.78rem', fontWeight: 600, color: '#374151',
                      cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
