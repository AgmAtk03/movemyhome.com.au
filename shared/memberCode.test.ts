import assert from 'node:assert/strict';
import test from 'node:test';
import { isMemberCodeFormat, memberCodeForEmail, normalizeEmail, normalizeMemberCode, randomMemberCode } from './memberCode';

test('member codes are STUDENT5- plus 8 unambiguous characters', () => {
  const code = randomMemberCode();
  assert.equal(isMemberCodeFormat(code), true);
  assert.match(code, /^STUDENT5-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
  assert.equal(isMemberCodeFormat('STUDENT5-OOOOOOOO'), false);
  assert.equal(isMemberCodeFormat('SAVE10-ABCDEFGH'), false);
  assert.equal(normalizeMemberCode(' student5-abcdefgh '), 'STUDENT5-ABCDEFGH');
});

test('HMAC member codes are stable per email and secret', () => {
  const a = memberCodeForEmail('sam@student.edu.au', 'test-secret');
  const b = memberCodeForEmail('Sam@Student.EDU.AU', 'test-secret');
  const c = memberCodeForEmail('sam@student.edu.au', 'other-secret');
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(isMemberCodeFormat(a), true);
  assert.equal(normalizeEmail(' Sam@Student.EDU.AU '), 'sam@student.edu.au');
});
