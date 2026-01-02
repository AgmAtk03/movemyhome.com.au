
import React, { useState, useEffect, useRef } from 'react';
import { VehicleType } from '../types';
import { RATES } from '../constants';

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
  isContactValid?: boolean;
  onNext: () => void;
  onBook: () => void;
}

const SummaryFooter: React.FC<FooterProps> = ({ breakdown, vehicle, isInterstate, step, isContactValid = true, onNext, onBook }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [animatePrice, setAnimatePrice] = useState(false);
  const prevTotalRef = useRef(breakdown.total);
  const isTruck = vehicle === 'truck';

  // Trigger animation when price changes
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] animate-in fade-in transition-all duration-500"
          onClick={() => setShowBreakdown(false)}
        />
      )}
      
      <footer className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-6 py-6 pb-safe z-50 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col cursor-pointer group flex-1" onClick={() => setShowBreakdown(!showBreakdown)}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] leading-none">Instant Quote</span>
              <i className={`ph-bold ph-caret-up text-[10px] text-blue-500 transition-transform duration-500 ${showBreakdown ? 'rotate-180' : ''}`}></i>
            </div>
            <div className={`flex items-baseline gap-0.5 transition-all duration-300 ${animatePrice ? 'animate-price-bump' : ''}`}>
              <span className="text-slate-900 font-black tracking-tighter" style={{ fontSize: 'clamp(1.75rem, 7vw, 2.5rem)' }}>
                ${breakdown.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
              <span className="text-slate-300 font-bold" style={{ fontSize: 'clamp(0.875rem, 3vw, 1.125rem)' }}>.00</span>
              {isTruck && !breakdown.isFixedTrip && (
                <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded ml-1 tracking-tighter uppercase self-center">Est</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {step < 6 ? (
              <button 
                onClick={onNext}
                disabled={(step === 2 && !vehicle)}
                className={`h-14 font-black rounded-2xl shadow-xl active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:grayscale whitespace-nowrap ${
                  isTruck ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-blue-600 text-white shadow-blue-600/20'
                }`}
                style={{ width: 'clamp(120px, 35vw, 160px)' }}
              >
                NEXT <i className="ph-bold ph-arrow-right text-xs"></i>
              </button>
            ) : (
              <button 
                onClick={onBook}
                disabled={!isContactValid}
                className={`h-14 font-black rounded-2xl shadow-xl active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:grayscale whitespace-nowrap ${
                  isContactValid ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
                style={{ width: 'clamp(120px, 35vw, 160px)' }}
              >
                BOOK <i className="ph-bold ph-paper-plane-tilt text-xs"></i>
              </button>
            )}
          </div>
        </div>
        
        {showBreakdown && (
          <div className="absolute bottom-full left-0 right-0 p-8 bg-white border-t border-slate-100 animate-slide-up rounded-t-[3rem] shadow-2xl z-[48] max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 cursor-pointer active:scale-90 transition-transform" onClick={() => setShowBreakdown(false)}></div>
            
            {isTruck && !breakdown.isFixedTrip && (
              <div className="mb-8 p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="ph-fill ph-timer"></i>
                </div>
                <div>
                  <h5 className="font-black text-indigo-900 text-xs tracking-tight uppercase">Hourly Professional Rate</h5>
                  <p className="text-indigo-700 text-[10px] font-bold tracking-wide uppercase opacity-75 leading-tight">Final price based on total time at ${breakdown.hourlyRate}/hr.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
               <h4 className="text-2xl font-black text-slate-900 tracking-tight">Price Summary</h4>
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400" onClick={() => setShowBreakdown(false)}>
                  <i className="ph ph-x text-xl"></i>
               </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                       <i className="ph-fill ph-truck"></i>
                    </div>
                    <span className="uppercase tracking-widest text-[10px] font-black text-slate-400">Base Logistics</span>
                  </div>
                  <span className="text-slate-900 font-black text-sm">${breakdown.base.toFixed(2)}</span>
              </div>
              
              {breakdown.distance > 0 && vehicle === 'van' && (
                  <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                           <i className="ph-fill ph-map-trifold"></i>
                        </div>
                        <span className="uppercase tracking-widest text-[10px] font-black text-slate-400">Travel Surcharge</span>
                      </div>
                      <span className="text-slate-900 font-black text-sm">${breakdown.distance.toFixed(2)}</span>
                  </div>
              )}
              
              {breakdown.inventory > 0 && (
                  <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                           <i className="ph-fill ph-package"></i>
                        </div>
                        <span className="uppercase tracking-widest text-[10px] font-black text-slate-400">Inventory Items</span>
                      </div>
                      <span className="text-slate-900 font-black text-sm">${breakdown.inventory.toFixed(2)}</span>
                  </div>
              )}

              {breakdown.potentialAccess > 0 && (
                  <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center">
                           <i className="ph-fill ph-stairs"></i>
                        </div>
                        <span className={`uppercase tracking-widest text-[10px] font-black ${isTruck ? 'line-through text-slate-300' : 'text-slate-400'}`}>Stairs & Access</span>
                      </div>
                      {isTruck ? (
                        <span className="text-emerald-500 text-[10px] uppercase font-black px-2 py-0.5 bg-emerald-50 rounded-md">Complimentary</span>
                      ) : (
                        <span className="text-slate-900 font-black text-sm">${breakdown.access.toFixed(2)}</span>
                      )}
                  </div>
              )}

              {breakdown.cbd > 0 && (
                  <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                           <i className="ph-fill ph-buildings"></i>
                        </div>
                        <span className="uppercase tracking-widest text-[10px] font-black text-blue-500">CBD Access Fee</span>
                      </div>
                      <span className="text-slate-900 font-black text-sm">${breakdown.cbd.toFixed(2)}</span>
                  </div>
              )}

              {breakdown.bedService > 0 && (
                  <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                           <i className="ph-fill ph-wrench"></i>
                        </div>
                        <span className="uppercase tracking-widest text-[10px] font-black text-slate-400">Bed Service</span>
                      </div>
                      <span className="text-slate-900 font-black text-sm">${breakdown.bedService.toFixed(2)}</span>
                  </div>
              )}

              <div className="pt-6 mt-4 border-t-2 border-slate-50 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                  {isTruck && !breakdown.isFixedTrip ? 'Estimated Total' : 'Total Quote'}
                </span>
                <span className={`text-4xl font-black tracking-tighter ${isTruck ? 'text-indigo-600' : 'text-blue-600'}`}>
                  ${breakdown.total.toFixed(0)}<span className="text-xl opacity-30">.00</span>
                </span>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-3xl text-[9px] text-center font-bold uppercase tracking-[0.2em] text-slate-400 mt-4 border border-slate-100 leading-relaxed">
                Quotes include premium transit insurance<br/>& public liability for total peace of mind.
              </div>
            </div>
          </div>
        )}
      </footer>
    </>
  );
};

export default SummaryFooter;
