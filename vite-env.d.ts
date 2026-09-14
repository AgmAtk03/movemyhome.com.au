/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_CLIENT_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_BUSINESS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_EMAILJS_MEMBER_TEMPLATE_ID?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_COMPANY_NAME?: string;
  readonly VITE_LEGAL_TRADING_NAME?: string;
  readonly VITE_COMPANY_EMAIL?: string;
  readonly VITE_COMPANY_PHONE?: string;
  readonly VITE_COMPANY_WEBSITE?: string;
  readonly VITE_ABN?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
