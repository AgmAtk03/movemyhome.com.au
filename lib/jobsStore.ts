import { StoredJob } from '../types';

const STORAGE_KEY = 'mhr_demo_jobs';

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function deriveStatus(moveDate: string, createdAt: string): StoredJob['status'] {
  const created = new Date(createdAt).getTime();
  const isNew = Date.now() - created < 24 * 60 * 60 * 1000;
  const move = moveDate ? new Date(`${moveDate}T00:00:00`) : null;
  const today = startOfToday();
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  if (move && move.getTime() > weekAhead.getTime()) return isNew ? 'new' : 'future';
  if (isNew) return 'new';
  return 'upcoming';
}

export function loadDemoJobs(): StoredJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredJob[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((job) => ({
      ...job,
      status: deriveStatus(job.moveDate, job.createdAt),
    }));
  } catch {
    return [];
  }
}

export function saveDemoJob(job: Omit<StoredJob, 'id' | 'createdAt' | 'status'>): StoredJob {
  const createdAt = new Date().toISOString();
  const stored: StoredJob = {
    ...job,
    id: `job-${Date.now()}`,
    createdAt,
    status: deriveStatus(job.moveDate, createdAt),
  };
  const next = [stored, ...loadDemoJobs()].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return stored;
}
