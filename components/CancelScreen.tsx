import React from 'react';
import ContactActions from './ContactActions';

interface CancelScreenProps {
  onRetry: () => void;
  onHome: () => void;
}

const CancelScreen: React.FC<CancelScreenProps> = ({ onRetry, onHome }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6 bg-white max-w-lg mx-auto text-center pt-16">
      <h1 className="text-3xl font-black text-slate-900">Deposit not taken</h1>
      <p className="text-slate-600 mt-3 max-w-sm leading-relaxed">
        You left before paying. Nothing was charged, and the slot isn’t held yet.
      </p>
      <button type="button" onClick={onRetry} className="btn-primary mt-8 w-full">
        Return to booking
      </button>
      <button type="button" onClick={onHome} className="btn-quiet mt-3 w-full">
        Back to home
      </button>
      <div className="mt-8 w-full text-left">
        <p className="text-sm font-bold text-slate-700 mb-3 text-center">Need a hand? Call or WhatsApp</p>
        <ContactActions variant="stack" />
      </div>
    </div>
  );
};

export default CancelScreen;
