import assert from 'node:assert/strict';
import test from 'node:test';
import { memberCodeForEmail } from '../../shared/memberCode';
import { MEMBER_CODE_FORMAT, MEMBER_CODE_INVALID, memberSignupMessage } from '../../lib/customerCopy';

const SECRET = 'unit-test-member-secret';

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>): Promise<void> {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return fn().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('HMAC issue + validate works without Stripe and rejects the wrong email', async () => {
  await withEnv({
    MEMBER_CODE_SECRET: SECRET,
    STRIPE_SECRET_KEY: '',
  }, async () => {
    const { issueMemberCode, validateMemberCode } = await import('./memberCodes');
    const issued = await issueMemberCode({ name: 'Sam Nguyen', email: 'sam@student.edu.au' });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const expected = memberCodeForEmail('sam@student.edu.au', SECRET);
    assert.equal(issued.code, expected);
    const ok = await validateMemberCode({ email: 'sam@student.edu.au', code: issued.code });
    assert.equal(ok.ok, true);
    const wrongPerson = await validateMemberCode({ email: 'other@student.edu.au', code: issued.code });
    assert.equal(wrongPerson.ok, false);
    if (!wrongPerson.ok) assert.equal(wrongPerson.error, MEMBER_CODE_INVALID);
    const junk = await validateMemberCode({ email: 'sam@student.edu.au', code: 'not-a-code' });
    assert.equal(junk.ok, false);
    if (!junk.ok) assert.equal(junk.error, MEMBER_CODE_FORMAT);
  });
});

test('signup copy is honest about partial email sends', () => {
  assert.match(memberSignupMessage({
    code: 'STUDENT5-ABCDEFGH',
    customerEmailed: true,
    businessEmailed: true,
  }), /STUDENT5-ABCDEFGH/);
  assert.match(memberSignupMessage({
    code: 'STUDENT5-ABCDEFGH',
    customerEmailed: true,
    businessEmailed: false,
  }), /couldn’t notify the office/);
  assert.match(memberSignupMessage({
    code: 'STUDENT5-ABCDEFGH',
    customerEmailed: false,
    businessEmailed: true,
  }), /couldn’t email you/);
  assert.match(memberSignupMessage({
    code: 'STUDENT5-ABCDEFGH',
    customerEmailed: false,
    businessEmailed: false,
  }), /couldn’t send the membership emails/);
});
