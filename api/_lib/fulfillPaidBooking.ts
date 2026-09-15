import type Stripe from 'stripe';
import { paidBookingEmailParams, sendPaidBookingEmails, type EmailSendResult } from './emailjs.js';
import {
  MAIL_BIZ_META,
  MAIL_CLIENT_META,
  MAIL_NOTE_META,
  MAIL_SENT_VALUE,
  bookingFromCheckoutSession,
  mailAlreadySent,
} from './paidSession.js';
import { getStripe } from './stripeClient.js';

export interface FulfillEmailsResult extends EmailSendResult {
  alreadySent: boolean;
  customerEmail: string;
  fallbackParams: Record<string, string>;
}

function paymentIntentId(session: Stripe.Checkout.Session): string {
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || '';
}

async function recordMailStatus(
  sessionId: string,
  result: EmailSendResult,
): Promise<void> {
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

export async function fulfillPaidBookingEmails(
  session: Stripe.Checkout.Session,
  options: { gapMs?: number } = {},
): Promise<FulfillEmailsResult> {
  let current = session;
  try {
    current = await getStripe().checkout.sessions.retrieve(session.id);
  } catch (error) {
    console.error('Could not re-fetch Checkout Session before email send; using in-memory copy', {
      sessionId: session.id,
      error: error instanceof Error ? error.message : 'retrieve failed',
    });
  }

  const { state, snapshot } = bookingFromCheckoutSession(current);
  const payment = {
    sessionId: current.id,
    paymentIntentId: paymentIntentId(current),
  };
  const fallbackParams = paidBookingEmailParams(state, snapshot, payment);
  const skipClient = mailAlreadySent(current.metadata, MAIL_CLIENT_META);
  const skipBusiness = mailAlreadySent(current.metadata, MAIL_BIZ_META);

  if (skipClient && skipBusiness) {
    return {
      clientSent: true,
      businessSent: true,
      skipped: false,
      alreadySent: true,
      customerEmail: state.details.email,
      fallbackParams,
    };
  }

  const result = await sendPaidBookingEmails(state, snapshot, payment, {
    gapMs: options.gapMs,
    skipClient,
    skipBusiness,
  });

  await recordMailStatus(current.id, {
    ...result,
    clientSent: result.clientSent || skipClient,
    businessSent: result.businessSent || skipBusiness,
  });

  return {
    ...result,
    clientSent: result.clientSent || skipClient,
    businessSent: result.businessSent || skipBusiness,
    alreadySent: false,
    customerEmail: state.details.email,
    fallbackParams,
  };
}

export class PaidEmailIncompleteError extends Error {
  result: FulfillEmailsResult;

  constructor(result: FulfillEmailsResult) {
    super(result.error || 'Paid, but email delivery failed — Stripe will retry.');
    this.name = 'PaidEmailIncompleteError';
    this.result = result;
  }
}

export async function fulfillPaidBookingEmailsOrThrow(
  session: Stripe.Checkout.Session,
  options: { gapMs?: number } = {},
): Promise<FulfillEmailsResult> {
  const result = await fulfillPaidBookingEmails(session, options);
  if (!result.clientSent || !result.businessSent) {
    throw new PaidEmailIncompleteError(result);
  }
  return result;
}
