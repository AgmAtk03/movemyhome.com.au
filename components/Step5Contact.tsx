import React, { useLayoutEffect } from 'react';
import { MoveDetails, QuoteSnapshot } from '../types';
import { ContactErrors } from '../lib/validation';
import QuoteRecap from './QuoteRecap';
import Icon from './Icon';
import { isSafeWhatsAppUrl } from '../lib/sanitize';

interface Step5Props {
  details: MoveDetails;
  onUpdateDetails: (d: Partial<MoveDetails>) => void;
  snapshot: QuoteSnapshot;
  whatsappUrl: string | null;
  errors: ContactErrors;
  showErrors: boolean;
  phase: 'details' | 'review';
  onEditDetails: () => void;
}

const fieldClass = (invalid: boolean) =>
  `w-full min-h-12 pl-14 p-4 bg-white border rounded-2xl text-base font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#146eb4]/15 ${
    invalid ? 'border-rose-400' : 'border-slate-200 focus:border-[#146eb4]'
  }`;

const ContactSummary: React.FC<{ details: MoveDetails; onEdit?: () => void }> = ({ details, onEdit }) => {
  const notes = details.instructions.trim();
  return (
    <section
      className="rounded-[1.75rem] border border-slate-100 bg-white p-5"
      aria-labelledby="contact-summary-heading"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 id="contact-summary-heading" className="text-base font-black text-slate-900 tracking-tight">
          Your details
        </h3>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 px-3 text-sm font-bold text-[#146eb4]"
          >
            Edit
          </button>
        ) : null}
      </div>
      <dl className="space-y-2.5">
        {details.name.trim() ? (
          <div>
            <dt className="text-xs font-semibold text-slate-400">Name</dt>
            <dd className="text-base font-semibold text-slate-900">{details.name.trim()}</dd>
          </div>
        ) : null}
        {details.phone.trim() ? (
          <div>
            <dt className="text-xs font-semibold text-slate-400">Mobile</dt>
            <dd className="text-base font-semibold text-slate-900">{details.phone.trim()}</dd>
          </div>
        ) : null}
        {details.email.trim() ? (
          <div>
            <dt className="text-xs font-semibold text-slate-400">Email</dt>
            <dd className="text-base font-semibold text-slate-900 break-all">{details.email.trim()}</dd>
          </div>
        ) : null}
        {notes ? (
          <div>
            <dt className="text-xs font-semibold text-slate-400">Notes</dt>
            <dd className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{notes}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
};

const Step5Contact: React.FC<Step5Props> = ({
  details, onUpdateDetails, snapshot, whatsappUrl, errors, showErrors, phase, onEditDetails,
}) => {
  const filled = Boolean(details.name.trim() || details.email.trim() || details.phone.trim());
  const quoteWhatsApp = Boolean(whatsappUrl) && isSafeWhatsAppUrl(whatsappUrl || '');

  useLayoutEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, [phase]);

  if (phase === 'review') {
    return (
      <div className="space-y-6 animate-premium-in pb-10">
        <div className="space-y-2">
          <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
            Check your booking
          </h2>
          <p className="text-slate-500 text-base font-medium leading-relaxed">
            A quiet look over the plan before you pay the 10% deposit.
          </p>
        </div>

        <ContactSummary details={details} onEdit={onEditDetails} />
        <QuoteRecap snapshot={snapshot} />

        {quoteWhatsApp && whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-bold text-[#128C7E]"
          >
            Send this quote on WhatsApp
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-premium-in pb-10">
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
          How can we reach you?
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          We’ll use this to confirm your booking. We never share your details.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="customer-name" className="text-sm font-bold text-slate-700">Your name</label>
            <span className="text-xs font-semibold text-[#146eb4]">Required</span>
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <Icon name="user" className="text-xl" />
            </span>
            <input
              id="customer-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Sam Nguyen"
              className={fieldClass(showErrors && Boolean(errors.name))}
              value={details.name}
              onChange={(e) => onUpdateDetails({ name: e.target.value })}
              aria-invalid={showErrors && Boolean(errors.name)}
              aria-describedby={showErrors && errors.name ? 'name-error' : undefined}
            />
          </div>
          {showErrors && errors.name && <p id="name-error" className="text-sm text-rose-700">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="customer-email" className="text-sm font-bold text-slate-700">Email</label>
            <span className="text-xs font-semibold text-[#146eb4]">Required</span>
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <Icon name="envelope-simple" className="text-xl" />
            </span>
            <input
              id="customer-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="e.g. sam@email.com"
              className={fieldClass(showErrors && Boolean(errors.email))}
              value={details.email}
              onChange={(e) => onUpdateDetails({ email: e.target.value })}
              aria-invalid={showErrors && Boolean(errors.email)}
              aria-describedby={showErrors && errors.email ? 'email-error' : undefined}
            />
          </div>
          {showErrors && errors.email && <p id="email-error" className="text-sm text-rose-700">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="customer-phone" className="text-sm font-bold text-slate-700">Mobile</label>
            <span className="text-xs font-semibold text-[#146eb4]">Required</span>
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <Icon name="phone" className="text-xl" />
            </span>
            <input
              id="customer-phone"
              name="tel"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="e.g. 0400 000 000"
              className={fieldClass(showErrors && Boolean(errors.phone))}
              value={details.phone}
              onChange={(e) => onUpdateDetails({ phone: e.target.value })}
              aria-invalid={showErrors && Boolean(errors.phone)}
              aria-describedby={showErrors && errors.phone ? 'phone-error' : undefined}
            />
          </div>
          {showErrors && errors.phone && <p id="phone-error" className="text-sm text-rose-700">{errors.phone}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customer-notes" className="text-sm font-bold text-slate-700">Anything we should know? (optional)</label>
          <textarea
            id="customer-notes"
            name="instructions"
            placeholder="Parking, stairs we missed, heavy pieces, gate codes…"
            rows={3}
            className="w-full p-4 bg-white border border-slate-200 rounded-3xl text-base font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-[#146eb4]/15 focus:border-[#146eb4] resize-none"
            value={details.instructions}
            onChange={(e) => onUpdateDetails({ instructions: e.target.value })}
          />
        </div>
      </div>

      {filled ? <ContactSummary details={details} /> : null}
    </div>
  );
};

export default Step5Contact;
