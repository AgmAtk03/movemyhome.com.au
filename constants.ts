import { FLOOR_RATES, INVENTORY_COSTS, RATES } from './shared/rates';

export { RATES, FLOOR_RATES, INVENTORY_COSTS };
export { ACCESS_LABELS, INVENTORY_LABELS, SERVICE_LABELS, BRAND_NAME } from './shared/rates';

function envText(key: keyof ImportMetaEnv, fallback: string): string {
  const value = String(import.meta.env[key] ?? '').trim();
  return value || fallback;
}

function isUnset(value: string, placeholders: string[]): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return placeholders.some((token) => trimmed.includes(token));
}

/**
 * Visible brand is My Home Removals.
 * Legal/trading name, phone, email, WhatsApp, and website are CONFIG / env
 * placeholders for the owner to fill — do not invent real credentials or licences.
 */
export const CONFIG = {
  COMPANY_NAME: envText('VITE_COMPANY_NAME', 'My Home Removals'),
  COMPANY_SHORT_NAME: 'My Home',
  LEGAL_TRADING_NAME: envText('VITE_LEGAL_TRADING_NAME', 'YOUR_LEGAL_TRADING_NAME'),
  COMPANY_EMAIL: envText('VITE_COMPANY_EMAIL', 'YOUR_BOOKINGS_EMAIL'),
  COMPANY_WEBSITE: envText('VITE_COMPANY_WEBSITE', 'https://YOUR_WEBSITE'),
  COMPANY_PHONE: envText('VITE_COMPANY_PHONE', 'YOUR_PHONE_NUMBER'),
  COMPANY_ABN: envText('VITE_ABN', 'YOUR_ABN'),
  COMPANY_TAGLINE: 'Sydney moving, made simple.',
  WHATSAPP_NUMBER: envText('VITE_WHATSAPP_NUMBER', 'YOUR_WHATSAPP_NUMBER'),
  EMAILJS_SERVICE_ID: envText('VITE_EMAILJS_SERVICE_ID', 'service_YOUR_ID'),
  EMAILJS_CLIENT_TEMPLATE_ID: envText('VITE_EMAILJS_CLIENT_TEMPLATE_ID', 'template_CLIENT_ID'),
  EMAILJS_BUSINESS_TEMPLATE_ID: envText('VITE_EMAILJS_BUSINESS_TEMPLATE_ID', 'template_BUSINESS_ID'),
  EMAILJS_PUBLIC_KEY: envText('VITE_EMAILJS_PUBLIC_KEY', 'YOUR_PUBLIC_KEY'),
};

export const isEmailJsConfigured = (): boolean =>
  !isUnset(CONFIG.EMAILJS_PUBLIC_KEY, ['YOUR_PUBLIC_KEY']) &&
  !isUnset(CONFIG.EMAILJS_SERVICE_ID, ['YOUR_ID']) &&
  !isUnset(CONFIG.EMAILJS_CLIENT_TEMPLATE_ID, ['CLIENT_ID', 'YOUR_ID']) &&
  !isUnset(CONFIG.EMAILJS_BUSINESS_TEMPLATE_ID, ['BUSINESS_ID', 'YOUR_ID']);

export const isWhatsAppConfigured = (): boolean =>
  !isUnset(CONFIG.WHATSAPP_NUMBER, ['YOUR_WHATSAPP']);

export const isPhoneConfigured = (): boolean =>
  !isUnset(CONFIG.COMPANY_PHONE, ['YOUR_PHONE_NUMBER']);

export const isEmailConfigured = (): boolean =>
  !isUnset(CONFIG.COMPANY_EMAIL, ['YOUR_BOOKINGS_EMAIL']);

export const isWebsiteConfigured = (): boolean =>
  !isUnset(CONFIG.COMPANY_WEBSITE, ['YOUR_WEBSITE']);

export const isLegalNameConfigured = (): boolean =>
  !isUnset(CONFIG.LEGAL_TRADING_NAME, ['YOUR_LEGAL_TRADING_NAME']);

export const isAbnConfigured = (): boolean =>
  !isUnset(CONFIG.COMPANY_ABN, ['YOUR_ABN']);

export const WIZARD_STEPS = [
  { id: 1, label: 'Service', title: 'What are you moving?' },
  { id: 2, label: 'Vehicle', title: 'Which vehicle suits you?' },
  { id: 3, label: 'Where', title: 'Where are we heading?' },
  { id: 4, label: 'Items', title: 'What’s coming with us?' },
  { id: 5, label: 'When', title: 'When should we arrive?' },
  { id: 6, label: 'Book', title: 'How can we reach you?' },
] as const;

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

export const SERVICE_AREAS = [
  'Sydney CBD',
  'Inner West',
  'Eastern Suburbs',
  'North Shore',
  'Northern Beaches',
  'Hills District',
  'South Sydney',
  'Greater Sydney',
  'Regional NSW',
] as const;
