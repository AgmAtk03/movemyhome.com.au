import { MEMBER_CODE_INVALID, MEMBER_CODE_REDEEMED, MEMBER_CODE_FORMAT } from '../../lib/customerCopy.js';
import { isValidEmail } from '../../lib/validation.js';
import { sanitizePlainText } from '../../lib/sanitize.js';
import {
  isMemberCodeFormat,
  memberCodeForEmail,
  normalizeEmail,
  normalizeMemberCode,
  randomMemberCode,
} from '../../shared/memberCode.js';
import { isStripeConfigured, memberCodeSecret } from './env.js';
import { getStripe, meta } from './stripeClient.js';

const META_CODE = 'mhr_member_code';
const META_STATUS = 'mhr_member_status';
const META_NAME = 'mhr_member_name';
const META_ISSUED = 'mhr_issued_at';
const META_REDEEMED_SESSION = 'mhr_redeemed_session';

export type MemberCodeStatus = 'issued' | 'redeemed';

export interface IssuedMemberCode {
  ok: true;
  code: string;
  reused: boolean;
  alreadyRedeemed: boolean;
  customerId: string | null;
}

export interface MemberCodeUnavailable {
  ok: false;
  reason: 'unavailable';
}

export type IssueMemberCodeResult = IssuedMemberCode | MemberCodeUnavailable;

export type ValidateMemberCodeResult =
  | { ok: true; code: string; customerId: string | null }
  | { ok: false; error: string; redeemed?: boolean };

async function findCustomerByEmail(email: string): Promise<{ id: string; metadata: Record<string, string> } | null> {
  if (!isStripeConfigured()) return null;
  const list = await getStripe().customers.list({ email, limit: 5 });
  const row = list.data[0];
  if (!row) return null;
  return { id: row.id, metadata: (row.metadata || {}) as Record<string, string> };
}

function storedCode(metadata: Record<string, string>): string {
  return normalizeMemberCode(metadata[META_CODE] || '');
}

function storedStatus(metadata: Record<string, string>): MemberCodeStatus | '' {
  const value = String(metadata[META_STATUS] || '').trim();
  if (value === 'issued' || value === 'redeemed') return value;
  return '';
}

export function canIssueMemberCode(): boolean {
  return isStripeConfigured() || Boolean(memberCodeSecret());
}

async function persistIssued(opts: {
  name: string;
  email: string;
  code: string;
  existingId: string | null;
}): Promise<string | null> {
  if (!isStripeConfigured()) return opts.existingId;
  const stripe = getStripe();
  const payload = {
    name: opts.name,
    email: opts.email,
    metadata: {
      [META_CODE]: meta(opts.code, 32),
      [META_STATUS]: 'issued',
      [META_NAME]: meta(opts.name, 80),
      [META_ISSUED]: new Date().toISOString(),
    },
  };
  if (opts.existingId) {
    await stripe.customers.update(opts.existingId, payload);
    return opts.existingId;
  }
  const created = await stripe.customers.create(payload);
  return created.id;
}

export async function issueMemberCode(input: { name: string; email: string }): Promise<IssueMemberCodeResult> {
  const name = sanitizePlainText(input.name, 80);
  const email = normalizeEmail(sanitizePlainText(input.email, 120));
  const secret = memberCodeSecret();

  if (!canIssueMemberCode()) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const existing = await findCustomerByEmail(email);
    const previous = existing ? storedCode(existing.metadata) : '';
    const previousStatus = existing ? storedStatus(existing.metadata) : '';
    if (previous && isMemberCodeFormat(previous)) {
      return {
        ok: true,
        code: previous,
        reused: true,
        alreadyRedeemed: previousStatus === 'redeemed',
        customerId: existing?.id || null,
      };
    }

    const code = secret ? memberCodeForEmail(email, secret) : randomMemberCode();
    const customerId = await persistIssued({
      name,
      email,
      code,
      existingId: existing?.id || null,
    });
    return {
      ok: true,
      code,
      reused: false,
      alreadyRedeemed: false,
      customerId,
    };
  } catch (error) {
    console.error('issueMemberCode failed');
    if (secret) {
      return {
        ok: true,
        code: memberCodeForEmail(email, secret),
        reused: false,
        alreadyRedeemed: false,
        customerId: null,
      };
    }
    throw error;
  }
}

export async function validateMemberCode(input: { email: string; code: string }): Promise<ValidateMemberCodeResult> {
  const email = normalizeEmail(sanitizePlainText(input.email, 120));
  const code = normalizeMemberCode(input.code);
  if (!isValidEmail(email)) {
    return { ok: false, error: MEMBER_CODE_INVALID };
  }
  if (!code) {
    return { ok: false, error: MEMBER_CODE_FORMAT };
  }
  if (!isMemberCodeFormat(code)) {
    return { ok: false, error: MEMBER_CODE_FORMAT };
  }

  const secret = memberCodeSecret();
  const hmacMatch = Boolean(secret) && memberCodeForEmail(email, secret) === code;

  try {
    const existing = await findCustomerByEmail(email);
    if (existing) {
      const stored = storedCode(existing.metadata);
      const status = storedStatus(existing.metadata);
      if (stored && stored === code) {
        if (status === 'redeemed') {
          return { ok: false, error: MEMBER_CODE_REDEEMED, redeemed: true };
        }
        return { ok: true, code, customerId: existing.id };
      }
      if (stored && stored !== code) {
        return { ok: false, error: MEMBER_CODE_INVALID };
      }
      if (status === 'redeemed') {
        return { ok: false, error: MEMBER_CODE_REDEEMED, redeemed: true };
      }
    }
  } catch (error) {
    console.error('validateMemberCode Stripe lookup failed');
    if (!hmacMatch) throw error;
  }

  if (hmacMatch) {
    return { ok: true, code, customerId: null };
  }

  return { ok: false, error: MEMBER_CODE_INVALID };
}

export async function redeemMemberCode(input: {
  email: string;
  code: string;
  sessionId: string;
  name?: string;
}): Promise<{ ok: boolean; alreadyRedeemed: boolean }> {
  const email = normalizeEmail(sanitizePlainText(input.email, 120));
  const code = normalizeMemberCode(input.code);
  const sessionId = sanitizePlainText(input.sessionId, 80);
  if (!isStripeConfigured() || !code || !email || !sessionId.startsWith('cs_')) {
    return { ok: false, alreadyRedeemed: false };
  }

  const stripe = getStripe();
  const existing = await findCustomerByEmail(email);
  const previousSession = existing?.metadata[META_REDEEMED_SESSION] || '';
  const status = existing ? storedStatus(existing.metadata) : '';

  if (status === 'redeemed' && previousSession && previousSession !== sessionId) {
    return { ok: true, alreadyRedeemed: true };
  }
  if (status === 'redeemed' && previousSession === sessionId) {
    return { ok: true, alreadyRedeemed: false };
  }

  const payload = {
    email,
    name: sanitizePlainText(input.name || existing?.metadata[META_NAME] || '', 80) || undefined,
    metadata: {
      [META_CODE]: meta(code, 32),
      [META_STATUS]: 'redeemed',
      [META_REDEEMED_SESSION]: meta(sessionId, 80),
      [META_NAME]: meta(input.name || existing?.metadata[META_NAME] || '', 80),
    },
  };

  if (existing?.id) {
    await stripe.customers.update(existing.id, payload);
  } else {
    await stripe.customers.create(payload);
  }
  return { ok: true, alreadyRedeemed: false };
}
