
import React from 'react';
import { CONFIG } from '../constants';

interface HeaderProps {
  step: number;
  totalSteps: number;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ step, totalSteps, onBack }) => {
  const progress = (step / totalSteps) * 100;

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 pt-safe border-b border-slate-100">
      <div className="px-6 py-4 flex items-center justify-center relative min-h-[64px]">
        {/* Top-Left Back Button */}
        {step > 1 && onBack && (
          <button 
            onClick={onBack}
            className="absolute left-6 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 active:scale-90 transition-all border border-slate-100 animate-in fade-in slide-in-from-left-2 duration-300"
            aria-label="Go back"
          >
            <i className="ph-bold ph-caret-left text-lg"></i>
          </button>
        )}

        <a href={CONFIG.COMPANY_WEBSITE} className="transition-transform active:scale-95">
          <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-lg text-sm">A</span>
            <span className="hidden sm:inline">{CONFIG.COMPANY_NAME}</span>
            <span className="sm:hidden">{CONFIG.COMPANY_SHORT_NAME}</span>
          </h1>
        </a>
      </div>
      
      <div className="h-1 w-full bg-slate-100 relative">
        <div 
          className="h-full bg-blue-600 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute right-4 -top-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Step {step} of {totalSteps}
        </div>
      </div>
    </header>
  );
};

export default Header;
