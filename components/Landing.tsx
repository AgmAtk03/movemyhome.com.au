import React from 'react';
import { CONFIG, SERVICE_AREAS } from '../constants';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col max-w-lg mx-auto relative overflow-x-hidden">
      <div className="absolute top-[-10%] right-[-20%] w-80 h-80 bg-blue-600/25 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-20%] w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <main className="relative z-10 flex-1 px-6 pt-12 pb-10 flex flex-col">
        <p className="text-blue-300 font-bold tracking-wide text-center">{CONFIG.COMPANY_NAME}</p>

        <div className="flex justify-center my-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] rotate-[12deg] flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <i className="ph-fill ph-house-line text-4xl text-white -rotate-[12deg]" aria-hidden="true"></i>
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight leading-tight text-center">
          Sydney moving, <span className="text-blue-400">made simple.</span>
        </h1>
        <p className="text-slate-300 text-base font-medium leading-relaxed text-center mt-4">
          Get a clear quote in a couple of minutes. Pay 10% to hold the day. We confirm the plan — then the rest is due when we move.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-8 w-full min-h-16 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-600/20 active:scale-[0.97] transition-all text-xl"
        >
          Get my quote
        </button>
        <p className="text-slate-400 text-sm font-medium mt-3 text-center">Takes about two minutes</p>

        <ol className="mt-8 space-y-3 text-sm">
          {[
            { n: '1', t: 'See the quote as you go' },
            { n: '2', t: 'Pay 10% to hold the slot' },
            { n: '3', t: 'We’ll confirm before moving day' },
            { n: '4', t: 'Pay the rest on the day' },
          ].map((step) => (
            <li key={step.n} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 font-medium text-slate-200">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{step.n}</span>
              {step.t}
            </li>
          ))}
        </ol>

        <section className="mt-8" aria-labelledby="areas-heading">
          <h2 id="areas-heading" className="text-sm font-bold uppercase tracking-wide text-slate-400">Where we work</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SERVICE_AREAS.map((area) => (
              <span key={area} className="text-xs font-semibold bg-white/10 text-slate-200 px-3 py-2 rounded-full">
                {area}
              </span>
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs text-slate-500 leading-relaxed text-center">
          Local Sydney movers for homes, rooms, and a few bulky items. We’ll talk through anything that might change the price before we start.
        </p>

        <a href="/privacy" className="mt-8 text-xs text-slate-500 underline decoration-slate-600 underline-offset-4 min-h-11 flex items-center justify-center self-center">
          Privacy
        </a>
      </main>
    </div>
  );
};

export default Landing;
