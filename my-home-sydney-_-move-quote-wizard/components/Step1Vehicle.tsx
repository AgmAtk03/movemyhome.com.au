
import React from 'react';
import { VehicleType, ServiceType } from '../types';
import { VEHICLE_OPTIONS, RATES } from '../constants';

interface Step1Props {
  selected: VehicleType | null;
  serviceType: ServiceType | null;
  truckHours: number;
  crewSize: number;
  distanceKm: number;
  travelTimeHrs: number;
  isInterstate: boolean;
  onSelect: (v: VehicleType) => void;
  onTruckHoursChange: (h: number) => void;
  onCrewSizeChange: (s: number) => void;
  onNext: () => void;
}

const Step1Vehicle: React.FC<Step1Props> = ({ 
  selected, serviceType, truckHours, crewSize, distanceKm, travelTimeHrs, isInterstate, 
  onSelect, onTruckHoursChange, onCrewSizeChange, onNext 
}) => {
  const isLongDistance = distanceKm > RATES.LONG_DISTANCE_THRESHOLD;
  const currentRate = crewSize === 1 ? RATES.TRUCK_HOURLY_SOLO : RATES.TRUCK_HOURLY_TEAM;
  const hideDescription = serviceType === 'item_delivery';

  const handleAdjustHours = (delta: number) => {
    onTruckHoursChange(Math.max(2, truckHours + delta));
  };

  return (
    <div className="space-y-8 animate-premium-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select your vehicle</h2>
        <p className="text-slate-500 text-sm font-medium">Choose the size that best fits your move requirements.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {VEHICLE_OPTIONS.map((opt) => {
          const isDisabled = opt.id === 'van' && (isInterstate || isLongDistance);
          const isSelected = selected === opt.id;
          const rateDisplay = opt.id === 'van' ? `Fixed from $${RATES.VAN_BASE}` : `From $${RATES.TRUCK_HOURLY_TEAM}/hr`;
          
          return (
            <button
              key={opt.id}
              disabled={isDisabled}
              onClick={() => {
                onSelect(opt.id as VehicleType);
                if (opt.id === 'van') setTimeout(onNext, 400);
              }}
              className={`group relative flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all duration-300 text-left ${
                isSelected 
                  ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-500/10' 
                  : isDisabled 
                    ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' 
                    : 'border-slate-100 bg-white hover:border-slate-200 active:scale-[0.98]'
              }`}
            >
              <div className={`w-16 h-16 flex items-center justify-center text-4xl rounded-2xl transition-transform duration-500 ${isSelected ? 'bg-blue-600 scale-110' : 'bg-slate-50 group-hover:scale-105'}`}>
                {opt.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-lg text-slate-900 leading-none">{opt.name}</span>
                  {isSelected && <i className="ph-fill ph-check-circle text-blue-600 text-xl"></i>}
                </div>
                {!hideDescription ? (
                  <span className="text-sm text-slate-500 font-medium block mb-1">{opt.desc}</span>
                ) : <div className="h-1"></div>}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rateDisplay}</span>
              </div>
              
              {isDisabled && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-rose-500/20">
                  Heavy Load / Distance
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected === 'truck' && (
        <div className="space-y-6 animate-premium-in py-2">
          <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Move Crew Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onCrewSizeChange(1)}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${crewSize === 1 ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-500/5' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
              >
                <i className={`ph-fill ph-user text-2xl ${crewSize === 1 ? 'text-indigo-600' : 'text-slate-300'}`}></i>
                <span className="font-black text-xs uppercase tracking-wider">Solo Professional</span>
              </button>
              <button 
                onClick={() => onCrewSizeChange(2)}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${crewSize === 2 ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-500/5' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
              >
                <div className="flex gap-1">
                  <i className={`ph-fill ph-user text-2xl ${crewSize === 2 ? 'text-indigo-600' : 'text-slate-300'}`}></i>
                  <i className={`ph-fill ph-user text-2xl ${crewSize === 2 ? 'text-indigo-600' : 'text-slate-300'}`}></i>
                </div>
                <span className="font-black text-xs uppercase tracking-wider">Expert Team</span>
              </button>
            </div>
          </div>

          <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${isLongDistance || isInterstate ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`font-black text-xs uppercase tracking-widest flex items-center gap-2 ${isLongDistance || isInterstate ? 'text-blue-600' : 'text-indigo-600'}`}>
                <i className="ph-fill ph-clock"></i> {isLongDistance ? "Calculated Drive Time" : "Required Hours"}
              </span>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${isLongDistance || isInterstate ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`}>
                {isLongDistance ? 'Fixed Trip' : '2H Minimum'}
              </span>
            </div>
            
            {(isLongDistance || isInterstate) ? (
              <div className="w-full p-5 bg-white border border-blue-200 rounded-2xl text-2xl font-black text-blue-700 flex items-center justify-between shadow-inner">
                {travelTimeHrs > 0 ? `${travelTimeHrs.toFixed(1)}` : "--"}
                <span className="text-sm text-blue-400">HRS</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleAdjustHours(-0.5)}
                  className="w-16 h-16 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-600 flex items-center justify-center text-2xl active:scale-90 transition-all shadow-sm hover:border-indigo-200"
                >
                  <i className="ph-bold ph-minus"></i>
                </button>
                
                <div className="flex-1 p-5 bg-white border-2 border-indigo-100 rounded-2xl text-3xl font-black text-indigo-700 flex items-center justify-center gap-2 shadow-inner">
                  {truckHours}
                  <span className="text-sm text-indigo-300 uppercase tracking-widest">Hrs</span>
                </div>

                <button 
                  onClick={() => handleAdjustHours(0.5)}
                  className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl active:scale-90 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <i className="ph-bold ph-plus"></i>
                </button>
              </div>
            )}

            <p className="mt-4 text-[11px] leading-relaxed font-bold uppercase tracking-wide opacity-70 text-center">
              {isLongDistance 
                ? "Interstate/Long distance rates apply for moves over 100km. Prices include comprehensive insurance." 
                : `Professional rate: $${currentRate}/hour. Includes ${crewSize} expert removalists.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Vehicle;
