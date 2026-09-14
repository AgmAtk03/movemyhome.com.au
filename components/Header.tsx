import React from 'react';
import { CONFIG, WIZARD_STEPS } from '../constants';

interface HeaderProps {
  step: number;
  totalSteps: number;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ step, totalSteps, onBack }) => {
  const current = WIZARD_STEPS[step - 1];

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 pt-safe">
      <div className="px-5 py-3 flex items-center justify-center relative min-h-[56px]">
        {step > 1 && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-4 min-w-11 min-h-11 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 active:scale-95 transition-all border border-slate-100"
            aria-label="Go back to the previous step"
          >
            <i className="ph-bold ph-caret-left text-lg" aria-hidden="true"></i>
          </button>
        )}

        <p className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-lg text-sm" aria-hidden="true">M</span>
          <span>{CONFIG.COMPANY_NAME}</span>
        </p>
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
                    active ? 'bg-blue-600' : done ? 'bg-blue-300' : 'bg-slate-200'
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
