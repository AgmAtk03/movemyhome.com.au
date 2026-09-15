import { createHmac, randomBytes } from 'node:crypto';
import { MEMBER_CODE_PREFIX } from './rates.js';
import {
  MEMBER_CODE_ALPHABET,
  MEMBER_CODE_TOKEN_LENGTH,
  isMemberCodeFormat,
  normalizeEmail,
  normalizeMemberCode,
} from './memberCodeFormat.js';

export {
  MEMBER_CODE_ALPHABET,
  MEMBER_CODE_TOKEN_LENGTH,
  isMemberCodeFormat,
  normalizeEmail,
  normalizeMemberCode,
};

function tokenFromBytes(bytes: Uint8Array): string {
  let token = '';
  for (let i = 0; token.length < MEMBER_CODE_TOKEN_LENGTH; i += 1) {
    token += MEMBER_CODE_ALPHABET[bytes[i % bytes.length] % MEMBER_CODE_ALPHABET.length];
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
  return `${MEMBER_CODE_PREFIX}-${tokenFromBytes(randomBytes(MEMBER_CODE_TOKEN_LENGTH + 4))}`;
}
