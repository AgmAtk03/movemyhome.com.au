import React, { useState, useEffect, useRef } from 'react';
import { VehicleType } from '../types';
import { formatMoney } from '../lib/quote';
import Icon from './Icon';
import FuelCallout from './FuelCallout';
import ContactActions from './ContactActions';

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
    fuelLitres: number;
    fuelStatus: 'none' | 'waived' | 'priced' | 'tbc';
    dieselAudPerLitre: number | null;
    isFixedTrip: boolean;
    hourlyRate: number;
    deposit: number;
    balance: number;
  };
  fuelLine?: {
    label: string;
    amount: string;
    note?: string;
    status: 'none' | 'waived' | 'priced' | 'tbc';
  };
  vehicle: VehicleType | null;
  isInterstate: boolean;
  step: number;
  readyToPay?: boolean;
  nextHint?: string;
  onNext: () => void;
  onBook: () => void;
}

const SummaryFooter: React.FC<FooterProps> = ({
  breakdown, fuelLine, vehicle, step, readyToPay = false, nextHint, onNext, onBook,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [animatePrice, setAnimatePrice] = useState(false);
  const prevTotalRef = useRef(breakdown.total);
  const isTruck = vehicle === 'truck';
  const isBookStep = step >= 6;
  const showPay = isBookStep && readyToPay;
  const showMoney = step > 1 && Boolean(vehicle);

  useEffect(() => {
    setShowBreakdown(false);
  }, [step, readyToPay]);

  useEffect(() => {
    if (prevTotalRef.current !== breakdown.total) {
      setAnimatePrice(true);
      const timer = setTimeout(() => setAnimatePrice(false), 400);
      prevTotalRef.current = breakdown.total;
      return () => clearTimeout(timer);
    }
  }, [breakdown.total]);

  useEffect(() => {
    const closeOnFormFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('footer')) return;
      if (target.matches('input, textarea, select')) {
        setShowBreakdown(false);
      }
    };
    document.addEventListener('focusin', closeOnFormFocus);
    return () => document.removeEventListener('focusin', closeOnFormFocus);
  }, []);

  return (
    <>
      {showBreakdown && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45]"
          onClick={() => setShowBreakdown(false)}
          aria-hidden="true"
        />
      )}

      <footer className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-5 pt-3 pb-safe z-50 rounded-t-[2rem] shadow-[0_-12px_40px_rgba(0,0,0,0.08)]">
        <div className={animatePrice ? 'animate-price-bump' : undefined}>
          {showMoney ? (
            <dl className="space-y-1">
              <div className="flex justify-between items-baseline gap-3">
                <dt className="text-sm font-bold text-slate-600">Estimated total</dt>
                <dd className="text-2xl font-black text-slate-900 tracking-tight" aria-live="polite">
                  {formatMoney(breakdown.total)}
                </dd>
              </div>
              {showPay && (
                <div className="flex justify-between gap-3 text-sm">
                  <dt className="font-semibold text-slate-500">Pay today (10%)</dt>
                  <dd className="font-black text-slate-800">{formatMoney(breakdown.deposit)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-lg font-black text-slate-400">Your quote appears as you go</p>
          )}
          {isTruck && !breakdown.isFixedTrip && showMoney && (
            <p className="text-[11px] font-bold text-[#0f5a94] mt-1">Hourly truck — final total depends on time on the day</p>
          )}
        </div>

        {showMoney && (
          <button
            type="button"
            className="mt-1 min-h-11 text-left text-[11px] font-bold text-slate-400 flex items-center gap-1"
            onClick={() => setShowBreakdown((open) => !open)}
            aria-expanded={showBreakdown}
            aria-controls="quote-breakdown"
          >
            {showBreakdown ? 'Hide breakdown' : 'See breakdown'}
            <Icon name="caret-up" className={`text-[10px] text-[#146eb4] transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
          </button>
        )}

        {showPay && (
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Fully refundable if you cancel at least 12 hours before your move date and time.
          </p>
        )}

        {nextHint && (
          <p className="text-sm text-rose-700 mt-2 font-medium" role="status">{nextHint}</p>
        )}

        {showPay ? (
          <button type="button" onClick={onBook} className="btn-primary mt-3 w-full text-lg">
            Pay 10% deposit
          </button>
        ) : (
          <button type="button" onClick={onNext} className="btn-primary mt-3 w-full text-lg">
            Continue
          </button>
        )}

        <div className="mt-2">
          <p className="sr-only">Or call or WhatsApp</p>
          <ContactActions variant="dock" />
        </div>

        {showBreakdown && (
          <div id="quote-breakdown" className="absolute bottom-full left-0 right-0 p-6 bg-white border-t border-slate-100 rounded-t-[2rem] shadow-2xl z-[48] max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-xl font-black text-slate-900">What’s in the quote</h4>
              <button type="button" className="w-11 h-11 bg-slate-50 rounded-xl text-slate-500 inline-flex items-center justify-center" onClick={() => setShowBreakdown(false)} aria-label="Close quote details">
                <Icon name="x" className="text-xl" />
              </button>
            </div>

            {isTruck && !breakdown.isFixedTrip && (
              <p className="mb-5 p-4 bg-[#e7f2fa] border border-[#c5dff0] rounded-2xl text-sm text-[#0f5a94]">
                Truck jobs are {formatMoney(breakdown.hourlyRate)} per hour. We’ll confirm the final time with you on the day.
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
                    <span className="text-[#146eb4] font-bold">Included</span>
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

            {fuelLine && fuelLine.status !== 'none' && (
              <FuelCallout fuelLine={fuelLine} />
            )}

            <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900">Estimated total</span>
                <span className="text-2xl font-black text-[#146eb4]">{formatMoney(breakdown.total)}</span>
              </div>
              {isBookStep && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Pay today (10%)</span>
                    <span className="font-bold">{formatMoney(breakdown.deposit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Due on the day (90%)</span>
                    <span className="font-bold">{formatMoney(breakdown.balance)}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    Fully refundable if you cancel at least 12 hours before your move date and time.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </footer>
    </>
  );
};

export default SummaryFooter;
