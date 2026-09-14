import React from 'react';
import { CONFIG, isAbnConfigured, isLegalNameConfigured } from '../constants';
import ConfiguredContact from './ConfiguredContact';
import SiteHeader from './SiteHeader';

interface PrivacyPageProps {
  onBack: () => void;
        onQuote: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack, onQuote }) => {
  const legalBits = [
    isLegalNameConfigured() ? `Trading as ${CONFIG.LEGAL_TRADING_NAME}` : null,
    isAbnConfigured() ? `ABN ${CONFIG.COMPANY_ABN}` : null,
  ].filter(Boolean);

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800">
      <SiteHeader current="privacy" />
      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-sm font-bold text-[#146eb4]">{CONFIG.COMPANY_NAME}</p>
        <h1 className="text-3xl font-black tracking-tight mt-2">Privacy</h1>
        {legalBits.length > 0 && (
          <p className="text-sm text-slate-500 mt-2">{legalBits.join('. ')}.</p>
        )}

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            We only use what you type here — your name, how to reach you, addresses, items, and when you’d like us — so we can quote and book your move.
          </p>
          <p>
            Card details are entered on a secure payment page, not on this site. We don’t keep your card number.
          </p>
          <p>
            After a 10% deposit is paid, we keep the job details we need to do the move and to confirm with you.
          </p>
          <p>
            If you join as a member for 5% off, we store your name and email in this browser. We only email that list if the owner has switched membership mail on.
          </p>
          <p>
            If street suggestions appear while you type an address, that’s only to help you fill the form.
          </p>
          <p>
            To ask what we hold, or to have it deleted, get in touch using the details below — or through the quote form if we haven’t listed a number yet.
          </p>
          <ConfiguredContact className="text-sm font-semibold text-slate-800" />
        </div>

        <button type="button" onClick={onQuote} className="btn-primary mt-10 w-full">
          Get an Instant Quote
        </button>
        <button type="button" onClick={onBack} className="btn-quiet mt-3 w-full">
          Back to home
        </button>
      </div>
    </div>
  );
};

export default PrivacyPage;
