import { isValidEmail, isValidPersonName } from './validation';
import { sanitizePlainText } from './sanitize';
import { fetchApi } from './api';
import { MEMBER_EMAILS_OFF, memberSignupMessage } from './customerCopy';

export const MEMBERS_STORAGE_KEY = 'mhr_members';

export interface MemberSignup {
  name: string;
  email: string;
  savedAt: string;
  discountCode?: string;
}

export interface MemberErrors {
  name?: string;
  email?: string;
}

export function validateMember(input: { name: string; email: string }): MemberErrors {
  const errors: MemberErrors = {};
  if (!isValidPersonName(input.name)) {
    errors.name = 'Please tell us your name (at least 2 letters).';
  }
  if (!isValidEmail(input.email)) {
    errors.email = 'That email doesn’t look quite right. Try again?';
  }
  return errors;
}

export function saveMemberLocally(input: { name: string; email: string; discountCode?: string }): MemberSignup {
  const record: MemberSignup = {
    name: sanitizePlainText(input.name, 80),
    email: sanitizePlainText(input.email, 120).toLowerCase(),
    savedAt: new Date().toISOString(),
    discountCode: sanitizePlainText(input.discountCode || '', 24),
  };

  let existing: MemberSignup[] = [];
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) existing = parsed.filter((row) => row && typeof row === 'object') as MemberSignup[];
    }
  } catch {
    existing = [];
  }

  const next = existing.filter((row) => row.email !== record.email);
  next.unshift(record);
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(next.slice(0, 50)));
  return record;
}

export interface MemberSignupResult {
  ok: boolean;
  savedLocally: boolean;
  emailed: boolean;
  customerEmailed: boolean;
  businessEmailed: boolean;
  discountCode: string;
  alreadyRedeemed: boolean;
  message: string;
}

export async function submitMemberSignup(input: { name: string; email: string }): Promise<MemberSignupResult> {
  const record = saveMemberLocally(input);

  const fallback = (message: string, extra: Partial<MemberSignupResult> = {}): MemberSignupResult => ({
    ok: true,
    savedLocally: true,
    emailed: false,
    customerEmailed: false,
    businessEmailed: false,
    discountCode: extra.discountCode || '',
    alreadyRedeemed: Boolean(extra.alreadyRedeemed),
    message,
    ...extra,
  });

  try {
    const response = await fetchApi('/api/member-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: record.name, email: record.email }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      emailed?: boolean;
      customerEmailed?: boolean;
      businessEmailed?: boolean;
      discountCode?: string;
      alreadyRedeemed?: boolean;
      message?: string;
    };

    const discountCode = sanitizePlainText(String(json.discountCode || ''), 24);
    if (discountCode) saveMemberLocally({ ...record, discountCode });

    if (!response.ok) {
      return fallback(json.message || MEMBER_EMAILS_OFF, { discountCode });
    }

    const customerEmailed = Boolean(json.customerEmailed);
    const businessEmailed = Boolean(json.businessEmailed);
    const alreadyRedeemed = Boolean(json.alreadyRedeemed);

    return {
      ok: true,
      savedLocally: true,
      emailed: Boolean(json.emailed) || (customerEmailed && businessEmailed),
      customerEmailed,
      businessEmailed,
      discountCode,
      alreadyRedeemed,
      message: json.message || memberSignupMessage({
        code: discountCode,
        customerEmailed,
        businessEmailed,
        alreadyRedeemed,
      }),
    };
  } catch {
    return fallback(MEMBER_EMAILS_OFF);
  }
}

export interface MemberCodeCheck {
  ok: boolean;
  code: string;
  rate: number;
  message: string;
}

export async function checkMemberDiscount(input: { email: string; code: string }): Promise<MemberCodeCheck> {
  const email = sanitizePlainText(input.email, 120);
  const code = sanitizePlainText(input.code, 24);
  try {
    const response = await fetchApi('/api/validate-member-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const json = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
      rate?: number;
      error?: string;
      message?: string;
    };
    if (!response.ok || !json.ok) {
      return {
        ok: false,
        code,
        rate: 0,
        message: json.error || json.message || 'That member code didn’t work.',
      };
    }
    return {
      ok: true,
      code: sanitizePlainText(String(json.code || code), 24),
      rate: typeof json.rate === 'number' ? json.rate : 0.05,
      message: json.message || 'Member 5% off applied.',
    };
  } catch {
    return { ok: false, code, rate: 0, message: 'We couldn’t check that code just now. Please try again.' };
  }
}
