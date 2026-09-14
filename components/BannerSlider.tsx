import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HOME_BANNERS } from './banners';

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
      <div className="relative h-[min(72vw,28rem)] sm:h-[min(52vw,32rem)] lg:h-[36rem]">
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
                  height={1080}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  decoding={i === 0 ? 'sync' : 'async'}
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-slate-900/10" />
            </div>
          );
        })}

        <p className="absolute left-4 bottom-16 z-20 sm:left-8 sm:bottom-20 text-white text-sm font-bold tracking-wide drop-shadow">
          {HOME_BANNERS[index].kicker}
        </p>

        <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2 sm:px-4 pointer-events-none">
          <button
            type="button"
            className="pointer-events-auto min-w-11 min-h-11 rounded-full bg-white/90 text-slate-800 shadow-md"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
          >
            <i className="ph-bold ph-caret-left text-xl" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className="pointer-events-auto min-w-11 min-h-11 rounded-full bg-white/90 text-slate-800 shadow-md"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
          >
            <i className="ph-bold ph-caret-right text-xl" aria-hidden="true"></i>
          </button>
        </div>

        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2" role="tablist" aria-label="Banner slides">
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
                  i === index ? 'w-8 h-2.5 bg-[#ff9900]' : 'w-2.5 h-2.5 bg-white/85'
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
