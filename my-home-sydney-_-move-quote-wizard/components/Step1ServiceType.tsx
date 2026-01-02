
import React from 'react';
import { ServiceType } from '../types';
import { RATES } from '../constants';

interface Step1ServiceTypeProps {
  selected: ServiceType | null;
  onSelect: (s: ServiceType) => void;
}

const Step1ServiceType: React.FC<Step1ServiceTypeProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-8 animate-premium-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">How can we help?</h2>
        <p className="text-slate-500 text-sm font-medium">Select the type of service you require today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Home Move Option */}
        <button
          onClick={() => onSelect('home_move')}
          className={`group flex items-center gap-6 p-7 rounded-[2.5rem] border-2 transition-all duration-300 text-left relative overflow-hidden ${
            selected === 'home_move'
              ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-500/10'
              : 'border-slate-100 bg-white hover:border-slate-200 active:scale-[0.98]'
          }`}
        >
          <div className={`w-16 h-16 flex items-center justify-center text-4xl rounded-2xl transition-all duration-500 ${
            selected === 'home_move' ? 'bg-blue-600 text-white scale-110' : 'bg-slate-50 group-hover:scale-105'
          }`}>
            <i className="ph-fill ph-house-line"></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-black text-lg text-slate-900 tracking-tight leading-none">Home Move</h3>
              <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Best Value</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-tight mb-2">Full House/Unit relocations.</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting from ${RATES.TRUCK_HOURLY_TEAM * 2}</span>
          </div>
          {selected === 'home_move' && <i className="ph-fill ph-check-circle text-blue-600 text-2xl"></i>}
        </button>

        {/* Room Move Option */}
        <button
          onClick={() => onSelect('room_move')}
          className={`group flex items-center gap-6 p-7 rounded-[2.5rem] border-2 transition-all duration-300 text-left relative overflow-hidden ${
            selected === 'room_move'
              ? 'border-violet-600 bg-violet-50/50 shadow-xl shadow-violet-500/10'
              : 'border-slate-100 bg-white hover:border-slate-200 active:scale-[0.98]'
          }`}
        >
          <div className={`w-16 h-16 flex items-center justify-center text-4xl rounded-2xl transition-all duration-500 ${
            selected === 'room_move' ? 'bg-violet-600 text-white scale-110' : 'bg-slate-50 group-hover:scale-105'
          }`}>
            <i className="ph-fill ph-door-open"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-slate-900 tracking-tight leading-none mb-0.5">Room Move</h3>
            <p className="text-sm text-slate-500 font-medium leading-tight mb-2">Single room or studio items.</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting from ${RATES.VAN_BASE}</span>
          </div>
          {selected === 'room_move' && <i className="ph-fill ph-check-circle text-violet-600 text-2xl"></i>}
        </button>

        {/* Item Delivery Option */}
        <button
          onClick={() => onSelect('item_delivery')}
          className={`group flex items-center gap-6 p-7 rounded-[2.5rem] border-2 transition-all duration-300 text-left relative overflow-hidden ${
            selected === 'item_delivery'
              ? 'border-indigo-600 bg-indigo-50/50 shadow-xl shadow-indigo-500/10'
              : 'border-slate-100 bg-white hover:border-slate-200 active:scale-[0.98]'
          }`}
        >
          <div className={`w-16 h-16 flex items-center justify-center text-4xl rounded-2xl transition-all duration-500 ${
            selected === 'item_delivery' ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-50 group-hover:scale-105'
          }`}>
            <i className="ph-fill ph-package"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-slate-900 tracking-tight leading-none mb-0.5">Delivery</h3>
            <p className="text-sm text-slate-500 font-medium leading-tight mb-2">Furniture or Marketplace items.</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting from ${RATES.VAN_BASE}</span>
          </div>
          {selected === 'item_delivery' && <i className="ph-fill ph-check-circle text-indigo-600 text-2xl"></i>}
        </button>
      </div>

      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
        <div className="flex items-center gap-3 text-slate-400 mb-2">
          <i className="ph-fill ph-lightning text-lg"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Instant Quotes</span>
        </div>
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
          Prices adjust automatically based on your inventory, distance, and chosen vehicle. No hidden surprises.
        </p>
      </div>
    </div>
  );
};

export default Step1ServiceType;
