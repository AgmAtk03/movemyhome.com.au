import assert from 'node:assert/strict';
import test from 'node:test';
import { paidDepositEmailCopy } from './customerCopy';

test('paid screen always tells the customer to check the email they entered', () => {
  const pending = paidDepositEmailCopy({ email: 'sam@example.com', clientSent: null });
  assert.match(pending.body, /Check sam@example.com for your booking confirmation/);
  assert.doesNotMatch(pending.body, /We’ve sent/i);

  const sent = paidDepositEmailCopy({ email: 'sam@example.com', clientSent: true, firstName: 'Sam' });
  assert.match(sent.body, /Thanks Sam/);
  assert.match(sent.body, /Check sam@example.com for your booking confirmation/);
  assert.doesNotMatch(sent.body, /We’ve sent/i);

  const failed = paidDepositEmailCopy({ email: 'sam@example.com', clientSent: false });
  assert.match(failed.body, /Check sam@example.com for your booking confirmation/);
  assert.doesNotMatch(failed.body, /We’ve sent/);
});
