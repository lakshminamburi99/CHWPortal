import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const ProfilePage = () => {
  const { user, login } = useAuth();
  const { i18n } = useTranslation();

  const [fullName, setFullName] = useState(user?.name || 'John Smith');
  const [email, setEmail] = useState(user?.email || 'demo-chw@example.com');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [district, setDistrict] = useState('Riverside District');
  const [clinic, setClinic] = useState('Field Team Alpha (Clinic A)');
  const [staffId] = useState('CHW-2026-084');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [audioReadback, setAudioReadback] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordToast, setPasswordToast] = useState('');
  
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'activity'>('profile');

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('user_profile_custom');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.district) setDistrict(parsed.district);
        if (parsed.clinic) setClinic(parsed.clinic);
        if (parsed.voiceEnabled !== undefined) setVoiceEnabled(parsed.voiceEnabled);
        if (parsed.offlineSync !== undefined) setOfflineSync(parsed.offlineSync);
        if (parsed.audioReadback !== undefined) setAudioReadback(parsed.audioReadback);
        if (parsed.mfaEnabled !== undefined) setMfaEnabled(parsed.mfaEnabled);
      } catch {}
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...(user || {}),
      id: user?.id || 'usr-chw-001',
      name: fullName,
      email: email,
      role: user?.role || 'CHW',
    };

    login(updatedUser);

    const customProfile = {
      phone,
      district,
      clinic,
      voiceEnabled,
      offlineSync,
      audioReadback,
      mfaEnabled,
    };
    localStorage.setItem('user_profile_custom', JSON.stringify(customProfile));

    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }

    setToast('Profile and clinical preferences updated successfully! ✓');
    setTimeout(() => setToast(''), 3500);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPasswordToast('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordToast('New password and confirmation do not match.');
      return;
    }

    setPasswordToast('Password changed successfully! ✓');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordToast(''), 3500);
  };

  const toggleMfa = () => {
    const nextMfa = !mfaEnabled;
    setMfaEnabled(nextMfa);
    const saved = localStorage.getItem('user_profile_custom');
    const parsed = saved ? JSON.parse(saved) : {};
    parsed.mfaEnabled = nextMfa;
    localStorage.setItem('user_profile_custom', JSON.stringify(parsed));
    setToast(nextMfa ? 'Two-factor authentication (MFA) enabled ✓' : 'Two-factor authentication disabled');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>User Profile & Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Manage your personal credentials, operational scope, and field preferences</p>
      </div>

      {toast && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ✓ {toast}
        </div>
      )}

      {/* Identity Card */}
      <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <CardContent style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'var(--color-primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.75rem',
              boxShadow: '0 4px 10px rgba(14, 116, 144, 0.25)',
            }}>
              {(fullName || 'CHW').split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{fullName}</h2>
                <Badge variant="success">Active Verified</Badge>
                <Badge variant="info">{(user?.role || 'CHW').replace('_', ' ')}</Badge>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{email}</p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                <span><strong>Staff ID:</strong> {staffId}</span>
                <span><strong>Unit:</strong> {clinic}</span>
                <span><strong>Region:</strong> {district}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {[
          { id: 'profile', label: '👤 Account & Demographics' },
          { id: 'preferences', label: '⚙️ Field & App Preferences' },
          { id: 'security', label: '🔒 Security & MFA' },
          { id: 'activity', label: '📊 Clinical Activity' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile & Demographics */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '1.1rem' }}>Personal & Workplace Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Full Name</label>
                  <input
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Contact Phone</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Staff ID / Worker ID</label>
                  <input
                    disabled
                    value={staffId}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: '#f1f5f9', color: '#64748b' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Assigned Operational District</label>
                  <input
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Primary Health Clinic / Facility</label>
                  <input
                    value={clinic}
                    onChange={e => setClinic(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary">Save profile details</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '1.1rem' }}>Field & Clinical Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Interface Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  style={{ width: '100%', maxWidth: '320px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'white' }}
                >
                  <option value="en">English (Default)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="ar">العربية (Arabic - RTL)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  Switches all clinical assessment templates and navigation text to selected locale.
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Field Tools & Offline Controls</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🎙️ Enable Voice Clinical Dictation</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Allows speech-to-text recording during patient vitals and assessment intake.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={e => setVoiceEnabled(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🔄 Background Offline Data Sync</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Automatically stores assessments locally when cellular connectivity is intermittent.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={offlineSync}
                      onChange={e => setOfflineSync(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🔊 Protocol Audio Read-Back</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Reads critical protocol emergency advice aloud in the selected language.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={audioReadback}
                      onChange={e => setAudioReadback(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary">Save preferences</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* MFA Management Card */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '1.1rem' }}>Multi-Factor Authentication (MFA)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Status:</span>
                    <Badge variant={mfaEnabled ? 'success' : 'default'}>{mfaEnabled ? 'Enabled' : 'Disabled'}</Badge>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Enhance login security by requiring an SMS or authenticator code.
                  </p>
                </div>
                <Button variant={mfaEnabled ? 'outline' : 'primary'} onClick={toggleMfa}>
                  {mfaEnabled ? 'Disable 2FA' : 'Enable 2FA Authenticator'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '1.1rem' }}>Update Password</CardTitle>
            </CardHeader>
            <CardContent>
              {passwordToast && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: passwordToast.includes('✓') ? '#dcfce7' : '#fee2e2', color: passwordToast.includes('✓') ? '#15803d' : '#b91c1c', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {passwordToast}
                </div>
              )}
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem' }}
                  />
                </div>
                <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }}>Update password</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Clinical Activity */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'REGISTERED PATIENTS', value: '50', sub: 'In primary caseload' },
              { label: 'ASSESSMENTS COMPLETED', value: '142', sub: 'Protocol evaluated' },
              { label: 'REFERRALS DISPATCHED', value: '18', sub: 'To specialist clinics' },
              { label: 'TRAINING COMPLETION', value: '85%', sub: 'Accredited score' },
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardContent style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{kpi.label}</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{kpi.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle style={{ fontSize: '1.1rem' }}>Recent Governance & Activity Log</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Paediatric Danger Sign Assessment</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Patient: Amara Diop (PT-2026-0002) · Escalated to Supervisor</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Today, 10:15 AM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Follow-up Visit Completed</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Patient: Amina Mwangi (PT-2026-0001) · Post-fever recovery</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Yesterday, 3:30 PM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Lesson Completed: Maternal ANC Criteria</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Scored 100% on module evaluation</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Aug 20, 2026</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
