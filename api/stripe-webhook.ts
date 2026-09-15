import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { isStripeWebhookConfigured, stripeWebhookSecret } from './_lib/env.js';
import { getStripe } from './_lib/stripeClient.js';
import { fulfillPaidBookingEmailsOrThrow, PaidEmailIncompleteError } from './_lib/fulfillPaidBooking.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isStripeWebhookConfigured()) {
    console.error('Stripe webhook secret is not configured (STRIPE_WEBHOOK_SECRET). Paid emails cannot run from this endpoint.');
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
  } catch (error) {
    console.error('Invalid Stripe webhook signature', {
      error: error instanceof Error ? error.message : 'constructEvent failed',
    });
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

  try {
    const result = await fulfillPaidBookingEmailsOrThrow(session);
    res.status(200).json({
      received: true,
      paid: true,
      sessionId: session.id,
      clientSent: result.clientSent,
      businessSent: result.businessSent,
    });
  } catch (error) {
    const result = error instanceof PaidEmailIncompleteError ? error.result : null;
    console.error('Paid, but email delivery failed — Stripe will retry.', {
      sessionId: session.id,
      clientSent: result?.clientSent,
      businessSent: result?.businessSent,
      skipped: result?.skipped,
      error: error instanceof Error ? error.message : 'email failed',
    });
    res.status(500).json({ error: 'Paid, but email delivery failed — Stripe will retry.' });
  }
}
