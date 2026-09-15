import React from 'react';
import { isPhoneConfigured, isWhatsAppConfigured } from '../constants';
import { isSafeWhatsAppUrl } from '../lib/sanitize';
import ConfiguredContact from './ConfiguredContact';
import Icon from './Icon';

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
  if (!whatsappReady && !isPhoneConfigured()) return null;

  const title = heading || (variant === 'success' ? 'Need us sooner?' : 'Prefer a chat?');

  return (
    <section className="space-y-3" aria-labelledby="booking-extras-heading">
      <h3 id="booking-extras-heading" className="text-base font-black text-slate-900 tracking-tight">
        {title}
      </h3>

      {whatsappReady && whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 items-center justify-center gap-2 w-full rounded-2xl bg-[#25D366] text-white font-black text-base shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
        >
          <Icon name="whatsapp-logo" className="text-xl" />
          Message us on WhatsApp
        </a>
      ) : (
        <ConfiguredContact className="text-sm font-semibold text-slate-600 text-center" />
      )}
    </section>
  );
};

export default BookingExtras;
