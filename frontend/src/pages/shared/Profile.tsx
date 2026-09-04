import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../App';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { DEFAULT_AVATARS_GALLERY, getAvatarForUser } from '../../utils/avatars';
import { supportedLanguages } from '../../utils/languages';

export const ProfilePage = () => {
  const { user, login } = useAuth();
  const { t, i18n } = useTranslation();

  const [fullName, setFullName] = useState(user?.name || 'John Smith');
  const [email, setEmail] = useState(user?.email || 'demo-chw@example.com');
  const [avatar, setAvatar] = useState<string>(user?.avatar || getAvatarForUser(user || ''));
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
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved preferences & avatar
  useEffect(() => {
    const saved = localStorage.getItem('user_profile_custom');
    const savedAvatar = localStorage.getItem('user_profile_avatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
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
      avatar: avatar,
    };

    login(updatedUser);
    localStorage.setItem('user_profile_avatar', avatar);

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

    setToast(t('common.success') || 'Profile and clinical preferences updated successfully! ✓');
    setTimeout(() => setToast(''), 3500);
  };

  const handleSelectPresetAvatar = (url: string) => {
    setAvatar(url);
    localStorage.setItem('user_profile_avatar', url);
    if (user) {
      login({ ...user, avatar: url });
    }
    setShowAvatarModal(false);
    setToast('Profile picture updated successfully! ✓');
    setTimeout(() => setToast(''), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUpload = () => {
    if (!customAvatarPreview) return;
    setAvatar(customAvatarPreview);
    localStorage.setItem('user_profile_avatar', customAvatarPreview);
    if (user) {
      login({ ...user, avatar: customAvatarPreview });
    }
    setShowAvatarModal(false);
    setCustomAvatarPreview('');
    setToast('Custom photo uploaded successfully! ✓');
    setTimeout(() => setToast(''), 3000);
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {t('profile.title')}
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
          {t('profile.subtitle')}
        </p>
      </div>

      {toast && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          ✓ {toast}
        </div>
      )}

      {/* Identity Card */}
      <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)' }}>
        <CardContent style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={avatar}
                name={fullName}
                role={user?.role}
                size="2xl"
                status="online"
                border={true}
                borderColor="var(--primary)"
              />
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                title="Change profile picture"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                📷
              </button>
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{fullName}</h2>
                <Badge variant="success">{t('common.online')}</Badge>
                <Badge variant="info">{t(`roles.${user?.role || 'CHW'}`)}</Badge>
              </div>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{email}</p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--muted-foreground)', flexWrap: 'wrap' }}>
                <span><strong>{t('profile.staff_id')}:</strong> {staffId}</span>
                <span><strong>{t('profile.clinic')}:</strong> {clinic}</span>
                <span><strong>{t('profile.district')}:</strong> {district}</span>
              </div>
            </div>

            <div>
              <Button variant="outline" size="sm" onClick={() => setShowAvatarModal(true)}>
                📷 Change Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Avatar Picker & Photo Upload */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => { setShowAvatarModal(false); setCustomAvatarPreview(''); }}
        title="Choose Profile Picture"
        footer={<>
          <Button variant="outline" onClick={() => { setShowAvatarModal(false); setCustomAvatarPreview(''); }}>
            {t('common.cancel')}
          </Button>
          {customAvatarPreview && (
            <Button variant="primary" onClick={handleApplyCustomUpload}>
              Apply Uploaded Photo
            </Button>
          )}
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
              Select from Healthcare Avatar Gallery
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {DEFAULT_AVATARS_GALLERY.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectPresetAvatar(item.url)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    border: avatar === item.url ? '2px solid #0284c7' : '1px solid var(--border)',
                    backgroundColor: avatar === item.url ? 'rgba(2, 132, 199, 0.08)' : 'var(--card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#0284c7')}
                  onMouseLeave={e => {
                    if (avatar !== item.url) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <Avatar src={item.url} name={item.label} size="lg" shape="circle" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.5rem', textAlign: 'center' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>
                    {item.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
              Or Upload Custom Photo
            </h4>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                📁 Choose File from Device
              </Button>
              {customAvatarPreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Avatar src={customAvatarPreview} name="Preview" size="md" />
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>Ready to apply</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {[
          { id: 'profile', label: `👤 ${t('profile.tab_account')}` },
          { id: 'preferences', label: `⚙️ ${t('profile.tab_preferences')}` },
          { id: 'security', label: `🔒 ${t('profile.tab_security')}` },
          { id: 'activity', label: `📊 ${t('profile.tab_activity')}` },
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
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted-foreground)',
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
            <CardTitle style={{ fontSize: '1.1rem' }}>{t('profile.personal_info')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.full_name')}
                  </label>
                  <input
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.phone')}
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.staff_id')}
                  </label>
                  <input
                    disabled
                    value={staffId}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.district')}
                  </label>
                  <input
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.clinic')}
                  </label>
                  <input
                    value={clinic}
                    onChange={e => setClinic(e.target.value)}
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary">
                  {t('profile.save_profile')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '1.1rem' }}>{t('profile.field_prefs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  {t('profile.language')}
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  style={{ width: '100%', maxWidth: '320px', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                >
                  {supportedLanguages.map(l => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.name})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>
                  {t('profile.language_sub')}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>
                  {t('profile.field_prefs')}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🎙️ {t('profile.voice_dictation')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{t('profile.voice_dictation_sub')}</div>
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
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🔄 {t('profile.offline_sync')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{t('profile.offline_sync_sub')}</div>
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
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>🔊 {t('profile.audio_readback')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{t('profile.audio_readback_sub')}</div>
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
                <Button type="submit" variant="primary">
                  {t('profile.save_preferences')}
                </Button>
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
              <CardTitle style={{ fontSize: '1.1rem' }}>{t('profile.mfa_title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Status:</span>
                    <Badge variant={mfaEnabled ? 'success' : 'default'}>{mfaEnabled ? 'Enabled' : 'Disabled'}</Badge>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
                    {t('profile.mfa_desc')}
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
              <CardTitle style={{ fontSize: '1.1rem' }}>{t('profile.change_password')}</CardTitle>
            </CardHeader>
            <CardContent>
              {passwordToast && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: passwordToast.includes('✓') ? '#dcfce7' : '#fee2e2', color: passwordToast.includes('✓') ? '#15803d' : '#b91c1c', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {passwordToast}
                </div>
              )}
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.current_password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.new_password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t('profile.confirm_password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{ width: '100%', height: '40px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                  />
                </div>
                <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }}>
                  {t('profile.update_password')}
                </Button>
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
              { label: t('dashboard.kpi_assigned_patients'), value: '50', sub: 'In primary caseload' },
              { label: 'ASSESSMENTS COMPLETED', value: '142', sub: 'Protocol evaluated' },
              { label: 'REFERRALS DISPATCHED', value: '18', sub: 'To specialist clinics' },
              { label: 'TRAINING COMPLETION', value: '85%', sub: 'Accredited score' },
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardContent style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>{kpi.label}</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{kpi.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle style={{ fontSize: '1.1rem' }}>Recent Governance & Activity Log</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Paediatric Danger Sign Assessment</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>Patient: Amara Diop (PT-2026-0002) · Escalated to Supervisor</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Today, 10:15 AM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Follow-up Visit Completed</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>Patient: Amina Mwangi (PT-2026-0001) · Post-fever recovery</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Yesterday, 3:30 PM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Lesson Completed: Maternal ANC Criteria</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>Scored 100% on module evaluation</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Aug 20, 2026</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
