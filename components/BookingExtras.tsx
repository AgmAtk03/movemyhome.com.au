import React from 'react';
import { CONFIG, isWhatsAppConfigured } from '../constants';
import { isSafeStripePaymentLink, isSafeWhatsAppUrl } from '../lib/sanitize';

interface BookingExtrasProps {
  whatsappUrl: string | null;
  stripeUrl: string | null;
  heading?: string;
  /** Success screen: emphasise confirm-by-email + optional pay. */
  variant?: 'booking' | 'success';
}

const BookingExtras: React.FC<BookingExtrasProps> = ({
  whatsappUrl,
  stripeUrl,
  heading,
  variant = 'booking',
}) => {
  const whatsappReady = isWhatsAppConfigured() && Boolean(whatsappUrl) && isSafeWhatsAppUrl(whatsappUrl || '');
  const stripeReady = Boolean(stripeUrl) && isSafeStripePaymentLink(stripeUrl || '');
  const title = heading || (variant === 'success' ? 'Need us sooner, or ready to pay a deposit?' : 'Prefer to chat on WhatsApp?');

  return (
    <section className="space-y-3" aria-labelledby="booking-extras-heading">
      <h3 id="booking-extras-heading" className="text-base font-black text-slate-900 tracking-tight">
        {title}
      </h3>
      {variant === 'booking' && (
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          Booking here sends your details to our team. You’re not charged on this page.
        </p>
      )}

      {whatsappReady && whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 items-center justify-center gap-2 w-full rounded-2xl bg-[#25D366] text-white font-black text-base shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
        >
          <i className="ph-fill ph-whatsapp-logo text-xl" aria-hidden="true"></i>
          WhatsApp us with this job
        </a>
      ) : (
        <a
          className="flex min-h-12 items-center justify-center text-sm font-bold text-blue-800"
          href={`tel:${CONFIG.COMPANY_PHONE.replace(/\s/g, '')}`}
        >
          Prefer a call? {CONFIG.COMPANY_PHONE}
        </a>
      )}

      {stripeReady && stripeUrl ? (
        <a
          href={stripeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 items-center justify-center gap-2 w-full rounded-2xl bg-slate-900 text-white font-black text-base active:scale-[0.98] transition-transform"
        >
          <i className="ph-fill ph-credit-card text-xl" aria-hidden="true"></i>
          Pay a deposit (AUD)
        </a>
      ) : (
        <p className="text-sm text-slate-500 leading-relaxed">
          Deposit link coming soon — after we confirm, we can send a secure card link. You won’t enter card details in this form.
        </p>
      )}
    </section>
  );
};

export default BookingExtras;
