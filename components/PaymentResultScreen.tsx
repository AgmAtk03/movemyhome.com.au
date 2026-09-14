import React, { useEffect, useState } from 'react';
import { CONFIG } from '../constants';

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
        <h1 className="text-2xl font-black text-slate-900">Checking Stripe…</h1>
        <p className="text-slate-600 mt-2 text-sm">This page is not proof of payment on its own. We’re asking Stripe whether the deposit was paid.</p>
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
          Thanks{data.customerName ? ` ${data.customerName.split(' ')[0]}` : ''}. Stripe has confirmed your 10% deposit
          {data.customerEmail ? ` — we’ll email ${data.customerEmail}` : ''}.
        </p>
        <dl className="w-full text-left bg-slate-50 rounded-2xl p-5 mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Estimated total</dt><dd className="font-bold">{data.quoteTotalLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Deposit paid</dt><dd className="font-bold">{data.depositLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Balance due on the day</dt><dd className="font-bold">{data.balanceLabel}</dd></div>
        </dl>
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          The remaining 90% is due on the day of the move. We don’t charge the full quote up front.
        </p>
        <p className="text-sm text-slate-500 mt-6">{CONFIG.COMPANY_EMAIL} · {CONFIG.COMPANY_PHONE}</p>
        <button type="button" onClick={onReset} className="mt-8 w-full min-h-14 rounded-2xl bg-slate-900 text-white font-black">
          Back to the quote
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6 bg-white max-w-lg mx-auto text-center pt-12">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-5">
        <i className="ph-fill ph-warning-circle text-amber-600 text-5xl" aria-hidden="true"></i>
      </div>
      <h1 className="text-3xl font-black text-slate-900">Payment not confirmed</h1>
      <p className="text-slate-600 mt-3 max-w-sm leading-relaxed">
        {data.message || data.error || 'We could not confirm a paid deposit with Stripe. Opening /success is not enough — the booking is only held after Stripe says the deposit is paid.'}
      </p>
      {data.demoMode && (
        <p className="mt-4 text-sm font-bold text-amber-900 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          Demo mode — no charge / no email.
        </p>
      )}
      <p className="text-sm text-slate-500 mt-6">
        If you were charged, keep your Stripe receipt and contact {CONFIG.COMPANY_EMAIL}.
      </p>
      <button type="button" onClick={onReset} className="mt-8 w-full min-h-14 rounded-2xl bg-slate-900 text-white font-black">
        Back to the quote
      </button>
    </div>
  );
};

export default PaymentResultScreen;
