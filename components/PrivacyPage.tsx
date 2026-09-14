import React from 'react';
import { CONFIG } from '../constants';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-[100dvh] bg-white max-w-lg mx-auto px-6 py-10 text-slate-800">
      <p className="text-sm font-bold text-blue-700">{CONFIG.COMPANY_NAME}</p>
      <h1 className="text-3xl font-black tracking-tight mt-2">Privacy</h1>
      <p className="text-sm text-slate-500 mt-2">
        Trading as {CONFIG.LEGAL_TRADING_NAME}. ABN {CONFIG.COMPANY_ABN}. These are owner-filled placeholders until your details are set in env.
      </p>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-slate-700">
        <p>
          We collect the name, email, phone, addresses, inventory, and schedule you enter so we can quote and book your move. We do not put card numbers, CVV, or full PAN on this website. Card payments are taken on Stripe-hosted Checkout.
        </p>
        <p>
          When you pay a 10% deposit we store Stripe session and payment IDs, amounts, currency, and payment status, plus the job details needed to do the move. We do not store card data.
        </p>
        <p>
          Emails (customer confirmation and a business job sheet) are sent after Stripe confirms payment, using EmailJS if the owner has configured it. In demo mode we send nothing.
        </p>
        <p>
          Google Maps may receive addresses you type, if a Maps key is configured, so we can autocomplete and estimate distance. Restrict that key to this site’s domains.
        </p>
        <p>
          We use HTTPS in production. Do not send this form over plain HTTP except on localhost for testing.
        </p>
        <p>
          To ask what we hold or to request deletion, email {CONFIG.COMPANY_EMAIL} or call {CONFIG.COMPANY_PHONE}.
        </p>
      </div>

      <button type="button" onClick={onBack} className="mt-10 w-full min-h-14 rounded-2xl bg-slate-900 text-white font-black">
        Back to quote
      </button>
    </div>
  );
};

export default PrivacyPage;
