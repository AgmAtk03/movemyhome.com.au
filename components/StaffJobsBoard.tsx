import React, { useMemo, useState } from 'react';
import { JobBoardFilter, JobWorkflowStatus, StoredJob } from '../types';
import { jobsMatchingFilter, loadDemoJobs, scheduleBucket, updateJobWorkflow } from '../lib/jobsStore';
import { buildCrewJobSheet, buildWhatsAppShareUrl, formatDateAu, formatTimeAu } from '../lib/quote';
import { isSafeWhatsAppUrl, safeMailtoHref, safeTelHref } from '../lib/sanitize';

const FILTERS: { id: JobBoardFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'future', label: 'Future' },
  { id: 'done', label: 'Done' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABEL: Record<JobWorkflowStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'true');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const StaffJobsBoard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [jobs, setJobs] = useState<StoredJob[]>(() => loadDemoJobs());
  const [filter, setFilter] = useState<JobBoardFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const next: Record<JobBoardFilter, number> = {
      all: jobs.length,
      new: 0,
      upcoming: 0,
      future: 0,
      done: 0,
      cancelled: 0,
    };
    jobs.forEach((job) => {
      next[scheduleBucket(job)] += 1;
    });
    return next;
  }, [jobs]);

  const visible = useMemo(() => jobsMatchingFilter(jobs, filter), [jobs, filter]);

  const grouped = useMemo(() => {
    if (filter !== 'all') return null;
    return {
      new: jobsMatchingFilter(jobs, 'new'),
      upcoming: jobsMatchingFilter(jobs, 'upcoming'),
      future: jobsMatchingFilter(jobs, 'future'),
      done: jobsMatchingFilter(jobs, 'done'),
      cancelled: jobsMatchingFilter(jobs, 'cancelled'),
    };
  }, [filter, jobs]);

  const setStatus = (id: string, workflowStatus: JobWorkflowStatus) => {
    setJobs(updateJobWorkflow(id, workflowStatus));
  };

  const onCopy = async (job: StoredJob) => {
    const sheet = buildCrewJobSheet(job);
    const ok = await copyText(sheet);
    if (ok) {
      setCopiedId(job.id);
      window.setTimeout(() => setCopiedId((current) => (current === job.id ? null : current)), 2000);
    }
  };

  const renderCard = (job: StoredJob) => {
    const tel = safeTelHref(job.customerPhone);
    const mail = safeMailtoHref(job.customerEmail);
    const when = job.scheduleLabel || [formatDateAu(job.moveDate), formatTimeAu(job.moveTime)].filter(Boolean).join(', ');
    const crewSheet = buildCrewJobSheet(job);
    const waShare = buildWhatsAppShareUrl(crewSheet);
    const pickup = job.pickupAddresses.filter(Boolean).join(' → ') || null;
    const dropoff = job.dropoffAddresses.filter(Boolean).join(' → ') || null;

    return (
      <article key={job.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between gap-2 items-start">
          <div>
            <h2 className="font-black text-slate-900 text-lg leading-tight">{job.customerName}</h2>
            <p className="text-sm font-bold text-blue-800 mt-0.5">{job.totalLabel}</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
            {STATUS_LABEL[job.workflowStatus]}
          </span>
        </div>

        <dl className="text-sm space-y-1.5">
          <div>
            <dt className="sr-only">When</dt>
            <dd className="text-slate-800 font-semibold">{when || 'Date to confirm'}</dd>
            <dd className="text-slate-500 text-xs">About a one-hour arrival window</dd>
          </div>
          <div>
            <dt className="text-slate-500">Pickup → drop-off</dt>
            <dd className="text-slate-800 whitespace-pre-line leading-relaxed">
              {pickup || dropoff ? (
                <>
                  {pickup && <span>From: {pickup}</span>}
                  {pickup && dropoff && <br />}
                  {dropoff && <span>To: {dropoff}</span>}
                </>
              ) : (
                job.routeSummary
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Vehicle</dt>
            <dd className="font-semibold text-right">{job.vehicleLabel}{job.crewLabel ? ` · ${job.crewLabel}` : ''}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Service</dt>
            <dd className="font-semibold text-right">{job.serviceLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Items</dt>
            <dd className="text-slate-800">{job.inventorySummary}</dd>
          </div>
          {job.instructions ? (
            <div>
              <dt className="text-slate-500">Notes</dt>
              <dd className="text-slate-800">{job.instructions}</dd>
            </div>
          ) : null}
        </dl>

        <p className="text-sm flex flex-wrap gap-x-3 gap-y-1">
          {tel ? <a className="text-blue-700 font-semibold" href={tel}>{job.customerPhone}</a> : <span className="text-slate-500">No phone</span>}
          {mail ? <a className="text-blue-700 font-semibold break-all" href={mail}>{job.customerEmail}</a> : null}
        </p>

        <div className="flex flex-wrap gap-2">
          {job.workflowStatus === 'new' && (
            <button type="button" className="min-h-11 px-3 rounded-xl bg-blue-600 text-white text-sm font-bold" onClick={() => setStatus(job.id, 'confirmed')}>
              Mark confirmed
            </button>
          )}
          {(job.workflowStatus === 'new' || job.workflowStatus === 'confirmed') && (
            <button type="button" className="min-h-11 px-3 rounded-xl bg-indigo-600 text-white text-sm font-bold" onClick={() => setStatus(job.id, 'in_progress')}>
              In progress
            </button>
          )}
          {job.workflowStatus === 'in_progress' && (
            <button type="button" className="min-h-11 px-3 rounded-xl bg-emerald-600 text-white text-sm font-bold" onClick={() => setStatus(job.id, 'done')}>
              Mark done
            </button>
          )}
          {job.workflowStatus !== 'cancelled' && job.workflowStatus !== 'done' && (
            <button type="button" className="min-h-11 px-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold" onClick={() => setStatus(job.id, 'cancelled')}>
              Cancel
            </button>
          )}
          {job.workflowStatus === 'done' && (
            <button type="button" className="min-h-11 px-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold" onClick={() => setStatus(job.id, 'confirmed')}>
              Reopen
            </button>
          )}
          {job.workflowStatus === 'cancelled' && (
            <button type="button" className="min-h-11 px-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold" onClick={() => setStatus(job.id, 'new')}>
              Restore
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onCopy(job)}
            className="min-h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
          >
            {copiedId === job.id ? 'Copied job sheet' : 'Copy job sheet'}
          </button>
          {waShare && isSafeWhatsAppUrl(waShare) && (
            <a
              href={waShare}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 rounded-xl bg-[#25D366] text-white text-sm font-bold flex items-center justify-center"
            >
              WhatsApp to crew
            </a>
          )}
        </div>
      </article>
    );
  };

  const empty = (
    <p className="text-sm text-slate-500 bg-white border border-slate-100 rounded-2xl p-5">
      Nothing in this list yet. Complete a booking on this device, or switch filters.
    </p>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 max-w-lg mx-auto">
      <header className="bg-amber-100 border-b border-amber-200 px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-900">This page isn’t for customers</p>
        <h1 className="text-xl font-black text-slate-900 mt-1">Internal jobs list</h1>
        <p className="text-sm text-slate-700 mt-1 leading-relaxed">
          You’ve found a private tools page. It isn’t a booking confirmation, and it isn’t linked from the public site. Paid jobs are confirmed after the deposit actually goes through — not by this list.
        </p>
      </header>

      <div className="px-5 py-4 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Job filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`min-h-11 px-4 rounded-full text-sm font-bold whitespace-nowrap ${
              filter === item.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {item.label}
            <span className="ml-1 opacity-70">{counts[item.id]}</span>
          </button>
        ))}
      </div>

      <main className="px-5 pb-28 space-y-6">
        {filter !== 'all' && (visible.length === 0 ? empty : visible.map(renderCard))}

        {grouped && (
          <>
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-500 mb-2">New</h2>
              {grouped.new.length ? grouped.new.map(renderCard) : <p className="text-sm text-slate-400">No new bookings.</p>}
            </section>
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-500 mb-2">Upcoming (7 days)</h2>
              {grouped.upcoming.length ? grouped.upcoming.map(renderCard) : <p className="text-sm text-slate-400">Nothing this week.</p>}
            </section>
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-500 mb-2">Future</h2>
              {grouped.future.length ? grouped.future.map(renderCard) : <p className="text-sm text-slate-400">No later jobs.</p>}
            </section>
            {(grouped.done.length > 0 || grouped.cancelled.length > 0) && (
              <>
                <section>
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-500 mb-2">Done</h2>
                  {grouped.done.length ? grouped.done.map(renderCard) : <p className="text-sm text-slate-400">None yet.</p>}
                </section>
                <section>
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-500 mb-2">Cancelled</h2>
                  {grouped.cancelled.length ? grouped.cancelled.map(renderCard) : <p className="text-sm text-slate-400">None.</p>}
                </section>
              </>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-gradient-to-t from-slate-50">
        <button
          type="button"
          onClick={onExit}
          className="w-full min-h-14 rounded-2xl bg-slate-900 text-white font-black"
        >
          Leave this page
        </button>
      </div>
    </div>
  );
};

export default StaffJobsBoard;
