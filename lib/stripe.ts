import { CONFIG } from '../constants';
import { isSafeStripePaymentLink, sanitizePlainText } from './sanitize';

/**
 * Stripe Payment Links are a fixed AUD amount set in the Dashboard.
 * Query params we append (when the URL is a genuine Stripe HTTPS link):
 * - prefilled_email
 * - client_reference_id (customer + move date, max 200 chars)
 *
 * There is no supported query param to change the charge amount on a
 * standard Payment Link. Use a fixed deposit (e.g. $50) or a
 * “customer chooses amount” link in Stripe.
 */
export function buildStripePaymentUrl(email: string, clientRef: string): string | null {
  const base = CONFIG.STRIPE_PAYMENT_LINK.trim();
  if (!isSafeStripePaymentLink(base)) return null;

  try {
    const url = new URL(base);
    const safeEmail = sanitizePlainText(email, 120);
    if (safeEmail.includes('@')) {
      url.searchParams.set('prefilled_email', safeEmail);
    }
    const ref = sanitizePlainText(clientRef, 200).replace(/\s+/g, '-').slice(0, 200);
    if (ref) {
      url.searchParams.set('client_reference_id', ref);
    }
    return url.toString();
  } catch {
    return null;
  }
}
