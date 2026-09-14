
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { LocationEntry, AccessType, VehicleType } from '../types';
import { ACCESS_LABELS, RATES } from '../constants';
import { isGoogleMapsConfigured, isGoogleMapsReady, loadGoogleMaps } from '../mapsLoader';
import { formatMoney } from '../lib/quote';

declare const google: any;

interface Step2Props {
  pickups: LocationEntry[];
  dropoffs: LocationEntry[];
  vehicle: VehicleType | null;
  isCBD: boolean;
  isInterstate: boolean;
  onUpdatePickups: (p: LocationEntry[]) => void;
  onUpdateDropoffs: (d: LocationEntry[]) => void;
  onUpdateRouteInfo: (km: number, isCBD: boolean, isInterstate: boolean, hrs: number) => void;
}

const Step2Route: React.FC<Step2Props> = ({ pickups, dropoffs, vehicle, isCBD, isInterstate, onUpdatePickups, onUpdateDropoffs, onUpdateRouteInfo }) => {
  const acRefs = useRef<Record<string, any>>({});
  const inputEls = useRef<Record<string, HTMLInputElement | null>>({});
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapsStatus, setMapsStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>(() => {
    if (!isGoogleMapsConfigured()) return 'missing';
    return isGoogleMapsReady() ? 'ready' : 'loading';
  });
  const mapsMissing = mapsStatus === 'missing' || mapsStatus === 'error';

  useEffect(() => {
    if (!isGoogleMapsConfigured()) {
      setMapsStatus('missing');
      return;
    }
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setMapsStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setMapsStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const calculateRoute = useCallback(() => {
    if (typeof google === 'undefined' || !google.maps || !google.maps.DirectionsService) return;

    const validAddresses = [...pickups, ...dropoffs]
      .map((l) => l.address.trim())
      .filter((a) => a.length > 10);

    if (validAddresses.length < 2) {
      setRouteError(null);
      return;
    }

    const service = new google.maps.DirectionsService();

    service.route({
      origin: validAddresses[0],
      destination: validAddresses[validAddresses.length - 1],
      waypoints: validAddresses.slice(1, -1).map((a) => ({ location: a, stopover: true })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
      avoidTolls: false,
    }, (result: any, status: string) => {
      if (status === 'OK' && result) {
        setRouteError(null);
        const totalDistance = result.routes[0].legs.reduce((acc: number, leg: any) => acc + (leg.distance?.value || 0), 0);
        const totalDuration = result.routes[0].legs.reduce((acc: number, leg: any) => acc + (leg.duration?.value || 0), 0);
        const travelHrs = totalDuration / 3600;

        let containsCBD = false;
        let movingInterstate = false;

        result.routes[0].legs.forEach((leg: any) => {
          const startAddr = leg.start_address;
          const endAddr = leg.end_address;

          if (startAddr.includes('2000') || endAddr.includes('2000')) {
            containsCBD = true;
          }

          const destinationIsNSW = endAddr.toLowerCase().includes('nsw') ||
            endAddr.toLowerCase().includes('new south wales') ||
            endAddr.toLowerCase().includes('sydney');

          if (!destinationIsNSW && endAddr.length > 5) {
            movingInterstate = true;
          }
        });

        onUpdateRouteInfo(totalDistance / 1000, containsCBD, movingInterstate, travelHrs);
      } else {
        if (status === 'NOT_FOUND') {
          setRouteError('We couldn’t find one of those addresses. Check the spelling, or pick a suggestion.');
        } else if (status === 'ZERO_RESULTS') {
          setRouteError('We couldn’t find a driving route between those spots. Try a nearby street.');
        } else {
          setRouteError('We couldn’t map that route just now. You can still continue — we’ll confirm the distance with you.');
        }
        onUpdateRouteInfo(0, false, false, 0);
      }
    });
  }, [pickups, dropoffs, onUpdateRouteInfo]);

  useEffect(() => {
    if (mapsStatus !== 'ready') return;
    const timer = setTimeout(calculateRoute, 1000);
    return () => clearTimeout(timer);
  }, [pickups, dropoffs, calculateRoute, mapsStatus]);

  const initAC = (id: string, el: HTMLInputElement | null) => {
    if (!el || acRefs.current[id] || mapsStatus !== 'ready' || typeof google === 'undefined') return;
    try {
      const ac = new google.maps.places.Autocomplete(el, {
        componentRestrictions: { country: 'au' },
        fields: ['formatted_address', 'address_components', 'geometry'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const addr = place.formatted_address || el.value;
        if (pickups.find((p) => p.id === id)) {
          onUpdatePickups(pickups.map((p) => p.id === id ? { ...p, address: addr } : p));
        } else {
          onUpdateDropoffs(dropoffs.map((d) => d.id === id ? { ...d, address: addr } : d));
        }
      });
      acRefs.current[id] = ac;
    } catch (e) {
      console.warn('Autocomplete failed', e);
    }
  };

  const bindInput = (id: string, el: HTMLInputElement | null) => {
    inputEls.current[id] = el;
    initAC(id, el);
  };

  useEffect(() => {
    if (mapsStatus !== 'ready') return;
    Object.entries(inputEls.current).forEach(([id, el]) => initAC(id, el));
  }, [mapsStatus, pickups, dropoffs]);

  const addLocation = (type: 'pickup' | 'dropoff') => {
    const newLoc: LocationEntry = { id: `${type}-${Date.now()}`, address: '', access: 'ground', hasLoadingDock: false };
    if (type === 'pickup') onUpdatePickups([...pickups, newLoc]);
    else onUpdateDropoffs([...dropoffs, newLoc]);
  };

  const removeLocation = (id: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup' && pickups.length > 1) onUpdatePickups(pickups.filter((p) => p.id !== id));
    if (type === 'dropoff' && dropoffs.length > 1) onUpdateDropoffs(dropoffs.filter((d) => d.id !== id));
    delete acRefs.current[id];
  };

  const updateAccess = (id: string, access: AccessType, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') onUpdatePickups(pickups.map((p) => p.id === id ? { ...p, access } : p));
    else onUpdateDropoffs(dropoffs.map((d) => d.id === id ? { ...d, access } : d));
  };

  const toggleDock = (id: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') onUpdatePickups(pickups.map((p) => p.id === id ? { ...p, hasLoadingDock: !p.hasLoadingDock } : p));
    else onUpdateDropoffs(dropoffs.map((d) => d.id === id ? { ...d, hasLoadingDock: !d.hasLoadingDock } : d));
  };

  const renderStop = (loc: LocationEntry, idx: number, type: 'pickup' | 'dropoff') => {
    const isLocCBD = loc.address.includes('2000');
    const list = type === 'pickup' ? pickups : dropoffs;
    const label = type === 'pickup' ? `Pickup ${list.length > 1 ? idx + 1 : 'address'}` : `Drop-off ${list.length > 1 ? idx + 1 : 'address'}`;
    const accessId = `${loc.id}-access`;

    return (
      <div key={loc.id} className={`mb-4 p-5 bg-white border rounded-3xl shadow-sm space-y-3 ${isLocCBD ? 'border-blue-200' : 'border-slate-200'}`}>
        {list.length > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">{label}</span>
            <button
              type="button"
              onClick={() => removeLocation(loc.id, type)}
              className="min-h-11 px-3 text-sm font-bold text-rose-700 bg-rose-50 rounded-full"
            >
              Remove
            </button>
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor={loc.id} className="text-sm font-bold text-slate-700">{label}</label>
          <input
            id={loc.id}
            ref={(el) => bindInput(loc.id, el)}
            type="text"
            autoComplete="street-address"
            placeholder={type === 'pickup' ? 'Street, suburb, NSW…' : 'Where should we take it?'}
            className="w-full min-h-12 p-4 bg-white border border-slate-200 rounded-2xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
            defaultValue={loc.address}
            onChange={(e) => {
              if (type === 'pickup') onUpdatePickups(pickups.map((item) => item.id === loc.id ? { ...item, address: e.target.value } : item));
              else onUpdateDropoffs(dropoffs.map((item) => item.id === loc.id ? { ...item, address: e.target.value } : item));
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={accessId} className="text-sm font-bold text-slate-700">How do we get in?</label>
          <select
            id={accessId}
            className="w-full min-h-12 p-4 bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-800"
            value={loc.access}
            onChange={(e) => updateAccess(loc.id, e.target.value as AccessType, type)}
          >
            {Object.entries(ACCESS_LABELS).map(([value, text]) => (
              <option key={value} value={value}>{text}</option>
            ))}
          </select>
        </div>

        {isLocCBD && (
          <button
            type="button"
            onClick={() => toggleDock(loc.id, type)}
            aria-pressed={loc.hasLoadingDock}
            className={`flex items-center gap-3 p-4 min-h-14 rounded-2xl border-2 w-full text-left ${loc.hasLoadingDock ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-blue-200 text-blue-800'}`}
          >
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${loc.hasLoadingDock ? 'border-white' : 'border-blue-400'}`}>
              {loc.hasLoadingDock && <span className="w-2 h-2 bg-white rounded-full" />}
            </span>
            <span>
              <span className="block text-sm font-bold">There’s a loading dock</span>
              <span className="block text-xs opacity-80">
                {loc.hasLoadingDock ? 'CBD parking fee waived' : `Saves ${formatMoney(RATES.CBD_FEE)} CBD parking`}
              </span>
            </span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-premium-in pb-24">
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
          Where are we heading?
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          Add where we collect from and where it needs to go. Extra stops are fine.
        </p>
      </div>

      <div className="space-y-3">
        {mapsMissing && (
          <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-2xl text-sm font-medium leading-relaxed" role="status">
            Address suggestions aren’t available right now. Type the full street and suburb — we’ll confirm the exact distance when we call.
          </div>
        )}

        {routeError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm font-medium" role="alert">
            {routeError}
          </div>
        )}

        {isCBD && !routeError && (
          <div className="bg-blue-700 text-white p-4 rounded-2xl text-sm font-medium">
            That looks like Sydney CBD. Tell us if there’s a loading dock so we can skip the parking fee.
          </div>
        )}

        {isInterstate && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 p-4 rounded-2xl text-sm font-medium">
            This looks like an interstate trip, so we’ll use the truck.
          </div>
        )}
      </div>

      <section>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Pick up from</h3>
        {pickups.map((p, idx) => renderStop(p, idx, 'pickup'))}
        <button
          type="button"
          onClick={() => addLocation('pickup')}
          className="w-full min-h-12 bg-blue-50 text-blue-800 border-2 border-dashed border-blue-200 rounded-2xl font-bold text-sm"
        >
          + Add another pickup
        </button>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Drop off at</h3>
        {dropoffs.map((d, idx) => renderStop(d, idx, 'dropoff'))}
        <button
          type="button"
          onClick={() => addLocation('dropoff')}
          className="w-full min-h-12 bg-emerald-50 text-emerald-800 border-2 border-dashed border-emerald-200 rounded-2xl font-bold text-sm"
        >
          + Add another drop-off
        </button>
      </section>
    </div>
  );
};

export default Step2Route;
