/**
 * Central API Base URL Configuration with Dynamic Cloud Run Resolution
 */
const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Dynamically derive Cloud Run backend URL from frontend hostname
    if (window.location.hostname.includes('.run.app')) {
      const backendHostname = window.location.hostname.replace('chw-frontend', 'chw-backend');
      return `https://${backendHostname}/api/v1`;
    }
    return '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

export const API_BASE: string = getApiBase();
