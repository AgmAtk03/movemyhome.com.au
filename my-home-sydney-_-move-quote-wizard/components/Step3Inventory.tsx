
import React, { useState, useEffect } from 'react';
import { Inventory, MoveDetails, VehicleType } from '../types';

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
      [key]: Math.max(0, inventory[key] + delta)
    });
  };

  const items = [
    { key: 'boxes', name: 'Boxes / Bags', icon: '📦' },
    { key: 'sofa', name: 'Sofa', icon: '🛋️' },
    { key: 'mattress', name: 'Mattress', icon: '🛏️' },
    { key: 'bed', name: 'Bed Frame', icon: '🪑' },
    { key: 'fridge', name: 'Fridge', icon: '❄️' },
    { key: 'washer', name: 'Washing Machine', icon: '🧼' },
    { key: 'tv', name: 'TV', icon: '📺' },
  ] as const;

  // Threshold logic: Show Truck Requirement feedback
  const hasMultipleHeavyItems = inventory.sofa >= 2 || inventory.fridge >= 2 || inventory.washer >= 2;
  const hasFullCombo = 
    inventory.sofa > 0 && 
    inventory.washer > 0 && 
    inventory.fridge > 0 && 
    inventory.mattress > 0 &&
    inventory.bed > 0;

  const needsTruckAutoUpgrade = hasMultipleHeavyItems || hasFullCombo;

  // Reset dismissal if items are removed so it triggers again if they re-add
  useEffect(() => {
    if (!needsTruckAutoUpgrade) {
      setIsDismissed(false);
    }
  }, [needsTruckAutoUpgrade]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10 relative">
      
      {/* Sticky Banner positioned at the very top of the scroll content */}
      {needsTruckAutoUpgrade && vehicle === 'truck' && !isManualTruckSelection && !isDismissed && (
        <div className="sticky top-0 z-50 -mt-2 mb-4 animate-in slide-in-from-top duration-500">
          <div className="bg-indigo-600/95 backdrop-blur-md border border-indigo-400 p-4 rounded-3xl flex items-center gap-3 shadow-2xl shadow-indigo-600/40 ring-4 ring-white">
             <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
                <i className="ph-fill ph-truck text-white text-xl"></i>
             </div>
             <div className="flex-1">
               <p className="text-white font-black text-[11px] uppercase tracking-tight">
                 {hasMultipleHeavyItems ? 'Heavy Quantity Detected' : 'Full Load Detected'}
               </p>
               <p className="text-indigo-100 text-[9px] font-bold leading-tight">
                 {hasMultipleHeavyItems 
                   ? 'Multiple heavy items require a Truck for safety & space.' 
                   : 'Professional Truck required for this inventory combo.'}
               </p>
             </div>
             <button 
              onClick={() => setIsDismissed(true)}
              className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-lg hover:bg-indigo-50"
             >
               OK
             </button>
          </div>
        </div>
      )}

      <div className="border-b-2 border-slate-100 pb-2 mb-4 flex justify-between items-end">
        <h2 className="text-xl font-black text-blue-600 flex items-center gap-2 tracking-tight">
          <i className="ph-fill ph-package"></i> Step 3: Inventory
        </h2>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${vehicle === 'truck' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
           Vehicle: {vehicle?.toUpperCase() || 'VAN'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <span className="text-2xl w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl">{item.icon}</span>
              <span className="font-bold text-slate-800 text-sm tracking-tight">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => updateCount(item.key, -1)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 active:scale-90 transition-transform"
              >
                <i className="ph ph-minus"></i>
              </button>
              <div className="w-12 text-center">
                <span className="font-black text-blue-600 text-lg">{inventory[item.key]}</span>
              </div>
              <button 
                onClick={() => updateCount(item.key, 1)}
                className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black active:scale-90 transition-transform shadow-lg shadow-blue-600/20"
              >
                <i className="ph ph-plus"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {inventory.bed > 0 && (
        <div className="space-y-4 p-6 bg-blue-50 rounded-[32px] border border-blue-100 animate-in zoom-in-95 duration-300">
          <h4 className="font-black text-blue-900 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <i className="ph-fill ph-wrench"></i> Bed Frame Service
          </h4>
          <div className="space-y-3">
            <button 
              onClick={() => onUpdateDetails({ bedIsAssembled: !details.bedIsAssembled })}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${!details.bedIsAssembled ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600'}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!details.bedIsAssembled ? 'border-white' : 'border-slate-300'}`}>
                {!details.bedIsAssembled && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
              <span className="text-sm font-bold">Bed is currently assembled</span>
            </button>
            
            {!details.bedIsAssembled && (
              <button 
                onClick={() => onUpdateDetails({ bedDisassembly: !details.bedDisassembly })}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all animate-in slide-in-from-top-2 ${details.bedDisassembly ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${details.bedDisassembly ? 'border-white' : 'border-slate-300'}`}>
                  {details.bedDisassembly && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-sm font-bold">Add Disassembly Service</span>
                   <span className={`text-[10px] font-bold ${details.bedDisassembly ? 'text-emerald-100' : 'text-slate-400'}`}>Fixed +$30 Fee</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3Inventory;
