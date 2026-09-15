import { CONFIG, isPhoneConfigured, isWhatsAppConfigured } from '../constants';
import { isSafeWhatsAppUrl } from './sanitize';

/** Owner-authorized public mobile, shown as 0410 721 370. */
export const PUBLIC_AU_MOBILE_DISPLAY = '0410 721 370';
export const PUBLIC_AU_MOBILE_E164 = '+61410721370';
export const PUBLIC_WHATSAPP_DIGITS = '61410721370';

export function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

/** Normalise AU mobile / +61 / 04… input to +614XXXXXXXX. */
export function toAuE164(raw: string): string | null {
  let digits = digitsOnly(raw);
  if (!digits) return null;
  if (digits.startsWith('61') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+61${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('4')) return `+61${digits}`;
  if (digits.startsWith('610') && digits.length === 12) return `+61${digits.slice(3)}`;
  return null;
}

/** Australian local grouping, e.g. 0410 721 370. */
export function formatAuMobileDisplay(raw: string): string {
  const e164 = toAuE164(raw);
  if (!e164) return raw.trim();
  const national = `0${e164.slice(3)}`;
  if (national.length !== 10) return raw.trim();
  return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
}

export function telHrefFrom(raw: string): string | null {
  const e164 = toAuE164(raw);
  return e164 ? `tel:${e164}` : null;
}

export function whatsAppHrefFrom(raw: string): string | null {
  const e164 = toAuE164(raw);
  if (!e164) return null;
  const url = `https://wa.me/${e164.replace(/\D/g, '')}`;
  return isSafeWhatsAppUrl(url) ? url : null;
}

export interface PublicContact {
  display: string;
  telHref: string | null;
  whatsAppHref: string | null;
  phoneConfigured: boolean;
  whatsAppConfigured: boolean;
}

export function getPublicContact(): PublicContact {
  const phoneRaw = isPhoneConfigured() ? CONFIG.COMPANY_PHONE : '';
  const waRaw = isWhatsAppConfigured() ? CONFIG.WHATSAPP_NUMBER : phoneRaw;
  const displaySource = phoneRaw || waRaw || PUBLIC_AU_MOBILE_DISPLAY;
  return {
    display: formatAuMobileDisplay(displaySource) || PUBLIC_AU_MOBILE_DISPLAY,
    telHref: telHrefFrom(phoneRaw || displaySource),
    whatsAppHref: whatsAppHrefFrom(waRaw || displaySource),
    phoneConfigured: Boolean(telHrefFrom(phoneRaw || displaySource)),
    whatsAppConfigured: Boolean(whatsAppHrefFrom(waRaw || displaySource)),
  };
}
