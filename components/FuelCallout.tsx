import React from 'react';
import { QuoteSnapshot } from '../types';

interface FuelCalloutProps {
  fuelLine: QuoteSnapshot['fuelLine'];
}

const FuelCallout: React.FC<FuelCalloutProps> = ({ fuelLine }) => {
  if (fuelLine.status === 'none') return null;

  const tone = fuelLine.status === 'tbc'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : 'border-[#c5dff0] bg-[#e7f2fa] text-[#0f5a94]';

  return (
    <div className={`mt-4 rounded-2xl border p-4 ${tone}`} role="status">
      <div className="flex justify-between gap-3 items-baseline">
        <p className="text-sm font-black tracking-tight">Fuel</p>
        <p className="text-lg font-black">{fuelLine.amount}</p>
      </div>
      {fuelLine.note && (
        <p className="mt-1.5 text-xs font-medium leading-relaxed opacity-90">{fuelLine.note}</p>
      )}
    </div>
  );
};

export default FuelCallout;
