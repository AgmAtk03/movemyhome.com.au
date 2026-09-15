import { QuoteState } from '../types';
import { fetchApi } from './api';
import { sanitizePlainText } from './sanitize';
import { PAYMENTS_OFF_SHORT, PAYMENT_OPEN_ERROR, PAYMENT_START_ERROR, customerFacingError } from './customerCopy';

export interface CheckoutQuoted {
  quoteTotal: number;
  deposit: number;
  balance: number;
  depositCents: number;
  currency: string;
  quoteTotalLabel: string;
  depositLabel: string;
  balanceLabel: string;
}

export type CheckoutResponse =
  | { demoMode: true; message: string; quoted: CheckoutQuoted }
  | { demoMode: false; url: string; sessionId: string; quoted: CheckoutQuoted };

export interface CheckoutResult {
  ok: boolean;
  demoMode: boolean;
  url?: string;
  quoted?: CheckoutQuoted;
  message?: string;
  error?: string;
}

export function checkoutPayload(state: QuoteState) {
  return {
    serviceType: state.serviceType,
    vehicle: state.vehicle,
    truckHours: state.truckHours,
    crewSize: state.crewSize,
    pickups: state.pickups,
    dropoffs: state.dropoffs,
    inventory: state.inventory,
    details: {
      date: state.details.date,
      time: state.details.time,
      name: sanitizePlainText(state.details.name, 80),
      email: sanitizePlainText(state.details.email, 120),
      phone: sanitizePlainText(state.details.phone, 24),
      instructions: state.details.instructions,
      bedDisassembly: state.details.bedDisassembly,
      bedIsAssembled: state.details.bedIsAssembled,
    },
    distanceKm: state.distanceKm,
    travelTimeHrs: state.travelTimeHrs,
    isInterstate: state.isInterstate,
  };
}

function isStripeCheckoutUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  return url.startsWith('https://checkout.stripe.com/') || url.includes('stripe.com');
}

/** Map a JSON checkout API body to a result. Network/HTML/404 must not become demoMode. */
export function checkoutResultFromJson(status: number, data: unknown): CheckoutResult {
  const row = (data && typeof data === 'object' ? data : {}) as {
    demoMode?: boolean;
    message?: string;
    error?: string;
    url?: string;
    quoted?: CheckoutQuoted;
  };

  if (status < 200 || status >= 300) {
    return {
      ok: false,
      demoMode: false,
      error: customerFacingError(row.error, PAYMENT_START_ERROR),
    };
  }

  if (row.demoMode === true) {
    return {
      ok: true,
      demoMode: true,
      quoted: row.quoted,
      message: typeof row.message === 'string' && row.message.trim() ? row.message : PAYMENTS_OFF_SHORT,
    };
  }

  if (isStripeCheckoutUrl(row.url)) {
    return { ok: true, demoMode: false, url: row.url, quoted: row.quoted };
  }

  return { ok: false, demoMode: false, error: PAYMENT_OPEN_ERROR };
}

export async function createCheckoutSession(state: QuoteState): Promise<CheckoutResult> {
  let response: Response;
  try {
    response = await fetchApi('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload(state)),
    });
  } catch {
    return {
      ok: false,
      demoMode: false,
      error: PAYMENT_START_ERROR,
    };
  }

  const data = await response.json().catch(() => ({}));
  return checkoutResultFromJson(response.status, data);
}
