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

export const MEMBER_CODE_INVALID =
  'That member code doesn’t match this email, or it’s already been used.';
export const MEMBER_CODE_REDEEMED =
  'This 5% off has already been used on a booking.';
export const MEMBER_CODE_FORMAT =
  'Member codes look like STUDENT5-XXXX. Check the email we sent you.';
export const MEMBER_EMAILS_OFF =
  'We’ve saved your name and email on this device. Membership emails aren’t switched on yet — once they are, we’ll use this for your 5% off.';

export function memberSignupMessage(opts: {
  code?: string;
  customerEmailed: boolean;
  businessEmailed: boolean;
  alreadyRedeemed?: boolean;
}): string {
  if (opts.alreadyRedeemed) {
    return 'This email already used the first-move 5% off. If you haven’t booked yet, call or email us and we’ll help.';
  }
  const code = String(opts.code || '').trim();
  if (!code) return MEMBER_EMAILS_OFF;

  if (opts.customerEmailed && opts.businessEmailed) {
    return `Your 5% off code is ${code}. We’ve emailed it to you — enter it when you book your first move.`;
  }
  if (opts.customerEmailed && !opts.businessEmailed) {
    return `Your 5% off code is ${code}. We’ve emailed you about the 5% off. We couldn’t notify the office just now — if we don’t follow up, please call or email us.`;
  }
  if (!opts.customerEmailed && opts.businessEmailed) {
    return `Your 5% off code is ${code}. Copy it now — we couldn’t email you just now, but the office has your details. Enter this code when you book.`;
  }
  return `Your 5% off code is ${code}. Copy it now — we couldn’t send the membership emails just now. Enter this code when you book.`;
}

const TECHY =
  /stripe|webhook|serverless|vite_|checkout session|npx vercel|localStorage|secret key|api isn’t|api is not|demo mode/i;

export function customerFacingError(raw?: string, fallback = PAYMENT_START_ERROR): string {
  const text = (raw || '').trim();
  if (!text || TECHY.test(text)) return fallback;
  return text;
}
