import React from 'react';
import { CONFIG, SERVICE_AREAS } from '../constants';
import BannerSlider from './BannerSlider';
import MemberSignup from './MemberSignup';
import SiteHeader from './SiteHeader';
import { navigateTo } from '../lib/nav';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const startQuote = (event?: React.MouseEvent) => {
    event?.preventDefault();
    onStart();
    navigateTo('/quote');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <SiteHeader current="home" />

      <BannerSlider />

      <div className="relative z-30 max-w-6xl mx-auto px-4 -mt-10 sm:-mt-14">
        <div className="bg-white rounded-[1.75rem] shadow-xl border border-slate-100 p-6 sm:p-8">
          <p className="text-[#146eb4] font-bold tracking-wide text-sm">{CONFIG.COMPANY_NAME}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight max-w-2xl">
            Sydney moving, made simple.
          </h1>
          <p className="mt-3 text-slate-600 text-base sm:text-lg font-medium max-w-xl leading-relaxed">
            Local movers for homes, rooms, and a few bulky bits across Sydney and NSW. Get a clear quote in a couple of minutes.
          </p>
          <a href="/quote" onClick={startQuote} className="btn-primary mt-5 inline-flex w-full sm:w-auto px-8 text-lg">
            Get an Instant Quote
          </a>
          <p className="text-sm text-slate-500 font-medium mt-3">Takes about two minutes · 10% holds the day</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14 space-y-12">
        <section aria-labelledby="value-heading">
          <h2 id="value-heading" className="text-2xl font-black tracking-tight">Why people book with us</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: 'ph-map-pin', t: 'Sydney & NSW', d: 'From the Inner West to the beaches and regional NSW — we’ll tell you if a job is too far.' },
              { icon: 'ph-calendar-check', t: '10% holds the day', d: 'Pay a tenth now so the slot is yours. Nothing more until we actually move you.' },
              { icon: 'ph-wallet', t: 'The rest on the day', d: 'The remaining 90% is due when we arrive. No surprise card charge for the full quote.' },
            ].map((item) => (
              <article key={item.t} className="bg-white border border-slate-200 rounded-[1.75rem] p-5">
                <span className="w-11 h-11 rounded-2xl bg-[#e7f2fa] text-[#146eb4] flex items-center justify-center" aria-hidden="true">
                  <i className={`ph-fill ${item.icon} text-xl`}></i>
                </span>
                <h3 className="mt-4 font-black text-lg text-slate-900">{item.t}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[1.75rem] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tight">Ready when you are</h2>
            <p className="mt-2 text-slate-600 leading-relaxed">
              A couple of minutes for a clear quote. No account to create. We’ll confirm the plan before moving day.
            </p>
          </div>
          <a href="/quote" onClick={startQuote} className="btn-primary w-full sm:w-auto px-8 text-lg flex-shrink-0">
            Get an Instant Quote
          </a>
        </section>

        <section aria-labelledby="areas-heading">
          <h2 id="areas-heading" className="text-sm font-bold uppercase tracking-wide text-slate-500">Where we work</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SERVICE_AREAS.map((area) => (
              <span key={area} className="text-sm font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-full">
                {area}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#146eb4] text-white mt-4">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-[#ff9900] font-bold">{CONFIG.COMPANY_NAME}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Become a member and get 5% off your first move.</h2>
            <p className="mt-3 text-white/85 leading-relaxed max-w-md">
              Leave your name and email. We’ll keep it for that first-move discount — not a mailing list of junk.
            </p>
          </div>
          <MemberSignup />
        </div>
        <div className="border-t border-white/15">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-white/70">
            <p>
              Banner photos: Luisa.geo, <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
              {' '}· additional scenes from Pexels. Canva Myhome originals can be swapped in.
            </p>
            <a href="/privacy" className="min-h-11 inline-flex items-center underline decoration-white/40">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
