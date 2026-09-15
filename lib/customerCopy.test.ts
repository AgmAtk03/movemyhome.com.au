import assert from 'node:assert/strict';
import test from 'node:test';
import { paidDepositEmailCopy } from './customerCopy';

test('paid screen never claims an email was sent until clientSent is true', () => {
  const pending = paidDepositEmailCopy({ email: 'sam@example.com', clientSent: null });
  assert.match(pending.body, /Check sam@example.com/);
  assert.doesNotMatch(pending.body, /We’ve sent/i);

  const sent = paidDepositEmailCopy({ email: 'sam@example.com', clientSent: true, firstName: 'Sam' });
  assert.match(sent.body, /Check sam@example.com for your booking confirmation/);

  const failed = paidDepositEmailCopy({ email: 'sam@example.com', clientSent: false });
  assert.match(failed.body, /couldn’t send the confirmation email/);
  assert.doesNotMatch(failed.body, /We’ve sent/);
});
