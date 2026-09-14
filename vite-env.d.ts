/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_CLIENT_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_BUSINESS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_STRIPE_PAYMENT_LINK?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
