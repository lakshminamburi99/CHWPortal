import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { API_BASE } from './config'

// Setup global fetch interceptor
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const newInit = { ...init };

  // 1. Enable HttpOnly cookie credentials transmission
  newInit.credentials = 'include';

  // 2. LocalStorage Authorization Header Fallback (for backwards compatibility/testing)
  const token = localStorage.getItem('access_token');
  if (token) {
    newInit.headers = {
      Authorization: `Bearer ${token}`,
      ...newInit.headers,
    };
  }

  // 3. Make the request
  let response = await originalFetch(input, newInit);

  // 4. Expiration / Rotation interceptor: If 401 Unauthorized, try to refresh
  const isRefreshEndpoint = typeof input === 'string' && input.includes('/auth/refresh');
  if (response.status === 401 && !isRefreshEndpoint) {
    try {
      const refToken = localStorage.getItem('refresh_token');
      // Attempt rotation
      const refreshRes = await originalFetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refToken || undefined }),
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        // Update credentials fallback if returned in response body
        if (refreshData.access_token) {
          localStorage.setItem('access_token', refreshData.access_token);
        }
        if (refreshData.refresh_token) {
          localStorage.setItem('refresh_token', refreshData.refresh_token);
        }

        // Retry the original request with the new credentials
        const newToken = localStorage.getItem('access_token');
        if (newToken) {
          newInit.headers = {
            ...newInit.headers,
            Authorization: `Bearer ${newToken}`,
          };
        }
        response = await originalFetch(input, newInit);
      } else {
        // Refresh failed: session completely expired/revoked, force log out
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        // Let application context know by redirecting
        window.dispatchEvent(new Event('auth_session_expired'));
      }
    } catch (err) {
      console.error('Session rotation failed:', err);
    }
  }

  return response;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
