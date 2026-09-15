import React from 'react';
import { VehicleType, ServiceType } from '../types';
import { VEHICLE_OPTIONS, RATES } from '../constants';
import { formatMoney } from '../lib/quote';
import Icon from './Icon';

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
}

const Step1Vehicle: React.FC<Step1Props> = ({
  selected, serviceType, truckHours, crewSize, distanceKm, travelTimeHrs, isInterstate,
  onSelect, onTruckHoursChange, onCrewSizeChange,
}) => {
  const isLongDistance = distanceKm > RATES.LONG_DISTANCE_THRESHOLD;
  const currentRate = crewSize === 1 ? RATES.TRUCK_HOURLY_SOLO : RATES.TRUCK_HOURLY_TEAM;
  const handleAdjustHours = (delta: number) => {
    onTruckHoursChange(Math.max(2, truckHours + delta));
  };

  return (
    <div className="space-y-8 animate-premium-in">
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
          Which vehicle suits you?
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          Not sure? Choose the van for a light load. We’ll suggest a truck if the items need more space.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {VEHICLE_OPTIONS.map((opt) => {
          const isDisabled = opt.id === 'van' && (isInterstate || isLongDistance);
          const isSelected = selected === opt.id;
          const rateDisplay = opt.id === 'van'
            ? `From ${formatMoney(RATES.VAN_BASE)}`
            : `From ${formatMoney(RATES.TRUCK_HOURLY_TEAM)}/hr`;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(opt.id as VehicleType)}
              className={`group relative flex items-center gap-5 p-5 min-h-[5.5rem] rounded-[1.75rem] border-2 transition-all duration-300 text-left ${
                isSelected
                  ? 'border-[#146eb4] bg-[#e7f2fa] shadow-lg shadow-[#146eb4]/10'
                  : isDisabled
                    ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300 active:scale-[0.99]'
              }`}
            >
              <div className={`w-14 h-14 flex items-center justify-center text-3xl rounded-2xl ${isSelected ? 'bg-[#146eb4]' : 'bg-slate-50'}`}>
                <span aria-hidden="true">{opt.icon}</span>
              </div>
              <div className="flex-1">
                <span className="font-black text-lg text-slate-900 leading-none">{opt.name}</span>
                <span className="text-sm text-slate-500 font-medium block mt-1">{opt.desc}</span>
                <span className="text-xs font-semibold text-slate-400 mt-1 block">{rateDisplay}</span>
              </div>

              {isDisabled && (
                <span className="absolute top-4 right-4 bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  Too far for a van
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected === 'truck' && (
        <div className="space-y-5 animate-premium-in py-1">
          <fieldset className="p-5 bg-white border border-slate-200 rounded-[1.75rem] space-y-4">
            <legend className="text-sm font-bold text-slate-700 px-1">Who’s helping?</legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onCrewSizeChange(1)}
                aria-pressed={crewSize === 1}
                className={`min-h-[5.5rem] p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${crewSize === 1 ? 'border-[#146eb4] bg-[#e7f2fa] text-[#0f5a94]' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
              >
                <Icon name="user" className={`text-2xl ${crewSize === 1 ? 'text-[#146eb4]' : 'text-slate-300'}`} />
                <span className="font-bold text-sm">Just one of us</span>
              </button>
              <button
                type="button"
                onClick={() => onCrewSizeChange(2)}
                aria-pressed={crewSize === 2}
                className={`min-h-[5.5rem] p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${crewSize === 2 ? 'border-[#146eb4] bg-[#e7f2fa] text-[#0f5a94]' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
              >
                <div className="flex gap-1" aria-hidden="true">
                  <Icon name="user" className={`text-2xl ${crewSize === 2 ? 'text-[#146eb4]' : 'text-slate-300'}`} />
                  <Icon name="user" className={`text-2xl ${crewSize === 2 ? 'text-[#146eb4]' : 'text-slate-300'}`} />
                </div>
                <span className="font-bold text-sm">A pair of us</span>
              </button>
            </div>
          </fieldset>

          <div className={`p-5 rounded-[1.75rem] border-2 ${isLongDistance || isInterstate ? 'bg-[#e7f2fa] border-[#c5dff0]' : 'bg-[#e7f2fa]/80 border-[#c5dff0]'}`}>
            <div className="flex items-center justify-between mb-4 gap-2">
              <p className="font-bold text-sm text-[#0f5a94]">
                {isLongDistance ? 'Drive time (from your route)' : 'Hours on the job'}
              </p>
              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#146eb4] text-white">
                {isLongDistance ? 'Fixed trip' : '2 hour minimum'}
              </span>
            </div>

            {(isLongDistance || isInterstate) ? (
              <p className="w-full p-4 bg-white border border-[#c5dff0] rounded-2xl text-2xl font-black text-[#0f5a94] flex items-center justify-between">
                {travelTimeHrs > 0 ? `${travelTimeHrs.toFixed(1)}` : '—'}
                <span className="text-sm font-bold text-[#146eb4]/70">hours</span>
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAdjustHours(-0.5)}
                  className="w-14 h-14 bg-white border-2 border-[#c5dff0] rounded-2xl text-[#146eb4] flex items-center justify-center text-2xl active:scale-95"
                  aria-label="Reduce hours by half an hour"
                >
                  <Icon name="minus" />
                </button>

                <p className="flex-1 p-4 bg-white border-2 border-[#c5dff0] rounded-2xl text-3xl font-black text-[#0f5a94] flex items-center justify-center gap-2" aria-live="polite">
                  {truckHours}
                  <span className="text-sm text-[#146eb4]/70">hrs</span>
                </p>

                <button
                  type="button"
                  onClick={() => handleAdjustHours(0.5)}
                  className="w-14 h-14 bg-[#146eb4] text-white rounded-2xl flex items-center justify-center text-2xl active:scale-95"
                  aria-label="Add half an hour"
                >
                  <Icon name="plus" />
                </button>
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-slate-600 text-center">
              {isLongDistance
                ? 'Trips over 100 km use a fixed long-distance price, including cover for the journey.'
                : `${formatMoney(currentRate)} per hour, with ${crewSize === 1 ? 'one removalist' : 'two removalists'} looking after your things.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Vehicle;
