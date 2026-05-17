import { Capacitor } from '@capacitor/core';

const explicitBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
let resolvedBase: string | null = explicitBase || null;

function normalize(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function deriveAndroidBases(): string[] {
  const envAndroid = (import.meta.env.VITE_ANDROID_API_BASE_URL || '').trim();
  const candidates: string[] = [];

  // Highest priority explicit Android override.
  if (envAndroid) candidates.push(envAndroid.replace(/\/$/, ''));

  // If app is being served from LAN/Vite host in a WebView, reuse that host for backend :3000.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      candidates.push(`http://${host}:3000`);
    }
  }

  // Android emulator alias last (won't work on physical devices).
  candidates.push('http://10.0.2.2:3000');
  candidates.push('http://localhost:3000');
  candidates.push('http://127.0.0.1:3000');

  return unique(candidates);
}

function getCandidates(path: string): string[] {
  const normalizedPath = normalize(path);

  if (resolvedBase) {
    return [`${resolvedBase}${normalizedPath}`];
  }

  if (Capacitor.getPlatform() === 'android') {
    return deriveAndroidBases().map((base) => `${base}${normalizedPath}`);
  }

  return [normalizedPath];
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return getCandidates(path)[0];
}

export async function fetchJsonOrThrow(path: string, init?: RequestInit) {
  const urls = /^https?:\/\//i.test(path) ? [path] : getCandidates(path);
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
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

      const parsed = await response.json();
      const baseMatch = url.match(/^(https?:\/\/[^/]+)/i);
      if (baseMatch) {
        resolvedBase = baseMatch[1];
      }
      return parsed;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  const tried = urls.join(', ');
  const rootMessage = lastError?.message || `Failed to fetch ${path}`;
  throw new Error(`${rootMessage}. Tried: ${tried}`);
}
