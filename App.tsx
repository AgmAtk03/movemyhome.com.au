
import React, { useState, useMemo, useEffect } from 'react';
import { VehicleType, QuoteState, Inventory, MoveDetails, LocationEntry, ServiceType, PriceBreakdown } from './types';
import { RATES, INVENTORY_COSTS, FLOOR_RATES, CONFIG, WIZARD_STEPS } from './constants';
import Header from './components/Header';
import Step1ServiceType from './components/Step1ServiceType';
import Step2Vehicle from './components/Step1Vehicle';
import Step3Route from './components/Step2Route';
import Step4Inventory from './components/Step3Inventory';
import Step5Schedule from './components/Step4Schedule';
import Step6Contact from './components/Step5Contact';
import SummaryFooter from './components/SummaryFooter';
import SuccessScreen from './components/SuccessScreen';
import StaffJobsBoard from './components/StaffJobsBoard';
import { addressesReady, buildQuoteSnapshot, scheduleReady } from './lib/quote';
import { isContactValid, validateContact } from './lib/validation';
import { buildWhatsAppUrl, submitBookingEmails } from './lib/booking';
import { saveDemoJob } from './lib/jobsStore';
import { sanitizePlainText } from './lib/sanitize';

const INITIAL_INVENTORY: Inventory = {
  boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0,
};

const INITIAL_DETAILS: MoveDetails = {
  date: '', time: '', name: '', email: '', phone: '', instructions: '',
  bedDisassembly: false, bedIsAssembled: true,
};

const EMPTY_BREAKDOWN: PriceBreakdown = {
  total: 0, base: 0, distance: 0, inventory: 0, access: 0, potentialAccess: 0,
  cbd: 0, bedService: 0, hours: 0, fuel: 0, isFixedTrip: false, hourlyRate: 0,
};

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [showStaffBoard, setShowStaffBoard] = useState(() => window.location.hash === '#staff-jobs');
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [nextHint, setNextHint] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const [emailOutcome, setEmailOutcome] = useState({ emailsSent: false, clientSent: false, businessSent: false, demoMode: false });

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

  useEffect(() => {
    const onHash = () => setShowStaffBoard(window.location.hash === '#staff-jobs');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    setState((prev) => {
      const updates: Partial<QuoteState> = {};
      if (prev.step < 4 && (JSON.stringify(prev.inventory) !== JSON.stringify(INITIAL_INVENTORY))) {
        updates.inventory = INITIAL_INVENTORY;
      }
      if (prev.step < 3 && (prev.distanceKm !== 0 || prev.isCBD !== false)) {
        updates.distanceKm = 0;
        updates.travelTimeHrs = 0;
        updates.isCBD = false;
        updates.isInterstate = false;
      }
      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [state.step]);

  const contactErrors = useMemo(() => validateContact(state.details), [state.details]);
  const contactOk = useMemo(() => isContactValid(state.details), [state.details]);

  useEffect(() => {
    if (state.step === 2 && state.vehicle) setNextHint('');
    if (state.step === 3 && addressesReady(state.pickups, state.dropoffs)) setNextHint('');
    if (state.step === 5 && scheduleReady(state.details)) setNextHint('');
    if (state.step === 6 && contactOk) setNextHint('');
  }, [state.step, state.vehicle, state.pickups, state.dropoffs, state.details, contactOk]);

  const priceBreakdown = useMemo(() => {
    if (!state.vehicle || state.step === 1) return EMPTY_BREAKDOWN;

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

    let cbdFee = 0;
    [...state.pickups, ...state.dropoffs].forEach((loc) => {
      const isLocCBD = loc.address.includes('2000');
      if (isLocCBD && !loc.hasLoadingDock) {
        cbdFee += RATES.CBD_FEE;
      }
      potentialAccess += FLOOR_RATES[loc.access] || 0;
    });

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

    (Object.keys(state.inventory) as (keyof Inventory)[]).forEach((key) => {
      inventory += state.inventory[key] * INVENTORY_COSTS[key];
    });

    if (state.inventory.bed > 0 && state.details.bedIsAssembled && state.details.bedDisassembly) {
      bedService = RATES.BED_SERVICE_FEE;
    }

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
      hourlyRate,
    };
  }, [state]);

  const snapshot = useMemo(() => buildQuoteSnapshot(state, priceBreakdown), [state, priceBreakdown]);
  const whatsappUrl = useMemo(() => buildWhatsAppUrl(state, snapshot), [state, snapshot]);

  const handleBooking = async () => {
    if (isBooking) return;
    setAttemptedStep(6);
    if (!contactOk) {
      setNextHint('Please add a name, email, and Australian phone number.');
      return;
    }
    setIsBooking(true);
    setNextHint('');

    try {
      const result = await submitBookingEmails(state, snapshot);
      if (!result.businessSent && !result.demoMode) {
        setBookingNotice(result.error || 'We couldn’t send your booking. Please try WhatsApp or call us.');
        setNextHint(result.error || 'Booking didn’t send. Try WhatsApp or call us.');
        return;
      }

      saveDemoJob({
        customerName: sanitizePlainText(state.details.name, 80),
        customerEmail: sanitizePlainText(state.details.email, 120),
        customerPhone: sanitizePlainText(state.details.phone, 24),
        moveDate: state.details.date,
        moveTime: state.details.time,
        serviceLabel: snapshot.serviceLabel,
        vehicleLabel: snapshot.vehicleLabel,
        routeSummary: snapshot.routeSummary,
        inventorySummary: snapshot.inventorySummary,
        totalLabel: snapshot.totalLabel,
        instructions: sanitizePlainText(state.details.instructions || '', 800),
      });

      setEmailOutcome({
        emailsSent: result.emailsSent,
        clientSent: result.clientSent,
        businessSent: result.businessSent,
        demoMode: result.demoMode,
      });
      setBookingNotice(result.error || '');
      setIsSuccess(true);
    } catch (error) {
      console.error('Booking error:', error);
      setNextHint('Something went wrong sending that. Please WhatsApp or call us and we’ll sort it.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleRouteUpdate = (km: number, isCBD: boolean, isInterstate: boolean, hrs: number) => {
    setState((prev) => {
      const vehicle = isInterstate ? 'truck' : prev.vehicle;
      return { ...prev, distanceKm: km, travelTimeHrs: hrs, isCBD, isInterstate, vehicle };
    });
    setDuplicateConfirmed(false);
  };

  const handleInventoryUpdate = (newInv: Inventory) => {
    setState((prev) => {
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
    if (state.step === 1 && !state.serviceType) {
      setAttemptedStep(1);
      setNextHint('Choose the kind of move that fits best.');
      return;
    }
    if (state.step === 2 && !state.vehicle) {
      setAttemptedStep(2);
      setNextHint('Pick a van or truck to continue.');
      return;
    }
    if (state.step === 3) {
      if (!addressesReady(state.pickups, state.dropoffs)) {
        setAttemptedStep(3);
        setNextHint('Add a pickup and a drop-off address so we know where we’re going.');
        return;
      }
      const pAddresses = state.pickups.map((p) => p.address.trim().toLowerCase()).filter((a) => a.length > 5);
      const dAddresses = state.dropoffs.map((d) => d.address.trim().toLowerCase()).filter((a) => a.length > 5);
      const hasDuplicate = pAddresses.some((addr) => dAddresses.includes(addr));
      if (hasDuplicate && !duplicateConfirmed) {
        setShowDuplicateWarning(true);
        return;
      }
    }
    if (state.step === 5 && !scheduleReady(state.details)) {
      setAttemptedStep(5);
      setNextHint('Please choose a date and a start time.');
      return;
    }

    setNextHint('');
    setAttemptedStep(null);
    setState((prev) => {
      const nextStepNum = prev.step + 1;
      const updates: Partial<QuoteState> = { step: nextStepNum };
      if (nextStepNum === 4) {
        updates.inventory = INITIAL_INVENTORY;
      }
      return { ...prev, ...updates };
    });
  };

  const confirmDuplicate = () => {
    setDuplicateConfirmed(true);
    setShowDuplicateWarning(false);
    setNextHint('');
    setState((prev) => ({ ...prev, step: prev.step + 1, inventory: INITIAL_INVENTORY }));
  };

  const handleServiceSelect = (service: ServiceType) => {
    setState((prev) => ({
      ...prev,
      serviceType: service,
      vehicle: service === 'home_move' ? 'truck' : 'van',
      step: 2,
    }));
    setNextHint('');
  };

  if (showStaffBoard) {
    return (
      <StaffJobsBoard
        onExit={() => {
          window.location.hash = '';
          setShowStaffBoard(false);
        }}
      />
    );
  }

  if (isSuccess) {
    return (
      <SuccessScreen
        name={state.details.name}
        email={state.details.email}
        emailsSent={emailOutcome.emailsSent}
        clientSent={emailOutcome.clientSent}
        businessSent={emailOutcome.businessSent}
        demoMode={emailOutcome.demoMode}
        notice={bookingNotice}
        whatsappUrl={whatsappUrl}
        onReset={() => window.location.reload()}
      />
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center p-8 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-sm w-full space-y-8">
          <div className="mb-2 inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] rotate-[15deg] flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-premium-in">
              <i className="ph-fill ph-house-line text-5xl text-white -rotate-[15deg]" aria-hidden="true"></i>
            </div>
          </div>
          <div className="space-y-4 animate-premium-in">
            <p className="text-blue-300 font-bold tracking-wide">{CONFIG.COMPANY_NAME}</p>
            <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
              Sydney moving, <span className="text-blue-400">made simple.</span>
            </h1>
            <p className="text-slate-300 text-lg font-medium leading-relaxed px-2">
              Honest quotes for home moves, room moves, and deliveries. No hard sell — just a clear price and a team who’ll look after your things.
            </p>
          </div>
          <div className="pt-4 animate-premium-in">
            <button
              type="button"
              onClick={() => setIsStarted(true)}
              className="w-full min-h-16 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-600/20 active:scale-[0.97] transition-all text-xl"
            >
              Get my quote
            </button>
            <p className="text-slate-400 text-sm font-medium mt-5">About two minutes · No payment on this form</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-lg mx-auto bg-white shadow-2xl relative">
      <Header
        step={state.step}
        totalSteps={WIZARD_STEPS.length}
        onBack={() => {
          setNextHint('');
          setAttemptedStep(null);
          setState((p) => ({ ...p, step: p.step - 1 }));
        }}
      />

      {isBooking && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white" role="status" aria-live="polite">
          <div className="loading-spinner mb-6"></div>
          <p className="font-black text-xl tracking-tight">Sending your booking…</p>
        </div>
      )}

      {showDuplicateWarning && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-7 shadow-2xl" role="alertdialog" aria-labelledby="dup-title" aria-describedby="dup-desc">
            <h3 id="dup-title" className="text-2xl font-black text-slate-900 text-center tracking-tight mb-3">Same address twice?</h3>
            <p id="dup-desc" className="text-slate-600 text-center font-medium leading-relaxed mb-8">
              Pickup and drop-off look identical. That’s okay if you meant it — for example moving items within the same building.
            </p>
            <div className="space-y-3">
              <button type="button" onClick={confirmDuplicate} className="w-full min-h-14 bg-blue-600 text-white font-black rounded-2xl">
                Yes, that’s right
              </button>
              <button type="button" onClick={() => setShowDuplicateWarning(false)} className="w-full min-h-14 bg-slate-100 text-slate-700 font-black rounded-2xl">
                Let me fix it
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-5 pt-8 pb-64 overflow-y-auto no-scrollbar bg-white">
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
              onSelect={(v: VehicleType) => setState((p) => ({ ...p, vehicle: v, isManualTruckSelection: v === 'truck' }))}
              onTruckHoursChange={(h) => setState((p) => ({ ...p, truckHours: h }))}
              onCrewSizeChange={(s) => setState((p) => ({ ...p, crewSize: s }))}
            />
          )}

          {state.step === 3 && (
            <Step3Route
              pickups={state.pickups}
              dropoffs={state.dropoffs}
              vehicle={state.vehicle}
              isCBD={state.isCBD}
              isInterstate={state.isInterstate}
              onUpdatePickups={(p: LocationEntry[]) => {
                setState((s) => ({ ...s, pickups: p }));
                setDuplicateConfirmed(false);
              }}
              onUpdateDropoffs={(d: LocationEntry[]) => {
                setState((s) => ({ ...s, dropoffs: d }));
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
              onUpdateDetails={(det) => setState((s) => ({ ...s, details: { ...s.details, ...det } }))}
            />
          )}

          {state.step === 5 && (
            <Step5Schedule
              details={state.details}
              showValidation={attemptedStep === 5}
              onUpdateDetails={(det) => setState((s) => ({ ...s, details: { ...s.details, ...det } }))}
            />
          )}

          {state.step === 6 && (
            <Step6Contact
              details={state.details}
              snapshot={snapshot}
              whatsappUrl={whatsappUrl}
              errors={contactErrors}
              showErrors={attemptedStep === 6}
              onUpdateDetails={(det) => setState((s) => ({ ...s, details: { ...s.details, ...det } }))}
            />
          )}
        </div>
      </main>

      <SummaryFooter
        breakdown={priceBreakdown}
        vehicle={state.vehicle}
        isInterstate={state.isInterstate}
        step={state.step}
        nextHint={nextHint}
        onNext={nextStep}
        onBook={handleBooking}
      />
    </div>
  );
};

export default App;
