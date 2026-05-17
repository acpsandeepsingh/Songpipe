
import { Capacitor } from '@capacitor/core';

export function getApiBaseUrl(): string | null {
  const host = window.location.hostname;
  
  // If we're on a real host (browser preview or deployed web app), use current origin
  if (host !== 'localhost' && host !== '127.0.0.1' && host !== '') {
    return window.location.origin;
  }
  
  // Check localStorage for a manually provided URL (useful for Capacitor)
  const savedUrl = localStorage.getItem('VITE_API_URL');
  if (savedUrl) return savedUrl;

  // If we're in Capacitor on Android/iOS, we need to know where the backend is.
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Fallback: If we're on localhost but NOT native, we're likely in a dev server
  if (!Capacitor.isNativePlatform()) {
    return window.location.origin;
  }

  // If we are native and on localhost, we are likely missing our backend URL.
  // In the case of AI Studio Build, the backend is on the URL that the user is viewing.
  // However, we don't know it. We'll default to origin as a last resort, 
  // but this is where the HTML vs JSON error happens.
  return null;
}

export function getFullUrl(path: string) {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!base) return null;
  
  // If base is just the current origin, we can stick to relative or absolute from root
  if (base === window.location.origin) {
     return cleanPath;
  }
  
  return `${base}${cleanPath}`;
}

export function getApiConfigError(): string | null {
  const isNative = Capacitor.isNativePlatform();
  const host = window.location.hostname;
  const savedUrl = localStorage.getItem('VITE_API_URL');
  if (isNative && (host === 'localhost' || host === '127.0.0.1') && !savedUrl && !import.meta.env.VITE_API_URL) {
    return 'Backend API URL is not configured. Open API CONFIG and set your deployed server URL.';
  }
  return null;
}
