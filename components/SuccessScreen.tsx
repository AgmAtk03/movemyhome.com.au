
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
  onReset: () => void;
}

const SuccessScreen: React.FC<SuccessProps> = ({
  name, email, emailsSent, clientSent, businessSent, demoMode, notice, whatsappUrl, onReset,
}) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-white max-w-lg mx-auto">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
        <i className="ph-fill ph-check-circle text-emerald-600 text-5xl" aria-hidden="true"></i>
      </div>

      <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">We’ve got it, {name.split(' ')[0] || name}.</h2>
      <p className="text-slate-600 mb-6 max-w-sm mx-auto text-base leading-relaxed">
        {emailsSent
          ? `A confirmation is on its way to ${email}, and our team has the full job details.`
          : clientSent
            ? `We’ve emailed ${email}. If our inbox is quiet, WhatsApp us so nothing is missed.`
            : businessSent
              ? `Our team has your booking. If you don’t see an email at ${email}, check spam or message us on WhatsApp.`
              : demoMode
                ? `This was a local test booking (emails aren’t connected yet). Please WhatsApp or call us so we can look after the job.`
                : `Please WhatsApp or call us as well, so we’re sure we have your move.`}
      </p>

      {notice && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">{notice}</p>
      )}

      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-6 text-left w-full">
        <h3 className="font-bold text-blue-950 mb-3">What happens next</h3>
        <ol className="space-y-3 text-sm text-blue-900">
          <li>1. We read your route, items, and time, then check the diary.</li>
          <li>2. We call you to confirm — usually within a couple of hours on business days.</li>
          <li>3. After that we can send a Stripe payment link for a deposit, if you’d like to lock it in.</li>
        </ol>
        <p className="text-sm text-blue-800 mt-3">
          Questions? {CONFIG.COMPANY_EMAIL} or {CONFIG.COMPANY_PHONE}.
        </p>
      </div>

      <div className="w-full text-left mb-6">
        <BookingExtras whatsappUrl={whatsappUrl} heading="Need us sooner?" />
      </div>

      <a
        href={CONFIG.COMPANY_WEBSITE}
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
