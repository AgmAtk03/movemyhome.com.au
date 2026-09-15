import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { sendPaidBookingEmails } from './emailjs.js';
import { paidBookingEmailParams } from './emailjs.js';
import { buildQuoteSnapshot } from '../../shared/snapshot.js';
import { calculateFullQuote } from '../../shared/quoteCalc.js';
import { BOOKINGS_INBOX } from '../../shared/rates.js';
import type { QuoteState } from '../../types.js';

const KEYS = [
  'VITE_COMPANY_EMAIL',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_CLIENT_TEMPLATE_ID',
  'EMAILJS_BUSINESS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
  'VITE_EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_CLIENT_TEMPLATE_ID',
  'VITE_EMAILJS_BUSINESS_TEMPLATE_ID',
  'VITE_EMAILJS_PUBLIC_KEY',
  'VITE_EMAILJS_PRIVATE_KEY',
];

const originalFetch = globalThis.fetch;

function sampleState(): QuoteState {
  return {
    step: 6,
    serviceType: 'item_delivery',
    vehicle: 'van',
    isManualTruckSelection: false,
    truckHours: 2,
    crewSize: 2,
    pickups: [{ id: 'p1', address: '10 Pickup Rd, Randwick NSW 2031', access: 'ground', hasLoadingDock: false }],
    dropoffs: [{ id: 'd1', address: '20 Dropoff Ave, Bondi NSW 2026', access: 'floor1', hasLoadingDock: false }],
    inventory: { boxes: 2, sofa: 0, mattress: 1, bed: 0, fridge: 0, tv: 1, washer: 0 },
    details: {
      date: '2026-09-22',
      time: '09:30',
      name: 'Jamie Booker',
      email: 'jamie@example.com',
      phone: '0410721370',
      instructions: 'Narrow driveway',
      bedDisassembly: false,
      bedIsAssembled: true,
    },
    distanceKm: 8,
    travelTimeHrs: 0.3,
    isCBD: false,
    isInterstate: false,
  };
}

function snapshotFor(state: QuoteState) {
  return buildQuoteSnapshot(state, calculateFullQuote({
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
    dieselAudPerLitre: null,
  }));
}

beforeEach(() => {
  for (const key of KEYS) delete process.env[key];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of KEYS) delete process.env[key];
});

test('skips already-sent client and business templates without calling EmailJS', async () => {
  process.env.EMAILJS_SERVICE_ID = 'service_abc';
  process.env.EMAILJS_CLIENT_TEMPLATE_ID = 'template_client';
  process.env.EMAILJS_BUSINESS_TEMPLATE_ID = 'template_biz';
  process.env.EMAILJS_PUBLIC_KEY = 'public_key';
  process.env.EMAILJS_PRIVATE_KEY = 'private_key';
  let fetches = 0;
  globalThis.fetch = (async () => {
    fetches += 1;
    return new Response('OK', { status: 200 });
  }) as typeof fetch;
  const state = sampleState();
  const result = await sendPaidBookingEmails(state, snapshotFor(state), {
    sessionId: 'cs_test_dedupe',
    paymentIntentId: 'pi_test',
  }, { gapMs: 0, skipClient: true, skipBusiness: true });
  assert.equal(fetches, 0);
  assert.equal(result.clientSent, true);
  assert.equal(result.businessSent, true);
});

test('skips loudly when EmailJS env is missing instead of pretending both emails sent', async () => {
  const state = sampleState();
  const result = await sendPaidBookingEmails(state, snapshotFor(state), {
    sessionId: 'cs_test_skip',
    paymentIntentId: 'pi_test',
  }, { gapMs: 0 });
  assert.equal(result.skipped, true);
  assert.equal(result.clientSent, false);
  assert.equal(result.businessSent, false);
  assert.match(String(result.error), /not configured/i);
});

test('sends business job sheet then customer confirmation, with office inbox and full job details', async () => {
  process.env.EMAILJS_SERVICE_ID = 'service_abc';
  process.env.EMAILJS_CLIENT_TEMPLATE_ID = 'template_client';
  process.env.EMAILJS_BUSINESS_TEMPLATE_ID = 'template_biz';
  process.env.EMAILJS_PUBLIC_KEY = 'public_key';
  process.env.EMAILJS_PRIVATE_KEY = 'private_key';
  process.env.VITE_COMPANY_EMAIL = BOOKINGS_INBOX;

  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
    calls.push({ url: String(input), body });
    return new Response('OK', { status: 200 });
  }) as typeof fetch;

  const state = sampleState();
  const snapshot = snapshotFor(state);
  const result = await sendPaidBookingEmails(state, snapshot, {
    sessionId: 'cs_test_paid',
    paymentIntentId: 'pi_test_paid',
  }, { gapMs: 0 });

  assert.equal(result.skipped, false);
  assert.equal(result.clientSent, true);
  assert.equal(result.businessSent, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body.template_id, 'template_biz');
  assert.equal(calls[1].body.template_id, 'template_client');
  assert.equal(calls[0].body.accessToken, 'private_key');

  const businessParams = calls[0].body.template_params as Record<string, string>;
  const clientParams = calls[1].body.template_params as Record<string, string>;
  assert.equal(businessParams.to_email, BOOKINGS_INBOX);
  assert.equal(clientParams.to_email, 'jamie@example.com');
  assert.match(businessParams.job_details, /10 Pickup Rd/);
  assert.match(businessParams.job_details, /20 Dropoff Ave/);
  assert.match(businessParams.job_details, /Boxes/);
  assert.match(businessParams.job_details, /Mattress/);
  assert.match(businessParams.job_details, /0410721370/);
  assert.match(businessParams.job_details, /Deposit paid/);
  assert.equal(businessParams.email_kind, 'business');
  assert.equal(clientParams.email_kind, 'client');
});

test('template params include pickup, inventory and do not use a placeholder office email', () => {
  process.env.VITE_COMPANY_EMAIL = '';
  const state = sampleState();
  const params = paidBookingEmailParams(state, snapshotFor(state), {
    sessionId: 'cs_test_params',
    paymentIntentId: 'pi_x',
  });
  assert.equal(params.company_email, BOOKINGS_INBOX);
  assert.match(params.pickup, /Pickup Rd/);
  assert.match(params.inventory, /Mattress/);
  assert.match(params.job_details, /NEW BOOKING/);
});
