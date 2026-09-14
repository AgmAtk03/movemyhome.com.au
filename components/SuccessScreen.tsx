
import React from 'react';
import { CONFIG } from '../constants';
import BookingExtras from './BookingExtras';

interface SuccessProps {
  name: string;
  email: string;
  emailsSent: boolean;
  clientSent: boolean;
  businessSent: boolean;
  demoMode: boolean;
  notice?: string;
  whatsappUrl: string | null;
  stripeUrl: string | null;
  onReset: () => void;
}

const SuccessScreen: React.FC<SuccessProps> = ({
  name, email, emailsSent, clientSent, businessSent, demoMode, notice, whatsappUrl, stripeUrl, onReset,
}) => {
  const firstName = name.split(' ')[0] || name;
  const emailLine = emailsSent || clientSent
    ? `We’ll confirm by email at ${email}. Check spam if it isn’t in the inbox within a few minutes.`
    : demoMode
      ? `We’ll confirm by email once that’s connected. For now, WhatsApp or call us so we don’t miss you.`
      : businessSent
        ? `Our team has your booking. We’ll confirm by email at ${email} — check spam if needed.`
        : `We’ll confirm by email. If you don’t see a note at ${email}, WhatsApp or call us.`;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6 text-center bg-white max-w-lg mx-auto pt-12 pb-10">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
        <i className="ph-fill ph-check-circle text-emerald-600 text-5xl" aria-hidden="true"></i>
      </div>

      <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">We’ve got it, {firstName}.</h2>
      <p className="text-slate-600 mb-6 max-w-sm mx-auto text-base leading-relaxed">{emailLine}</p>

      {notice && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">{notice}</p>
      )}

      <ol className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-6 text-left w-full space-y-3 text-sm text-blue-950">
        <li>
          <span className="font-bold">1. We’ll confirm by email.</span> Watch {email} — that’s how we lock in the time.
        </li>
        <li>
          <span className="font-bold">2. Want a faster reply?</span> WhatsApp us with this job summary (button below, when WhatsApp is on).
        </li>
        <li>
          <span className="font-bold">3. Optional deposit.</span> Pay deposit only appears when card payments are switched on. No card details on this page.
        </li>
      </ol>

      <div className="w-full text-left mb-6">
        <BookingExtras
          variant="success"
          whatsappUrl={whatsappUrl}
          stripeUrl={stripeUrl}
        />
      </div>

      <p className="text-sm text-slate-500 mb-6">
        {CONFIG.COMPANY_EMAIL} · <span className="whitespace-nowrap">{CONFIG.COMPANY_PHONE}</span>
      </p>

      <a
        href={CONFIG.COMPANY_WEBSITE}
        rel="noopener noreferrer"
        className="w-full min-h-14 flex items-center justify-center bg-slate-900 text-white font-black rounded-2xl mb-4"
      >
        Back to the website
      </a>

      <button
        type="button"
        onClick={onReset}
        className="min-h-11 text-slate-500 font-bold text-sm"
      >
        Start another quote
      </button>
    </div>
  );
};

export default SuccessScreen;
