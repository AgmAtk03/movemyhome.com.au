/** Client-side path change that keeps the Vite SPA from doing a full reload. */
export function navigateTo(path: string): void {
  const next = path.startsWith('/') ? path : `/${path}`;
  if (window.location.pathname === next && !window.location.hash) {
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }
  window.history.pushState({}, '', next);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

export function isQuoteRoute(path = currentPath(), hash = window.location.hash): boolean {
  return path === '/quote' || hash === '#quote';
}
