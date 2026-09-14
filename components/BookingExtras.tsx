import React from 'react';
import { CONFIG, isStripePaymentLinkConfigured, isWhatsAppConfigured } from '../constants';

interface BookingExtrasProps {
  whatsappUrl: string | null;
  heading?: string;
}

const BookingExtras: React.FC<BookingExtrasProps> = ({ whatsappUrl, heading = 'Prefer to chat or pay a deposit?' }) => {
  const stripeReady = isStripePaymentLinkConfigured();
  const whatsappReady = isWhatsAppConfigured() && Boolean(whatsappUrl);

  return (
    <section className="space-y-3" aria-labelledby="booking-extras-heading">
      <h3 id="booking-extras-heading" className="text-base font-black text-slate-900 tracking-tight">
        {heading}
      </h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">
        Booking here sends your details to our team. You’re not charged on this page. Chat to us on WhatsApp anytime, or use a card link once payments are switched on.
      </p>

      {whatsappReady && whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 items-center justify-center gap-2 w-full rounded-2xl bg-[#25D366] text-white font-black text-base shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
        >
          <i className="ph-fill ph-whatsapp-logo text-xl" aria-hidden="true"></i>
          Message us on WhatsApp
        </a>
      ) : (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          WhatsApp will appear here once a business number is added. You can still call{' '}
          <a className="font-bold text-blue-700 underline" href={`tel:${CONFIG.COMPANY_PHONE.replace(/\s/g, '')}`}>
            {CONFIG.COMPANY_PHONE}
          </a>
          .
        </p>
      )}

      {stripeReady ? (
        <a
          href={CONFIG.STRIPE_PAYMENT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 items-center justify-center gap-2 w-full rounded-2xl bg-slate-900 text-white font-black text-base active:scale-[0.98] transition-transform"
        >
          <i className="ph-fill ph-credit-card text-xl" aria-hidden="true"></i>
          Pay a deposit (AUD)
        </a>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
          <p className="font-bold text-slate-800 text-sm">Card payment (Stripe)</p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Deposits in Australian dollars aren’t live yet. After we confirm your move, we’ll send a secure Stripe Payment Link — you won’t enter card details in this form.
          </p>
        </div>
      )}
    </section>
  );
};

export default BookingExtras;
