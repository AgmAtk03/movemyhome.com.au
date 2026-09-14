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
        You left before paying. Nothing was charged, and the slot isn’t held yet.
      </p>
      <button type="button" onClick={onRetry} className="btn-primary mt-8 w-full">
        Return to booking
      </button>
      <button type="button" onClick={onHome} className="btn-quiet mt-3 w-full">
        Back to home
      </button>
    </div>
  );
};

export default CancelScreen;
