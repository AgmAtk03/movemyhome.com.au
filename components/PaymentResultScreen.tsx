import React, { useEffect, useState } from 'react';
import { PAYMENTS_OFF_BODY, PAYMENTS_OFF_HEADING, PAYMENT_NOT_FOUND, customerFacingError, paidDepositEmailCopy } from '../lib/customerCopy';
import { sendPaidEmailsFromBrowser } from '../lib/emailjsBrowser';
import ConfiguredContact from './ConfiguredContact';
import ContactActions from './ContactActions';
import Icon from './Icon';

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
  mailClient?: boolean;
  mailBusiness?: boolean;
  clientSent?: boolean;
  businessSent?: boolean;
  skipped?: boolean;
  needClient?: boolean;
  needBusiness?: boolean;
  fallbackParams?: Record<string, string>;
}

const PaymentResultScreen: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const [status, setStatus] = useState<'loading' | 'paid' | 'unpaid' | 'missing' | 'error'>('loading');
  const [data, setData] = useState<VerifyResponse>({});
  const [clientSent, setClientSent] = useState<boolean | null>(null);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id') || '';
    if (!sessionId) {
      setStatus('missing');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const verifyRes = await fetch(`/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        const json = (await verifyRes.json()) as VerifyResponse;
        if (cancelled) return;
        setData(json);
        if (!json.paid) {
          setStatus('unpaid');
          return;
        }
        setStatus('paid');
        setClientSent(json.clientSent === true ? true : json.clientSent === false ? false : null);

        const needsMail = Boolean(json.needClient || json.needBusiness || json.clientSent === false || json.businessSent === false);
        if (!needsMail) return;

        try {
          const notifyRes = await fetch('/api/notify-paid-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const notify = (await notifyRes.json()) as VerifyResponse;
          if (cancelled) return;
          let nextClient = Boolean(notify.clientSent || json.clientSent);
          if ((!nextClient || notify.needBusiness || json.needBusiness) && (notify.fallbackParams || json.fallbackParams)) {
            const fallback = await sendPaidEmailsFromBrowser({
              params: notify.fallbackParams || json.fallbackParams || {},
              needClient: Boolean(notify.needClient ?? json.needClient),
              needBusiness: Boolean(notify.needBusiness ?? json.needBusiness),
            });
            nextClient = nextClient || fallback.clientSent;
          }
          if (!cancelled) setClientSent(nextClient);
        } catch {
          if (!cancelled) setClientSent(Boolean(json.clientSent));
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-white max-w-lg mx-auto text-center">
        <div className="loading-spinner mb-6" style={{ borderTopColor: '#146eb4', borderColor: '#c5dff0' }}></div>
        <h1 className="text-2xl font-black text-slate-900">Just checking your payment…</h1>
        <p className="text-slate-600 mt-2 text-sm">Hang tight — this page on its own isn’t proof the deposit went through.</p>
      </div>
    );
  }

  if (status === 'paid') {
    const firstName = data.customerName ? data.customerName.split(' ')[0] : '';
    const copy = paidDepositEmailCopy({
      email: data.customerEmail,
      clientSent,
      firstName,
    });
    const ref = data.sessionId ? data.sessionId.slice(-8) : '';
    return (
      <div className="min-h-[100dvh] flex flex-col items-center p-6 bg-white max-w-lg mx-auto text-center pt-12">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
          <Icon name="check-circle" className="text-emerald-600 text-5xl" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">{copy.heading}</h1>
        <p className="text-slate-600 mt-3 max-w-sm leading-relaxed">
          {copy.body}
        </p>
        <dl className="w-full text-left bg-slate-50 rounded-2xl p-5 mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Estimated total</dt><dd className="font-bold">{data.quoteTotalLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Pay today (10%)</dt><dd className="font-bold">{data.depositLabel}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Due on the day (90%)</dt><dd className="font-bold">{data.balanceLabel}</dd></div>
          {data.customerEmail ? (
            <div className="flex justify-between gap-3 pt-2 border-t border-slate-200">
              <dt className="text-slate-500">Check this inbox</dt>
              <dd className="font-bold break-all text-right">{data.customerEmail}</dd>
            </div>
          ) : null}
        </dl>
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          The remaining 90% is due on the day of the move. We don’t charge the full quote up front.
        </p>
        {ref ? (
          <p className="text-xs text-slate-400 mt-2">Payment reference: {ref}</p>
        ) : null}
        <ConfiguredContact className="text-sm text-slate-500 mt-6" includePhone={false} />
        <div className="mt-4 w-full">
          <ContactActions variant="stack" />
        </div>
        <button type="button" onClick={onReset} className="btn-primary mt-8 w-full">
          Back to home
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
        <Icon name="warning-circle" className="text-amber-600 text-5xl" />
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
      <ConfiguredContact className="text-sm text-slate-500 mt-3" includePhone={false} />
      <div className="mt-4 w-full">
        <ContactActions variant="stack" />
      </div>
      <button type="button" onClick={onReset} className="btn-primary mt-8 w-full">
        Back to home
      </button>
    </div>
  );
};

export default PaymentResultScreen;
