import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { VehicleType, QuoteState, Inventory, MoveDetails, LocationEntry, ServiceType } from './types';
import { RATES, WIZARD_STEPS } from './constants';
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
import Landing from './components/Landing';
import PrivacyPage from './components/PrivacyPage';
import PaymentResultScreen from './components/PaymentResultScreen';
import CancelScreen from './components/CancelScreen';
import { addressesReady, buildQuoteSnapshot, scheduleReady } from './lib/quote';
import { isContactValid, validateContact } from './lib/validation';
import { buildWhatsAppUrl } from './lib/booking';
import { saveDemoJob } from './lib/jobsStore';
import { sanitizePlainText } from './lib/sanitize';
import { calculateQuote, EMPTY_BREAKDOWN } from './shared/quoteCalc';
import { createCheckoutSession } from './lib/checkout';
import { fetchDieselPrice } from './lib/dieselPrice';
import { PAYMENTS_OFF_BODY, PAYMENT_START_ERROR, customerFacingError } from './lib/customerCopy';
import { currentPath, isQuoteRoute, navigateTo } from './lib/nav';

const INITIAL_INVENTORY: Inventory = {
  boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0,
};

const INITIAL_DETAILS: MoveDetails = {
  date: '', time: '', name: '', email: '', phone: '', instructions: '',
  bedDisassembly: false, bedIsAssembled: true,
};

const App: React.FC = () => {
  const [path, setPath] = useState(currentPath);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [showStaffBoard, setShowStaffBoard] = useState(() => window.location.hash === '#staff-jobs');
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [nextHint, setNextHint] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const [demoCheckout, setDemoCheckout] = useState(false);
  const [bookReview, setBookReview] = useState(false);
  const [dieselAudPerLitre, setDieselAudPerLitre] = useState<number | null>(null);

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
    const onNav = () => {
      setPath(currentPath());
      setShowStaffBoard(window.location.hash === '#staff-jobs');
    };
    window.addEventListener('hashchange', onNav);
    window.addEventListener('popstate', onNav);
    return () => {
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener('popstate', onNav);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDieselPrice().then((row) => {
      if (!cancelled) setDieselAudPerLitre(row.audPerLitre);
    });
    return () => {
      cancelled = true;
    };
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
    if (state.step !== 6) setBookReview(false);
  }, [state.step]);

  useEffect(() => {
    if (state.step === 2 && state.vehicle) setNextHint('');
    if (state.step === 3 && addressesReady(state.pickups, state.dropoffs)) setNextHint('');
    if (state.step === 5 && scheduleReady(state.details)) setNextHint('');
    if (state.step === 6 && contactOk) setNextHint('');
  }, [state.step, state.vehicle, state.pickups, state.dropoffs, state.details, contactOk]);

  const priceBreakdown = useMemo(
    () => calculateQuote({
      vehicle: state.vehicle,
      truckHours: state.truckHours,
      crewSize: state.crewSize,
      pickups: state.pickups,
      dropoffs: state.dropoffs,
      inventory: state.inventory,
      bedDisassembly: state.details.bedDisassembly,
      bedIsAssembled: state.details.bedIsAssembled,
      distanceKm: state.distanceKm,
      travelTimeHrs: state.travelTimeHrs,
      isInterstate: state.isInterstate,
      dieselAudPerLitre,
      step: state.step,
    }),
    [state, dieselAudPerLitre]
  );

  const snapshot = useMemo(() => buildQuoteSnapshot(state, priceBreakdown), [state, priceBreakdown]);
  const whatsappUrl = useMemo(() => buildWhatsAppUrl(state, snapshot), [state, snapshot]);

  const goHome = () => {
    navigateTo('/');
    setIsSuccess(false);
    setDemoCheckout(false);
  };

  const startQuote = () => {
    navigateTo('/quote');
  };

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
      const result = await createCheckoutSession(state);
      if (!result.ok) {
        const hint = customerFacingError(result.error, PAYMENT_START_ERROR);
        setBookingNotice(hint);
        setNextHint(hint);
        return;
      }

      if (result.demoMode) {
        saveDemoJob({
          customerName: sanitizePlainText(state.details.name, 80),
          customerEmail: sanitizePlainText(state.details.email, 120),
          customerPhone: sanitizePlainText(state.details.phone, 24),
          moveDate: state.details.date,
          moveTime: state.details.time,
          scheduleLabel: snapshot.scheduleLabel,
          serviceLabel: snapshot.serviceLabel,
          vehicleLabel: snapshot.vehicleLabel,
          crewLabel: snapshot.crewLabel,
          routeSummary: snapshot.routeSummary,
          pickupAddresses: snapshot.pickupAddresses,
          dropoffAddresses: snapshot.dropoffAddresses,
          inventorySummary: snapshot.inventorySummary,
          totalLabel: result.quoted?.quoteTotalLabel || snapshot.totalLabel,
          depositLabel: result.quoted?.depositLabel || snapshot.depositLabel,
          balanceLabel: result.quoted?.balanceLabel || snapshot.balanceLabel,
          instructions: sanitizePlainText(state.details.instructions || '', 800),
          moveType: snapshot.moveType,
          distanceLabel: snapshot.distanceLabel,
          paymentStatus: 'demo',
        });
        setDemoCheckout(true);
        setBookingNotice(PAYMENTS_OFF_BODY);
        setIsSuccess(true);
        return;
      }

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      setNextHint(PAYMENT_START_ERROR);
    } catch {
      setNextHint('Something went wrong. Please try again in a moment.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleRouteUpdate = useCallback((km: number, isCBD: boolean, isInterstate: boolean, hrs: number) => {
    setState((prev) => {
      const vehicle = isInterstate ? 'truck' : prev.vehicle;
      return { ...prev, distanceKm: km, travelTimeHrs: hrs, isCBD, isInterstate, vehicle };
    });
    setDuplicateConfirmed(false);
  }, []);

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
    if (state.step === 6) {
      setAttemptedStep(6);
      if (!contactOk) {
        setNextHint('Please add a name, email, and Australian phone number.');
        return;
      }
      setNextHint('');
      setBookReview(true);
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

  if (path === '/privacy') {
    return <PrivacyPage onBack={goHome} onQuote={startQuote} />;
  }

  if (path === '/success') {
    return <PaymentResultScreen onReset={goHome} />;
  }

  if (path === '/cancel') {
    return (
      <CancelScreen
        onRetry={() => {
          startQuote();
          setBookReview(false);
          setState((prev) => ({ ...prev, step: 6 }));
        }}
        onHome={goHome}
      />
    );
  }

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
        demoMode={demoCheckout}
        notice={bookingNotice}
        whatsappUrl={whatsappUrl}
        quoted={priceBreakdown}
        onReset={() => window.location.reload()}
      />
    );
  }

  if (!isQuoteRoute(path)) {
    return (
      <Landing onStart={startQuote} />
    );
  }

  return (
    <div className="h-[100dvh] min-h-[100dvh] flex flex-col max-w-lg mx-auto bg-white shadow-2xl relative overflow-hidden">
      <Header
        step={state.step}
        totalSteps={WIZARD_STEPS.length}
        onHome={goHome}
        onBack={() => {
          setNextHint('');
          setAttemptedStep(null);
          if (state.step === 6 && bookReview) {
            setBookReview(false);
            return;
          }
          if (state.step <= 1) {
            goHome();
            return;
          }
          setState((p) => ({ ...p, step: p.step - 1 }));
        }}
      />

      {isBooking && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white" role="status" aria-live="polite">
          <div className="loading-spinner mb-6"></div>
          <p className="font-black text-xl tracking-tight">Taking you to pay the deposit…</p>
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
              <button type="button" onClick={confirmDuplicate} className="btn-primary w-full">
                Yes, that’s right
              </button>
              <button type="button" onClick={() => setShowDuplicateWarning(false)} className="btn-quiet w-full">
                Let me fix it
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 px-5 pt-8 overflow-y-auto no-scrollbar bg-white ${state.step >= 6 ? 'pb-96' : 'pb-80'}`}>
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
              distanceKm={state.distanceKm}
              travelTimeHrs={state.travelTimeHrs}
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
              showErrors={attemptedStep === 6 && !bookReview}
              phase={bookReview ? 'review' : 'details'}
              onEditDetails={() => setBookReview(false)}
              onUpdateDetails={(det) => setState((s) => ({ ...s, details: { ...s.details, ...det } }))}
            />
          )}
        </div>
      </main>

      <SummaryFooter
        breakdown={priceBreakdown.total === 0 && state.step === 1 ? EMPTY_BREAKDOWN : priceBreakdown}
        fuelLine={snapshot.fuelLine}
        vehicle={state.vehicle}
        isInterstate={state.isInterstate}
        step={state.step}
        readyToPay={bookReview}
        nextHint={nextHint}
        onNext={nextStep}
        onBook={handleBooking}
      />
    </div>
  );
};

export default App;
