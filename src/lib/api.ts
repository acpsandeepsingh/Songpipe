import { Capacitor } from '@capacitor/core';

const DEFAULT_ANDROID_BASES = [
  (import.meta.env.VITE_ANDROID_API_BASE_URL || '').trim(),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.0.2.2:3000'
].filter(Boolean);

const explicitBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
let resolvedBase: string | null = explicitBase || null;

function normalize(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function getCandidates(path: string): string[] {
  const normalizedPath = normalize(path);

  if (resolvedBase) {
    return [`${resolvedBase}${normalizedPath}`];
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    return DEFAULT_ANDROID_BASES.map((base) => `${base.replace(/\/$/, '')}${normalizedPath}`);
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

  throw lastError || new Error(`Failed to fetch ${path}`);
}
