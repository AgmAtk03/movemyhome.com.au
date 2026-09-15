import assert from 'node:assert/strict';
import test from 'node:test';
import type Stripe from 'stripe';
import { bookingFromCheckoutSession, buildCheckoutMetadata } from './paidSession.js';
import { buildQuoteSnapshot } from '../../shared/snapshot.js';
import { calculateFullQuote } from '../../shared/quoteCalc.js';
import type { QuoteState } from '../../types.js';

function sampleState(): QuoteState {
  return {
    step: 6,
    serviceType: 'home_move',
    vehicle: 'truck',
    isManualTruckSelection: true,
    truckHours: 3,
    crewSize: 2,
    pickups: [{ id: 'p1', address: '1 George St, Sydney NSW 2000', access: 'floor2', hasLoadingDock: false }],
    dropoffs: [{ id: 'd1', address: '9 Smith St, Marrickville NSW 2204', access: 'ground', hasLoadingDock: true }],
    inventory: { boxes: 4, sofa: 1, mattress: 0, bed: 1, fridge: 1, tv: 0, washer: 0 },
    details: {
      date: '2026-09-20',
      time: '08:00',
      name: 'Alex Customer',
      email: 'alex@example.com',
      phone: '0410 721 370',
      instructions: 'Please call on arrival',
      bedDisassembly: true,
      bedIsAssembled: true,
    },
    distanceKm: 14.2,
    travelTimeHrs: 0.6,
    isCBD: true,
    isInterstate: false,
  };
}

test('checkout metadata round-trips addresses, inventory, schedule and quote for the job sheet', () => {
  const state = sampleState();
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
    dieselAudPerLitre: 1.95,
  });
  const snapshot = buildQuoteSnapshot(state, breakdown);
  const metadata = buildCheckoutMetadata(state, snapshot, breakdown, {
    dieselAudPerLitre: 1.95,
    legalName: 'Test Pty',
  });

  const session = {
    id: 'cs_test_123',
    amount_total: breakdown.depositCents,
    customer_email: state.details.email,
    metadata,
  } as unknown as Stripe.Checkout.Session;

  const restored = bookingFromCheckoutSession(session);
  assert.equal(restored.state.details.email, 'alex@example.com');
  assert.equal(restored.state.details.phone, '0410 721 370');
  assert.equal(restored.state.inventory.boxes, 4);
  assert.equal(restored.state.inventory.sofa, 1);
  assert.equal(restored.state.pickups[0].address, '1 George St, Sydney NSW 2000');
  assert.equal(restored.state.pickups[0].access, 'floor2');
  assert.equal(restored.state.dropoffs[0].hasLoadingDock, true);
  assert.match(restored.snapshot.inventorySummary, /Boxes/);
  assert.match(restored.snapshot.routeSummary, /George St/);
  assert.match(restored.snapshot.scheduleLabel, /20/);
  assert.equal(restored.snapshot.depositLabel, snapshot.depositLabel);

  const job = restored.snapshot;
  assert.match(`${job.routeSummary}\n${job.inventorySummary}\n${job.scheduleLabel}`, /Marrickville/);
});
