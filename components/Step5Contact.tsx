import React from 'react';
import { MoveDetails, QuoteSnapshot } from '../types';
import { ContactErrors } from '../lib/validation';
import QuoteRecap from './QuoteRecap';
import BookingExtras from './BookingExtras';

interface Step5Props {
  details: MoveDetails;
  onUpdateDetails: (d: Partial<MoveDetails>) => void;
  snapshot: QuoteSnapshot;
  whatsappUrl: string | null;
  errors: ContactErrors;
  showErrors: boolean;
}

const fieldClass = (invalid: boolean) =>
  `w-full min-h-12 pl-14 p-4 bg-white border rounded-2xl text-base font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/15 ${
    invalid ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
  }`;

const Step5Contact: React.FC<Step5Props> = ({ details, onUpdateDetails, snapshot, whatsappUrl, errors, showErrors }) => {
  return (
    <div className="space-y-8 animate-premium-in pb-10">
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
          How can we reach you?
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          This is an estimate. Pay 10% now to hold the slot. The remaining 90% is due on the day. You’ll enter card details on Stripe — not on this page.
        </p>
      </div>

      <QuoteRecap snapshot={snapshot} />

      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="customer-name" className="text-sm font-bold text-slate-700">Your name</label>
            <span className="text-xs font-semibold text-blue-700">Required</span>
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <i className="ph-bold ph-user text-xl"></i>
            </span>
            <input
              id="customer-name"
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
            <span className="text-xs font-semibold text-blue-700">Required</span>
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <i className="ph-bold ph-envelope-simple text-xl"></i>
            </span>
            <input
              id="customer-email"
              type="email"
              autoComplete="email"
              inputMode="email"
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
            <span className="text-xs font-semibold text-blue-700">Required</span>
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <i className="ph-bold ph-phone text-xl"></i>
            </span>
            <input
              id="customer-phone"
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
            placeholder="Parking, stairs we missed, heavy pieces, gate codes…"
            rows={4}
            className="w-full p-4 bg-white border border-slate-200 rounded-3xl text-base font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 resize-none"
            value={details.instructions}
            onChange={(e) => onUpdateDetails({ instructions: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-emerald-50 p-5 rounded-[1.75rem] border border-emerald-100">
        <h3 className="font-bold text-emerald-950">Pay 10% to hold this slot</h3>
        <p className="text-sm text-emerald-900 mt-2 leading-relaxed">
          We recalculate the quote on the server from the same rate table. You are not charged the full amount. Card details stay on Stripe.
        </p>
      </div>

      <BookingExtras whatsappUrl={whatsappUrl} />
    </div>
  );
};

export default Step5Contact;
