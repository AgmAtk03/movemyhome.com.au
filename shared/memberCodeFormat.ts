import { MEMBER_CODE_PREFIX } from './rates.js';

/** Crockford-like alphabet — no 0/O/1/I/L so codes are easy to read aloud. */
export const MEMBER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const MEMBER_CODE_TOKEN_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeMemberCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function isMemberCodeFormat(code: string): boolean {
  const value = normalizeMemberCode(code);
  return new RegExp(
    `^${MEMBER_CODE_PREFIX}-[${MEMBER_CODE_ALPHABET}]{${MEMBER_CODE_TOKEN_LENGTH}}$`
  ).test(value);
}
