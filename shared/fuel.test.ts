import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFuelSurcharge, FUEL_FREE_UNDER_KM, FUEL_KM_PER_LITRE } from './fuel';
import { calculateFullQuote } from './quoteCalc';
import { buildQuoteSnapshot } from './snapshot';
import { depositFromQuoteTotal, roundMoney } from './money';
import type { Inventory, LocationEntry, QuoteState } from '../types';

const emptyInventory: Inventory = {
  boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0,
};
const ground: LocationEntry = { id: 'p1', address: '1 Example St, Marrickville NSW 2204', access: 'ground', hasLoadingDock: false };
const drop: LocationEntry = { id: 'd1', address: '2 Example St, Newtown NSW 2042', access: 'ground', hasLoadingDock: false };

test('zero kilometres is not a free trip — fuel stays hidden until Maps returns a distance', () => {
  const none = calculateFuelSurcharge(0, 2.5);
  assert.equal(none.status, 'none');
  assert.equal(none.fuel, 0);
  assert.equal(none.litres, 0);
});

test('fuel is $0 under 12 km even when a diesel price exists', () => {
  const justUnder = calculateFuelSurcharge(FUEL_FREE_UNDER_KM - 0.1, 2.5);
  assert.equal(justUnder.status, 'waived');
  assert.equal(justUnder.fuel, 0);
  assert.equal(justUnder.litres, 0);
});

test('fuel at 12 km is litres = km/10 times diesel AUD/L', () => {
  const priced = calculateFuelSurcharge(12, 2);
  assert.equal(priced.status, 'priced');
  assert.equal(priced.litres, roundMoney(12 / FUEL_KM_PER_LITRE));
  assert.equal(priced.fuel, roundMoney(1.2 * 2));
});

test('missing diesel price is TBC and does not invent a dollar amount', () => {
  const tbc = calculateFuelSurcharge(40, null);
  assert.equal(tbc.status, 'tbc');
  assert.equal(tbc.fuel, 0);
  assert.equal(tbc.litres, 4);
});

test('quote total and 10% deposit include priced fuel', () => {
  const diesel = 2.5;
  const distanceKm = 20;
  const quote = calculateFullQuote({
    vehicle: 'van',
    truckHours: 2,
    crewSize: 2,
    pickups: [ground],
    dropoffs: [drop],
    inventory: emptyInventory,
    bedDisassembly: false,
    bedIsAssembled: true,
    distanceKm,
    travelTimeHrs: 0.5,
    isInterstate: false,
    dieselAudPerLitre: diesel,
  });
  const fuel = roundMoney((20 / 10) * diesel);
  const expectedTotal = roundMoney(55 + 20 * 0.42 + fuel);
  assert.equal(quote.fuelStatus, 'priced');
  assert.equal(quote.fuel, fuel);
  assert.equal(quote.total, expectedTotal);
  const money = depositFromQuoteTotal(expectedTotal);
  assert.equal(quote.deposit, money.deposit);
  assert.equal(quote.depositCents, money.depositCents);
});

test('TBC fuel is omitted from the total so the deposit is not guessed', () => {
  const quote = calculateFullQuote({
    vehicle: 'van',
    truckHours: 2,
    crewSize: 2,
    pickups: [ground],
    dropoffs: [drop],
    inventory: emptyInventory,
    bedDisassembly: false,
    bedIsAssembled: true,
    distanceKm: 20,
    travelTimeHrs: 0.5,
    isInterstate: false,
    dieselAudPerLitre: null,
  });
  assert.equal(quote.fuelStatus, 'tbc');
  assert.equal(quote.fuel, 0);
  assert.equal(quote.total, roundMoney(55 + 20 * 0.42));
});

test('booking snapshot shows waived fuel copy before the deposit', () => {
  const state: QuoteState = {
    step: 6,
    serviceType: 'room_move',
    vehicle: 'van',
    isManualTruckSelection: false,
    truckHours: 2,
    crewSize: 2,
    pickups: [ground],
    dropoffs: [drop],
    inventory: emptyInventory,
    details: {
      date: '2026-09-20',
      time: '09:00',
      name: 'Alex Test',
      email: 'alex@example.com',
      phone: '0412345678',
      instructions: '',
      bedDisassembly: false,
      bedIsAssembled: true,
    },
    distanceKm: 8,
    travelTimeHrs: 0.3,
    isCBD: false,
    isInterstate: false,
    discountCode: '',
  };
  const quote = calculateFullQuote({
    vehicle: state.vehicle,
    truckHours: state.truckHours,
    crewSize: state.crewSize,
    pickups: state.pickups,
    dropoffs: state.dropoffs,
    inventory: state.inventory,
    bedDisassembly: false,
    bedIsAssembled: true,
    distanceKm: state.distanceKm,
    travelTimeHrs: state.travelTimeHrs,
    isInterstate: false,
    dieselAudPerLitre: 2.5,
  });
  const snapshot = buildQuoteSnapshot(state, quote);
  assert.equal(snapshot.fuelLine.status, 'waived');
  assert.equal(snapshot.fuelLine.note, 'No fuel charge under 12 km');
  assert.equal(snapshot.lines[snapshot.lines.length - 1]?.label, 'Fuel');
});
