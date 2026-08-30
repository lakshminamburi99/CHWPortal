import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { API_BASE } from './config'

// Setup global fetch interceptor
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const newInit: RequestInit = { ...init };

  // 1. Enable HttpOnly cookie credentials transmission
  newInit.credentials = 'include';

  // 2. Safely extract target URL string
  const urlString = typeof input === 'string'
    ? input
    : (input instanceof URL ? input.toString() : (input && 'url' in input ? (input as Request).url : ''));

  // 3. LocalStorage Authorization Header Fallback using standard Headers
  const token = localStorage.getItem('access_token');
  const headers = new Headers(newInit.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  newInit.headers = headers;

  // 4. Make the request
  let response = await originalFetch(input, newInit);

  // 5. Expiration / Rotation interceptor: If 401 Unauthorized, try to refresh
  const isLoginEndpoint = urlString.includes('/auth/login');
  const isLogoutEndpoint = urlString.includes('/auth/logout');
  const isRefreshEndpoint = urlString.includes('/auth/refresh');
  const isAuthBypass = isLoginEndpoint || isLogoutEndpoint || isRefreshEndpoint;

  if (response.status === 401 && !isAuthBypass) {
    const refToken = localStorage.getItem('refresh_token');
    // Only attempt refresh if a refresh token or session might exist
    if (refToken || token) {
      try {
        const refreshHeaders = new Headers();
        refreshHeaders.set('Content-Type', 'application/json');
        if (token) {
          refreshHeaders.set('Authorization', `Bearer ${token}`);
        }

        const refreshRes = await originalFetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: refreshHeaders,
          body: JSON.stringify({ refresh_token: refToken || undefined }),
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            localStorage.setItem('access_token', refreshData.access_token);
          }
          if (refreshData.refresh_token) {
            localStorage.setItem('refresh_token', refreshData.refresh_token);
          }

          // Retry the original request with the new access token
          const newToken = localStorage.getItem('access_token');
          const retryHeaders = new Headers(newInit.headers || {});
          if (newToken) {
            retryHeaders.set('Authorization', `Bearer ${newToken}`);
          }
          newInit.headers = retryHeaders;
          response = await originalFetch(input, newInit);
        } else {
          // Refresh failed: session completely expired/revoked, force log out
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth_session_expired'));
        }
      } catch (err) {
        console.error('Session rotation failed:', err);
      }
    }
  }

  return response;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
