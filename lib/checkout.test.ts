import assert from 'node:assert/strict';
import test from 'node:test';
import { checkoutResultFromJson } from './checkout';
import { PAYMENT_OPEN_ERROR, PAYMENT_START_ERROR, PAYMENTS_OFF_SHORT } from './customerCopy';

test('explicit demoMode JSON is the only payments-off success', () => {
  const result = checkoutResultFromJson(200, {
    demoMode: true,
    message: PAYMENTS_OFF_SHORT,
    quoted: { depositLabel: '$23.60' },
  });
  assert.equal(result.ok, true);
  assert.equal(result.demoMode, true);
  assert.equal(result.message, PAYMENTS_OFF_SHORT);
});

test('Stripe checkout URL is live payment, not demo', () => {
  const result = checkoutResultFromJson(200, {
    demoMode: false,
    url: 'https://checkout.stripe.com/c/pay/cs_live_test',
    sessionId: 'cs_live_test',
  });
  assert.equal(result.ok, true);
  assert.equal(result.demoMode, false);
  assert.equal(result.url, 'https://checkout.stripe.com/c/pay/cs_live_test');
});

test('HTTP errors are retryable failures, never demoMode', () => {
  const notFound = checkoutResultFromJson(404, { error: 'Not found' });
  assert.equal(notFound.ok, false);
  assert.equal(notFound.demoMode, false);

  const fail = checkoutResultFromJson(500, { error: 'We couldn’t start the payment. Please try again.' });
  assert.equal(fail.ok, false);
  assert.equal(fail.demoMode, false);
  assert.equal(fail.error, PAYMENT_START_ERROR);

  const htmlish = checkoutResultFromJson(200, '<!doctype html>');
  assert.equal(htmlish.ok, false);
  assert.equal(htmlish.demoMode, false);
  assert.equal(htmlish.error, PAYMENT_OPEN_ERROR);
});
