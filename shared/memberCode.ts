import { createHmac, randomBytes } from 'node:crypto';
import { MEMBER_CODE_PREFIX } from './rates.js';

/** Crockford-like alphabet — no 0/O/1/I/L so codes are easy to read aloud. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TOKEN_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeMemberCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function isMemberCodeFormat(code: string): boolean {
  const value = normalizeMemberCode(code);
  return new RegExp(`^${MEMBER_CODE_PREFIX}-[${ALPHABET}]{${TOKEN_LENGTH}}$`).test(value);
}

function tokenFromBytes(bytes: Uint8Array): string {
  let token = '';
  for (let i = 0; token.length < TOKEN_LENGTH; i += 1) {
    token += ALPHABET[bytes[i % bytes.length] % ALPHABET.length];
  }
  return token;
}

/** Deterministic per-email code. Same email + secret always yields the same STUDENT5-XXXXXXXX. */
export function memberCodeForEmail(email: string, secret: string): string {
  const digest = createHmac('sha256', secret)
    .update(`mhr-student5-v1:${normalizeEmail(email)}`)
    .digest();
  return `${MEMBER_CODE_PREFIX}-${tokenFromBytes(digest)}`;
}

export function randomMemberCode(): string {
  return `${MEMBER_CODE_PREFIX}-${tokenFromBytes(randomBytes(TOKEN_LENGTH + 4))}`;
}
