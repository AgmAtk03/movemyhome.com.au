
import React, { useState, useMemo, useEffect } from 'react';
import { VehicleType, QuoteState, Inventory, MoveDetails, LocationEntry, ServiceType } from './types';
import { RATES, INVENTORY_COSTS, FLOOR_RATES, CONFIG } from './constants';
import Header from './components/Header';
import Step1ServiceType from './components/Step1ServiceType';
import Step2Vehicle from './components/Step1Vehicle'; // Reusing Step1 component for Step 2
import Step3Route from './components/Step2Route';    // Shifting steps
import Step4Inventory from './components/Step3Inventory';
import Step5Schedule from './components/Step4Schedule';
import Step6Contact from './components/Step5Contact';
import SummaryFooter from './components/SummaryFooter';
import SuccessScreen from './components/SuccessScreen';

// EmailJS Global declaration
declare const emailjs: any;

const INITIAL_INVENTORY: Inventory = {
  boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0
};

const INITIAL_DETAILS: MoveDetails = {
  date: '', time: '', name: '', email: '', phone: '', instructions: '',
  bedDisassembly: false, bedIsAssembled: true
};

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);

  const [state, setState] = useState<QuoteState>({
    step: 1,
    serviceType: null,
    vehicle: null,
    isManualTruckSelection: false,
    truckHours: 2,
    crewSize: 2, 
    pickups: [{ id: 'p1', address: '', access: 'ground', hasLoadingDock: false }],
    dropoffs: [{ id: 'd1', address: '', access: 'ground', hasLoadingDock: false }],
    inventory: INITIAL_INVENTORY,
    details: INITIAL_DETAILS,
    distanceKm: 0,
    travelTimeHrs: 0,
    isCBD: false,
    isInterstate: false,
  });

  // --- Volatile Wizard Logic ---
  // If user navigates backward, clear the "future" data to prevent old values from affecting UI/Price
  useEffect(() => {
    setState(prev => {
      const updates: Partial<QuoteState> = {};
      
      // If we go back before Step 4 (Inventory), reset inventory data
      if (prev.step < 4 && (JSON.stringify(prev.inventory) !== JSON.stringify(INITIAL_INVENTORY))) {
        updates.inventory = INITIAL_INVENTORY;
      }
      
      // If we go back before Step 3 (Route), reset route data
      if (prev.step < 3 && (prev.distanceKm !== 0 || prev.isCBD !== false)) {
        updates.distanceKm = 0;
        updates.travelTimeHrs = 0;
        updates.isCBD = false;
        updates.isInterstate = false;
        // Optionally reset addresses if we want full clean slate
        // updates.pickups = [{ id: 'p1', address: '', access: 'ground', hasLoadingDock: false }];
        // updates.dropoffs = [{ id: 'd1', address: '', access: 'ground', hasLoadingDock: false }];
      }

      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [state.step]);

  const isContactValid = useMemo(() => {
    const { name, email, phone } = state.details;
    return name.trim().length > 1 && 
           email.includes('@') && 
           email.includes('.') && 
           phone.trim().length >= 8;
  }, [state.details]);

  const priceBreakdown = useMemo(() => {
    const initialBreakdown = { total: 0, base: 0, distance: 0, inventory: 0, access: 0, potentialAccess: 0, cbd: 0, bedService: 0, hours: 0, fuel: 0, isFixedTrip: false, hourlyRate: 0 };
    
    // Step 1 has no price
    if (!state.vehicle || state.step === 1) return initialBreakdown;
    
    let base = 0;
    let distance = 0;
    let inventory = 0;
    let access = 0;
    let potentialAccess = 0;
    let bedService = 0;
    let fuel = 0;
    let hours = 0;
    let isFixedTrip = false;
    let hourlyRate = 0;
    
    // 1. Calculate CBD and Access (Route Logic - Step 3+)
    let cbdFee = 0;
    [...state.pickups, ...state.dropoffs].forEach(loc => {
      const isLocCBD = loc.address.includes('2000');
      if (isLocCBD && !loc.hasLoadingDock) {
        cbdFee += RATES.CBD_FEE;
      }
      potentialAccess += FLOOR_RATES[loc.access] || 0;
    });

    // 2. Base Calculation (Vehicle Logic - Step 2+)
    if (state.vehicle === 'truck') {
      const isLongDistance = state.distanceKm > RATES.LONG_DISTANCE_THRESHOLD;
      hourlyRate = state.crewSize === 1 ? RATES.TRUCK_HOURLY_SOLO : RATES.TRUCK_HOURLY_TEAM;

      if (isLongDistance) {
        isFixedTrip = true;
        const fuelCostPerKm = (RATES.TRUCK_L_PER_100KM / 100) * RATES.DIESEL_PRICE_PER_L;
        const rawCostPerKmTotal = fuelCostPerKm + RATES.TRUCK_WEAR_PER_KM;
        const totalDistanceDiscountedReturn = state.distanceKm * 1.8;
        const rawCost = totalDistanceDiscountedReturn * rawCostPerKmTotal;
        const marginPerKm = state.crewSize === 1 ? RATES.MARGIN_SOLO_PER_KM : RATES.MARGIN_TEAM_PER_KM;
        const laborMargin = state.distanceKm * marginPerKm;
        base = rawCost + laborMargin;
        fuel = 0; 
        hours = state.travelTimeHrs;
      } else {
        hours = state.isInterstate ? state.travelTimeHrs : Math.max(RATES.TRUCK_MIN_HOURS, state.truckHours);
        base = hours * hourlyRate;
        fuel = (state.distanceKm / 100) * RATES.TRUCK_L_PER_100KM * RATES.DIESEL_PRICE_PER_L;
      }
    } else {
      base = RATES.VAN_BASE;
      distance = state.distanceKm * RATES.VAN_PER_KM;
      access = potentialAccess;
    }

    // 3. Inventory Calculation (Step 4+)
    Object.keys(state.inventory).forEach((key) => {
      inventory += state.inventory[key as keyof Inventory] * INVENTORY_COSTS[key];
    });

    if (state.inventory.bed > 0 && !state.details.bedIsAssembled && state.details.bedDisassembly) {
      bedService = RATES.BED_SERVICE_FEE;
    }

    /** 
     * Step-Isolated Logic:
     * Only allow costs into the 'total' if the user is at or past the step where those costs are defined.
     */
    const showInventoryCosts = state.step >= 4;
    const showRouteCosts = state.step >= 3;

    const filteredInventory = showInventoryCosts ? inventory : 0;
    const filteredBedService = showInventoryCosts ? bedService : 0;
    const filteredDistance = showRouteCosts ? distance : 0;
    const filteredFuel = showRouteCosts ? fuel : 0;
    const filteredCBD = showRouteCosts ? cbdFee : 0;
    const filteredAccess = showRouteCosts ? access : 0;

    const total = base + filteredDistance + filteredInventory + filteredAccess + filteredCBD + filteredBedService + filteredFuel;
    
    return { 
      total, 
      base, 
      distance: filteredDistance, 
      inventory: filteredInventory, 
      access: filteredAccess, 
      potentialAccess: showRouteCosts ? potentialAccess : 0, 
      cbd: filteredCBD, 
      bedService: filteredBedService, 
      hours, 
      fuel: filteredFuel, 
      isFixedTrip, 
      hourlyRate 
    };
  }, [state]);

  const handleBooking = async () => {
    if (isBooking || !isContactValid) return;
    setIsBooking(true);

    const inventoryEntries = Object.entries(state.inventory) as [string, number][];
    const inventoryList = inventoryEntries
      .filter(([_, count]) => count > 0)
      .map(([item, count]) => {
        const name = item === 'washer' ? 'Washing Machine' : item.charAt(0).toUpperCase() + item.slice(1);
        return `${count}x ${name}`;
      })
      .join(', ');

    const routeDetails = `Pickups: ${state.pickups.map(p => `${p.address}${p.hasLoadingDock ? ' (Dock)' : ''}`).join(' | ')}\nDropoffs: ${state.dropoffs.map(d => `${d.address}${d.hasLoadingDock ? ' (Dock)' : ''}`).join(' | ')}`;

    const templateParams = {
      from_name: state.details.name,
      user_email: state.details.email,
      user_phone: state.details.phone,
      move_date: state.details.date,
      move_time: state.details.time,
      service_type: state.serviceType?.toUpperCase(),
      vehicle: state.vehicle?.toUpperCase(),
      crew_size: state.vehicle === 'truck' ? (state.crewSize === 1 ? 'Solo (1 Man)' : 'Team (2 Men)') : 'N/A',
      total_quote: `$${priceBreakdown.total.toFixed(2)}`,
      inventory: inventoryList || 'No specific items listed',
      route: routeDetails,
      special_instructions: state.details.instructions || 'None',
      distance: `${state.distanceKm.toFixed(1)} km`,
      travel_time: `${state.travelTimeHrs.toFixed(1)} hrs`,
      fuel_surcharge: `$${priceBreakdown.fuel.toFixed(2)}`,
      cbd_surcharge: priceBreakdown.cbd > 0 ? `Yes ($${priceBreakdown.cbd})` : 'No (Dock/Non-CBD)',
      move_type: priceBreakdown.isFixedTrip ? 'LONG DISTANCE FIXED' : (state.isInterstate ? 'INTERSTATE' : 'LOCAL')
    };

    try {
      if (typeof emailjs !== 'undefined' && CONFIG.EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, templateParams, CONFIG.EMAILJS_PUBLIC_KEY);
      } else {
        await new Promise(r => setTimeout(r, 1800));
      }
      setIsSuccess(true);
    } catch (error) {
      console.error("Booking Error:", error);
      alert("Booking system temporarily unavailable. Please call us directly!");
    } finally {
      setIsBooking(false);
    }
  };

  const handleRouteUpdate = (km: number, isCBD: boolean, isInterstate: boolean, hrs: number) => {
    setState(prev => {
      const vehicle = isInterstate ? 'truck' : prev.vehicle;
      return { ...prev, distanceKm: km, travelTimeHrs: hrs, isCBD, isInterstate, vehicle };
    });
    setDuplicateConfirmed(false);
  };

  const handleInventoryUpdate = (newInv: Inventory) => {
    setState(prev => {
      const hasMultipleHeavyItems = newInv.sofa >= 2 || newInv.fridge >= 2 || newInv.washer >= 2;
      const hasFullCombo = 
        newInv.sofa > 0 && newInv.washer > 0 && newInv.fridge > 0 && newInv.mattress > 0 && newInv.bed > 0;
      const needsTruck = hasMultipleHeavyItems || hasFullCombo;

      let nextVehicle = prev.vehicle;
      const isForcedTruck = prev.isManualTruckSelection || prev.isInterstate || (prev.distanceKm > RATES.LONG_DISTANCE_THRESHOLD);

      if (isForcedTruck) {
        nextVehicle = 'truck';
      } else {
        nextVehicle = needsTruck ? 'truck' : 'van';
      }

      return { ...prev, inventory: newInv, vehicle: nextVehicle };
    });
  };

  const nextStep = () => {
    if (state.step === 1 && !state.serviceType) return;
    if (state.step === 2 && !state.vehicle) return;
    if (state.step === 3) {
      if (!state.pickups[0].address || !state.dropoffs[0].address) return;
      const pAddresses = state.pickups.map(p => p.address.trim().toLowerCase()).filter(a => a.length > 5);
      const dAddresses = state.dropoffs.map(d => d.address.trim().toLowerCase()).filter(a => a.length > 5);
      const hasDuplicate = pAddresses.some(addr => dAddresses.includes(addr));
      if (hasDuplicate && !duplicateConfirmed) {
        setShowDuplicateWarning(true);
        return;
      }
    }
    
    setState(prev => {
      const nextStepNum = prev.step + 1;
      const updates: Partial<QuoteState> = { step: nextStepNum };
      
      // REQUIREMENT: When user navigates forward to inventory (Step 4), reset count to 0
      if (nextStepNum === 4) {
        updates.inventory = INITIAL_INVENTORY;
      }
      
      return { ...prev, ...updates };
    });
  };

  const confirmDuplicate = () => {
    setDuplicateConfirmed(true);
    setShowDuplicateWarning(false);
    setState(prev => ({ ...prev, step: prev.step + 1, inventory: INITIAL_INVENTORY }));
  };

  const handleServiceSelect = (service: ServiceType) => {
    setState(prev => ({ 
      ...prev, 
      serviceType: service,
      vehicle: (service === 'home_move') ? 'truck' : 'van',
      step: 2
    }));
  };

  if (isSuccess) return <SuccessScreen name={state.details.name} email={state.details.email} onReset={() => window.location.reload()} />;

  if (!isStarted) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center p-8 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-sm w-full space-y-8">
          <div className="mb-4 inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] rotate-[15deg] flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-premium-in">
              <i className="ph-fill ph-house-line text-5xl text-white -rotate-[15deg]"></i>
            </div>
          </div>
          <div className="space-y-4 animate-premium-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-tight">
              Sydney Moving <br/> <span className="text-blue-500">Made Simple.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed px-4">
              Premium removalist services with transparent pricing. No surprises.
            </p>
          </div>
          <div className="pt-8 animate-premium-in" style={{ animationDelay: '0.2s' }}>
            <button 
              onClick={() => setIsStarted(true)}
              className="group w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-600/20 active:scale-[0.97] transition-all text-xl flex items-center justify-center gap-3"
            >
              GET STARTED <i className="ph-bold ph-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
            </button>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-6 opacity-50">Instant Quote • 2-Min Booking</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-lg mx-auto bg-white shadow-2xl relative">
      <Header 
        step={state.step} 
        totalSteps={6} 
        onBack={() => setState(p => ({ ...p, step: p.step - 1 }))}
      />
      
      {isBooking && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
           <div className="loading-spinner mb-6"></div>
           <p className="font-black text-xl tracking-tight">Securing Your Quote...</p>
        </div>
      )}

      {showDuplicateWarning && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto">
              <i className="ph-fill ph-warning-circle text-4xl text-amber-500 animate-pulse"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 text-center tracking-tight mb-3">Duplicate Address?</h3>
            <p className="text-slate-500 text-center font-medium leading-relaxed mb-8">
              We noticed your <span className="text-slate-900 font-bold">pickup</span> and <span className="text-slate-900 font-bold">drop-off</span> addresses are identical. Is this intended?
            </p>
            <div className="space-y-3">
              <button 
                onClick={confirmDuplicate}
                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-[0.97]"
              >
                YES, IT'S CORRECT
              </button>
              <button 
                onClick={() => setShowDuplicateWarning(false)}
                className="w-full py-5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.97]"
              >
                LET ME FIX IT
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-6 pt-10 pb-40 overflow-y-auto no-scrollbar bg-white">
        <div className="max-w-md mx-auto">
          {state.step === 1 && (
            <Step1ServiceType 
              selected={state.serviceType}
              onSelect={handleServiceSelect}
            />
          )}

          {state.step === 2 && (
            <Step2Vehicle 
              selected={state.vehicle} 
              serviceType={state.serviceType}
              truckHours={state.truckHours}
              crewSize={state.crewSize}
              distanceKm={state.distanceKm}
              travelTimeHrs={state.travelTimeHrs}
              isInterstate={state.isInterstate}
              onSelect={(v) => setState(p => ({ ...p, vehicle: v, isManualTruckSelection: v === 'truck' }))}
              onTruckHoursChange={(h) => setState(p => ({ ...p, truckHours: h }))}
              onCrewSizeChange={(s) => setState(p => ({ ...p, crewSize: s }))}
              onNext={nextStep}
            />
          )}
          
          {state.step === 3 && (
            <Step3Route 
              pickups={state.pickups} 
              dropoffs={state.dropoffs}
              vehicle={state.vehicle}
              isCBD={state.isCBD}
              isInterstate={state.isInterstate}
              onUpdatePickups={(p) => { 
                setState(s => ({ ...s, pickups: p })); 
                setDuplicateConfirmed(false); 
              }}
              onUpdateDropoffs={(d) => { 
                setState(s => ({ ...s, dropoffs: d })); 
                setDuplicateConfirmed(false); 
              }}
              onUpdateRouteInfo={handleRouteUpdate}
            />
          )}

          {state.step === 4 && (
            <Step4Inventory 
              inventory={state.inventory} 
              details={state.details}
              vehicle={state.vehicle}
              isManualTruckSelection={state.isManualTruckSelection}
              onUpdateInventory={handleInventoryUpdate}
              onUpdateDetails={(det) => setState(s => ({ ...s, details: { ...s.details, ...det } }))}
            />
          )}

          {state.step === 5 && (
            <Step5Schedule 
              details={state.details}
              onUpdateDetails={(det) => setState(s => ({ ...s, details: { ...s.details, ...det } }))}
            />
          )}

          {state.step === 6 && (
            <Step6Contact 
              details={state.details}
              onUpdateDetails={(det) => setState(s => ({ ...s, details: { ...s.details, ...det } }))}
            />
          )}
        </div>
      </main>

      <SummaryFooter 
        breakdown={priceBreakdown}
        vehicle={state.vehicle}
        isInterstate={state.isInterstate}
        step={state.step} 
        isContactValid={isContactValid}
        onNext={nextStep} 
        onBook={handleBooking}
      />
    </div>
  );
};

export default App;
