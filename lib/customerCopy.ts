/** Customer-facing lines when card payments are not live. */

export const PAYMENTS_OFF_HEADING = 'Payments aren’t switched on yet';
export const PAYMENTS_OFF_BODY =
  'Nothing will be charged, and this move isn’t booked. You can still look over the quote — we’ll take the 10% deposit once payments are on.';
export const PAYMENTS_OFF_SHORT = 'Payments aren’t switched on yet — nothing will be charged.';

export const PAYMENT_START_ERROR = 'We couldn’t start the payment. Please try again.';
export const PAYMENT_OPEN_ERROR = 'We couldn’t open the payment page. Please try again.';
export const PAYMENT_NOT_FOUND = 'We couldn’t find that payment.';
export const QUOTE_TOO_SMALL =
  'This quote is a bit small to take a card deposit. Please get in touch to book.';

const TECHY =
  /stripe|webhook|serverless|vite_|checkout session|npx vercel|localStorage|secret key|api isn’t|api is not|demo mode/i;

export function customerFacingError(raw?: string, fallback = PAYMENT_START_ERROR): string {
  const text = (raw || '').trim();
  if (!text || TECHY.test(text)) return fallback;
  return text;
}
