import assert from 'node:assert/strict';
import test from 'node:test';
import { depositFromQuoteTotal, roundMoney } from './money';
import { calculateFullQuote, applyMemberDiscount } from './quoteCalc';
import { Inventory, LocationEntry } from '../types';

const emptyInventory: Inventory = {
  boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0,
};

const ground: LocationEntry = { id: 'p1', address: '1 Example St, Marrickville NSW 2204', access: 'ground', hasLoadingDock: false };
const drop: LocationEntry = { id: 'd1', address: '2 Example St, Newtown NSW 2042', access: 'ground', hasLoadingDock: false };

test('deposit is 10% rounded to 2dp with cents for Stripe', () => {
  const a = depositFromQuoteTotal(100);
  assert.equal(a.deposit, 10);
  assert.equal(a.balance, 90);
  assert.equal(a.depositCents, 1000);

  const b = depositFromQuoteTotal(99.99);
  assert.equal(b.deposit, roundMoney(99.99 * 0.1));
  assert.equal(b.balance, roundMoney(99.99 - b.deposit));
  assert.equal(b.depositCents, Math.round(b.deposit * 100));

  const c = depositFromQuoteTotal(10.05);
  assert.equal(c.deposit, roundMoney(10.05 * 0.1));
  assert.equal(c.depositCents, Math.round(c.deposit * 100));
});

test('van local quote uses existing base + per-km rates', () => {
  const quote = calculateFullQuote({
    vehicle: 'van',
    truckHours: 2,
    crewSize: 2,
    pickups: [ground],
    dropoffs: [drop],
    inventory: emptyInventory,
    bedDisassembly: false,
    bedIsAssembled: true,
    distanceKm: 10,
    travelTimeHrs: 0.4,
    isInterstate: false,
  });
  assert.equal(quote.base, 55);
  assert.equal(quote.distance, roundMoney(10 * 0.42));
  assert.equal(quote.fuel, 0);
  assert.equal(quote.fuelStatus, 'waived');
  assert.equal(quote.total, roundMoney(55 + 4.2));
  assert.equal(quote.deposit, roundMoney(quote.total * 0.1));
  assert.equal(quote.balance, roundMoney(quote.total - quote.deposit));
  assert.equal(quote.depositCents, Math.round(quote.deposit * 100));
});

test('CBD fee applies without a loading dock on a 2000 address', () => {
  const cbdStop: LocationEntry = {
    id: 'p1',
    address: '1 George St, Sydney NSW 2000',
    access: 'ground',
    hasLoadingDock: false,
  };
  const quote = calculateFullQuote({
    vehicle: 'van',
    truckHours: 2,
    crewSize: 2,
    pickups: [cbdStop],
    dropoffs: [drop],
    inventory: emptyInventory,
    bedDisassembly: false,
    bedIsAssembled: true,
    distanceKm: 5,
    travelTimeHrs: 0.3,
    isInterstate: false,
  });
  assert.equal(quote.cbd, 20);
});

test('server ignores a client-supplied total by recalculating', () => {
  const quote = calculateFullQuote({
    vehicle: 'truck',
    truckHours: 2,
    crewSize: 2,
    pickups: [ground],
    dropoffs: [drop],
    inventory: emptyInventory,
    bedDisassembly: false,
    bedIsAssembled: true,
    distanceKm: 8,
    travelTimeHrs: 0.3,
    isInterstate: false,
  });
  assert.equal(quote.hourlyRate, 90);
  assert.equal(quote.base, 180);
  assert.ok(quote.depositCents > 0);
  assert.ok(quote.depositCents < Math.round(quote.total * 100));
});

test('member 5% off is taken off the quote, then 10% deposit is of the discounted total', () => {
  const quote = calculateFullQuote({
    vehicle: 'van',
    truckHours: 2,
    crewSize: 2,
    pickups: [ground],
    dropoffs: [drop],
    inventory: emptyInventory,
    bedDisassembly: false,
    bedIsAssembled: true,
    distanceKm: 10,
    travelTimeHrs: 0.4,
    isInterstate: false,
  });
  const discounted = applyMemberDiscount(quote, 'STUDENT5-ABCDEFGH');
  const expectedTotal = roundMoney(quote.total * 0.95);
  assert.equal(discounted.subtotal, quote.total);
  assert.equal(discounted.memberDiscount, roundMoney(quote.total * 0.05));
  assert.equal(discounted.total, expectedTotal);
  assert.equal(discounted.deposit, roundMoney(expectedTotal * 0.1));
  assert.equal(discounted.balance, roundMoney(expectedTotal - discounted.deposit));
  assert.equal(discounted.depositCents, Math.round(discounted.deposit * 100));
  assert.equal(discounted.memberDiscountCode, 'STUDENT5-ABCDEFGH');
  const again = applyMemberDiscount(discounted, 'STUDENT5-ABCDEFGH');
  assert.equal(again.total, discounted.total);
});
