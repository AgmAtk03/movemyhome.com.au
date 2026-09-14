import React from 'react';
import { CONFIG, isWhatsAppConfigured } from '../constants';
import { isSafeWhatsAppUrl } from '../lib/sanitize';

interface BookingExtrasProps {
  whatsappUrl: string | null;
  heading?: string;
  variant?: 'booking' | 'success';
}

const BookingExtras: React.FC<BookingExtrasProps> = ({
  whatsappUrl,
  heading,
  variant = 'booking',
}) => {
  const whatsappReady = isWhatsAppConfigured() && Boolean(whatsappUrl) && isSafeWhatsAppUrl(whatsappUrl || '');
  const title = heading || (variant === 'success' ? 'Need us sooner?' : 'Prefer to chat on WhatsApp?');

  return (
    <section className="space-y-3" aria-labelledby="booking-extras-heading">
      <h3 id="booking-extras-heading" className="text-base font-black text-slate-900 tracking-tight">
        {title}
      </h3>
      {variant === 'booking' && (
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          Pay 10% on Stripe-hosted Checkout. Card numbers never touch this site.
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
        <p className="text-sm font-bold text-blue-800 text-center">
          Prefer a call? {CONFIG.COMPANY_PHONE}
        </p>
      )}
    </section>
  );
};

export default BookingExtras;
