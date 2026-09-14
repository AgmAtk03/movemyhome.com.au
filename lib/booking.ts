import { CONFIG, isWhatsAppConfigured } from '../constants';
import { QuoteSnapshot, QuoteState } from '../types';
import { buildCustomerMessage } from './quote';
import { isSafeWhatsAppUrl, sanitizePlainText } from './sanitize';

export function buildWhatsAppUrl(state: QuoteState, snapshot: QuoteSnapshot): string | null {
  if (!isWhatsAppConfigured()) return null;
  const digits = CONFIG.WHATSAPP_NUMBER.replace(/\D/g, '');
  if (digits.length < 8) return null;
  const text = buildCustomerMessage(state, snapshot);
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  return isSafeWhatsAppUrl(url) ? url : null;
}

export function clientReferenceId(state: QuoteState): string {
  const name = sanitizePlainText(state.details.name, 40).replace(/\s+/g, '-');
  const date = sanitizePlainText(state.details.date || 'tbc', 12);
  return `mhr-${date}-${name}`.slice(0, 180);
}
