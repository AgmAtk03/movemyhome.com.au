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

export const DEPOSIT_PAID_HEADING = 'Deposit received';

/** Copy for the paid screen. Always tell them to check the email they entered. Never claim it was sent unless `clientSent === true`. */
export function paidDepositEmailCopy(opts: {
  email?: string;
  clientSent?: boolean | null;
  firstName?: string;
}): { heading: string; body: string } {
  const email = (opts.email || '').trim();
  const inbox = email || 'the email you entered';
  const thanks = opts.firstName ? `Thanks ${opts.firstName}.` : 'Thanks.';
  const checkInbox = `Check ${inbox} for your booking confirmation`;
  if (opts.clientSent === false) {
    return {
      heading: DEPOSIT_PAID_HEADING,
      body: `${thanks} Your 10% deposit is in. ${checkInbox}. If it isn’t there in a few minutes, look in spam and keep your card receipt. Call or WhatsApp us if it doesn’t arrive — we’ve marked this payment so the office can follow up.`,
    };
  }
  return {
    heading: DEPOSIT_PAID_HEADING,
    body: `${thanks} Your 10% deposit is in. ${checkInbox} — look in spam or promotions if it isn’t there within a few minutes.`,
  };
}
