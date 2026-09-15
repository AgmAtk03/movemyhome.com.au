import Stripe from 'stripe';
import { stripeSecretKey } from './env.js';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(stripeSecretKey());
  }
  return client;
}

export function meta(value: string, max = 500): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
}
