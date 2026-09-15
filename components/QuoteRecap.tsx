import React from 'react';
import { QuoteSnapshot } from '../types';

interface QuoteRecapProps {
  snapshot: QuoteSnapshot;
}

const Row: React.FC<{ label: string; value: string; multiline?: boolean }> = ({
  label, value, multiline,
}) => (
  <div className={multiline ? 'space-y-1' : 'flex justify-between gap-4'}>
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className={`text-sm font-semibold text-slate-800 ${multiline ? 'leading-relaxed whitespace-pre-line' : 'text-right'}`}>
      {value}
    </dd>
  </div>
);

/** Job overview only — no payout line items (those live in the footer breakdown). */
const QuoteRecap: React.FC<QuoteRecapProps> = ({ snapshot }) => {
  return (
    <section
      className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 space-y-4"
      aria-labelledby="quote-recap-heading"
    >
      <h3 id="quote-recap-heading" className="text-base font-black text-slate-900 tracking-tight">
        Your move
      </h3>
      <dl className="space-y-3">
        <Row label="Service" value={snapshot.serviceLabel} />
        <Row label="Vehicle" value={`${snapshot.vehicleLabel} · ${snapshot.crewLabel}`} />
        <Row label="When" value={snapshot.scheduleLabel} />
        <Row label="From / to" value={snapshot.routeSummary} multiline />
        <Row label="Items" value={snapshot.inventorySummary} />
        {snapshot.distanceLabel && !snapshot.distanceLabel.startsWith('0.0') ? (
          <Row label="Distance" value={snapshot.distanceLabel} />
        ) : null}
      </dl>
    </section>
  );
};

export default QuoteRecap;
