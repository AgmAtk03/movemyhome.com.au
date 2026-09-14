import React from 'react';
import { CONFIG } from '../constants';
import { navigateTo } from '../lib/nav';

interface SiteHeaderProps {
  current?: 'home' | 'quote' | 'privacy';
}

const linkClass = (active: boolean) =>
  `min-h-11 px-3 inline-flex items-center justify-center rounded-xl text-sm font-bold ${
    active ? 'text-[#146eb4] bg-[#e7f2fa]' : 'text-slate-700 hover:bg-slate-100'
  }`;

const SiteHeader: React.FC<SiteHeaderProps> = ({ current = 'home' }) => {
  const go = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigateTo(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 pt-safe">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <a
          href="/"
          onClick={(e) => go(e, '/')}
          className="flex items-center gap-2 min-h-11 min-w-0"
          aria-current={current === 'home' ? 'page' : undefined}
        >
          <span className="w-9 h-9 rounded-xl bg-[#146eb4] text-white font-black flex items-center justify-center flex-shrink-0" aria-hidden="true">
            M
          </span>
          <span className="font-black text-slate-900 tracking-tight truncate">
            {CONFIG.COMPANY_NAME}
          </span>
        </a>

        <nav aria-label="Site" className="flex items-center gap-0.5">
          <a href="/" onClick={(e) => go(e, '/')} className={linkClass(current === 'home')} aria-current={current === 'home' ? 'page' : undefined}>
            Home
          </a>
          <a href="/quote" onClick={(e) => go(e, '/quote')} className={`${linkClass(current === 'quote')} max-[380px]:hidden`}>
            Get a quote
          </a>
          <a href="/privacy" onClick={(e) => go(e, '/privacy')} className={linkClass(current === 'privacy')}>
            Privacy
          </a>
        </nav>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#ff9900] via-[#ff9900] to-[#146eb4]" aria-hidden="true" />
    </header>
  );
};

export default SiteHeader;
