import React, { useEffect, useLayoutEffect, useRef } from 'react';
import {
  stripGoogleMapsErrorUi,
  subscribeMapsFailure,
  unlockAddressInput,
} from '../mapsLoader';

declare const google: any;

interface AddressFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  mapsReady: boolean;
  onChange: (address: string) => void;
}

function detachAutocomplete(ac: any, el: HTMLInputElement): void {
  try {
    if (typeof google !== 'undefined' && google?.maps?.event?.clearInstanceListeners) {
      if (ac) google.maps.event.clearInstanceListeners(ac);
      google.maps.event.clearInstanceListeners(el);
    }
  } catch {
    // Autocomplete may already be gone if the Maps script failed later.
  }
  unlockAddressInput(el);
  stripGoogleMapsErrorUi();
}

/**
 * Controlled address input. Autocomplete is bound only after Maps is usable.
 * Google may still disable the node on ApiNotActivatedMapError — we unlock it
 * and fall back to plain typing so the field never becomes unusable.
 */
const AddressField: React.FC<AddressFieldProps> = ({
  id, label, value, placeholder, mapsReady, onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  onChangeRef.current = onChange;
  valueRef.current = value;

  const keepUsable = () => {
    const el = inputRef.current;
    if (!el) return;
    unlockAddressInput(el, valueRef.current);
    stripGoogleMapsErrorUi();
  };

  useLayoutEffect(() => {
    keepUsable();
  });

  useEffect(() => {
    const el = inputRef.current;
    if (!el || typeof MutationObserver === 'undefined') return;
    keepUsable();
    const observer = new MutationObserver(() => keepUsable());
    observer.observe(el, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
    const bodyObserver = new MutationObserver(() => stripGoogleMapsErrorUi());
    if (document.body) {
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      observer.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  useEffect(() => subscribeMapsFailure(() => keepUsable()), []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (!mapsReady) {
      unlockAddressInput(el, valueRef.current);
      stripGoogleMapsErrorUi();
      return;
    }
    if (typeof google === 'undefined' || !google.maps?.places?.Autocomplete) return;

    let ac: any = null;
    try {
      ac = new google.maps.places.Autocomplete(el, {
        componentRestrictions: { country: 'au' },
        fields: ['formatted_address', 'address_components', 'geometry'],
        types: ['address'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const addr = place.formatted_address || el.value;
        onChangeRef.current(addr);
      });
      unlockAddressInput(el, valueRef.current);
    } catch (error) {
      console.warn('Autocomplete failed', error);
      unlockAddressInput(el, valueRef.current);
      return undefined;
    }

    const unsubscribe = subscribeMapsFailure(() => detachAutocomplete(ac, el));

    return () => {
      unsubscribe();
      detachAutocomplete(ac, el);
    };
  }, [mapsReady]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-bold text-slate-700">{label}</label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        autoComplete={mapsReady ? 'off' : 'street-address'}
        placeholder={placeholder}
        className="address-field w-full min-h-12 p-4 bg-white border border-slate-200 rounded-2xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
        onInput={(e) => onChangeRef.current(e.currentTarget.value)}
        onChange={(e) => onChangeRef.current(e.currentTarget.value)}
      />
    </div>
  );
};

export default AddressField;
