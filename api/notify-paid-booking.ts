import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_lib/cors.js';
import { isStripeConfigured } from './_lib/env.js';
import { getStripe } from './_lib/stripeClient.js';
import { fulfillPaidBookingEmails } from './_lib/fulfillPaidBooking.js';
import { MAIL_BIZ_META, MAIL_CLIENT_META, MAIL_SENT_VALUE } from './_lib/paidSession.js';
import { PAYMENT_NOT_FOUND, PAYMENTS_OFF_SHORT } from '../lib/customerCopy.js';

function sessionIdFrom(req: VercelRequest): string {
  const queryId = String(req.query.session_id || '').trim();
  if (queryId.startsWith('cs_')) return queryId;
  const body = (req.body && typeof req.body === 'object') ? req.body as { session_id?: string } : {};
  const bodyId = String(body.session_id || '').trim();
  return bodyId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const sessionId = sessionIdFrom(req);
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
    const paid = session.payment_status === 'paid';
    if (!paid) {
      res.status(200).json({
        paid: false,
        sessionId: session.id,
        clientSent: false,
        businessSent: false,
      });
      return;
    }

    try {
      const result = await fulfillPaidBookingEmails(session);
      res.status(200).json({
        paid: true,
        sessionId: session.id,
        customerEmail: result.customerEmail,
        clientSent: result.clientSent,
        businessSent: result.businessSent,
        skipped: result.skipped,
        alreadySent: result.alreadySent,
        fallbackParams: (!result.clientSent || !result.businessSent) ? result.fallbackParams : undefined,
        needClient: !result.clientSent,
        needBusiness: !result.businessSent,
        mailClient: session.metadata?.[MAIL_CLIENT_META] === MAIL_SENT_VALUE || result.clientSent,
        mailBusiness: session.metadata?.[MAIL_BIZ_META] === MAIL_SENT_VALUE || result.businessSent,
      });
    } catch (error) {
      console.error('notify-paid-booking send failed after paid session', {
        sessionId,
        error: error instanceof Error ? error.message : 'send failed',
      });
      res.status(200).json({
        paid: true,
        sessionId: session.id,
        customerEmail: session.customer_email || session.metadata?.customer_email || '',
        clientSent: false,
        businessSent: false,
        skipped: true,
        needClient: true,
        needBusiness: true,
      });
    }
  } catch (error) {
    console.error('notify-paid-booking failed', {
      sessionId,
      error: error instanceof Error ? error.message : 'retrieve/send failed',
    });
    res.status(404).json({
      paid: false,
      sessionId,
      clientSent: false,
      businessSent: false,
      error: PAYMENT_NOT_FOUND,
    });
  }
}
