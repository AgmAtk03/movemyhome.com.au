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

export function apiPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function apiUrl(path: string, base = viteApiBase()): string {
  return `${base}${apiPath(path)}`;
}

/**
 * Same-origin first (Netlify /api proxy — no CORS), then the configured
 * Vercel origin, then the known production API host.
 */
export function apiCandidates(path: string): string[] {
  const suffix = apiPath(path);
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (url: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  };
  add(suffix);
  add(apiUrl(suffix));
  add(apiUrl(suffix, DEFAULT_API_BASE));
  return out;
}

export function isApiJson(contentType: string | null | undefined): boolean {
  return (contentType || '').toLowerCase().includes('application/json');
}

/** Fetch JSON from the API, retrying hosts when the response is HTML/404 or the request fails. */
export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const urls = apiCandidates(path);
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, init);
      if (res.status === 404 || !isApiJson(res.headers.get('content-type'))) {
        lastError = new Error('not-json');
        continue;
      }
      return res;
    } catch {
      lastError = new Error('network');
    }
  }
  throw lastError || new Error('network');
}
