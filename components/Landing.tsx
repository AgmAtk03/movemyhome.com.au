import React from 'react';
import { CONFIG, SERVICE_AREAS } from '../constants';
import BannerSlider from './BannerSlider';
import Icon, { type IconName } from './Icon';
import MemberSignup from './MemberSignup';
import SiteHeader from './SiteHeader';
import { navigateTo } from '../lib/nav';

interface LandingProps {
  onStart: () => void;
}

const CARE_PROPS: { icon: IconName; t: string; d: string }[] = [
  {
    icon: 'bubbles',
    t: 'Bubble wrap',
    d: 'Glass, TVs, and the awkward bits get wrapped so they don’t rattle around in the back.',
  },
  {
    icon: 'straps',
    t: 'Ties and straps',
    d: 'Everything is strapped into the truck so it stays put on Sydney roads — hills, roundabouts, the lot.',
  },
  {
    icon: 'shield-check',
    t: 'Careful handling',
    d: 'We take our time with your things. If something needs extra care, we’ll say so before we lift it.',
  },
];

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const startQuote = (event?: React.MouseEvent) => {
    event?.preventDefault();
    onStart();
    navigateTo('/quote');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <SiteHeader current="home" />

      <BannerSlider>
        <div className="absolute inset-0 z-[15] flex flex-col items-center justify-center px-4 pb-10 pt-6 text-center pointer-events-none">
          <p className="text-[#ff9900] font-bold tracking-wide text-sm drop-shadow">{CONFIG.COMPANY_NAME}</p>
          <h1 className="mt-1 text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight max-w-xl drop-shadow-md">
            Sydney moving, made simple.
          </h1>
          <a
            href="/quote"
            onClick={startQuote}
            className="btn-primary pointer-events-auto mt-5 w-full max-w-sm text-xl min-h-[52px] px-8 shadow-[0_12px_28px_rgba(255,153,0,0.45)]"
          >
            Get an Instant Quote
          </a>
          <p className="mt-3 text-sm font-medium text-white/90 drop-shadow">Takes about two minutes · No account needed</p>
        </div>
      </BannerSlider>

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14 space-y-12">
        <section aria-labelledby="care-heading">
          <p className="text-[#146eb4] font-bold text-sm tracking-wide">Looked after, not just loaded</p>
          <h2 id="care-heading" className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">
            How we protect your things
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed">
            Local Sydney movers, packing like we’d pack our own place. Wrap, strap, and take it steady — that’s the job.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CARE_PROPS.map((item) => (
              <article key={item.t} className="bg-white border border-slate-200 rounded-[1.75rem] p-5">
                <span className="w-11 h-11 rounded-2xl bg-[#e7f2fa] text-[#146eb4] flex items-center justify-center text-xl" aria-hidden="true">
                  <Icon name={item.icon} />
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
            <p>My Home Removals · Sydney and NSW</p>
            <a href="/privacy" className="min-h-11 inline-flex items-center underline decoration-white/40">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
