import { roundMoney } from '../../shared/money.js';

export const ELEVEN_URL = 'https://projectzerothree.info/api.php?format=json';

export interface DieselPriceResult {
  ok: true;
  audPerLitre: number;
  centsPerLitre: number;
  currency: 'AUD';
  source: string;
  sourceUrl?: string;
  station?: string;
  suburb?: string;
  state?: string;
  asOf: string;
  cached: boolean;
}

export interface DieselPriceUnavailable {
  ok: false;
  status: 'tbc';
  reason: string;
}

export type DieselResponse = DieselPriceResult | DieselPriceUnavailable;

const CACHE_MS = 30 * 60 * 1000;
const FAIL_CACHE_MS = 2 * 60 * 1000;

let cache: { at: number; value: DieselResponse } | null = null;

function readEnv(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function parseOverride(): number | null {
  const raw = readEnv('SEVEN_ELEVEN_DIESEL_AUD_PER_L');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0.5 || n > 8) return null;
  return roundMoney(n);
}

interface ElevenPrice {
  type?: string;
  price?: number;
  name?: string;
  suburb?: string;
  state?: string;
}

interface ElevenRegion {
  region?: string;
  prices?: ElevenPrice[];
}

/**
 * 11-Seven JSON: regions[].prices[] with type "Diesel" and price in cents/L.
 * Prefer the NSW row (Sydney moves). Official 7-Eleven AU APIs need app attestation.
 */
export function parseElevenNswDiesel(data: unknown): DieselPriceResult {
  if (!data || typeof data !== 'object') {
    throw new Error('11-Seven payload missing');
  }
  const row = data as { updated?: number; regions?: ElevenRegion[] };
  const regions = Array.isArray(row.regions) ? row.regions : [];
  const nsw = regions.find((item) => String(item.region || '').toUpperCase() === 'NSW') || regions[0];
  const diesel = (nsw?.prices || []).find((item) => String(item.type || '').toLowerCase() === 'diesel');
  const cents = Number(diesel?.price);
  if (!Number.isFinite(cents) || cents < 50 || cents > 800) {
    throw new Error('11-Seven diesel row missing or out of range');
  }
  const audPerLitre = roundMoney(cents / 100);
  const asOf = typeof row.updated === 'number' && row.updated > 0
    ? new Date(row.updated * 1000).toISOString()
    : new Date().toISOString();
  return {
    ok: true,
    audPerLitre,
    centsPerLitre: cents,
    currency: 'AUD',
    source: '11-Seven NSW 7-Eleven diesel (live pump list)',
    sourceUrl: ELEVEN_URL,
    station: diesel?.name ? String(diesel.name) : undefined,
    suburb: diesel?.suburb ? String(diesel.suburb) : undefined,
    state: diesel?.state ? String(diesel.state) : 'NSW',
    asOf,
    cached: false,
  };
}

async function fetchElevenNswDiesel(): Promise<DieselPriceResult> {
  const response = await fetch(ELEVEN_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MyHomeRemovals/1.0 (diesel-price; +https://movemyhome.com.au)',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`11-Seven HTTP ${response.status}`);
  }
  return parseElevenNswDiesel(await response.json());
}

export async function getDieselPrice(): Promise<DieselResponse> {
  const now = Date.now();
  if (cache && now - cache.at < (cache.value.ok ? CACHE_MS : FAIL_CACHE_MS)) {
    if (cache.value.ok) return { ...cache.value, cached: true };
    return cache.value;
  }

  const override = parseOverride();
  if (override != null) {
    const value: DieselPriceResult = {
      ok: true,
      audPerLitre: override,
      centsPerLitre: roundMoney(override * 100),
      currency: 'AUD',
      source: 'SEVEN_ELEVEN_DIESEL_AUD_PER_L (operator override)',
      asOf: new Date().toISOString(),
      cached: false,
    };
    cache = { at: now, value };
    return value;
  }

  try {
    const value = await fetchElevenNswDiesel();
    cache = { at: now, value };
    return value;
  } catch {
    const value: DieselPriceUnavailable = {
      ok: false,
      status: 'tbc',
      reason: 'Could not load the 7-Eleven diesel feed just now.',
    };
    cache = { at: now, value };
    return value;
  }
}

export function dieselAudFromResult(result: DieselResponse): number | null {
  return result.ok ? result.audPerLitre : null;
}
