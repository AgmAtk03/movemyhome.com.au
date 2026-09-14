import React from 'react';
import { CONFIG } from '../constants';
import BookingExtras from './BookingExtras';
import { PriceBreakdown } from '../types';
import { formatMoney } from '../lib/quote';

interface SuccessProps {
  name: string;
  email: string;
  demoMode: boolean;
  notice?: string;
  whatsappUrl: string | null;
  quoted: PriceBreakdown;
  onReset: () => void;
}

const SuccessScreen: React.FC<SuccessProps> = ({
  name, email, demoMode, notice, whatsappUrl, quoted, onReset,
}) => {
  const firstName = name.split(' ')[0] || name;

  if (!demoMode) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center p-6 text-center bg-white max-w-lg mx-auto pt-12">
        <h2 className="text-2xl font-black text-slate-900">Redirecting to Stripe…</h2>
        <p className="text-slate-600 mt-3">If nothing happens, go back and try Pay 10% deposit again.</p>
        <button type="button" onClick={onReset} className="mt-8 min-h-11 text-slate-500 font-bold text-sm">Start another quote</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6 text-center bg-white max-w-lg mx-auto pt-12 pb-10">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-5">
        <i className="ph-fill ph-flask text-amber-700 text-5xl" aria-hidden="true"></i>
      </div>

      <p className="text-[11px] font-black uppercase tracking-widest text-amber-800">Demo mode — no charge / no email</p>
      <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight mt-2">This was not booked, {firstName}.</h2>
      <p className="text-slate-600 mb-6 max-w-sm mx-auto text-base leading-relaxed">
        Stripe keys are missing or the checkout API isn’t running, so we did not take a deposit and we did not email {email}. This screen is not a confirmed job.
      </p>

      {notice && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">{notice}</p>
      )}

      <dl className="w-full text-left bg-slate-50 rounded-2xl p-5 mb-6 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Estimated total</dt><dd className="font-bold">{formatMoney(quoted.total)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">10% deposit (not charged)</dt><dd className="font-bold">{formatMoney(quoted.deposit)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Balance remaining</dt><dd className="font-bold">{formatMoney(quoted.balance)}</dd></div>
      </dl>

      <div className="w-full text-left mb-6">
        <BookingExtras variant="success" whatsappUrl={whatsappUrl} />
      </div>

      <p className="text-sm text-slate-500 mb-6">
        {CONFIG.COMPANY_EMAIL} · <span className="whitespace-nowrap">{CONFIG.COMPANY_PHONE}</span>
      </p>

      <button
        type="button"
        onClick={onReset}
        className="w-full min-h-14 flex items-center justify-center bg-slate-900 text-white font-black rounded-2xl mb-4"
      >
        Start another quote
      </button>
    </div>
  );
};

export default SuccessScreen;
