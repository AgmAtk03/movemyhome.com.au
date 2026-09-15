import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isStripeConfigured } from './_lib/env.js';
import { getStripe } from './_lib/stripeClient.js';
import { formatMoney } from '../shared/money.js';
import { PAYMENT_NOT_FOUND, PAYMENTS_OFF_SHORT } from '../lib/customerCopy.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    res.status(200).json({
      paid: confirmed,
      demoMode: false,
      status: session.status,
      paymentStatus: session.payment_status,
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '',
      currency: (session.currency || 'aud').toUpperCase(),
      customerName: meta.customer_name || '',
      customerEmail: session.customer_email || meta.customer_email || '',
      quoteTotal,
      deposit,
      balance,
      depositCents,
      quoteTotalLabel: quoteTotal ? formatMoney(quoteTotal) : '',
      depositLabel: deposit ? formatMoney(deposit) : formatMoney(depositCents / 100),
      balanceLabel: balance ? formatMoney(balance) : '',
      mailClient: meta.mail_client === 'sent',
      mailBusiness: meta.mail_biz === 'sent',
    });
  } catch {
    res.status(404).json({ paid: false, error: PAYMENT_NOT_FOUND });
  }
}
