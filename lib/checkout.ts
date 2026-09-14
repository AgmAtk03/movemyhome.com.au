import { QuoteState } from '../types';
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

export async function createCheckoutSession(state: QuoteState): Promise<CheckoutResult> {
  let response: Response;
  try {
    response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload(state)),
    });
  } catch {
    return {
      ok: true,
      demoMode: true,
      message: PAYMENTS_OFF_SHORT,
    };
  }

  if (response.status === 404) {
    return {
      ok: true,
      demoMode: true,
      message: PAYMENTS_OFF_SHORT,
    };
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return {
      ok: true,
      demoMode: true,
      message: PAYMENTS_OFF_SHORT,
    };
  }

  const data = await response.json().catch(() => ({})) as Partial<CheckoutResponse> & { error?: string };

  if (!response.ok) {
    return {
      ok: false,
      demoMode: false,
      error: customerFacingError(data.error, PAYMENT_START_ERROR),
    };
  }

  if ('demoMode' in data && data.demoMode) {
    return {
      ok: true,
      demoMode: true,
      quoted: data.quoted,
      message: PAYMENTS_OFF_SHORT,
    };
  }

  if ('url' in data && data.url && data.url.startsWith('https://checkout.stripe.com/')) {
    return { ok: true, demoMode: false, url: data.url, quoted: data.quoted };
  }

  if ('url' in data && typeof data.url === 'string' && data.url.startsWith('https://') && data.url.includes('stripe.com')) {
    return { ok: true, demoMode: false, url: data.url, quoted: data.quoted };
  }

  return { ok: false, demoMode: false, error: PAYMENT_OPEN_ERROR };
}
