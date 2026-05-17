import { Capacitor } from '@capacitor/core';

const rawAndroidBases = (import.meta.env.VITE_ANDROID_API_BASES || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const DEFAULT_ANDROID_BASES = [
  (import.meta.env.VITE_ANDROID_API_BASE_URL || '').trim(),
  ...rawAndroidBases
].filter(Boolean);

const explicitBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
let resolvedBase: string | null = explicitBase || null;
let hasLoggedAndroidHint = false;

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
    if (DEFAULT_ANDROID_BASES.length > 0) {
      return DEFAULT_ANDROID_BASES.map((base) => `${base.replace(/\/$/, '')}${normalizedPath}`);
    }
    return [normalizedPath];
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
  const attemptErrors: string[] = [];

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
      attemptErrors.push(`${url} -> ${lastError.message}`);
    }
  }

  if (Capacitor.getPlatform() === 'android' && !hasLoggedAndroidHint) {
    hasLoggedAndroidHint = true;
    console.warn(
      `[API] Android request failed for all candidates: ${urls.join(', ')}. ` +
      `Set VITE_API_BASE_URL or VITE_ANDROID_API_BASES to a reachable HTTPS/LAN backend for APK builds.`
    );
  }

  const combined = attemptErrors.length > 0
    ? `All API candidates failed for ${path}. Attempts: ${attemptErrors.join(' | ')}`
    : `Failed to fetch ${path}`;

  throw new Error(combined);
}
