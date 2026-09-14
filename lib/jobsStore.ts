import { JobScheduleBucket, JobWorkflowStatus, StoredJob } from '../types';

const STORAGE_KEY = 'mhr_demo_jobs';
const SCHEMA = 2;

interface StoredEnvelope {
  schema: number;
  jobs: StoredJob[];
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function moveDateMs(moveDate: string): number | null {
  if (!moveDate) return null;
  const move = new Date(`${moveDate}T00:00:00`);
  if (Number.isNaN(move.getTime())) return null;
  return move.getTime();
}

export function scheduleBucket(job: StoredJob): JobScheduleBucket {
  if (job.workflowStatus === 'done') return 'done';
  if (job.workflowStatus === 'cancelled') return 'cancelled';

  const created = new Date(job.createdAt).getTime();
  const isFresh = Number.isFinite(created) && Date.now() - created < 24 * 60 * 60 * 1000;
  if (isFresh && job.workflowStatus === 'new') return 'new';

  const today = startOfToday().getTime();
  const weekAhead = today + 7 * 24 * 60 * 60 * 1000;
  const move = moveDateMs(job.moveDate);

  if (move !== null && move > weekAhead) return 'future';
  return 'upcoming';
}

function migrateLegacy(raw: unknown): StoredJob | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id || '');
  if (!id) return null;

  const legacyStatus = String(row.status || '');
  const workflow = (row.workflowStatus as JobWorkflowStatus) || (
    legacyStatus === 'new' ? 'new' : 'confirmed'
  );

  return {
    id,
    createdAt: String(row.createdAt || new Date().toISOString()),
    workflowStatus: ['new', 'confirmed', 'in_progress', 'done', 'cancelled'].includes(workflow)
      ? workflow
      : 'new',
    customerName: String(row.customerName || 'Customer'),
    customerEmail: String(row.customerEmail || ''),
    customerPhone: String(row.customerPhone || ''),
    moveDate: String(row.moveDate || ''),
    moveTime: String(row.moveTime || ''),
    scheduleLabel: String(row.scheduleLabel || [row.moveDate, row.moveTime].filter(Boolean).join(' ')),
    serviceLabel: String(row.serviceLabel || ''),
    vehicleLabel: String(row.vehicleLabel || ''),
    crewLabel: String(row.crewLabel || ''),
    routeSummary: String(row.routeSummary || ''),
    pickupAddresses: Array.isArray(row.pickupAddresses) ? row.pickupAddresses.map(String) : [],
    dropoffAddresses: Array.isArray(row.dropoffAddresses) ? row.dropoffAddresses.map(String) : [],
    inventorySummary: String(row.inventorySummary || ''),
    totalLabel: String(row.totalLabel || ''),
    depositLabel: String(row.depositLabel || ''),
    balanceLabel: String(row.balanceLabel || ''),
    instructions: String(row.instructions || ''),
    moveType: String(row.moveType || ''),
    distanceLabel: String(row.distanceLabel || ''),
    paymentStatus: row.paymentStatus === 'deposit_paid' || row.paymentStatus === 'unpaid' || row.paymentStatus === 'demo'
      ? row.paymentStatus
      : 'demo',
    stripeSessionId: String(row.stripeSessionId || ''),
  };
}

function readEnvelope(): StoredJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredEnvelope | StoredJob[] | unknown[];
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as StoredEnvelope).jobs)
        ? (parsed as StoredEnvelope).jobs
        : [];
    return list.map(migrateLegacy).filter((job): job is StoredJob => Boolean(job));
  } catch {
    return [];
  }
}

function writeEnvelope(jobs: StoredJob[]) {
  const payload: StoredEnvelope = { schema: SCHEMA, jobs: jobs.slice(0, 80) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadDemoJobs(): StoredJob[] {
  return readEnvelope().sort((a, b) => {
    const aMove = moveDateMs(a.moveDate) ?? Number.MAX_SAFE_INTEGER;
    const bMove = moveDateMs(b.moveDate) ?? Number.MAX_SAFE_INTEGER;
    if (aMove !== bMove) return aMove - bMove;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

export function saveDemoJob(job: Omit<StoredJob, 'id' | 'createdAt' | 'workflowStatus'> & { workflowStatus?: JobWorkflowStatus }): StoredJob {
  const createdAt = new Date().toISOString();
  const stored: StoredJob = {
    ...job,
    id: `job-${Date.now()}`,
    createdAt,
    workflowStatus: job.workflowStatus || 'new',
  };
  writeEnvelope([stored, ...readEnvelope()]);
  return stored;
}

export function updateJobWorkflow(id: string, workflowStatus: JobWorkflowStatus): StoredJob[] {
  const next = readEnvelope().map((job) => (job.id === id ? { ...job, workflowStatus } : job));
  writeEnvelope(next);
  return loadDemoJobs();
}

export function jobsMatchingFilter(jobs: StoredJob[], filter: string): StoredJob[] {
  if (filter === 'all') return jobs;
  return jobs.filter((job) => scheduleBucket(job) === filter);
}
