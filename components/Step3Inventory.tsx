
import React, { useState, useEffect } from 'react';
import { Inventory, MoveDetails, VehicleType } from '../types';
import { RATES } from '../constants';
import { formatMoney, hasAnyInventory } from '../lib/quote';
import Icon from './Icon';

interface Step3Props {
  inventory: Inventory;
  details: MoveDetails;
  vehicle: VehicleType | null;
  isManualTruckSelection: boolean;
  onUpdateInventory: (i: Inventory) => void;
  onUpdateDetails: (d: Partial<MoveDetails>) => void;
}

const Step3Inventory: React.FC<Step3Props> = ({ inventory, details, vehicle, isManualTruckSelection, onUpdateInventory, onUpdateDetails }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const updateCount = (key: keyof Inventory, delta: number) => {
    onUpdateInventory({
      ...inventory,
      [key]: Math.max(0, inventory[key] + delta),
    });
  };

  const items = [
    { key: 'boxes', name: 'Boxes / bags', icon: '📦' },
    { key: 'sofa', name: 'Sofa', icon: '🛋️' },
    { key: 'mattress', name: 'Mattress', icon: '🛏️' },
    { key: 'bed', name: 'Bed frame', icon: '🪑' },
    { key: 'fridge', name: 'Fridge', icon: '❄️' },
    { key: 'washer', name: 'Washing machine', icon: '🧼' },
    { key: 'tv', name: 'TV', icon: '📺' },
  ] as const;

  const hasMultipleHeavyItems = inventory.sofa >= 2 || inventory.fridge >= 2 || inventory.washer >= 2;
  const hasFullCombo =
    inventory.sofa > 0 &&
    inventory.washer > 0 &&
    inventory.fridge > 0 &&
    inventory.mattress > 0 &&
    inventory.bed > 0;

  const needsTruckAutoUpgrade = hasMultipleHeavyItems || hasFullCombo;

  useEffect(() => {
    if (!needsTruckAutoUpgrade) {
      setIsDismissed(false);
    }
  }, [needsTruckAutoUpgrade]);

  return (
    <div className="space-y-6 animate-premium-in pb-10">
      {needsTruckAutoUpgrade && vehicle === 'truck' && !isManualTruckSelection && !isDismissed && (
        <div className="bg-indigo-700 text-white p-4 rounded-3xl flex items-start gap-3" role="status">
          <Icon name="truck" className="text-white text-xl mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm">
              {hasMultipleHeavyItems ? 'That’s a heavy load' : 'That’s a full house-worth'}
            </p>
            <p className="text-indigo-100 text-sm mt-1 leading-relaxed">
              We’ve switched you to the truck so everything has a safe amount of space. You can still go back if that doesn’t feel right.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="min-h-11 px-4 bg-white text-indigo-700 rounded-xl text-sm font-bold"
          >
            Got it
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
          What’s coming with us?
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          Add what you can. A rough list is enough — leftover bits can go in the notes later.
        </p>
      </div>

      <p className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[#e7f2fa] text-[#0f5a94]">
        Using the {vehicle === 'truck' ? 'truck' : 'van'}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-2xl w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl" aria-hidden="true">{item.icon}</span>
              <span className="font-bold text-slate-800">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateCount(item.key, -1)}
                className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700"
                aria-label={`Remove one ${item.name}`}
              >
                <Icon name="minus" />
              </button>
              <span className="w-10 text-center font-black text-[#146eb4] text-lg" aria-live="polite">{inventory[item.key]}</span>
              <button
                type="button"
                onClick={() => updateCount(item.key, 1)}
                className="w-11 h-11 rounded-xl bg-[#146eb4] text-white flex items-center justify-center"
                aria-label={`Add one ${item.name}`}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!hasAnyInventory(inventory) && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          Nothing listed yet — that’s okay. Continue if you’d rather tell us on the phone, or tap plus on anything you know is coming.
        </p>
      )}

      {inventory.bed > 0 && (
        <fieldset className="space-y-3 p-5 bg-[#e7f2fa] rounded-[1.75rem] border border-[#c5dff0]">
          <legend className="font-bold text-[#0f172a] text-sm">Bed frame</legend>
          <p className="text-sm text-[#0f5a94]">Is the bed already put together?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateDetails({ bedIsAssembled: true })}
              aria-pressed={details.bedIsAssembled}
              className={`min-h-14 rounded-2xl border-2 font-bold text-sm ${details.bedIsAssembled ? 'bg-[#146eb4] border-[#146eb4] text-white' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              Yes, it’s assembled
            </button>
            <button
              type="button"
              onClick={() => onUpdateDetails({ bedIsAssembled: false, bedDisassembly: false })}
              aria-pressed={!details.bedIsAssembled}
              className={`min-h-14 rounded-2xl border-2 font-bold text-sm ${!details.bedIsAssembled ? 'bg-[#146eb4] border-[#146eb4] text-white' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              No, it’s in pieces
            </button>
          </div>

          {details.bedIsAssembled && (
            <button
              type="button"
              onClick={() => onUpdateDetails({ bedDisassembly: !details.bedDisassembly })}
              aria-pressed={details.bedDisassembly}
              className={`w-full flex items-center gap-3 p-4 min-h-14 rounded-2xl border-2 text-left ${details.bedDisassembly ? 'bg-[#146eb4] border-[#146eb4] text-white' : 'bg-white border-slate-200 text-slate-700'}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${details.bedDisassembly ? 'border-white' : 'border-slate-300'}`}>
                {details.bedDisassembly && <span className="w-2 h-2 bg-white rounded-full" />}
              </span>
              <span>
                <span className="block text-sm font-bold">Please take it apart for us</span>
                <span className="block text-xs opacity-80">Fixed {formatMoney(RATES.BED_SERVICE_FEE)} take-down</span>
              </span>
            </button>
          )}
        </fieldset>
      )}
    </div>
  );
};

export default Step3Inventory;
