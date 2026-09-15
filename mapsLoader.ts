const MAPS_SCRIPT_ID = 'google-maps-js';

declare global {
  interface Window {
    gm_authFailure?: () => void;
    google?: {
      maps?: {
        places?: {
          Autocomplete?: new (input: HTMLInputElement, opts?: unknown) => unknown;
          AutocompleteService?: new () => {
            getPlacePredictions: (
              request: unknown,
              callback: (predictions: unknown, status: string) => void,
            ) => void;
          };
        };
        DirectionsService?: new () => unknown;
        importLibrary?: (name: string) => Promise<unknown>;
        event?: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

const failureListeners = new Set<() => void>();
let mapsFailed = false;
let loadPromise: Promise<void> | null = null;
let rejectInFlight: ((error: Error) => void) | null = null;

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

export function hasMapsFailed(): boolean {
  return mapsFailed;
}

/** Places library exists *and* GCP has not denied the key. */
export function isGoogleMapsUsable(): boolean {
  return isGoogleMapsReady() && !mapsFailed;
}

export function isPlacesApiEnabledStatus(status: string): boolean {
  return status === 'OK' || status === 'ZERO_RESULTS' || status === 'OVER_QUERY_LIMIT';
}

export function isPlacesApiDeniedStatus(status: string): boolean {
  return status === 'REQUEST_DENIED';
}

export function isGoogleMapsErrorCopy(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes('something went wrong')
    || t.includes('this page can\'t load google maps')
    || t.includes('this page can’t load google maps')
    || t.includes('apinotactivatedmaperror');
}

export function subscribeMapsFailure(listener: () => void): () => void {
  failureListeners.add(listener);
  if (mapsFailed) listener();
  return () => {
    failureListeners.delete(listener);
  };
}

export function notifyMapsFailed(reason = 'Maps API not activated'): void {
  if (mapsFailed) return;
  mapsFailed = true;
  const error = new Error(reason);
  rejectInFlight?.(error);
  rejectInFlight = null;
  failureListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Listeners must not break Maps cleanup.
    }
  });
}

/**
 * Google disables the bound <input> and paints “Sorry! Something went wrong.”
 * when Places is denied. Strip that so customers can keep typing.
 */
export function unlockAddressInput(el: HTMLInputElement, restoreValue?: string): void {
  if (el.disabled) el.disabled = false;
  if (el.readOnly) el.readOnly = false;
  el.removeAttribute('disabled');
  el.removeAttribute('readonly');
  if (typeof restoreValue === 'string' && el.value !== restoreValue) {
    el.value = restoreValue;
  }
}

export function stripGoogleMapsErrorUi(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.gm-err-container, .gm-err-autocomplete').forEach((node) => {
    node.remove();
  });
  document.querySelectorAll('.pac-container').forEach((node) => {
    if (isGoogleMapsErrorCopy(node.textContent || '')) {
      node.remove();
    }
  });
}

function installAuthFailureHandler(): void {
  if (typeof window === 'undefined') return;
  const previous = window.gm_authFailure;
  window.gm_authFailure = () => {
    try {
      previous?.();
    } catch {
      // Ignore a previous handler throwing.
    }
    notifyMapsFailed('Maps API not activated');
  };
}

if (typeof window !== 'undefined') {
  installAuthFailureHandler();
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

async function waitForMapsReady(timeoutMs = 4000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (!isGoogleMapsReady() && !mapsFailed && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return isGoogleMapsReady() && !mapsFailed;
}

function probePlacesApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (mapsFailed) {
      reject(new Error('Maps API not activated'));
      return;
    }
    const Service = window.google?.maps?.places?.AutocompleteService;
    if (!Service) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      rejectInFlight = null;
      reject(new Error('Maps Places probe timed out'));
    }, 8000);

    rejectInFlight = (error) => {
      clearTimeout(timer);
      reject(error);
    };

    try {
      const service = new Service();
      service.getPlacePredictions(
        { input: 'Sydney NSW', componentRestrictions: { country: 'au' } },
        (_predictions, status) => {
          clearTimeout(timer);
          rejectInFlight = null;
          if (mapsFailed || isPlacesApiDeniedStatus(status)) {
            notifyMapsFailed('Maps API not activated');
            reject(new Error('Maps API not activated'));
            return;
          }
          if (isPlacesApiEnabledStatus(status)) {
            resolve();
            return;
          }
          notifyMapsFailed(`Maps Places probe failed: ${status}`);
          reject(new Error(`Maps Places probe failed: ${status}`));
        },
      );
    } catch (error) {
      clearTimeout(timer);
      rejectInFlight = null;
      reject(error instanceof Error ? error : new Error('Maps Places probe failed'));
    }
  });
}

async function ensureMapsLibraries(): Promise<void> {
  if (mapsFailed) {
    throw new Error('Maps API not activated');
  }
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
  if (mapsFailed || !(await waitForMapsReady())) {
    throw new Error(mapsFailed ? 'Maps API not activated' : 'Maps loaded without Places or Directions');
  }
  await probePlacesApi();
  if (mapsFailed) {
    throw new Error('Maps API not activated');
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
  installAuthFailureHandler();
  if (mapsFailed) {
    return Promise.reject(new Error('Maps API not activated'));
  }
  if (isGoogleMapsUsable()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('Maps not configured'));
  }

  loadPromise = injectMapsScript(buildGoogleMapsScriptUrl(key))
    .then(ensureMapsLibraries)
    .catch((error) => {
      loadPromise = null;
      if (!mapsFailed) {
        const message = error instanceof Error ? error.message : 'Maps failed to load';
        if (message.includes('not activated') || message.includes('without Places')) {
          notifyMapsFailed(message);
        }
      }
      throw error;
    });

  return loadPromise;
}
