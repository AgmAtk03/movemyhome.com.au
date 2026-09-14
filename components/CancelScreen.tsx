import React from 'react';

interface CancelScreenProps {
  onRetry: () => void;
  onHome: () => void;
}

const CancelScreen: React.FC<CancelScreenProps> = ({ onRetry, onHome }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-6 bg-white max-w-lg mx-auto text-center pt-16">
      <h1 className="text-3xl font-black text-slate-900">Deposit not taken</h1>
      <p className="text-slate-600 mt-3 max-w-sm leading-relaxed">
        You left Stripe Checkout before paying. The slot is not held. Nothing was charged.
      </p>
      <button type="button" onClick={onRetry} className="mt-8 w-full min-h-14 rounded-2xl bg-blue-600 text-white font-black">
        Return to booking
      </button>
      <button type="button" onClick={onHome} className="mt-3 min-h-11 text-slate-500 font-bold text-sm">
        Start again
      </button>
    </div>
  );
};

export default CancelScreen;
