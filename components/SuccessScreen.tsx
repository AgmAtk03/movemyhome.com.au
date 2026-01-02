
import React from 'react';
import { CONFIG } from '../constants';

interface SuccessProps {
  name: string;
  email: string;
  onReset: () => void;
}

const SuccessScreen: React.FC<SuccessProps> = ({ name, email, onReset }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-700">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
        <i className="ph ph-check-circle-fill text-emerald-500 text-6xl"></i>
      </div>
      
      <h2 className="text-3xl font-black text-slate-800 mb-2">Move Requested!</h2>
      <p className="text-slate-600 mb-8 max-w-xs mx-auto text-sm">
        Thanks <span className="font-bold text-blue-600">{name}</span>. We've received your booking request and sent a copy to <span className="font-medium text-blue-600">{email}</span>.
      </p>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-10 text-left w-full">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <i className="ph ph-info-fill"></i> What's next?
        </h4>
        <ul className="space-y-3 text-sm text-blue-800 font-medium">
          <li className="flex items-start gap-2">
            <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
            Our team will review the details & confirm availability.
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
            You'll receive a confirmation call within 2 hours.
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
            Questions? Email us at <span className="underline">{CONFIG.COMPANY_EMAIL}</span>.
          </li>
        </ul>
      </div>

      <button 
        onClick={() => window.location.href = CONFIG.COMPANY_WEBSITE}
        className="w-full py-4 bg-slate-800 text-white font-black rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-95 mb-4"
      >
        RETURN TO WEBSITE
      </button>

      <button 
        onClick={onReset}
        className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600"
      >
        Start New Quote
      </button>
    </div>
  );
};

export default SuccessScreen;
