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

test('createCheckoutSession treats Netlify HTML 404 as a failure, not demoMode', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith('/')) {
      return new Response('<!doctype html>', { status: 404, headers: { 'content-type': 'text/html' } });
    }
    return new Response(JSON.stringify({
      demoMode: false,
      url: 'https://checkout.stripe.com/c/pay/cs_live_test',
      sessionId: 'cs_live_test',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  try {
    const { createCheckoutSession } = await import('./checkout');
    const result = await createCheckoutSession({
      step: 6,
      serviceType: 'item_delivery',
      vehicle: 'van',
      isManualTruckSelection: false,
      truckHours: 2,
      crewSize: 2,
      pickups: [{ id: 'p1', address: '1 Test St Sydney', access: 'ground', hasLoadingDock: false }],
      dropoffs: [{ id: 'd1', address: '2 Test St Sydney', access: 'ground', hasLoadingDock: false }],
      inventory: { boxes: 2, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0 },
      details: {
        date: '2026-09-20',
        time: '09:00',
        name: 'Sam Nguyen',
        email: 'sam@example.com',
        phone: '0410721370',
        instructions: '',
        bedDisassembly: false,
        bedIsAssembled: true,
      },
      distanceKm: 8,
      travelTimeHrs: 0.4,
      isCBD: false,
      isInterstate: false,
    });
    assert.equal(result.ok, true);
    assert.equal(result.demoMode, false);
    assert.equal(result.url, 'https://checkout.stripe.com/c/pay/cs_live_test');
  } finally {
    globalThis.fetch = orig;
  }
});
