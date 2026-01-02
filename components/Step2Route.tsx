
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { LocationEntry, AccessType, VehicleType } from '../types';

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
  const [routeError, setRouteError] = useState<string | null>(null);
  const isTruck = vehicle === 'truck';

  const calculateRoute = useCallback(() => {
    if (typeof google === 'undefined' || !google.maps || !google.maps.DirectionsService) return;

    const validAddresses = [...pickups, ...dropoffs]
      .map(l => l.address.trim())
      .filter(a => a.length > 10);

    if (validAddresses.length < 2) {
      setRouteError(null);
      return;
    }

    const service = new google.maps.DirectionsService();
    
    service.route({
      origin: validAddresses[0],
      destination: validAddresses[validAddresses.length - 1],
      waypoints: validAddresses.slice(1, -1).map(a => ({ location: a, stopover: true })),
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
          setRouteError("One or more addresses could not be found.");
        } else if (status === 'ZERO_RESULTS') {
          setRouteError("No driving route found between these locations.");
        } else {
          setRouteError("Unable to calculate route.");
        }
        onUpdateRouteInfo(0, false, false, 0);
      }
    });
  }, [pickups, dropoffs, onUpdateRouteInfo]);

  useEffect(() => {
    const timer = setTimeout(calculateRoute, 1000);
    return () => clearTimeout(timer);
  }, [pickups, dropoffs, calculateRoute]);

  const initAC = (id: string, el: HTMLInputElement | null) => {
    if (!el || acRefs.current[id] || typeof google === 'undefined') return;
    try {
      const ac = new google.maps.places.Autocomplete(el, {
        componentRestrictions: { country: 'au' },
        fields: ['formatted_address', 'address_components', 'geometry'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const addr = place.formatted_address || el.value;
        if (pickups.find(p => p.id === id)) {
          onUpdatePickups(pickups.map(p => p.id === id ? { ...p, address: addr } : p));
        } else {
          onUpdateDropoffs(dropoffs.map(d => d.id === id ? { ...d, address: addr } : d));
        }
      });
      acRefs.current[id] = ac;
    } catch (e) { 
      console.warn("Autocomplete failed", e); 
    }
  };

  const addLocation = (type: 'pickup' | 'dropoff') => {
    const newLoc: LocationEntry = { id: `${type}-${Date.now()}`, address: '', access: 'ground', hasLoadingDock: false };
    if (type === 'pickup') onUpdatePickups([...pickups, newLoc]);
    else onUpdateDropoffs([...dropoffs, newLoc]);
  };

  const removeLocation = (id: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup' && pickups.length > 1) onUpdatePickups(pickups.filter(p => p.id !== id));
    if (type === 'dropoff' && dropoffs.length > 1) onUpdateDropoffs(dropoffs.filter(d => d.id !== id));
    delete acRefs.current[id];
  };

  const updateAccess = (id: string, access: AccessType, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') onUpdatePickups(pickups.map(p => p.id === id ? { ...p, access } : p));
    else onUpdateDropoffs(dropoffs.map(d => d.id === id ? { ...d, access } : d));
  };

  const toggleDock = (id: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') onUpdatePickups(pickups.map(p => p.id === id ? { ...p, hasLoadingDock: !p.hasLoadingDock } : p));
    else onUpdateDropoffs(dropoffs.map(d => d.id === id ? { ...d, hasLoadingDock: !d.hasLoadingDock } : d));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="border-b-2 border-slate-100 pb-2">
        <h2 className="text-xl font-extrabold text-blue-600 flex items-center gap-2 tracking-tight">
          <i className="ph-fill ph-map-pin"></i> Step 2: Route & Stops
        </h2>
      </div>

      <div className="space-y-3">
        {routeError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake duration-500">
            <i className="ph-fill ph-warning-octagon text-xl"></i>
            {routeError}
          </div>
        )}

        {isCBD && !routeError && (
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-600/20 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-4">
            <i className="ph-fill ph-buildings text-xl"></i>
            <div>
              <p>Sydney CBD Detected</p>
              <p className="text-[10px] opacity-90 font-medium">Please confirm loading dock availability for each stop to avoid parking fees.</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Pickup Points</h3>
        {pickups.map((p, idx) => {
          const isLocCBD = p.address.includes('2000');
          return (
            <div key={p.id} className={`mb-4 p-5 bg-white border rounded-3xl shadow-sm space-y-3 transition-colors ${isLocCBD ? 'border-blue-200 bg-blue-50/20' : 'border-slate-100'}`}>
              {pickups.length > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    Location #{idx + 1} {isLocCBD && <i className="ph-fill ph-seal-check text-blue-500"></i>}
                  </span>
                  <button onClick={() => removeLocation(p.id, 'pickup')} className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100">
                     <i className="ph ph-trash"></i>
                  </button>
                </div>
              )}
              <input
                ref={(el) => initAC(p.id, el)}
                type="text"
                placeholder="Search pickup address..."
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                defaultValue={p.address}
                onChange={(e) => onUpdatePickups(pickups.map(item => item.id === p.id ? { ...item, address: e.target.value } : item))}
              />
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Access Type</label>
                  <select 
                    className={`w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700`}
                    value={p.access}
                    onChange={(e) => updateAccess(p.id, e.target.value as AccessType, 'pickup')}
                  >
                    <option value="ground">Elevator / Ground Floor</option>
                    <option value="floor1">1st Floor Stairs</option>
                    <option value="floor2">2nd Floor Stairs</option>
                    <option value="floor3">3rd Floor Stairs</option>
                    <option value="floor4">4th Floor Stairs</option>
                  </select>
                </div>

                {isLocCBD && (
                  <button 
                    onClick={() => toggleDock(p.id, 'pickup')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${p.hasLoadingDock ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${p.hasLoadingDock ? 'border-white' : 'border-blue-300'}`}>
                      {p.hasLoadingDock && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex flex-col items-start">
                       <span className="text-sm font-bold">I have a loading dock</span>
                       <span className={`text-[10px] font-bold ${p.hasLoadingDock ? 'text-emerald-100' : 'text-blue-400'}`}>
                         {p.hasLoadingDock ? 'Parking Fee Waived' : 'Avoid $20 Parking Fee'}
                       </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <button onClick={() => addLocation('pickup')} className="w-full py-4 bg-blue-50 text-blue-600 border-2 border-dashed border-blue-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors">
          + Add Pickup Stop
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Dropoff Points</h3>
        {dropoffs.map((d, idx) => {
          const isLocCBD = d.address.includes('2000');
          return (
            <div key={d.id} className={`mb-4 p-5 bg-white border rounded-3xl shadow-sm space-y-3 transition-colors ${isLocCBD ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100'}`}>
              {dropoffs.length > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    Destination #{idx + 1} {isLocCBD && <i className="ph-fill ph-seal-check text-emerald-500"></i>}
                  </span>
                  <button onClick={() => removeLocation(d.id, 'dropoff')} className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100">
                     <i className="ph ph-trash"></i>
                  </button>
                </div>
              )}
              <input
                ref={(el) => initAC(d.id, el)}
                type="text"
                placeholder="Search dropoff address..."
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                defaultValue={d.address}
                onChange={(e) => onUpdateDropoffs(dropoffs.map(item => item.id === d.id ? { ...item, address: e.target.value } : item))}
              />

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Access Type</label>
                  <select 
                    className={`w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700`}
                    value={d.access}
                    onChange={(e) => updateAccess(d.id, e.target.value as AccessType, 'dropoff')}
                  >
                    <option value="ground">Elevator / Ground Floor</option>
                    <option value="floor1">1st Floor Stairs</option>
                    <option value="floor2">2nd Floor Stairs</option>
                    <option value="floor3">3rd Floor Stairs</option>
                    <option value="floor4">4th Floor Stairs</option>
                  </select>
                </div>

                {isLocCBD && (
                  <button 
                    onClick={() => toggleDock(d.id, 'dropoff')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${d.hasLoadingDock ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${d.hasLoadingDock ? 'border-white' : 'border-emerald-300'}`}>
                      {d.hasLoadingDock && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex flex-col items-start">
                       <span className="text-sm font-bold">I have a loading dock</span>
                       <span className={`text-[10px] font-bold ${d.hasLoadingDock ? 'text-emerald-100' : 'text-emerald-400'}`}>
                         {d.hasLoadingDock ? 'Parking Fee Waived' : 'Avoid $20 Parking Fee'}
                       </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <button onClick={() => addLocation('dropoff')} className="w-full py-4 bg-emerald-50 text-emerald-600 border-2 border-dashed border-emerald-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-colors">
          + Add Dropoff Stop
        </button>
      </div>
    </div>
  );
};

export default Step2Route;
