const MAPS_SCRIPT_ID = 'google-maps-js';

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: unknown;
        DirectionsService?: new () => unknown;
        importLibrary?: (name: string) => Promise<unknown>;
        event?: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

export function getGoogleMapsApiKey(): string {
  const fromEnv = String(import.meta.env?.VITE_GOOGLE_MAPS_API_KEY ?? '').trim();
  if (fromEnv && fromEnv !== '%VITE_GOOGLE_MAPS_API_KEY%') {
    return fromEnv;
  }
  return '';
}

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

export function isGoogleMapsReady(): boolean {
  return Boolean(window.google?.maps?.places && window.google?.maps?.DirectionsService);
}

/**
 * Legacy script URL (no `loading=async`).
 * `loading=async` means the script `load` event is not API-ready — Google requires
 * `callback` or `importLibrary()` instead, which left Places half-initialized.
 */
export function buildGoogleMapsScriptUrl(key: string): string {
  const params = new URLSearchParams({
    key,
    libraries: 'places',
    region: 'AU',
    language: 'en-AU',
  });
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

let loadPromise: Promise<void> | null = null;

async function waitForMapsReady(timeoutMs = 4000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (!isGoogleMapsReady() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return isGoogleMapsReady();
}

async function ensureMapsLibraries(): Promise<void> {
  const maps = window.google?.maps;
  if (!maps) {
    throw new Error('Maps loaded without Places or Directions');
  }
  if (typeof maps.importLibrary === 'function') {
    await maps.importLibrary('places');
    await maps.importLibrary('maps');
    try {
      await maps.importLibrary('routes');
    } catch {
      // DirectionsService is on google.maps in older weekly builds.
    }
  }
  if (!(await waitForMapsReady())) {
    throw new Error('Maps loaded without Places or Directions');
  }
}

function injectMapsScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (isGoogleMapsReady()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Maps failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Maps failed to load'));
    document.head.appendChild(script);
  });
}

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

  loadPromise = injectMapsScript(buildGoogleMapsScriptUrl(key))
    .then(ensureMapsLibraries)
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}
