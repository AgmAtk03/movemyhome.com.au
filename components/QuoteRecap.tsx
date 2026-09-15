import React from 'react';
import { QuoteSnapshot } from '../types';
import FuelCallout from './FuelCallout';

interface QuoteRecapProps {
  snapshot: QuoteSnapshot;
  compact?: boolean;
}

const QuoteRecap: React.FC<QuoteRecapProps> = ({ snapshot, compact = false }) => {
  return (
    <section
      className={`rounded-[1.75rem] border border-slate-100 bg-slate-50 ${compact ? 'p-5' : 'p-6'}`}
      aria-labelledby="quote-recap-heading"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 id="quote-recap-heading" className="text-base font-black text-slate-900 tracking-tight">
            Your quote
          </h3>
        </div>
        <p className="text-xl font-black text-[#146eb4] whitespace-nowrap">{snapshot.totalLabel}</p>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Service</dt>
          <dd className="font-semibold text-slate-800 text-right">{snapshot.serviceLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Vehicle</dt>
          <dd className="font-semibold text-slate-800 text-right">{snapshot.vehicleLabel} · {snapshot.crewLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">When</dt>
          <dd className="font-semibold text-slate-800 text-right">{snapshot.scheduleLabel}</dd>
        </div>
        <div className="pt-2">
          <dt className="text-slate-500 mb-1">Route</dt>
          <dd className="font-medium text-slate-800 whitespace-pre-line leading-relaxed">{snapshot.routeSummary}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Items</dt>
          <dd className="font-semibold text-slate-800 text-right">{snapshot.inventorySummary}</dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-1.5 border-t border-slate-200 pt-4">
        {snapshot.lines.filter((line) => line.label !== 'Fuel').map((line) => (
          <li key={line.label} className="flex justify-between gap-3 text-sm">
            <span className="text-slate-600">{line.label}</span>
            <span className="font-bold text-slate-900">{line.note || line.amount}</span>
          </li>
        ))}
      </ul>

      <FuelCallout fuelLine={snapshot.fuelLine} />

      <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-slate-600">Pay today (10%)</span>
          <span className="font-bold text-slate-900">{snapshot.depositLabel}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-600">Due on the day (90%)</span>
          <span className="font-bold text-slate-900">{snapshot.balanceLabel}</span>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-600 leading-relaxed">
        Pay 10% of the total today to book and hold your slot. Fully refundable if you cancel at least 12 hours before your move date and time.
      </p>
      <p className="mt-3 text-xs font-medium text-slate-500 leading-relaxed">
        Included: {snapshot.included.join(', ')}.
      </p>
    </section>
  );
};

export default QuoteRecap;
