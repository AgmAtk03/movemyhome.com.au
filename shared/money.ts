import { DEPOSIT_RATE } from './rates';

/** Round a dollar amount to 2 decimal places (half-up for positive values). */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Deposit rules (non-negotiable):
 *   deposit = round(quoteTotal * 0.10, 2)
 *   balance = quoteTotal - deposit
 *   Stripe cents = Math.round(deposit * 100)
 */
export function depositFromQuoteTotal(quoteTotal: number): {
  quoteTotal: number;
  deposit: number;
  balance: number;
  depositCents: number;
} {
  const total = roundMoney(quoteTotal);
  const deposit = roundMoney(total * DEPOSIT_RATE);
  const balance = roundMoney(total - deposit);
  const depositCents = Math.round(deposit * 100);
  return { quoteTotal: total, deposit, balance, depositCents };
}

export function formatMoney(amount: number): string {
  return roundMoney(amount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}
