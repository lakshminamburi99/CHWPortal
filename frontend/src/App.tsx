import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE } from './config';
import { CWSTbot } from './components/CWSTbot';
import { CareCompassLogo } from './components/CareCompassLogo';
import { Avatar } from './components/ui/Avatar';
import { getAvatarForUser } from './utils/avatars';

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
export type Role = 'CHW' | 'SUPERVISOR' | 'MANAGER' | 'PROGRAMME_MANAGER' | 'REGIONAL_ADMIN' | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

// ---------------------------------------------------------
// Auth Context
// ---------------------------------------------------------
interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('user');
    const customAvatar = localStorage.getItem('user_profile_avatar');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (customAvatar && !parsed.avatar) {
          parsed.avatar = customAvatar;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth_session_expired', handleExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleExpired);
    };
  }, []);

  useEffect(() => {
    // If we are using HttpOnly cookies, we can still call /auth/session.
    // If access_token doesn't exist, we can try to fetch anyway because the cookie might be there!
    // But to support localStorage fallback, we check for either.
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/auth/session`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Session invalid');
      })
      .then(data => {
        const authUser: AuthUser = {
          id: data.id,
          name: data.display_name,
          email: data.email,
          role: data.role,
        };
        setUser(authUser);
        localStorage.setItem('user', JSON.stringify(authUser));
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--muted-foreground)' }}>
        Authenticating session…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------
// Protected Route
// ---------------------------------------------------------
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

// ---------------------------------------------------------
// Role redirect after login
// ---------------------------------------------------------
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  switch (user.role) {
    case 'CHW': return <Navigate to="/chw/dashboard" replace />;
    case 'SUPERVISOR': return <Navigate to="/supervisor/dashboard" replace />;
    case 'MANAGER':
    case 'PROGRAMME_MANAGER': return <Navigate to="/manager/dashboard" replace />;
    case 'REGIONAL_ADMIN': return <Navigate to="/admin/regional/dashboard" replace />;
    case 'SUPER_ADMIN': return <Navigate to="/admin/super/dashboard" replace />;
    default: return <Navigate to="/" replace />;
  }
};


import { LanguageSelector } from './components/LanguageSelector';

// ---------------------------------------------------------
// Sidebar nav items helper by role
// ---------------------------------------------------------
const getNavConfig = (t: (key: string) => string): Record<Role, { section: string; items: { label: string; path: string; icon: string }[] }[]> => ({
  CHW: [
    {
      section: t('nav.sections.FIELD_WORKSPACE'),
      items: [
        { label: t('nav.items.home'), path: '/chw/dashboard', icon: '🏠' },
        { label: t('nav.items.patients'), path: '/chw/patients', icon: '👥' },
        { label: t('nav.items.assessments'), path: '/chw/assessments', icon: '🩺' },
        { label: t('nav.items.cases'), path: '/chw/cases', icon: '📋' },
      ],
    },
    {
      section: t('nav.sections.FIELD_WORKSPACE'),
      items: [
        { label: t('nav.items.referrals'), path: '/chw/referrals', icon: '📤' },
        { label: t('nav.items.follow_ups'), path: '/chw/follow-ups', icon: '💓' },
        { label: t('nav.items.notifications'), path: '/chw/notifications', icon: '🔔' },
      ],
    },
    {
      section: t('nav.sections.FIELD_WORKSPACE'),
      items: [
        { label: t('nav.items.training'), path: '/chw/training', icon: '🎓' },
        { label: t('nav.items.profile'), path: '/chw/profile', icon: '👤' },
      ],
    },
  ],
  SUPERVISOR: [
    {
      section: t('nav.sections.SUPERVISOR'),
      items: [
        { label: t('nav.items.home'), path: '/supervisor/dashboard', icon: '🏠' },
        { label: t('nav.items.triage'), path: '/supervisor/triage', icon: '🚨' },
        { label: t('nav.items.cases'), path: '/supervisor/cases', icon: '📋' },
        { label: t('nav.items.patients'), path: '/supervisor/patients', icon: '👥' },
      ],
    },
    {
      section: t('nav.sections.SUPERVISOR'),
      items: [
        { label: t('nav.items.team'), path: '/supervisor/team', icon: '👷' },
        { label: t('nav.items.referrals'), path: '/supervisor/referrals', icon: '📤' },
        { label: t('nav.items.follow_ups'), path: '/supervisor/follow-ups', icon: '💓' },
        { label: t('nav.items.notifications'), path: '/supervisor/notifications', icon: '🔔' },
      ],
    },
    {
      section: t('nav.sections.SUPERVISOR'),
      items: [
        { label: t('nav.items.profile'), path: '/supervisor/profile', icon: '👤' },
      ],
    },
  ],
  MANAGER: [
    {
      section: t('nav.sections.PROGRAMME'),
      items: [
        { label: t('nav.items.home'), path: '/manager/dashboard', icon: '🏠' },
        { label: t('nav.items.regions'), path: '/manager/regions', icon: '🗺️' },
        { label: t('nav.items.districts'), path: '/manager/districts', icon: '📍' },
        { label: t('nav.items.teams'), path: '/manager/teams', icon: '👥' },
        { label: t('nav.items.reports'), path: '/manager/reports', icon: '📊' },
      ],
    },
    {
      section: t('nav.sections.PROGRAMME'),
      items: [
        { label: t('nav.items.notifications'), path: '/manager/notifications', icon: '🔔' },
        { label: t('nav.items.profile'), path: '/manager/profile', icon: '👤' },
      ],
    },
  ],
  PROGRAMME_MANAGER: [
    {
      section: t('nav.sections.PROGRAMME'),
      items: [
        { label: t('nav.items.home'), path: '/manager/dashboard', icon: '🏠' },
        { label: t('nav.items.regions'), path: '/manager/regions', icon: '🗺️' },
        { label: t('nav.items.districts'), path: '/manager/districts', icon: '📍' },
        { label: t('nav.items.teams'), path: '/manager/teams', icon: '👥' },
        { label: t('nav.items.reports'), path: '/manager/reports', icon: '📊' },
      ],
    },
    {
      section: t('nav.sections.PROGRAMME'),
      items: [
        { label: t('nav.items.notifications'), path: '/manager/notifications', icon: '🔔' },
        { label: t('nav.items.profile'), path: '/manager/profile', icon: '👤' },
      ],
    },
  ],
  REGIONAL_ADMIN: [
    {
      section: t('nav.sections.ADMINISTRATION'),
      items: [
        { label: t('nav.items.home'), path: '/admin/regional/dashboard', icon: '🏠' },
        { label: t('nav.items.accounts'), path: '/admin/regional/accounts', icon: '👥' },
        { label: t('nav.items.org_units'), path: '/admin/regional/org-units', icon: '🏢' },
      ],
    },
    {
      section: t('nav.sections.ADMINISTRATION'),
      items: [
        { label: t('nav.items.notifications'), path: '/admin/regional/notifications', icon: '🔔' },
        { label: t('nav.items.profile'), path: '/admin/regional/profile', icon: '👤' },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      section: t('nav.sections.PLATFORM'),
      items: [
        { label: t('nav.items.home'), path: '/admin/super/dashboard', icon: '🏠' },
        { label: t('nav.items.users'), path: '/admin/super/users', icon: '👥' },
        { label: t('nav.items.roles'), path: '/admin/super/roles', icon: '🛡️' },
        { label: t('nav.items.audit'), path: '/admin/super/audit', icon: '📜' },
        { label: t('nav.items.settings'), path: '/admin/super/settings', icon: '⚙️' },
      ],
    },
    {
      section: t('nav.sections.ORGANISATION'),
      items: [
        { label: t('nav.items.org_units'), path: '/admin/super/org-units', icon: '🏢' },
        { label: t('nav.items.notifications'), path: '/admin/super/notifications', icon: '🔔' },
        { label: t('nav.items.profile'), path: '/admin/super/profile', icon: '👤' },
      ],
    },
  ],
});

const getProfilePath = (role: Role) => {
  switch (role) {
    case 'CHW': return '/chw/profile';
    case 'SUPERVISOR': return '/supervisor/profile';
    case 'MANAGER':
    case 'PROGRAMME_MANAGER': return '/manager/profile';
    case 'REGIONAL_ADMIN': return '/admin/regional/profile';
    case 'SUPER_ADMIN': return '/admin/super/profile';
    default: return '/chw/profile';
  }
};

// ---------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------
const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  if (!user) return null;
  const isRtl = i18n.dir() === 'rtl';
  const sections = getNavConfig(t)[user.role];
  const userAvatar = user.avatar || getAvatarForUser(user);

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      backgroundColor: 'var(--sidebar)',
      color: 'var(--sidebar-foreground)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      height: '100vh',
      fontFamily: 'var(--font-sans)',
      borderInlineEnd: '1px solid var(--sidebar-border)',
    }}>
      {/* Brand */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ marginBottom: '0.6rem' }}>
          <CareCompassLogo
            variant="horizontal"
            size="sm"
            showSubtitle={true}
            subtitleText={t('app_subtitle')}
            theme="sidebar"
          />
        </div>
        <div style={{
          display: 'inline-block',
          padding: '0.2rem 0.6rem',
          backgroundColor: 'var(--sidebar-accent)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.62rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--sidebar-accent-foreground)',
          textTransform: 'uppercase',
        }}>
          {t(`roles.${user.role}`)}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '1.5rem' }}>
            <div style={{
              padding: '0 1.25rem 0.4rem',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
            }}>
              {section.section}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 1rem 0.5rem 1.25rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--sidebar-accent-foreground)' : 'rgba(255,255,255,0.6)',
                  backgroundColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                  borderInlineStart: isActive ? '3px solid var(--sidebar-primary)' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                  borderRadius: isRtl ? 'var(--radius-sm) 0 0 var(--radius-sm)' : '0 var(--radius-sm) var(--radius-sm) 0',
                  marginInlineEnd: '0.75rem',
                })}
              >
                <span style={{ fontSize: '0.875rem', opacity: 0.85 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer: Profile + Sign out */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div
          onClick={() => navigate(getProfilePath(user.role))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            cursor: 'pointer',
            padding: '0.35rem',
            borderRadius: 'var(--radius-sm)',
            transition: 'background-color var(--transition-fast)',
          }}
          title="View profile & preferences"
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Avatar
            src={userAvatar}
            name={user.name}
            role={user.role}
            size="md"
            status="online"
            border={true}
            borderColor="rgba(56, 189, 248, 0.4)"
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sidebar-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{
            width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--sidebar-border)',
            backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)',
            fontSize: '0.8rem', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            fontFamily: 'var(--font-sans)',
            transition: 'background-color var(--transition-fast)',
          }}
        >
          {t('common.sign_out')}
        </button>
      </div>
    </aside>
  );
};

// ---------------------------------------------------------
// Top Header
// ---------------------------------------------------------
const Header = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!user) return null;
  const userAvatar = user.avatar || getAvatarForUser(user);

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      flexShrink: 0,
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
          {t(`roles.${user.role}`)}
        </span>
        <span style={{
          fontSize: '0.7rem',
          padding: '0.2rem 0.55rem',
          border: '1px solid #16a34a',
          borderRadius: '9999px',
          color: '#16a34a',
          backgroundColor: '#f0fdf4',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          {t('common.online')}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <LanguageSelector variant="dropdown" />
        <div
          onClick={() => navigate(getProfilePath(user.role))}
          title="Account Settings"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Avatar
            src={userAvatar}
            name={user.name}
            role={user.role}
            size="sm"
            status="online"
            border={true}
            borderColor="var(--primary)"
          />
        </div>
      </div>
    </header>
  );
};

// ---------------------------------------------------------
// Dashboard Layout
// ---------------------------------------------------------
const DashboardLayout = () => (
  <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', backgroundColor: 'var(--background)' }}>
        <Outlet />
      </main>
    </div>
    <CWSTbot />
  </div>
);

// ---------------------------------------------------------
// Lazy-imported pages
// ---------------------------------------------------------
import { SignIn } from './pages/auth/SignIn';
import { ChwDashboard } from './pages/chw/Dashboard';
import { PatientsPage } from './pages/chw/Patients';
import { AssessmentsPage } from './pages/chw/Assessments';
import { CasesPage } from './pages/chw/Cases';
import { ReferralsPage } from './pages/chw/Referrals';
import { FollowUpsPage } from './pages/chw/FollowUps';
import { NotificationsPage } from './pages/chw/Notifications';
import { TrainingPage } from './pages/chw/Training';
import { ProfilePage } from './pages/shared/Profile';
import { SupervisorDashboard } from './pages/supervisor/Dashboard';
import { TriagePage } from './pages/supervisor/Triage';
import { SupervisorCasesPage } from './pages/supervisor/Cases';
import { SupervisorPatientsPage } from './pages/supervisor/Patients';
import { SupervisorTeamPage } from './pages/supervisor/Team';
import { SupervisorReferralsPage } from './pages/supervisor/Referrals';
import { SupervisorFollowUpsPage } from './pages/supervisor/FollowUps';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { RegionsPage } from './pages/manager/Regions';
import { DistrictsPage } from './pages/manager/Districts';
import { TeamsPage } from './pages/manager/Teams';
import { ReportsPage } from './pages/manager/Reports';
import { RegionalAdminDashboard } from './pages/admin/regional/Dashboard';
import { AccountsPage } from './pages/admin/regional/Accounts';
import { OrgUnitsPage } from './pages/admin/regional/OrgUnits';
import { OrgUnitDetailsPage } from './pages/admin/regional/OrgUnitDetails';
import { SuperAdminDashboard } from './pages/admin/super/Dashboard';
import { UsersPage } from './pages/admin/super/Users';
import { RolesPage } from './pages/admin/super/Roles';
import { AuditPage } from './pages/admin/super/Audit';
import { SettingsPage } from './pages/admin/super/Settings';

const Unauthorized = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h2>
    <p style={{ color: 'var(--color-text-muted)' }}>You do not have permission to view this page.</p>
  </div>
);

// ---------------------------------------------------------
// Main App
// ---------------------------------------------------------
function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/redirect" element={<RoleRedirect />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<DashboardLayout />}>
            {/* CHW */}
            <Route element={<ProtectedRoute allowedRoles={['CHW']} />}>
              <Route path="/chw/dashboard" element={<ChwDashboard />} />
              <Route path="/chw/patients" element={<PatientsPage />} />
              <Route path="/chw/assessments" element={<AssessmentsPage />} />
              <Route path="/chw/cases" element={<CasesPage />} />
              <Route path="/chw/referrals" element={<ReferralsPage />} />
              <Route path="/chw/follow-ups" element={<FollowUpsPage />} />
              <Route path="/chw/notifications" element={<NotificationsPage />} />
              <Route path="/chw/training" element={<TrainingPage />} />
              <Route path="/chw/profile" element={<ProfilePage />} />
            </Route>

            {/* Supervisor */}
            <Route element={<ProtectedRoute allowedRoles={['SUPERVISOR']} />}>
              <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
              <Route path="/supervisor/triage" element={<TriagePage />} />
              <Route path="/supervisor/cases" element={<SupervisorCasesPage />} />
              <Route path="/supervisor/patients" element={<SupervisorPatientsPage />} />
              <Route path="/supervisor/team" element={<SupervisorTeamPage />} />
              <Route path="/supervisor/referrals" element={<SupervisorReferralsPage />} />
              <Route path="/supervisor/follow-ups" element={<SupervisorFollowUpsPage />} />
              <Route path="/supervisor/notifications" element={<NotificationsPage />} />
              <Route path="/supervisor/profile" element={<ProfilePage />} />
            </Route>

            {/* Manager */}
            <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'PROGRAMME_MANAGER']} />}>
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/regions" element={<RegionsPage />} />
              <Route path="/manager/districts" element={<DistrictsPage />} />
              <Route path="/manager/teams" element={<TeamsPage />} />
              <Route path="/manager/reports" element={<ReportsPage />} />
              <Route path="/manager/notifications" element={<NotificationsPage />} />
              <Route path="/manager/profile" element={<ProfilePage />} />
            </Route>

            {/* Regional Admin */}
            <Route element={<ProtectedRoute allowedRoles={['REGIONAL_ADMIN']} />}>
              <Route path="/admin/regional/dashboard" element={<RegionalAdminDashboard />} />
              <Route path="/admin/regional/accounts" element={<AccountsPage />} />
              <Route path="/admin/regional/org-units" element={<OrgUnitsPage />} />
              <Route path="/admin/regional/org-units/:id" element={<OrgUnitDetailsPage />} />
              <Route path="/admin/regional/notifications" element={<NotificationsPage />} />
              <Route path="/admin/regional/profile" element={<ProfilePage />} />
            </Route>

            {/* Super Admin */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/admin/super/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/admin/super/users" element={<UsersPage />} />
              <Route path="/admin/super/roles" element={<RolesPage />} />
              <Route path="/admin/super/audit" element={<AuditPage />} />
              <Route path="/admin/super/settings" element={<SettingsPage />} />
              <Route path="/admin/super/org-units" element={<OrgUnitsPage />} />
              <Route path="/admin/super/notifications" element={<NotificationsPage />} />
              <Route path="/admin/super/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
