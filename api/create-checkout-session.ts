import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './_lib/cors.js';
import { parseCheckoutPayload } from './_lib/parseQuote.js';
import { calculateFullQuote } from '../shared/quoteCalc.js';
import { formatMoney } from '../shared/money.js';
import { buildQuoteSnapshot } from '../shared/snapshot.js';
import { companyConfig, isStripeConfigured, publicSiteUrl } from './_lib/env.js';
import { dieselAudFromResult, getDieselPrice } from './_lib/dieselPrice.js';
import { getStripe, meta } from './_lib/stripeClient.js';
import { BRAND_NAME } from '../shared/rates.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { PAYMENT_OPEN_ERROR, PAYMENTS_OFF_SHORT, QUOTE_TOO_SMALL } from '../lib/customerCopy.js';

function originFrom(req: VercelRequest): { host: string | null; proto: string | null } {
  const forwarded = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const proto = String(req.headers['x-forwarded-proto'] || '');
  return { host: forwarded || null, proto: proto || null };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parsed = parseCheckoutPayload(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { state } = parsed;
  let dieselAudPerLitre: number | null = null;
  try {
    dieselAudPerLitre = dieselAudFromResult(await getDieselPrice());
  } catch {
    dieselAudPerLitre = null;
  }
  const breakdown = calculateFullQuote({
    vehicle: state.vehicle,
    truckHours: state.truckHours,
    crewSize: state.crewSize,
    pickups: state.pickups,
    dropoffs: state.dropoffs,
    inventory: state.inventory,
    bedDisassembly: state.details.bedDisassembly,
    bedIsAssembled: state.details.bedIsAssembled,
    distanceKm: state.distanceKm,
    travelTimeHrs: state.travelTimeHrs,
    isInterstate: state.isInterstate,
    dieselAudPerLitre,
  });

  if (breakdown.depositCents < 50) {
    res.status(400).json({ error: QUOTE_TOO_SMALL });
    return;
  }

  const snapshot = buildQuoteSnapshot(state, breakdown);
  const quoted = {
    quoteTotal: breakdown.total,
    deposit: breakdown.deposit,
    balance: breakdown.balance,
    depositCents: breakdown.depositCents,
    currency: 'aud',
    quoteTotalLabel: formatMoney(breakdown.total),
    depositLabel: formatMoney(breakdown.deposit),
    balanceLabel: formatMoney(breakdown.balance),
  };

  if (!isStripeConfigured()) {
    res.status(200).json({
      demoMode: true,
      message: PAYMENTS_OFF_SHORT,
      quoted,
    });
    return;
  }

  try {
    const { host, proto } = originFrom(req);
    const site = publicSiteUrl(host, proto);
    const stripe = getStripe();
    const company = companyConfig();
    const clientRef = `mhr-${state.details.date || 'tbc'}-${sanitizePlainText(state.details.name, 40).replace(/\s+/g, '-')}`.slice(0, 180);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'aud',
      customer_email: state.details.email,
      client_reference_id: clientRef,
      submit_type: 'pay',
      billing_address_collection: 'auto',
      allow_promotion_codes: false,
      success_url: `${site}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aud',
            unit_amount: breakdown.depositCents,
            product_data: {
              name: `10% booking deposit — ${BRAND_NAME}`,
              description: `Estimate ${formatMoney(breakdown.total)}. Remaining ${formatMoney(breakdown.balance)} is due on the day of the move. This charge is the deposit only.`,
            },
          },
        },
      ],
      metadata: {
        brand: meta(BRAND_NAME, 40),
        customer_name: meta(state.details.name, 80),
        customer_email: meta(state.details.email, 120),
        customer_phone: meta(state.details.phone, 24),
        quote_total: meta(String(breakdown.total), 24),
        deposit: meta(String(breakdown.deposit), 24),
        balance: meta(String(breakdown.balance), 24),
        deposit_cents: meta(String(breakdown.depositCents), 12),
        currency: 'aud',
        move_date: meta(state.details.date, 16),
        move_time: meta(state.details.time, 8),
        service: meta(snapshot.serviceLabel, 80),
        vehicle: meta(snapshot.vehicleLabel, 40),
        crew: meta(snapshot.crewLabel, 40),
        pickup: meta(state.pickups.map((p) => p.address).join(' | '), 500),
        dropoff: meta(state.dropoffs.map((d) => d.address).join(' | '), 500),
        inventory: meta(snapshot.inventorySummary, 400),
        notes: meta(state.details.instructions || '', 400),
        distance_km: meta(state.distanceKm.toFixed(1), 16),
        travel_hrs: meta(state.travelTimeHrs.toFixed(1), 16),
        fuel: meta(String(breakdown.fuel), 24),
        fuel_status: meta(
          breakdown.fuelStatus === 'none' && state.distanceKm <= 0 ? 'tbc' : breakdown.fuelStatus,
          12,
        ),
        diesel_aud_per_l: meta(dieselAudPerLitre != null ? String(dieselAudPerLitre) : '', 16),
        move_type: meta(snapshot.moveType, 80),
        legal_name: meta(company.legalName, 80),
      },
    });

    if (!session.url) {
      res.status(500).json({ error: PAYMENT_OPEN_ERROR });
      return;
    }

    res.status(200).json({
      demoMode: false,
      url: session.url,
      sessionId: session.id,
      quoted,
    });
  } catch (error) {
    console.error('create-checkout-session failed');
    res.status(500).json({ error: PAYMENT_OPEN_ERROR });
  }
}
