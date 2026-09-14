import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { isStripeWebhookConfigured, stripeWebhookSecret } from './_lib/env';
import { getStripe } from './_lib/stripeClient';
import { sendPaidBookingEmails } from './_lib/emailjs';
import { QuoteState } from '../types';
import { calculateFullQuote } from '../shared/quoteCalc';
import { buildQuoteSnapshot } from '../shared/snapshot';
import { formatMoney } from '../shared/money';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function rawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function stateFromMetadata(meta: Stripe.Metadata): QuoteState {
  const pickup = String(meta.pickup || '');
  const dropoff = String(meta.dropoff || '');
  return {
    step: 6,
    serviceType: null,
    vehicle: String(meta.vehicle || '').toLowerCase().includes('truck') ? 'truck' : 'van',
    isManualTruckSelection: false,
    truckHours: 2,
    crewSize: 2,
    pickups: [{ id: 'p1', address: pickup, access: 'ground', hasLoadingDock: false }],
    dropoffs: [{ id: 'd1', address: dropoff, access: 'ground', hasLoadingDock: false }],
    inventory: { boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0 },
    details: {
      date: String(meta.move_date || ''),
      time: String(meta.move_time || ''),
      name: String(meta.customer_name || ''),
      email: String(meta.customer_email || ''),
      phone: String(meta.customer_phone || ''),
      instructions: String(meta.notes || ''),
      bedDisassembly: false,
      bedIsAssembled: true,
    },
    distanceKm: Number(meta.distance_km || 0) || 0,
    travelTimeHrs: Number(meta.travel_hrs || 0) || 0,
    isCBD: pickup.includes('2000') || dropoff.includes('2000'),
    isInterstate: String(meta.move_type || '').toLowerCase().includes('interstate'),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isStripeWebhookConfigured()) {
    res.status(500).json({ error: 'Webhook secret is not configured.' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing Stripe signature.' });
    return;
  }

  let event: Stripe.Event;
  try {
    const buf = await rawBody(req);
    event = getStripe().webhooks.constructEvent(buf, signature, stripeWebhookSecret());
  } catch {
    res.status(400).json({ error: 'Invalid Stripe signature.' });
    return;
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    res.status(200).json({ received: true, ignored: event.type });
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paid = session.payment_status === 'paid';
  if (!paid) {
    res.status(200).json({ received: true, ignored: 'not_paid' });
    return;
  }

  const meta = session.metadata || {};
  const amountCents = session.amount_total ?? 0;
  const expectedDepositCents = Number(meta.deposit_cents || 0);
  if (expectedDepositCents && amountCents !== expectedDepositCents) {
    console.error('Deposit amount mismatch on paid session', { sessionId: session.id });
  }

  const state = stateFromMetadata(meta);
  const snapshot = {
    ...buildQuoteSnapshot(state, calculateFullQuote({
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
    })),
    serviceLabel: String(meta.service || 'Moving help'),
    vehicleLabel: String(meta.vehicle || ''),
    crewLabel: String(meta.crew || ''),
    inventorySummary: String(meta.inventory || 'See notes'),
    moveType: String(meta.move_type || ''),
    totalLabel: formatMoney(Number(meta.quote_total || 0)),
    depositLabel: formatMoney(Number(meta.deposit || (amountCents / 100))),
    balanceLabel: formatMoney(Number(meta.balance || 0)),
  };

  const paymentIntent = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || '';

  try {
    await sendPaidBookingEmails(state, snapshot, {
      sessionId: session.id,
      paymentIntentId: paymentIntent,
    });
  } catch {
    res.status(500).json({ error: 'Paid, but email delivery failed — Stripe will retry.' });
    return;
  }

  res.status(200).json({ received: true, paid: true, sessionId: session.id });
}
