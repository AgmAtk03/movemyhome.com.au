import React, { useMemo, useState } from 'react';
import { StoredJob } from '../types';
import { loadDemoJobs } from '../lib/jobsStore';
import { CONFIG } from '../constants';

const StaffJobsBoard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [jobs] = useState<StoredJob[]>(() => loadDemoJobs());
  const [filter, setFilter] = useState<'all' | 'new' | 'upcoming' | 'future'>('all');

  const visible = useMemo(
    () => (filter === 'all' ? jobs : jobs.filter((job) => job.status === filter)),
    [jobs, filter]
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 max-w-lg mx-auto">
      <header className="bg-amber-100 border-b border-amber-200 px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-800">Demo only — this browser</p>
        <h1 className="text-xl font-black text-slate-900 mt-1">{CONFIG.COMPANY_NAME} jobs</h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Bookings are stored in this device’s browser only. Production staff should use the business inbox first. See JOBS.md.
        </p>
      </header>

      <div className="px-5 py-4 flex gap-2 overflow-x-auto">
        {(['all', 'new', 'upcoming', 'future'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`min-h-11 px-4 rounded-full text-sm font-bold capitalize whitespace-nowrap ${
              filter === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <main className="px-5 pb-24 space-y-3">
        {visible.length === 0 && (
          <p className="text-sm text-slate-500 bg-white border border-slate-100 rounded-2xl p-5">
            No demo jobs yet. Complete a booking in this browser and it will show up here.
          </p>
        )}
        {visible.map((job) => (
          <article key={job.id} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-1">
            <div className="flex justify-between gap-2">
              <h2 className="font-black text-slate-900">{job.customerName}</h2>
              <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                {job.status}
              </span>
            </div>
            <p className="text-sm text-slate-600">{job.moveDate || 'Date TBC'} {job.moveTime}</p>
            <p className="text-sm text-slate-600">{job.serviceLabel} · {job.vehicleLabel} · {job.totalLabel}</p>
            <p className="text-sm text-slate-500 whitespace-pre-line">{job.routeSummary}</p>
            <p className="text-sm text-slate-500">{job.inventorySummary}</p>
            <p className="text-sm">
              <a className="text-blue-700 font-semibold" href={`tel:${job.customerPhone}`}>{job.customerPhone}</a>
              {' · '}
              <a className="text-blue-700 font-semibold" href={`mailto:${job.customerEmail}`}>{job.customerEmail}</a>
            </p>
          </article>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4">
        <button
          type="button"
          onClick={onExit}
          className="w-full min-h-14 rounded-2xl bg-slate-900 text-white font-black"
        >
          Back to quote
        </button>
      </div>
    </div>
  );
};

export default StaffJobsBoard;
