import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_lib/cors.js';
import { isValidEmail, isValidPersonName } from '../lib/validation.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { memberSignupMessage, MEMBER_EMAILS_OFF } from '../lib/customerCopy.js';
import { sendMemberSignupEmails } from './_lib/emailjs.js';
import { canIssueMemberCode, issueMemberCode } from './_lib/memberCodes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
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
      customerEmailed: false,
      businessEmailed: false,
      discountCode: '',
      message: 'Please add a name and a valid email so we can hold your 5% off.',
    });
    return;
  }

  let code = '';
  let alreadyRedeemed = false;
  if (canIssueMemberCode()) {
    try {
      const issued = await issueMemberCode({ name, email });
      if (issued.ok) {
        code = issued.code;
        alreadyRedeemed = issued.alreadyRedeemed;
      }
    } catch {
      console.error('member-signup code issue failed');
    }
  }

  if (!code) {
    res.status(200).json({
      ok: true,
      emailed: false,
      customerEmailed: false,
      businessEmailed: false,
      discountCode: '',
      message: MEMBER_EMAILS_OFF,
    });
    return;
  }

  if (alreadyRedeemed) {
    res.status(200).json({
      ok: true,
      emailed: false,
      customerEmailed: false,
      businessEmailed: false,
      discountCode: code,
      alreadyRedeemed: true,
      message: memberSignupMessage({ code, customerEmailed: false, businessEmailed: false, alreadyRedeemed: true }),
    });
    return;
  }

  const mailed = await sendMemberSignupEmails({ name, email, discountCode: code });
  const customerEmailed = mailed.customerSent;
  const businessEmailed = mailed.businessSent;

  res.status(200).json({
    ok: true,
    emailed: customerEmailed && businessEmailed,
    customerEmailed,
    businessEmailed,
    discountCode: code,
    alreadyRedeemed: false,
    message: memberSignupMessage({ code, customerEmailed, businessEmailed }),
  });
}
