import React, { useEffect, useRef } from 'react';

declare const google: any;

interface AddressFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  mapsReady: boolean;
  onChange: (address: string) => void;
}

/**
 * Controlled address input. Autocomplete is bound once via a stable object ref
 * so React 19 callback-ref identity changes and parent keystrokes cannot remount
 * or clear the field. Typing always updates React state, even if Maps is down.
 */
const AddressField: React.FC<AddressFieldProps> = ({
  id, label, value, placeholder, mapsReady, onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = inputRef.current;
    if (!mapsReady || !el) return;
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
    } catch (error) {
      console.warn('Autocomplete failed', error);
      return undefined;
    }

    return () => {
      try {
        if (ac && google.maps?.event?.clearInstanceListeners) {
          google.maps.event.clearInstanceListeners(ac);
        }
      } catch {
        // Autocomplete may already be gone if the Maps script failed later.
      }
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
        className="w-full min-h-12 p-4 bg-white border border-slate-200 rounded-2xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
        onChange={(e) => onChangeRef.current(e.target.value)}
      />
    </div>
  );
};

export default AddressField;
