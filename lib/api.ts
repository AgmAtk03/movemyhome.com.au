export const DEFAULT_API_BASE = 'https://aama-removals.vercel.app';

/** Absolute API origin. Empty/missing VITE_API_BASE uses the Vercel host so checkout still works if Netlify’s /api proxy 404s. */
export function resolveApiBase(raw?: string | null): string {
  const value = String(raw ?? '').trim();
  return (value || DEFAULT_API_BASE).replace(/\/$/, '');
}

export function viteApiBase(): string {
  const env = (import.meta as ImportMeta).env;
  return resolveApiBase(env?.VITE_API_BASE);
}

export function apiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${viteApiBase()}${suffix}`;
}
