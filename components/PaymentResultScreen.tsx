import React, { useEffect, useState } from 'react';
import { PAYMENTS_OFF_BODY, PAYMENTS_OFF_HEADING, PAYMENT_NOT_FOUND, customerFacingError } from '../lib/customerCopy';
import ConfiguredContact from './ConfiguredContact';

interface VerifyResponse {
  paid?: boolean;
  demoMode?: boolean;
  error?: string;
  message?: string;
  customerName?: string;
  customerEmail?: string;
  quoteTotalLabel?: string;
  depositLabel?: string;
  balanceLabel?: string;
  sessionId?: string;
  paymentIntentId?: string;
  currency?: string;
}

const PaymentResultScreen: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const [status, setStatus] = useState<'loading' | 'paid' | 'unpaid' | 'missing' | 'error'>('loading');
  const [data, setData] = useState<VerifyResponse>({});

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id') || '';
    if (!sessionId) {
      setStatus('missing');
      return;
    }

    fetch(`/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const json = (await res.json()) as VerifyResponse;
        setData(json);
        if (json.paid) setStatus('paid');
        else if (json.demoMode) setStatus('unpaid');
        else setStatus('unpaid');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-white max-w-lg mx-auto text-center">
        <div className="loading-spinner mb-6" style={{ borderTopColor: '#2563eb', borderColor: '#dbeafe' }}></div>
        <h1 className="text-2xl font-black text-slate-900">Just checking your payment…</h1>
        <p className="text-slate-600 mt-2 text-sm">Hang tight — this page on its own isn’t proof the deposit went through.</p>
      </div>
    );
  }

  if (status === 'paid') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center p-6 bg-white max-w-lg mx-auto text-center pt-12">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
          <i className="ph-fill ph-check-circle text-emerald-600 text-5xl" aria-hidden="true"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Deposit received</h1>
        <p className="text-slate-600 mt-3 max-w-sm leading-relaxed">
          Thanks{data.customerName ? ` ${data.customerName.split(' ')[0]}` : ''}. We’ve got your 10% deposit
          {data.customerEmail ? ` — we’ll email ${data.customerEmail}` : ''}. We’ll confirm the plan before moving day.
        </p>
        <dl className="w-full text-left bg-slate-50 rounded-2xl p-5 mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Estimated total</dt><dd className="font-bold">{data.quoteTotalLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Pay today (10%)</dt><dd className="font-bold">{data.depositLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Due on the day (90%)</dt><dd className="font-bold">{data.balanceLabel}</dd></div>
        </dl>
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          The remaining 90% is due on the day of the move. We don’t charge the full quote up front.
        </p>
        <ConfiguredContact className="text-sm text-slate-500 mt-6" />
        <button type="button" onClick={onReset} className="mt-8 w-full min-h-14 rounded-2xl bg-slate-900 text-white font-black">
          Back to the quote
        </button>
      </div>
    );
  }

  const paymentsOff = Boolean(data.demoMode);
  const unpaidBody = paymentsOff
    ? PAYMENTS_OFF_BODY
    : customerFacingError(data.message || data.error, 'We couldn’t confirm the deposit. Nothing is booked yet.');

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6 bg-white max-w-lg mx-auto text-center pt-12">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-5">
        <i className="ph-fill ph-warning-circle text-amber-600 text-5xl" aria-hidden="true"></i>
      </div>
      <h1 className="text-3xl font-black text-slate-900">
        {paymentsOff ? PAYMENTS_OFF_HEADING : status === 'missing' ? 'No payment to check' : 'Payment not confirmed'}
      </h1>
      <p className="text-slate-600 mt-3 max-w-sm leading-relaxed">
        {status === 'missing' ? PAYMENT_NOT_FOUND : unpaidBody}
      </p>
      <p className="text-sm text-slate-500 mt-6 leading-relaxed max-w-sm">
        If money left your account, keep your receipt and get in touch — we’ll sort it.
      </p>
      <ConfiguredContact className="text-sm text-slate-500 mt-3" />
      <button type="button" onClick={onReset} className="mt-8 w-full min-h-14 rounded-2xl bg-slate-900 text-white font-black">
        Back to the quote
      </button>
    </div>
  );
};

export default PaymentResultScreen;
