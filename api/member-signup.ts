import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isValidEmail, isValidPersonName } from '../lib/validation.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { emailJsConfig } from './_lib/env.js';

function read(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function memberTemplateId(): string {
  return read('EMAILJS_MEMBER_TEMPLATE_ID') || read('VITE_EMAILJS_MEMBER_TEMPLATE_ID');
}

function isMemberEmailConfigured(): boolean {
  const cfg = emailJsConfig();
  const template = memberTemplateId();
  if (!template || template.includes('YOUR') || template.includes('MEMBER_ID')) return false;
  if (!cfg.serviceId || cfg.serviceId.includes('YOUR_ID')) return false;
  if (!cfg.publicKey || cfg.publicKey.includes('YOUR_PUBLIC_KEY')) return false;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body || {}) as { name?: string; email?: string };
  const name = sanitizePlainText(String(body.name || ''), 80);
  const email = sanitizePlainText(String(body.email || ''), 120);

  if (!isValidPersonName(name) || !isValidEmail(email)) {
    res.status(400).json({
      ok: false,
      emailed: false,
      message: 'Please add a name and a valid email so we can hold your 5% off.',
    });
    return;
  }

  if (!isMemberEmailConfigured()) {
    res.status(200).json({
      ok: true,
      emailed: false,
      message:
        'We’ve saved your name and email on this device. Membership emails aren’t switched on yet — once they are, we’ll use this for your 5% off.',
    });
    return;
  }

  const cfg = emailJsConfig();
  const payload: Record<string, unknown> = {
    service_id: cfg.serviceId,
    template_id: memberTemplateId(),
    user_id: cfg.publicKey,
    template_params: {
      customer_name: name,
      user_email: email,
      to_email: email,
      email_kind: 'member',
      company_name: 'My Home Removals',
    },
  };
  if (cfg.privateKey) payload.accessToken = cfg.privateKey;

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      res.status(200).json({
        ok: true,
        emailed: false,
        message:
          'We’ve saved your details on this device. We couldn’t send the membership email just now — nothing else was charged or booked.',
      });
      return;
    }
    res.status(200).json({
      ok: true,
      emailed: true,
      message: 'You’re on the list — we’ll be in touch about your 5% off.',
    });
  } catch {
    res.status(200).json({
      ok: true,
      emailed: false,
      message:
        'We’ve saved your details on this device. We couldn’t reach the mail service just now.',
    });
  }
}
