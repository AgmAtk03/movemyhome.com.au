import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_lib/cors.js';
import { MEMBER_CODE_FORMAT, MEMBER_CODE_INVALID } from '../lib/customerCopy.js';
import { isValidEmail } from '../lib/validation.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { MEMBER_DISCOUNT_RATE } from '../shared/rates.js';
import { validateMemberCode } from './_lib/memberCodes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (req.body || {}) as { email?: string; code?: string };
  const email = sanitizePlainText(String(body.email || ''), 120);
  const code = sanitizePlainText(String(body.code || ''), 24);

  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, error: MEMBER_CODE_INVALID });
    return;
  }
  if (!code) {
    res.status(400).json({ ok: false, error: MEMBER_CODE_FORMAT });
    return;
  }

  try {
    const result = await validateMemberCode({ email, code });
    if (!result.ok) {
      res.status(200).json({ ok: false, error: result.error, redeemed: Boolean(result.redeemed) });
      return;
    }
    res.status(200).json({
      ok: true,
      code: result.code,
      rate: MEMBER_DISCOUNT_RATE,
      message: `Member 5% off applied (${result.code}).`,
    });
  } catch {
    res.status(200).json({ ok: false, error: 'We couldn’t check that code just now. Please try again.' });
  }
}
