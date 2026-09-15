import assert from 'node:assert/strict';
import test from 'node:test';
import type { QuoteState } from '../../types.js';
import { calculateFullQuote } from '../../shared/quoteCalc.js';
import { buildQuoteSnapshot } from '../../shared/snapshot.js';

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
};

function samplePaidState(): QuoteState {
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
    discountCode: '',
  };
}

function assertCompletePaidBookingParams(params: Record<string, string>, kind: 'business' | 'client') {
  assert.equal(params.email_kind, kind);
  assert.equal(params.payment_status, 'deposit_paid');
  assert.equal(params.customer_name, 'Jane Client');
  assert.equal(params.user_email, 'jane@example.com');
  assert.equal(params.user_phone, '0412 345 678');
  assert.match(params.move_date, /2 Oct 2026/);
  assert.match(params.move_time, /9:00 am/);
  assert.match(params.route, /12 Illawarra Rd, Marrickville NSW 2204/);
  assert.match(params.route, /88 Queen St, Newtown NSW 2042/);
  assert.match(params.inventory, /12× Boxes \/ bags/);
  assert.match(params.inventory, /Sofa/);
  assert.match(params.inventory, /Fridge/);
  assert.match(params.total_quote, /^\$/);
  assert.match(params.deposit_amount, /^\$/);
  assert.match(params.balance_amount, /^\$/);
  assert.match(params.job_details, /NEW BOOKING/);
  assert.match(params.job_details, /Jane Client/);
  assert.match(params.job_details, /jane@example.com/);
  assert.match(params.job_details, /0412 345 678/);
  assert.match(params.job_details, /Marrickville/);
  assert.match(params.job_details, /Newtown/);
  assert.match(params.job_details, /Ring the bell/);
  assert.notEqual(params.vehicle, '');
  assert.notEqual(params.service_type, '');
}

test('member signup reuses client then business templates, not a third member template', async () => {
  await withEnv(EMAIL_ENV, async () => {
    const calls: Array<Record<string, unknown>> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body || '{}')));
      return new Response('OK', { status: 200 });
    }) as typeof fetch;
    try {
      const { sendMemberDiscountEmails } = await import('./emailjs');
      const result = await sendMemberDiscountEmails({
        name: 'Sam Nguyen',
        email: 'sam@student.edu.au',
        discountCode: 'STUDENT5-ABCDEFGH',
        gapMs: 0,
      });
      assert.equal(result.skipped, false);
      assert.equal(result.customerSent, true);
      assert.equal(result.businessSent, true);
      assert.equal(calls.length, 2);
      const first = calls[0] as {
        service_id?: string;
        user_id?: string;
        template_id: string;
        accessToken?: string;
        template_params: Record<string, string>;
      };
      const second = calls[1] as {
        service_id?: string;
        template_id: string;
        accessToken?: string;
        template_params: Record<string, string>;
      };
      assert.equal(first.template_id, 'template_client');
      assert.equal(second.template_id, 'template_business');
      assert.equal(first.service_id, 'service_live');
      assert.equal(second.service_id, 'service_live');
      assert.equal(first.user_id, 'public_live');
      assert.equal(first.accessToken, 'private_live');
      assert.equal(second.accessToken, 'private_live');
      assert.equal(first.template_params.to_email, 'sam@student.edu.au');
      assert.equal(first.template_params.email_kind, 'member');
      assert.equal(first.template_params.payment_status, '');
      assert.equal(first.template_params.discount_code, 'STUDENT5-ABCDEFGH');
      assert.equal(first.template_params.customer_name, 'Sam Nguyen');
      assert.match(first.template_params.job_details, /STUDENT5-ABCDEFGH/);
      assert.match(first.template_params.job_details, /not a booking/i);
      assert.equal(second.template_params.to_email, 'removalsmyhome@gmail.com');
      assert.equal(second.template_params.email_kind, 'member');
      assert.equal(second.template_params.reply_to, 'sam@student.edu.au');
      assert.equal(second.template_params.user_email, 'sam@student.edu.au');
      assert.match(second.template_params.job_details, /STUDENT5-ABCDEFGH/);
      assert.equal(calls.some((row) => String((row as { template_id?: string }).template_id || '').includes('member')), false);
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('member emails fill booking {{}} fields without inventing fake job data', async () => {
  await withEnv(EMAIL_ENV, async () => {
    const calls: Array<Record<string, unknown>> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body || '{}')));
      return new Response('OK', { status: 200 });
    }) as typeof fetch;
    try {
      const { sendMemberDiscountEmails } = await import('./emailjs');
      await sendMemberDiscountEmails({
        name: 'Sam Nguyen',
        email: 'sam@student.edu.au',
        discountCode: 'STUDENT5-ABCDEFGH',
        gapMs: 0,
      });
      for (const row of calls) {
        const params = (row as { template_params: Record<string, string> }).template_params;
        assert.equal(params.email_kind, 'member');
        assert.notEqual(params.payment_status, 'deposit_paid');
        assert.equal(params.move_date, '');
        assert.equal(params.move_time, '');
        assert.equal(params.vehicle, '');
        assert.equal(params.inventory, '');
        assert.equal(params.route, '');
        assert.equal(params.total_quote, '');
        assert.equal(params.deposit_amount, '');
        assert.equal(params.balance_amount, '');
        assert.equal(params.service_type, '');
        assert.notEqual(params.move_date, 'First move');
        assert.notEqual(params.vehicle, 'Member offer');
        assert.notEqual(params.inventory, 'Code STUDENT5-ABCDEFGH');
      }
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('member signup reports partial send when the office email fails', async () => {
  await withEnv(EMAIL_ENV, async () => {
    let n = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => {
      n += 1;
      if (n === 1) return new Response('OK', { status: 200 });
      return new Response('fail', { status: 500 });
    }) as typeof fetch;
    try {
      const { sendMemberDiscountEmails } = await import('./emailjs');
      const result = await sendMemberDiscountEmails({
        name: 'Sam Nguyen',
        email: 'sam@student.edu.au',
        discountCode: 'STUDENT5-ABCDEFGH',
        gapMs: 0,
      });
      assert.equal(result.customerSent, true);
      assert.equal(result.businessSent, false);
      assert.match(String(result.error || ''), /EmailJS 500/);
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('sendPaidBookingEmails still sends complete client + business booking emails', async () => {
  await withEnv(EMAIL_ENV, async () => {
    const calls: Array<Record<string, unknown>> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body || '{}')));
      return new Response('OK', { status: 200 });
    }) as typeof fetch;
    try {
      const { sendPaidBookingEmails } = await import('./emailjs');
      const state = samplePaidState();
      const breakdown = calculateFullQuote({
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
      const snapshot = buildQuoteSnapshot(state, breakdown);
      const result = await sendPaidBookingEmails(state, snapshot, {
        sessionId: 'cs_test_paid',
        paymentIntentId: 'pi_test_paid',
      }, { gapMs: 0 });
      assert.equal(result.skipped, false);
      assert.equal(result.businessSent, true);
      assert.equal(result.clientSent, true);
      assert.equal(calls.length, 2);
      const business = calls[0] as { template_id: string; template_params: Record<string, string> };
      const client = calls[1] as { template_id: string; template_params: Record<string, string> };
      assert.equal(business.template_id, 'template_business');
      assert.equal(client.template_id, 'template_client');
      assert.equal((business as { service_id?: string }).service_id, 'service_live');
      assert.equal((business as { accessToken?: string }).accessToken, 'private_live');
      assert.equal((client as { accessToken?: string }).accessToken, 'private_live');
      assert.equal(business.template_params.to_email, 'removalsmyhome@gmail.com');
      assert.equal(client.template_params.to_email, 'jane@example.com');
      assertCompletePaidBookingParams(business.template_params, 'business');
      assertCompletePaidBookingParams(client.template_params, 'client');
      assert.equal(business.template_params.stripe_session_id, 'cs_test_paid');
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('sendPaidBookingEmails skip flags do not resend a side already marked sent', async () => {
  await withEnv(EMAIL_ENV, async () => {
    const calls: Array<Record<string, unknown>> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body || '{}')));
      return new Response('OK', { status: 200 });
    }) as typeof fetch;
    try {
      const { sendPaidBookingEmails } = await import('./emailjs');
      const state = samplePaidState();
      const breakdown = calculateFullQuote({
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
      const snapshot = buildQuoteSnapshot(state, breakdown);
      const result = await sendPaidBookingEmails(state, snapshot, {
        sessionId: 'cs_test_paid',
        paymentIntentId: 'pi_test_paid',
      }, { gapMs: 0, skipBusiness: true });
      assert.equal(result.businessSent, true);
      assert.equal(result.clientSent, true);
      assert.equal(calls.length, 1);
      assert.equal((calls[0] as { template_id: string }).template_id, 'template_client');
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('EmailJS failure hint includes status and body without secrets', async () => {
  await withEnv(EMAIL_ENV, async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => new Response(
      'API calls are disabled for non-browser applications',
      { status: 403 },
    )) as typeof fetch;
    try {
      const { sendMemberDiscountEmails, sanitizeEmailJsHint } = await import('./emailjs');
      const result = await sendMemberDiscountEmails({
        name: 'Sam Nguyen',
        email: 'sam@student.edu.au',
        discountCode: 'STUDENT5-ABCDEFGH',
        gapMs: 0,
      });
      assert.equal(result.customerSent, false);
      assert.equal(result.businessSent, false);
      assert.match(String(result.error || ''), /403/);
      assert.match(String(result.error || ''), /non-browser/i);
      assert.match(String(result.error || ''), /Allow EmailJS API/i);
      assert.equal(String(result.error || '').includes('private_live'), false);
      const redacted = sanitizeEmailJsHint(400, 'accessToken=supersecretvalue123 The user_id parameter is required');
      assert.match(redacted, /400/);
      assert.equal(redacted.includes('supersecretvalue123'), false);
    } finally {
      globalThis.fetch = orig;
    }
  });
});
