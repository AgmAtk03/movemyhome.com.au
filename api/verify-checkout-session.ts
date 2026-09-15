import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_lib/cors.js';
import { isStripeConfigured } from './_lib/env.js';
import { getStripe } from './_lib/stripeClient.js';
import { fulfillPaidBookingEmails } from './_lib/fulfillPaidBooking.js';
import { MAIL_BIZ_META, MAIL_CLIENT_META, MAIL_SENT_VALUE } from './_lib/paidSession.js';
import { formatMoney } from '../shared/money.js';
import { PAYMENT_NOT_FOUND, PAYMENTS_OFF_SHORT } from '../lib/customerCopy.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const sessionId = String(req.query.session_id || '').trim();
  if (!sessionId.startsWith('cs_')) {
    res.status(400).json({ paid: false, error: PAYMENT_NOT_FOUND });
    return;
  }

  if (!isStripeConfigured()) {
    res.status(200).json({
      paid: false,
      demoMode: true,
      clientSent: false,
      businessSent: false,
      message: PAYMENTS_OFF_SHORT,
    });
    return;
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const confirmed = session.payment_status === 'paid';
    const meta = session.metadata || {};
    const depositCents = session.amount_total ?? Number(meta.deposit_cents || 0);
    const quoteTotal = Number(meta.quote_total || 0);
    const deposit = Number(meta.deposit || (depositCents / 100));
    const balance = Number(meta.balance || 0);
    const customerEmail = session.customer_email || meta.customer_email || '';

    const body: Record<string, unknown> = {
      paid: confirmed,
      demoMode: false,
      status: session.status,
      paymentStatus: session.payment_status,
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '',
      currency: (session.currency || 'aud').toUpperCase(),
      customerName: meta.customer_name || '',
      customerEmail,
      quoteTotal,
      deposit,
      balance,
      depositCents,
      quoteTotalLabel: quoteTotal ? formatMoney(quoteTotal) : '',
      depositLabel: deposit ? formatMoney(deposit) : formatMoney(depositCents / 100),
      balanceLabel: balance ? formatMoney(balance) : '',
      mailClient: meta[MAIL_CLIENT_META] === MAIL_SENT_VALUE,
      mailBusiness: meta[MAIL_BIZ_META] === MAIL_SENT_VALUE,
      clientSent: meta[MAIL_CLIENT_META] === MAIL_SENT_VALUE,
      businessSent: meta[MAIL_BIZ_META] === MAIL_SENT_VALUE,
    };

    if (!confirmed) {
      res.status(200).json(body);
      return;
    }

    try {
      const result = await fulfillPaidBookingEmails(session);
      body.clientSent = result.clientSent;
      body.businessSent = result.businessSent;
      body.mailClient = result.clientSent;
      body.mailBusiness = result.businessSent;
      body.alreadySent = result.alreadySent;
      body.skipped = result.skipped;
      body.needClient = !result.clientSent;
      body.needBusiness = !result.businessSent;
      if (result.customerEmail) body.customerEmail = result.customerEmail;
      if (!result.clientSent || !result.businessSent) {
        body.fallbackParams = result.fallbackParams;
      }
      if (result.error) {
        console.error('verify-checkout-session paid, but email send incomplete', {
          sessionId: session.id,
          clientSent: result.clientSent,
          businessSent: result.businessSent,
          skipped: result.skipped,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('verify-checkout-session email backup failed after paid session', {
        sessionId: session.id,
        error: error instanceof Error ? error.message : 'send failed',
      });
      body.needClient = true;
      body.needBusiness = true;
    }

    res.status(200).json(body);
  } catch {
    res.status(404).json({ paid: false, error: PAYMENT_NOT_FOUND });
  }
}
