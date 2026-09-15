import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG } from '../constants';
import { HOME_BANNERS } from './banners';
import Icon from './Icon';

const INTERVAL_MS = 5500;

const BannerSlider: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const go = useCallback((next: number) => {
    const total = HOME_BANNERS.length;
    setIndex(((next % total) + total) % total);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion.current) return undefined;
    const timer = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [index, paused, go]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    setPaused(true);
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (start == null) return;
    const delta = event.changedTouches[0].clientX - start;
    if (delta < -40) go(index + 1);
    if (delta > 40) go(index - 1);
  };

  const activeSlide = HOME_BANNERS[index];

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900"
      aria-roledescription="carousel"
      aria-label="My Home Removals in action"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-[14.5rem] sm:h-[min(44vw,28rem)] lg:h-[32rem]">
        {HOME_BANNERS.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                active ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              aria-hidden={!active}
            >
              <picture>
                <source
                  type="image/webp"
                  srcSet={`${slide.stem}-768.webp 768w, ${slide.stem}-1280.webp 1280w, ${slide.stem}.webp 1920w`}
                  sizes="100vw"
                />
                <img
                  src={`${slide.stem}.jpg`}
                  alt={active ? slide.alt : ''}
                  className="h-full w-full object-cover"
                  width={1920}
                  height={864}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  decoding={i === 0 ? 'sync' : 'async'}
                />
              </picture>
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.55)_0%,rgba(15,23,42,0.28)_52%,rgba(15,23,42,0.42)_100%)]"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/25" aria-hidden="true" />
            </div>
          );
        })}

        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-16 sm:px-24 pb-9 pt-2">
          <div className="text-center max-w-lg">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#ff9900] [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">
              {CONFIG.COMPANY_NAME}
            </p>
            <p
              className="mt-1.5 text-white text-[1.15rem] sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug [text-shadow:0_2px_18px_rgba(0,0,0,0.65)]"
              aria-live="polite"
            >
              {activeSlide.kicker}
            </p>
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 right-0 z-30 flex items-center justify-between px-1.5 sm:px-4 pointer-events-none">
          <button
            type="button"
            className="pointer-events-auto min-w-11 min-h-11 rounded-full bg-white/85 text-slate-800 shadow-sm inline-flex items-center justify-center"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
          >
            <Icon name="caret-left" className="text-lg" />
          </button>
          <button
            type="button"
            className="pointer-events-auto min-w-11 min-h-11 rounded-full bg-white/85 text-slate-800 shadow-sm inline-flex items-center justify-center"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
          >
            <Icon name="caret-right" className="text-lg" />
          </button>
        </div>

        <div className="absolute bottom-1.5 left-0 right-0 z-30 flex justify-center gap-1" role="tablist" aria-label="Banner slides">
          {HOME_BANNERS.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1}: ${slide.kicker}`}
              className={`min-w-11 min-h-11 flex items-center justify-center ${i === index ? '' : 'opacity-80'}`}
              onClick={() => go(i)}
            >
              <span
                className={`block rounded-full ${
                  i === index ? 'w-6 h-2 bg-[#ff9900]' : 'w-2 h-2 bg-white/85'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BannerSlider;
