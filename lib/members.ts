import { isValidEmail, isValidPersonName } from './validation';
import { sanitizePlainText } from './sanitize';

export const MEMBERS_STORAGE_KEY = 'mhr_members';

export interface MemberSignup {
  name: string;
  email: string;
  savedAt: string;
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

export function saveMemberLocally(input: { name: string; email: string }): MemberSignup {
  const record: MemberSignup = {
    name: sanitizePlainText(input.name, 80),
    email: sanitizePlainText(input.email, 120).toLowerCase(),
    savedAt: new Date().toISOString(),
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
  message: string;
}

export async function submitMemberSignup(input: { name: string; email: string }): Promise<MemberSignupResult> {
  const record = saveMemberLocally(input);
  const localMessage =
    'We’ve saved your name and email on this device. Membership emails aren’t switched on yet — once they are, we’ll use this for your 5% off.';

  try {
    const response = await fetch('/api/member-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: record.name, email: record.email }),
    });

    if (response.status === 404) {
      return { ok: true, savedLocally: true, emailed: false, message: localMessage };
    }

    const json = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      emailed?: boolean;
      message?: string;
    };

    if (!response.ok) {
      return {
        ok: true,
        savedLocally: true,
        emailed: false,
        message: json.message || localMessage,
      };
    }

    return {
      ok: true,
      savedLocally: true,
      emailed: Boolean(json.emailed),
      message: json.message || (json.emailed
        ? 'You’re on the list — we’ll be in touch about your 5% off.'
        : localMessage),
    };
  } catch {
    return { ok: true, savedLocally: true, emailed: false, message: localMessage };
  }
}
