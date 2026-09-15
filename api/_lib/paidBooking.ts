import type Stripe from 'stripe';
import type { PriceBreakdown, QuoteSnapshot, QuoteState } from '../../types.js';
import { applyMemberDiscount, calculateFullQuote } from '../../shared/quoteCalc.js';
import { buildQuoteSnapshot } from '../../shared/snapshot.js';
import { formatMoney } from '../../shared/money.js';
import { BRAND_NAME } from '../../shared/rates.js';
import { companyConfig, isStripeConfigured } from './env.js';
import { getStripe, meta } from './stripeClient.js';
import { sendPaidBookingEmails, type EmailSendResult } from './emailjs.js';

export const MAIL_CLIENT_META = 'mail_client';
export const MAIL_BIZ_META = 'mail_biz';
export const MAIL_NOTE_META = 'mail_note';
export const MAIL_SENT_VALUE = 'sent';

type SessionMeta = Stripe.Metadata | Record<string, string>;

export interface FulfillEmailsResult extends EmailSendResult {
  alreadySent: boolean;
}

export class PaidEmailIncompleteError extends Error {
  result: FulfillEmailsResult;

  constructor(result: FulfillEmailsResult) {
    super(result.error || 'Paid, but email delivery failed — Stripe will retry.');
    this.name = 'PaidEmailIncompleteError';
    this.result = result;
  }
}

export type PaidCheckoutSession = {
  id: string;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  metadata?: SessionMeta | null;
};

export function mailAlreadySent(row: SessionMeta | null | undefined, key: string): boolean {
  return String(row?.[key] || '') === MAIL_SENT_VALUE;
}

function readMeta(row: SessionMeta, key: string): string {
  return String(row[key] || '');
}

/** Stripe Checkout Session metadata written by create-checkout-session. */
export function buildCheckoutSessionMetadata(input: {
  state: QuoteState;
  snapshot: QuoteSnapshot;
  breakdown: PriceBreakdown;
  dieselAudPerLitre: number | null;
}): Record<string, string> {
  const { state, snapshot, breakdown, dieselAudPerLitre } = input;
  const company = companyConfig();
  return {
    brand: meta(BRAND_NAME, 40),
    customer_name: meta(state.details.name, 80),
    customer_email: meta(state.details.email, 120),
    customer_phone: meta(state.details.phone, 24),
    quote_total: meta(String(breakdown.total), 24),
    quote_subtotal: meta(String(breakdown.subtotal), 24),
    discount_code: meta(breakdown.memberDiscountCode, 32),
    discount_amount: meta(String(breakdown.memberDiscount), 24),
    deposit: meta(String(breakdown.deposit), 24),
    balance: meta(String(breakdown.balance), 24),
    deposit_cents: meta(String(breakdown.depositCents), 12),
    currency: 'aud',
    move_date: meta(state.details.date, 16),
    move_time: meta(state.details.time, 8),
    service: meta(snapshot.serviceLabel, 80),
    vehicle: meta(snapshot.vehicleLabel, 40),
    crew: meta(snapshot.crewLabel, 40),
    pickup: meta(state.pickups.map((p) => p.address).join(' | '), 500),
    dropoff: meta(state.dropoffs.map((d) => d.address).join(' | '), 500),
    inventory: meta(snapshot.inventorySummary, 400),
    notes: meta(state.details.instructions || '', 400),
    distance_km: meta(state.distanceKm.toFixed(1), 16),
    travel_hrs: meta(state.travelTimeHrs.toFixed(1), 16),
    fuel: meta(String(breakdown.fuel), 24),
    fuel_status: meta(
      breakdown.fuelStatus === 'none' && state.distanceKm <= 0 ? 'tbc' : breakdown.fuelStatus,
      12,
    ),
    diesel_aud_per_l: meta(dieselAudPerLitre != null ? String(dieselAudPerLitre) : '', 16),
    move_type: meta(snapshot.moveType, 80),
    legal_name: meta(company.legalName, 80),
  };
}

export function stateFromPaidMetadata(row: SessionMeta): QuoteState {
  const pickup = readMeta(row, 'pickup');
  const dropoff = readMeta(row, 'dropoff');
  return {
    step: 6,
    serviceType: null,
    vehicle: readMeta(row, 'vehicle').toLowerCase().includes('truck') ? 'truck' : 'van',
    isManualTruckSelection: false,
    truckHours: 2,
    crewSize: 2,
    pickups: [{ id: 'p1', address: pickup, access: 'ground', hasLoadingDock: false }],
    dropoffs: [{ id: 'd1', address: dropoff, access: 'ground', hasLoadingDock: false }],
    inventory: { boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0 },
    details: {
      date: readMeta(row, 'move_date'),
      time: readMeta(row, 'move_time'),
      name: readMeta(row, 'customer_name'),
      email: readMeta(row, 'customer_email'),
      phone: readMeta(row, 'customer_phone'),
      instructions: readMeta(row, 'notes'),
      bedDisassembly: false,
      bedIsAssembled: true,
    },
    distanceKm: Number(readMeta(row, 'distance_km') || 0) || 0,
    travelTimeHrs: Number(readMeta(row, 'travel_hrs') || 0) || 0,
    isCBD: pickup.includes('2000') || dropoff.includes('2000'),
    isInterstate: readMeta(row, 'move_type').toLowerCase().includes('interstate'),
    discountCode: readMeta(row, 'discount_code'),
  };
}

export function snapshotFromPaidSession(
  state: QuoteState,
  row: SessionMeta,
  amountCents: number,
): QuoteSnapshot {
  let paidQuote = calculateFullQuote({
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
    dieselAudPerLitre: (() => {
      const n = Number(readMeta(row, 'diesel_aud_per_l') || 0);
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
  });
  if (state.discountCode) {
    paidQuote = applyMemberDiscount(paidQuote, state.discountCode);
  }
  return {
    ...buildQuoteSnapshot(state, paidQuote),
    serviceLabel: readMeta(row, 'service') || 'Moving help',
    vehicleLabel: readMeta(row, 'vehicle'),
    crewLabel: readMeta(row, 'crew'),
    inventorySummary: readMeta(row, 'inventory') || 'See notes',
    moveType: readMeta(row, 'move_type'),
    totalLabel: formatMoney(Number(readMeta(row, 'quote_total') || 0)),
    depositLabel: formatMoney(Number(readMeta(row, 'deposit') || (amountCents / 100))),
    balanceLabel: formatMoney(Number(readMeta(row, 'balance') || 0)),
  };
}

/**
 * Paid booking emails after Stripe confirms the deposit.
 * Rebuilds the job sheet from Checkout Session metadata (same fields
 * create-checkout-session stores) and sends the client + business templates.
 * Idempotent: Stripe metadata mail_client / mail_biz = sent so webhook +
 * verify-checkout-session do not double-send.
 */
export async function fulfillPaidBookingEmails(
  session: PaidCheckoutSession,
  options: { gapMs?: number } = {},
): Promise<FulfillEmailsResult> {
  const current = await refreshPaidSession(session);
  const row = current.metadata || {};
  const amountCents = current.amount_total ?? 0;
  const state = stateFromPaidMetadata(row);
  const snapshot = snapshotFromPaidSession(state, row, amountCents);
  const paymentIntent = typeof current.payment_intent === 'string'
    ? current.payment_intent
    : current.payment_intent?.id || '';
  const skipClient = mailAlreadySent(row, MAIL_CLIENT_META);
  const skipBusiness = mailAlreadySent(row, MAIL_BIZ_META);

  if (skipClient && skipBusiness) {
    return {
      clientSent: true,
      businessSent: true,
      skipped: false,
      alreadySent: true,
    };
  }

  const result = await sendPaidBookingEmails(state, snapshot, {
    sessionId: current.id,
    paymentIntentId: paymentIntent,
  }, {
    gapMs: options.gapMs,
    skipClient,
    skipBusiness,
  });

  const combined: FulfillEmailsResult = {
    ...result,
    clientSent: result.clientSent || skipClient,
    businessSent: result.businessSent || skipBusiness,
    alreadySent: false,
  };
  await recordMailStatus(current.id, combined);
  return combined;
}

export async function fulfillPaidBookingEmailsOrThrow(
  session: PaidCheckoutSession,
  options: { gapMs?: number } = {},
): Promise<FulfillEmailsResult> {
  const result = await fulfillPaidBookingEmails(session, options);
  if (!result.clientSent || !result.businessSent) {
    throw new PaidEmailIncompleteError(result);
  }
  return result;
}

async function refreshPaidSession(session: PaidCheckoutSession): Promise<PaidCheckoutSession> {
  if (!isStripeConfigured()) return session;
  try {
    return await getStripe().checkout.sessions.retrieve(session.id);
  } catch (error) {
    console.error('Could not re-fetch Checkout Session before email send; using in-memory copy', {
      sessionId: session.id,
      error: error instanceof Error ? error.message : 'retrieve failed',
    });
    return session;
  }
}

async function recordMailStatus(sessionId: string, result: EmailSendResult): Promise<void> {
  if (!isStripeConfigured()) return;
  const metadata: Record<string, string> = {};
  if (result.clientSent) metadata[MAIL_CLIENT_META] = MAIL_SENT_VALUE;
  if (result.businessSent) metadata[MAIL_BIZ_META] = MAIL_SENT_VALUE;
  if (result.error || result.skipped) {
    metadata[MAIL_NOTE_META] = String(result.error || 'EmailJS skipped or failed').slice(0, 500);
  } else if (result.clientSent && result.businessSent) {
    metadata[MAIL_NOTE_META] = 'client+business sent';
  }
  if (!Object.keys(metadata).length) return;
  try {
    await getStripe().checkout.sessions.update(sessionId, { metadata });
  } catch (error) {
    console.error('Could not write email status onto Stripe session metadata', {
      sessionId,
      error: error instanceof Error ? error.message : 'update failed',
    });
  }
}
