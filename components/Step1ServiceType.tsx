import React from 'react';
import { ServiceType } from '../types';
import { RATES } from '../constants';
import { formatMoney } from '../lib/quote';

interface Step1ServiceTypeProps {
  selected: ServiceType | null;
  onSelect: (s: ServiceType) => void;
}

const Step1ServiceType: React.FC<Step1ServiceTypeProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-8 animate-premium-in">
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
          What are you moving?
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          Pick the closest match — we can always adjust when we chat.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3" role="list">
        <button
          type="button"
          onClick={() => onSelect('home_move')}
          aria-pressed={selected === 'home_move'}
          className={`group flex items-center gap-5 p-5 min-h-[5.5rem] rounded-[1.75rem] border-2 transition-all duration-300 text-left ${
            selected === 'home_move'
              ? 'border-blue-600 bg-blue-50/70 shadow-lg shadow-blue-500/10'
              : 'border-slate-200 bg-white hover:border-slate-300 active:scale-[0.99]'
          }`}
        >
          <div className={`w-14 h-14 flex items-center justify-center text-3xl rounded-2xl ${
            selected === 'home_move' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'
          }`}>
            <i className="ph-fill ph-house-line" aria-hidden="true"></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-lg text-slate-900 tracking-tight">Whole home</h3>
              <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">Most popular</span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">House, unit, or a full apartment move.</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">From {formatMoney(RATES.TRUCK_HOURLY_TEAM * 2)} · 2-hour truck minimum</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('room_move')}
          aria-pressed={selected === 'room_move'}
          className={`group flex items-center gap-5 p-5 min-h-[5.5rem] rounded-[1.75rem] border-2 transition-all duration-300 text-left ${
            selected === 'room_move'
              ? 'border-violet-600 bg-violet-50/70 shadow-lg shadow-violet-500/10'
              : 'border-slate-200 bg-white hover:border-slate-300 active:scale-[0.99]'
          }`}
        >
          <div className={`w-14 h-14 flex items-center justify-center text-3xl rounded-2xl ${
            selected === 'room_move' ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-700'
          }`}>
            <i className="ph-fill ph-door-open" aria-hidden="true"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-slate-900 tracking-tight">A room or studio</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">One room, share-house bits, or a small load.</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">From {formatMoney(RATES.VAN_BASE)}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('item_delivery')}
          aria-pressed={selected === 'item_delivery'}
          className={`group flex items-center gap-5 p-5 min-h-[5.5rem] rounded-[1.75rem] border-2 transition-all duration-300 text-left ${
            selected === 'item_delivery'
              ? 'border-indigo-600 bg-indigo-50/70 shadow-lg shadow-indigo-500/10'
              : 'border-slate-200 bg-white hover:border-slate-300 active:scale-[0.99]'
          }`}
        >
          <div className={`w-14 h-14 flex items-center justify-center text-3xl rounded-2xl ${
            selected === 'item_delivery' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'
          }`}>
            <i className="ph-fill ph-package" aria-hidden="true"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-slate-900 tracking-tight">A few items</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Marketplace finds, furniture, or a single bulky piece.</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">From {formatMoney(RATES.VAN_BASE)}</p>
          </div>
        </button>
      </div>

      <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
        <p className="text-sm font-medium text-slate-600 leading-relaxed">
          Your quote updates as you go. No hidden extras — if something changes, we’ll talk it through before moving day.
        </p>
      </div>
    </div>
  );
};

export default Step1ServiceType;
