import { Capacitor } from '@capacitor/core';

const DEFAULT_ANDROID_API = 'http://10.0.2.2:3000';

function getConfiguredApiBase() {
  const explicit = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    return DEFAULT_ANDROID_API;
  }

  return '';
}

export const API_BASE_URL = getConfiguredApiBase();

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE_URL}${path}`;
}

export async function fetchJsonOrThrow(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  const response = await fetch(url, init);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}. Response: ${body.substring(0, 300)}`);
  }

  if (!contentType.includes('application/json')) {
    const body = await response.text();
    const hint = body.includes('<!doctype html') || body.includes('<html')
      ? 'Received HTML instead of JSON. Backend API route is likely unreachable and WebView/Vite fallback served index.html.'
      : `Unexpected content-type: ${contentType || 'unknown'}.`;
    throw new Error(`${hint} URL: ${url}. Body snippet: ${body.substring(0, 300)}`);
  }

  return response.json();
}
