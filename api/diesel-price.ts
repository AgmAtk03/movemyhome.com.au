import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDieselPrice } from './_lib/dieselPrice.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const price = await getDieselPrice();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', price.ok ? 'public, max-age=60' : 'no-store');
    res.status(200).json(price);
  } catch {
    res.status(200).json({
      ok: false,
      status: 'tbc',
      reason: 'Could not load the 7-Eleven diesel feed just now.',
    });
  }
}
