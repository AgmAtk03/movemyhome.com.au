import React from 'react';
import { CONFIG, WIZARD_STEPS } from '../constants';
import { navigateTo } from '../lib/nav';
import BrandMark from './BrandMark';
import Icon from './Icon';

interface HeaderProps {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onHome?: () => void;
}

const Header: React.FC<HeaderProps> = ({ step, totalSteps, onBack, onHome }) => {
  const current = WIZARD_STEPS[step - 1];
  const goHome = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onHome) onHome();
    else navigateTo('/');
  };
  const goPrivacy = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigateTo('/privacy');
  };

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 pt-safe">
      <div className="px-3 py-3 flex items-center gap-2 min-h-[56px]">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="min-w-11 min-h-11 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 active:scale-95 transition-all border border-slate-100 flex-shrink-0"
            aria-label={step > 1 ? 'Go back to the previous step' : 'Back to home'}
          >
            <Icon name="caret-left" className="text-lg" />
          </button>
        )}

        <a href="/" onClick={goHome} className="flex items-center gap-2 min-h-11 min-w-0 flex-1">
          <BrandMark className="h-8 w-12" />
          <span className="font-black tracking-tight text-slate-900 truncate">{CONFIG.COMPANY_NAME}</span>
        </a>

        <nav className="flex items-center flex-shrink-0" aria-label="Site">
          <a href="/" onClick={goHome} className="min-h-11 px-2 inline-flex items-center text-xs font-bold text-slate-600">
            Home
          </a>
          <a href="/privacy" onClick={goPrivacy} className="min-h-11 px-2 inline-flex items-center text-xs font-bold text-slate-600">
            Privacy
          </a>
        </nav>
      </div>

      <div className="px-5 pb-3">
        <p className="text-[11px] font-bold text-slate-500 mb-2" aria-live="polite">
          Step {step} of {totalSteps}
          {current ? ` · ${current.label}` : ''}
        </p>
        <ol className="flex items-center gap-1" aria-label="Quote progress">
          {WIZARD_STEPS.map((item) => {
            const done = item.id < step;
            const active = item.id === step;
            return (
              <li key={item.id} className="flex-1">
                <span
                  className={`block h-1.5 rounded-full ${
                    active ? 'bg-[#ff9900]' : done ? 'bg-[#146eb4]' : 'bg-slate-200'
                  }`}
                />
                <span className="sr-only">
                  {item.label}
                  {active ? ', current step' : done ? ', completed' : ', not yet'}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </header>
  );
};

export default Header;
