import React from 'react';
import { CONFIG } from '../constants';
import { getPublicContact } from '../lib/contact';
import Icon from './Icon';

type ContactVariant = 'bar' | 'header' | 'hero' | 'stack' | 'inline' | 'dock';

interface ContactActionsProps {
  variant?: ContactVariant;
  className?: string;
}

const brand = CONFIG.COMPANY_NAME;

const ContactActions: React.FC<ContactActionsProps> = ({ variant = 'stack', className = '' }) => {
  const contact = getPublicContact();
  if (!contact.phoneConfigured && !contact.whatsAppConfigured) return null;

  const callLabel = `Call ${brand} on ${contact.display}`;
  const waLabel = `WhatsApp ${brand} on ${contact.display}`;

  if (variant === 'inline') {
    return (
      <p className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
        {contact.telHref && (
          <a
            href={contact.telHref}
            className="inline-flex min-h-11 items-center font-bold text-[#146eb4] underline decoration-[#146eb4]/40 underline-offset-2"
            aria-label={callLabel}
          >
            {contact.display}
          </a>
        )}
        {contact.whatsAppHref && (
          <a
            href={contact.whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-bold text-[#146eb4] underline decoration-[#146eb4]/40 underline-offset-2"
            aria-label={waLabel}
          >
            WhatsApp
          </a>
        )}
      </p>
    );
  }

  if (variant === 'header') {
    return (
      <nav aria-label="Call or WhatsApp" className={`flex items-center gap-1 ${className}`}>
        {contact.telHref && (
          <a
            href={contact.telHref}
            className="min-h-11 min-w-11 px-2 inline-flex items-center justify-center gap-1.5 rounded-xl text-[#146eb4] hover:bg-[#e7f2fa]"
            aria-label={callLabel}
          >
            <Icon name="phone" className="text-lg" />
            <span className="hidden sm:inline text-xs font-black whitespace-nowrap">{contact.display}</span>
          </a>
        )}
        {contact.whatsAppHref && (
          <a
            href={contact.whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 min-w-11 px-2 inline-flex items-center justify-center gap-1.5 rounded-xl text-[#128C7E] hover:bg-emerald-50"
            aria-label={waLabel}
          >
            <Icon name="whatsapp-logo" className="text-lg" />
            <span className="hidden sm:inline text-xs font-black">WhatsApp</span>
          </a>
        )}
      </nav>
    );
  }

  const callClass =
    variant === 'bar'
      ? 'flex-1 min-h-11 px-3 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#c5dff0] text-[#0f5a94] font-bold text-sm'
      : variant === 'dock'
        ? 'flex-1 min-h-12 px-2 sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white border-2 border-[#c5dff0] text-[#0f5a94] font-black text-sm whitespace-nowrap'
        : variant === 'hero'
          ? 'w-full min-h-12 px-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-[#c5dff0] text-[#0f5a94] font-black text-base shadow-sm'
          : 'w-full min-h-12 px-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e7f2fa] border border-[#c5dff0] text-[#0f5a94] font-black text-base';

  const waClass =
    variant === 'bar'
      ? 'flex-1 min-h-11 px-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white font-bold text-sm'
      : variant === 'dock'
        ? 'flex-1 min-h-12 px-2 sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] text-white font-black text-sm whitespace-nowrap'
        : variant === 'hero'
          ? 'w-full min-h-12 px-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white font-black text-base shadow-lg shadow-emerald-500/20'
          : 'w-full min-h-12 px-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white font-black text-base shadow-lg shadow-emerald-500/20';

  const wrap =
    variant === 'stack' || variant === 'hero'
      ? `flex flex-col gap-2 ${className}`
      : `flex gap-2 ${className}`;

  return (
    <nav aria-label="Call or WhatsApp" className={wrap}>
      {contact.telHref && (
        <a href={contact.telHref} className={callClass} aria-label={callLabel}>
          <Icon name="phone" className="text-lg" />
          <span className={variant === 'dock' ? 'whitespace-nowrap' : undefined}>
            {variant === 'dock' ? (
              contact.display
            ) : (
              <>
                <span className="max-[380px]:sr-only">Call </span>
                {contact.display}
              </>
            )}
          </span>
        </a>
      )}
      {contact.whatsAppHref && (
        <a
          href={contact.whatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className={waClass}
          aria-label={waLabel}
        >
          <Icon name="whatsapp-logo" className="text-lg" />
          <span>WhatsApp</span>
        </a>
      )}
    </nav>
  );
};

export default ContactActions;
