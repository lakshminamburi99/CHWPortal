/**
 * Central API Base URL Configuration
 */
export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string) ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api/v1'
    : 'http://localhost:8000/api/v1');
