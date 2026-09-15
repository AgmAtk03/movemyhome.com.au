import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGIN = [
  /^https:\/\/(www\.)?movemyhome\.com\.au$/i,
  /^https:\/\/([a-z0-9-]+\.)+netlify\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)+vercel\.app$/i,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i,
];

export function isAllowedBrowserOrigin(origin: string): boolean {
  const value = String(origin || '').trim();
  if (!value) return false;
  try {
    const url = new URL(value);
    return ALLOWED_ORIGIN.some((re) => re.test(url.origin));
  } catch {
    return false;
  }
}

function setCorsHeaders(res: VercelResponse, origin: string): void {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/** Set CORS for the public Netlify UI. Returns true when OPTIONS was answered. */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = String(req.headers.origin || '').trim();
  if (origin && isAllowedBrowserOrigin(origin)) {
    setCorsHeaders(res, origin);
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
