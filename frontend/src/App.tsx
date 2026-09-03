import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE } from './config';
import { CWSTbot } from './components/CWSTbot';

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
export type Role = 'CHW' | 'SUPERVISOR' | 'MANAGER' | 'PROGRAMME_MANAGER' | 'REGIONAL_ADMIN' | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
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
    return saved ? JSON.parse(saved) : null;
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


// ---------------------------------------------------------
// Sidebar nav items by role
// ---------------------------------------------------------
const navConfig: Record<Role, { section: string; items: { label: string; path: string; icon: string }[] }[]> = {
  CHW: [
    {
      section: 'CLINICAL CARE',
      items: [
        { label: 'Home', path: '/chw/dashboard', icon: '🏠' },
        { label: 'Patients', path: '/chw/patients', icon: '👥' },
        { label: 'Assessments', path: '/chw/assessments', icon: '🩺' },
        { label: 'Cases', path: '/chw/cases', icon: '📋' },
      ],
    },
    {
      section: 'COORDINATION',
      items: [
        { label: 'Referrals', path: '/chw/referrals', icon: '📤' },
        { label: 'Follow-ups', path: '/chw/follow-ups', icon: '💓' },
        { label: 'Notifications', path: '/chw/notifications', icon: '🔔' },
      ],
    },
    {
      section: 'LEARNING & ACCOUNT',
      items: [
        { label: 'Training', path: '/chw/training', icon: '🎓' },
        { label: 'Profile', path: '/chw/profile', icon: '👤' },
      ],
    },
  ],
  SUPERVISOR: [
    {
      section: 'CLINICAL OVERSIGHT',
      items: [
        { label: 'Home', path: '/supervisor/dashboard', icon: '🏠' },
        { label: 'Triage', path: '/supervisor/triage', icon: '🚨' },
        { label: 'Cases', path: '/supervisor/cases', icon: '📋' },
        { label: 'Patients', path: '/supervisor/patients', icon: '👥' },
      ],
    },
    {
      section: 'TEAM',
      items: [
        { label: 'Health workers', path: '/supervisor/team', icon: '👷' },
        { label: 'Referrals', path: '/supervisor/referrals', icon: '📤' },
        { label: 'Follow-ups', path: '/supervisor/follow-ups', icon: '💓' },
        { label: 'Notifications', path: '/supervisor/notifications', icon: '🔔' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { label: 'Profile', path: '/supervisor/profile', icon: '👤' },
      ],
    },
  ],
  MANAGER: [
    {
      section: 'PROGRAMME',
      items: [
        { label: 'Home', path: '/manager/dashboard', icon: '🏠' },
        { label: 'Regions', path: '/manager/regions', icon: '🗺️' },
        { label: 'Districts', path: '/manager/districts', icon: '📍' },
        { label: 'Teams', path: '/manager/teams', icon: '👥' },
        { label: 'Reports', path: '/manager/reports', icon: '📊' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { label: 'Notifications', path: '/manager/notifications', icon: '🔔' },
        { label: 'Profile', path: '/manager/profile', icon: '👤' },
      ],
    },
  ],
  PROGRAMME_MANAGER: [
    {
      section: 'PROGRAMME',
      items: [
        { label: 'Home', path: '/manager/dashboard', icon: '🏠' },
        { label: 'Regions', path: '/manager/regions', icon: '🗺️' },
        { label: 'Districts', path: '/manager/districts', icon: '📍' },
        { label: 'Teams', path: '/manager/teams', icon: '👥' },
        { label: 'Reports', path: '/manager/reports', icon: '📊' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { label: 'Notifications', path: '/manager/notifications', icon: '🔔' },
        { label: 'Profile', path: '/manager/profile', icon: '👤' },
      ],
    },
  ],
  REGIONAL_ADMIN: [
    {
      section: 'ADMINISTRATION',
      items: [
        { label: 'Home', path: '/admin/regional/dashboard', icon: '🏠' },
        { label: 'Accounts', path: '/admin/regional/accounts', icon: '👥' },
        { label: 'Org units', path: '/admin/regional/org-units', icon: '🏢' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { label: 'Notifications', path: '/admin/regional/notifications', icon: '🔔' },
        { label: 'Profile', path: '/admin/regional/profile', icon: '👤' },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      section: 'PLATFORM',
      items: [
        { label: 'Home', path: '/admin/super/dashboard', icon: '🏠' },
        { label: 'Users', path: '/admin/super/users', icon: '👥' },
        { label: 'Roles', path: '/admin/super/roles', icon: '🛡️' },
        { label: 'Audit', path: '/admin/super/audit', icon: '📜' },
        { label: 'Settings', path: '/admin/super/settings', icon: '⚙️' },
      ],
    },
    {
      section: 'ORGANISATION',
      items: [
        { label: 'Org units', path: '/admin/super/org-units', icon: '🏢' },
        { label: 'Notifications', path: '/admin/super/notifications', icon: '🔔' },
        { label: 'Profile', path: '/admin/super/profile', icon: '👤' },
      ],
    },
  ],
};

const roleBadgeLabel: Record<Role, string> = {
  CHW: 'COMMUNITY HEALTH WORKER',
  SUPERVISOR: 'SUPERVISOR',
  MANAGER: 'PROGRAMME MANAGER',
  PROGRAMME_MANAGER: 'PROGRAMME MANAGER',
  REGIONAL_ADMIN: 'REGIONAL ADMINISTRATOR',
  SUPER_ADMIN: 'SUPER ADMINISTRATOR',
};

const CompassLogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

// ---------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const sections = navConfig[user.role];
  const initials = user.name.split(' ').map(n => n[0]).join('');

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
    }}>
      {/* Brand */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: '30px', height: '30px',
            borderRadius: '8px',
            backgroundColor: 'var(--sidebar-primary)',
            color: 'var(--sidebar-primary-foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <CompassLogoIcon />
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--sidebar-foreground)', letterSpacing: '-0.01em' }}>Care Compass</div>
        </div>
        <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.45)', paddingLeft: '38px' }}>
          Community health worker support platform
        </div>
        <div style={{
          display: 'inline-block',
          marginTop: '0.75rem',
          padding: '0.2rem 0.6rem',
          backgroundColor: 'var(--sidebar-accent)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.62rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--sidebar-accent-foreground)',
          textTransform: 'uppercase',
        }}>
          {roleBadgeLabel[user.role]}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {sections.map((section) => (
          <div key={section.section} style={{ marginBottom: '1.5rem' }}>
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
                  borderLeft: isActive ? '2px solid var(--sidebar-primary)' : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  marginRight: '0.75rem',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--sidebar-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.75rem', color: 'var(--sidebar-primary-foreground)',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sidebar-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
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
          Sign out
        </button>
      </div>
    </aside>
  );
};

// ---------------------------------------------------------
// Top Header
// ---------------------------------------------------------
const langLabels: Record<string, string> = { en: 'English', es: 'Español', ar: 'العربية', hi: 'हिन्दी' };

const Header = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  if (!user) return null;
  const initials = user.name.split(' ').map((n: string) => n[0]).join('');

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
          {roleBadgeLabel[user.role].charAt(0) + roleBadgeLabel[user.role].slice(1).toLowerCase()}
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
          Online
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <select
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.3rem 0.5rem',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-sans)',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ar">العربية</option>
          <option value="hi">हिन्दी</option>
        </select>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          fontWeight: 700, fontSize: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          {initials}
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
