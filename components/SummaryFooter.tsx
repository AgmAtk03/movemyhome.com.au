
import React, { useState, useEffect, useRef } from 'react';
import { VehicleType } from '../types';
import { formatMoney } from '../lib/quote';

interface FooterProps {
  breakdown: {
    total: number;
    base: number;
    distance: number;
    inventory: number;
    access: number;
    potentialAccess: number;
    cbd: number;
    bedService: number;
    hours: number;
    fuel: number;
    isFixedTrip: boolean;
    hourlyRate: number;
  };
  vehicle: VehicleType | null;
  isInterstate: boolean;
  step: number;
  nextHint?: string;
  onNext: () => void;
  onBook: () => void;
}

const SummaryFooter: React.FC<FooterProps> = ({
  breakdown, vehicle, step, nextHint, onNext, onBook,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [animatePrice, setAnimatePrice] = useState(false);
  const prevTotalRef = useRef(breakdown.total);
  const isTruck = vehicle === 'truck';
  const isBookStep = step >= 6;

  useEffect(() => {
    if (prevTotalRef.current !== breakdown.total) {
      setAnimatePrice(true);
      const timer = setTimeout(() => setAnimatePrice(false), 400);
      prevTotalRef.current = breakdown.total;
      return () => clearTimeout(timer);
    }
  }, [breakdown.total]);

  return (
    <>
      {showBreakdown && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45]"
          onClick={() => setShowBreakdown(false)}
          aria-hidden="true"
        />
      )}

      <footer className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-5 pt-4 pb-safe z-50 rounded-t-[2rem] shadow-[0_-12px_40px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="flex flex-col flex-1 text-left"
            onClick={() => setShowBreakdown(!showBreakdown)}
            aria-expanded={showBreakdown}
            aria-controls="quote-breakdown"
          >
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              Live quote
              <i className={`ph-bold ph-caret-up text-[10px] text-blue-600 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} aria-hidden="true"></i>
            </span>
            <span className={`font-black tracking-tight text-slate-900 ${animatePrice ? 'animate-price-bump' : ''}`} style={{ fontSize: 'clamp(1.5rem, 6vw, 2.1rem)' }} aria-live="polite">
              {step === 1 || !vehicle ? 'As you go' : formatMoney(breakdown.total)}
            </span>
            {isTruck && !breakdown.isFixedTrip && (
              <span className="text-[11px] font-bold text-indigo-700">Estimate · billed on time</span>
            )}
          </button>

          {isBookStep ? (
            <button
              type="button"
              onClick={onBook}
              className="min-h-14 px-5 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm bg-emerald-600 text-white shadow-emerald-600/20 active:scale-[0.97]"
            >
              Book this move
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className={`min-h-14 px-5 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm text-white active:scale-[0.97] ${
                isTruck ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-blue-600 shadow-blue-600/20'
              }`}
            >
              Continue
              <i className="ph-bold ph-arrow-right text-xs" aria-hidden="true"></i>
            </button>
          )}
        </div>
        {nextHint && (
          <p className="text-xs text-rose-700 mt-2 font-medium" role="status">{nextHint}</p>
        )}
        {isBookStep && (
          <p className="text-xs text-slate-500 mt-2">Sends your quote to us. No payment is taken on this screen.</p>
        )}

        {showBreakdown && (
          <div id="quote-breakdown" className="absolute bottom-full left-0 right-0 p-6 bg-white border-t border-slate-100 rounded-t-[2rem] shadow-2xl z-[48] max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-xl font-black text-slate-900">What you’re paying for</h4>
              <button type="button" className="w-11 h-11 bg-slate-50 rounded-xl text-slate-500" onClick={() => setShowBreakdown(false)} aria-label="Close quote details">
                <i className="ph ph-x text-xl" aria-hidden="true"></i>
              </button>
            </div>

            {isTruck && !breakdown.isFixedTrip && (
              <p className="mb-5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm text-indigo-900">
                Truck jobs are billed at {formatMoney(breakdown.hourlyRate)} per hour. The total below is an estimate until we finish on the day.
              </p>
            )}

            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-slate-600">Vehicle and travel</span>
                <span className="font-bold">{formatMoney(breakdown.base)}</span>
              </li>
              {breakdown.distance > 0 && vehicle === 'van' && (
                <li className="flex justify-between gap-3">
                  <span className="text-slate-600">Distance</span>
                  <span className="font-bold">{formatMoney(breakdown.distance)}</span>
                </li>
              )}
              {breakdown.fuel > 0 && (
                <li className="flex justify-between gap-3">
                  <span className="text-slate-600">Fuel estimate</span>
                  <span className="font-bold">{formatMoney(breakdown.fuel)}</span>
                </li>
              )}
              {breakdown.inventory > 0 && (
                <li className="flex justify-between gap-3">
                  <span className="text-slate-600">Items</span>
                  <span className="font-bold">{formatMoney(breakdown.inventory)}</span>
                </li>
              )}
              {breakdown.potentialAccess > 0 && (
                <li className="flex justify-between gap-3">
                  <span className={isTruck ? 'text-slate-400 line-through' : 'text-slate-600'}>Stairs and access</span>
                  {isTruck ? (
                    <span className="text-emerald-700 font-bold">Included</span>
                  ) : (
                    <span className="font-bold">{formatMoney(breakdown.access)}</span>
                  )}
                </li>
              )}
              {breakdown.cbd > 0 && (
                <li className="flex justify-between gap-3">
                  <span className="text-slate-600">Sydney CBD parking</span>
                  <span className="font-bold">{formatMoney(breakdown.cbd)}</span>
                </li>
              )}
              {breakdown.bedService > 0 && (
                <li className="flex justify-between gap-3">
                  <span className="text-slate-600">Bed take-down</span>
                  <span className="font-bold">{formatMoney(breakdown.bedService)}</span>
                </li>
              )}
            </ul>

            <div className="pt-5 mt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="font-black text-slate-900">{isTruck && !breakdown.isFixedTrip ? 'Estimated total' : 'Quote total'}</span>
              <span className={`text-2xl font-black ${isTruck ? 'text-indigo-700' : 'text-blue-700'}`}>{formatMoney(breakdown.total)}</span>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Quotes include transit insurance and public liability. We’ll talk through anything that might change the price before we start.
            </p>
          </div>
        )}
      </footer>
    </>
  );
};

export default SummaryFooter;
