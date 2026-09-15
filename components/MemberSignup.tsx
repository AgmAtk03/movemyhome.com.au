import React, { useState } from 'react';
import { submitMemberSignup, validateMember } from '../lib/members';

const MemberSignup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    heading: string;
    message: string;
    discountCode: string;
  } | null>(null);

  const errors = validateMember({ name, email });
  const show = attempted;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      const response = await submitMemberSignup({ name, email });
      const heading = response.alreadyRedeemed
        ? 'Already used'
        : response.discountCode
          ? 'You’re on the list'
          : 'Saved on this device';
      setResult({
        heading,
        message: response.message,
        discountCode: response.alreadyRedeemed ? '' : response.discountCode,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-[1.75rem] bg-white border border-slate-200 p-6" role="status">
        <p className="text-lg font-black text-slate-900">{result.heading}</p>
        {result.discountCode ? (
          <p className="mt-3 font-black text-slate-900 tracking-wide text-xl">{result.discountCode}</p>
        ) : null}
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white border border-slate-200 p-6 space-y-4" noValidate>
      <div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Name and email only. We’ll email you a code for 5% off your first move.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="member-name" className="text-sm font-bold text-slate-700">Your name</label>
        <input
          id="member-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full min-h-12 px-4 rounded-2xl border text-base text-slate-800 ${
            show && errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'
          }`}
          aria-invalid={show && Boolean(errors.name)}
          aria-describedby={show && errors.name ? 'member-name-error' : undefined}
        />
        {show && errors.name && <p id="member-name-error" className="text-sm text-rose-700">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="member-email" className="text-sm font-bold text-slate-700">Email</label>
        <input
          id="member-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full min-h-12 px-4 rounded-2xl border text-base text-slate-800 ${
            show && errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'
          }`}
          aria-invalid={show && Boolean(errors.email)}
          aria-describedby={show && errors.email ? 'member-email-error' : undefined}
        />
        {show && errors.email && <p id="member-email-error" className="text-sm text-rose-700">{errors.email}</p>}
      </div>

      <button type="submit" className="btn-primary w-full text-base" disabled={submitting} aria-busy={submitting}>
        {submitting ? 'Saving…' : 'Get 5% off'}
      </button>
    </form>
  );
};

export default MemberSignup;
