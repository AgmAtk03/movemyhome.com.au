import React from 'react';
import { isPhoneConfigured, isWhatsAppConfigured } from '../constants';
import { getPublicContact } from '../lib/contact';
import { isSafeWhatsAppUrl } from '../lib/sanitize';
import ContactActions from './ContactActions';
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
  const quoteWhatsApp = Boolean(whatsappUrl) && isSafeWhatsAppUrl(whatsappUrl || '');
  const contact = getPublicContact();
  if (!isWhatsAppConfigured() && !isPhoneConfigured()) return null;

  const title = heading || (variant === 'success' ? 'Need us sooner?' : 'Prefer a chat?');

  return (
    <section className="space-y-3" aria-labelledby="booking-extras-heading">
      <h3 id="booking-extras-heading" className="text-base font-black text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="text-sm font-medium text-slate-600 leading-relaxed">
        Call or WhatsApp — we’re on {contact.display}.
      </p>
      <ContactActions variant="stack" />
      {quoteWhatsApp && whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 w-full rounded-2xl border-2 border-[#25D366] text-[#128C7E] font-black text-base bg-white"
          aria-label="WhatsApp this quote to My Home Removals"
        >
          <Icon name="whatsapp-logo" className="text-xl" />
          Send this quote on WhatsApp
        </a>
      ) : null}
    </section>
  );
};

export default BookingExtras;
