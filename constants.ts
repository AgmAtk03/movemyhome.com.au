import { isSafeStripePaymentLink } from './lib/sanitize';

function envText(key: keyof ImportMetaEnv, fallback: string): string {
  const value = String(import.meta.env[key] ?? '').trim();
  return value || fallback;
}

function isUnset(value: string, placeholders: string[]): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return placeholders.some((token) => trimmed.includes(token));
}

export const CONFIG = {
  COMPANY_NAME: 'My Home Removals',
  COMPANY_SHORT_NAME: 'My Home',
  COMPANY_EMAIL: 'bookings@movemyhome.com.au',
  COMPANY_WEBSITE: 'https://movemyhome.com.au',
  COMPANY_PHONE: '1300 000 000',
  COMPANY_TAGLINE: 'Sydney moving, made simple.',
  /**
   * WhatsApp Business number, digits only with country code (e.g. 61412345678).
   * Replace the placeholder or set VITE_WHATSAPP_NUMBER — never commit a private number you don’t want public.
   */
  WHATSAPP_NUMBER: envText('VITE_WHATSAPP_NUMBER', 'YOUR_WHATSAPP_NUMBER'),
  EMAILJS_SERVICE_ID: envText('VITE_EMAILJS_SERVICE_ID', 'service_YOUR_ID'),
  EMAILJS_CLIENT_TEMPLATE_ID: envText('VITE_EMAILJS_CLIENT_TEMPLATE_ID', 'template_CLIENT_ID'),
  EMAILJS_BUSINESS_TEMPLATE_ID: envText('VITE_EMAILJS_BUSINESS_TEMPLATE_ID', 'template_BUSINESS_ID'),
  EMAILJS_PUBLIC_KEY: envText('VITE_EMAILJS_PUBLIC_KEY', 'YOUR_PUBLIC_KEY'),
  /** Stripe Payment Link URL (AUD). Empty until the owner creates one. */
  STRIPE_PAYMENT_LINK: envText('VITE_STRIPE_PAYMENT_LINK', ''),
  STRIPE_PUBLISHABLE_KEY: envText('VITE_STRIPE_PUBLISHABLE_KEY', ''),
};

export const isEmailJsConfigured = (): boolean =>
  !isUnset(CONFIG.EMAILJS_PUBLIC_KEY, ['YOUR_PUBLIC_KEY']) &&
  !isUnset(CONFIG.EMAILJS_SERVICE_ID, ['YOUR_ID']) &&
  !isUnset(CONFIG.EMAILJS_CLIENT_TEMPLATE_ID, ['CLIENT_ID', 'YOUR_ID']) &&
  !isUnset(CONFIG.EMAILJS_BUSINESS_TEMPLATE_ID, ['BUSINESS_ID', 'YOUR_ID']);

export const isWhatsAppConfigured = (): boolean =>
  !isUnset(CONFIG.WHATSAPP_NUMBER, ['YOUR_WHATSAPP']);

export const isStripePaymentLinkConfigured = (): boolean =>
  isSafeStripePaymentLink(CONFIG.STRIPE_PAYMENT_LINK);

export const WIZARD_STEPS = [
  { id: 1, label: 'Service', title: 'What are you moving?' },
  { id: 2, label: 'Vehicle', title: 'Which vehicle suits you?' },
  { id: 3, label: 'Where', title: 'Where are we heading?' },
  { id: 4, label: 'Items', title: 'What’s coming with us?' },
  { id: 5, label: 'When', title: 'When should we arrive?' },
  { id: 6, label: 'Book', title: 'How can we reach you?' },
] as const;

export const RATES = {
  VAN_BASE: 55,
  VAN_PER_KM: 0.42,
  VAN_MIN_KM: 0,
  TRUCK_HOURLY_TEAM: 90,
  TRUCK_HOURLY_SOLO: 80,
  TRUCK_MIN_HOURS: 2,
  CBD_FEE: 20,
  BED_SERVICE_FEE: 30,

  LONG_DISTANCE_THRESHOLD: 100,
  TRUCK_L_PER_100KM: 26,
  DIESEL_PRICE_PER_L: 1.85,
  TRUCK_WEAR_PER_KM: 0.405,

  MARGIN_SOLO_PER_KM: 1.7385,
  MARGIN_TEAM_PER_KM: 2.5719,
};

export const FLOOR_RATES: Record<string, number> = {
  ground: 0,
  floor1: 6.99,
  floor2: 9.99,
  floor3: 12.99,
  floor4: 16.99,
};

export const INVENTORY_COSTS: Record<string, number> = {
  boxes: 2,
  sofa: 10,
  mattress: 6.99,
  fridge: 5,
  washer: 5,
  tv: 0,
  bed: 10,
};

export const VEHICLE_OPTIONS = [
  {
    id: 'van',
    name: 'Van',
    icon: '🚐',
    desc: 'Studios, a few items, or a small delivery.',
  },
  {
    id: 'truck',
    name: 'Truck',
    icon: '🚛',
    desc: 'Whole homes, heavier furniture, or longer trips.',
  },
] as const;

export const SERVICE_LABELS: Record<string, string> = {
  home_move: 'Home move',
  room_move: 'Room move',
  item_delivery: 'Item delivery',
};

export const ACCESS_LABELS: Record<string, string> = {
  ground: 'Ground floor or lift',
  floor1: '1st floor, stairs',
  floor2: '2nd floor, stairs',
  floor3: '3rd floor, stairs',
  floor4: '4th floor, stairs',
};

export const INVENTORY_LABELS: Record<string, string> = {
  boxes: 'Boxes / bags',
  sofa: 'Sofa',
  mattress: 'Mattress',
  bed: 'Bed frame',
  fridge: 'Fridge',
  washer: 'Washing machine',
  tv: 'TV',
};

export const SERVICE_AREAS = [
  'Sydney CBD',
  'Inner West',
  'Eastern Suburbs',
  'North Shore',
  'Northern Beaches',
  'Hills District',
  'South Sydney',
  'Greater Sydney',
] as const;

