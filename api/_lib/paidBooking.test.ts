import assert from 'node:assert/strict';
import test from 'node:test';
import type { QuoteState } from '../../types.js';
import { applyMemberDiscount, calculateFullQuote } from '../../shared/quoteCalc.js';
import { buildQuoteSnapshot } from '../../shared/snapshot.js';
import { buildCheckoutSessionMetadata, fulfillPaidBookingEmails, fulfillPaidBookingEmailsOrThrow } from './paidBooking.js';

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

const EMAIL_ENV = {
  EMAILJS_SERVICE_ID: 'service_live',
  EMAILJS_PUBLIC_KEY: 'public_live',
  EMAILJS_PRIVATE_KEY: 'private_live',
  EMAILJS_CLIENT_TEMPLATE_ID: 'template_client',
  EMAILJS_BUSINESS_TEMPLATE_ID: 'template_business',
  VITE_COMPANY_EMAIL: 'removalsmyhome@gmail.com',
  STRIPE_SECRET_KEY: undefined,
};

function samplePaidState(discountCode = ''): QuoteState {
  return {
    step: 6,
    serviceType: 'home_move',
    vehicle: 'van',
    isManualTruckSelection: false,
    truckHours: 2,
    crewSize: 2,
    pickups: [{ id: 'p1', address: '12 Illawarra Rd, Marrickville NSW 2204', access: 'ground', hasLoadingDock: false }],
    dropoffs: [{ id: 'd1', address: '88 Queen St, Newtown NSW 2042', access: 'ground', hasLoadingDock: false }],
    inventory: { boxes: 12, sofa: 1, mattress: 0, bed: 0, fridge: 1, tv: 0, washer: 0 },
    details: {
      date: '2026-10-02',
      time: '09:00',
      name: 'Jane Client',
      email: 'jane@example.com',
      phone: '0412 345 678',
      instructions: 'Ring the bell',
      bedDisassembly: false,
      bedIsAssembled: true,
    },
    distanceKm: 8,
    travelTimeHrs: 0.4,
    isCBD: false,
    isInterstate: false,
    discountCode,
  };
}

function quotedBreakdown(state: QuoteState) {
  let breakdown = calculateFullQuote({
    vehicle: state.vehicle,
    truckHours: state.truckHours,
    crewSize: state.crewSize,
    pickups: state.pickups,
    dropoffs: state.dropoffs,
    inventory: state.inventory,
    bedDisassembly: state.details.bedDisassembly,
    bedIsAssembled: state.details.bedIsAssembled,
    distanceKm: state.distanceKm,
    travelTimeHrs: state.travelTimeHrs,
    isInterstate: state.isInterstate,
  });
  if (state.discountCode) breakdown = applyMemberDiscount(breakdown, state.discountCode);
  return breakdown;
}

test('create-checkout-session metadata still stores full booking details', () => {
  const state = samplePaidState();
  const breakdown = quotedBreakdown(state);
  const snapshot = buildQuoteSnapshot(state, breakdown);
  const metadata = buildCheckoutSessionMetadata({
    state,
    snapshot,
    breakdown,
    dieselAudPerLitre: 1.95,
  });
  assert.equal(metadata.customer_name, 'Jane Client');
  assert.equal(metadata.customer_email, 'jane@example.com');
  assert.equal(metadata.customer_phone, '0412 345 678');
  assert.equal(metadata.move_date, '2026-10-02');
  assert.equal(metadata.move_time, '09:00');
  assert.match(metadata.pickup, /12 Illawarra Rd, Marrickville NSW 2204/);
  assert.match(metadata.dropoff, /88 Queen St, Newtown NSW 2042/);
  assert.match(metadata.inventory, /12× Boxes \/ bags/);
  assert.match(metadata.inventory, /Sofa/);
  assert.match(metadata.inventory, /Fridge/);
  assert.equal(metadata.notes, 'Ring the bell');
  assert.ok(Number(metadata.quote_total) > 0);
  assert.ok(Number(metadata.deposit) > 0);
  assert.ok(Number(metadata.balance) > 0);
  assert.equal(metadata.deposit_cents, String(breakdown.depositCents));
});

test('create-checkout-session + fulfillPaidBookingEmails still produce complete client + business booking emails', async () => {
  await withEnv(EMAIL_ENV, async () => {
    const calls: Array<Record<string, unknown>> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body || '{}')));
      return new Response('OK', { status: 200 });
    }) as typeof fetch;
    try {
      const state = samplePaidState();
      const breakdown = quotedBreakdown(state);
      const snapshot = buildQuoteSnapshot(state, breakdown);
      const metadata = buildCheckoutSessionMetadata({
        state,
        snapshot,
        breakdown,
        dieselAudPerLitre: 1.95,
      });
      const result = await fulfillPaidBookingEmails({
        id: 'cs_test_paid',
        payment_intent: 'pi_test_paid',
        amount_total: breakdown.depositCents,
        metadata,
      }, { gapMs: 0 });
      assert.equal(result.skipped, false);
      assert.equal(result.businessSent, true);
      assert.equal(result.clientSent, true);
      assert.equal(calls.length, 2);
      const business = calls[0] as { template_id: string; template_params: Record<string, string> };
      const client = calls[1] as { template_id: string; template_params: Record<string, string> };
      assert.equal(business.template_id, 'template_business');
      assert.equal(client.template_id, 'template_client');
      assert.equal(business.template_params.email_kind, 'business');
      assert.equal(client.template_params.email_kind, 'client');
      assert.equal(business.template_params.to_email, 'removalsmyhome@gmail.com');
      assert.equal(client.template_params.to_email, 'jane@example.com');
      assert.equal(business.template_params.email_subject, 'New booking — deposit paid');
      assert.equal(client.template_params.email_subject, 'Your move is booked — My Home Removals');
      assert.equal(business.template_params.payment_status, 'deposit_paid');
      assert.equal(client.template_params.payment_status, 'deposit_paid');
      assert.equal(business.template_params.customer_name, 'Jane Client');
      assert.equal(client.template_params.customer_name, 'Jane Client');
      assert.equal(business.template_params.user_email, 'jane@example.com');
      assert.equal(business.template_params.user_phone, '0412 345 678');
      assert.match(business.template_params.move_date, /2 Oct 2026/);
      assert.match(business.template_params.route, /12 Illawarra Rd, Marrickville NSW 2204/);
      assert.match(business.template_params.route, /88 Queen St, Newtown NSW 2042/);
      assert.match(business.template_params.inventory, /12× Boxes \/ bags/);
      assert.match(business.template_params.inventory, /Sofa/);
      assert.match(business.template_params.total_quote, /^\$/);
      assert.match(business.template_params.deposit_amount, /^\$/);
      assert.match(business.template_params.balance_amount, /^\$/);
      assert.match(business.template_params.job_details, /NEW BOOKING/);
      assert.match(business.template_params.job_details, /Ring the bell/);
      assert.match(business.template_params.job_details, /Stripe session: cs_test_paid/);
      assert.match(business.template_params.job_details, /Payment status: deposit_paid/);
      assert.equal(business.template_params.stripe_session_id, 'cs_test_paid');
      assert.match(client.template_params.client_summary, /12 Illawarra Rd, Marrickville NSW 2204/);
      assert.match(client.template_params.client_summary, /88 Queen St, Newtown NSW 2042/);
      assert.match(client.template_params.client_summary, /Deposit paid/);
      assert.match(client.template_params.client_summary, /Balance due on the day/);
      assert.equal(client.template_params.client_summary.includes('cs_test_paid'), false);
      assert.equal(client.template_params.client_summary.includes('Ring the bell'), false);
      assert.equal(client.template_params.stripe_session_id, '');
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('fulfillPaidBookingEmails is idempotent when mail_client and mail_biz are already sent', async () => {
  await withEnv(EMAIL_ENV, async () => {
    const calls: Array<Record<string, unknown>> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body || '{}')));
      return new Response('OK', { status: 200 });
    }) as typeof fetch;
    try {
      const state = samplePaidState();
      const breakdown = quotedBreakdown(state);
      const snapshot = buildQuoteSnapshot(state, breakdown);
      const metadata = {
        ...buildCheckoutSessionMetadata({
          state,
          snapshot,
          breakdown,
          dieselAudPerLitre: 1.95,
        }),
        mail_client: 'sent',
        mail_biz: 'sent',
      };
      const result = await fulfillPaidBookingEmails({
        id: 'cs_test_paid',
        payment_intent: 'pi_test_paid',
        amount_total: breakdown.depositCents,
        metadata,
      }, { gapMs: 0 });
      assert.equal(result.alreadySent, true);
      assert.equal(result.clientSent, true);
      assert.equal(result.businessSent, true);
      assert.equal(calls.length, 0);
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('fulfillPaidBookingEmailsOrThrow fails when EmailJS is not configured', async () => {
  await withEnv({
    ...EMAIL_ENV,
    EMAILJS_SERVICE_ID: undefined,
    EMAILJS_PUBLIC_KEY: undefined,
    EMAILJS_CLIENT_TEMPLATE_ID: undefined,
    EMAILJS_BUSINESS_TEMPLATE_ID: undefined,
  }, async () => {
    const state = samplePaidState();
    const breakdown = quotedBreakdown(state);
    const snapshot = buildQuoteSnapshot(state, breakdown);
    const metadata = buildCheckoutSessionMetadata({
      state,
      snapshot,
      breakdown,
      dieselAudPerLitre: null,
    });
    await assert.rejects(
      () => fulfillPaidBookingEmailsOrThrow({
        id: 'cs_test_paid',
        payment_intent: 'pi_test_paid',
        amount_total: breakdown.depositCents,
        metadata,
      }, { gapMs: 0 }),
      /email delivery failed|not configured/i,
    );
  });
});
