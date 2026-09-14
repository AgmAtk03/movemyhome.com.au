import React from 'react';
import { PriceBreakdown } from '../types';
import { formatMoney } from '../lib/quote';
import { PAYMENTS_OFF_HEADING } from '../lib/customerCopy';
import BookingExtras from './BookingExtras';
import ConfiguredContact from './ConfiguredContact';

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
  name, email, demoMode, whatsappUrl, quoted, onReset,
}) => {
  const firstName = name.split(' ')[0] || name;

  if (!demoMode) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center p-6 text-center bg-white max-w-lg mx-auto pt-12">
        <h2 className="text-2xl font-black text-slate-900">Taking you to pay the deposit…</h2>
        <p className="text-slate-600 mt-3">If nothing happens, go back and tap Pay 10% deposit again.</p>
        <button type="button" onClick={onReset} className="mt-8 min-h-11 text-slate-500 font-bold text-sm">Start another quote</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6 text-center bg-white max-w-lg mx-auto pt-12 pb-10">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-5">
        <i className="ph-fill ph-pause-circle text-amber-700 text-5xl" aria-hidden="true"></i>
      </div>

      <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{PAYMENTS_OFF_HEADING}</h2>
      <p className="text-slate-600 mb-6 max-w-sm mx-auto text-base leading-relaxed">
        {firstName ? `${firstName}, nothing` : 'Nothing'} was charged and this move isn’t booked
        {email ? ` — we haven’t emailed ${email}` : ''}. You can still look over the quote. We’ll take the 10% deposit once payments are on.
      </p>

      <dl className="w-full text-left bg-slate-50 rounded-2xl p-5 mb-6 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Estimated total</dt><dd className="font-bold">{formatMoney(quoted.total)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Pay today (10%) — not charged</dt><dd className="font-bold">{formatMoney(quoted.deposit)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Due on the day (90%)</dt><dd className="font-bold">{formatMoney(quoted.balance)}</dd></div>
      </dl>

      <div className="w-full text-left mb-6">
        <BookingExtras variant="success" whatsappUrl={whatsappUrl} />
      </div>

      <ConfiguredContact className="text-sm text-slate-500 mb-6" />

      <button
        type="button"
        onClick={onReset}
        className="btn-primary w-full mb-4"
      >
        Start another quote
      </button>
    </div>
  );
};

export default SuccessScreen;
