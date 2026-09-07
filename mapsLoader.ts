const MAPS_SCRIPT_ID = 'google-maps-js';

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: unknown;
        DirectionsService?: new () => unknown;
      };
    };
  }
}

export function getGoogleMapsApiKey(): string {
  const fromEnv = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim();
  if (fromEnv && fromEnv !== '%VITE_GOOGLE_MAPS_API_KEY%') {
    return fromEnv;
  }

  if (typeof document === 'undefined') return '';
  const meta = document.querySelector('meta[name="vite-google-maps-api-key"]');
  const fromMeta = meta?.getAttribute('content')?.trim() ?? '';
  if (fromMeta && fromMeta !== '%VITE_GOOGLE_MAPS_API_KEY%') {
    return fromMeta;
  }

  return '';
}

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

export function isGoogleMapsReady(): boolean {
  return Boolean(window.google?.maps?.places && window.google?.maps?.DirectionsService);
}

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Maps not configured'));
  }
  if (isGoogleMapsReady()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('Maps not configured'));
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (isGoogleMapsReady()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => {
        if (isGoogleMapsReady()) resolve();
        else reject(new Error('Maps loaded without Places or Directions'));
      });
      existing.addEventListener('error', () => reject(new Error('Maps failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    const params = new URLSearchParams({
      key,
      libraries: 'places',
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.onload = () => {
      if (isGoogleMapsReady()) resolve();
      else reject(new Error('Maps loaded without Places or Directions'));
    };
    script.onerror = () => reject(new Error('Maps failed to load'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
