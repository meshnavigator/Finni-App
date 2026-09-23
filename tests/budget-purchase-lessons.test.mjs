import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAllocation, evaluateBasket } from '../src/lessons/budget-purchase-lessons.ts';

const allocation = (solution, parameters) => evaluateAllocation(solution, parameters);
const basket = (solution, parameters) => evaluateBasket(solution, parameters);

test('B01 and B02 use the schema-v3 allocation parameters', () => {
  const b01 = { budget: 100, needMinimum: 40, savingTarget: 30 };
  const b02 = { budget: 100, needMinimum: 60, savingTarget: 20 };
  assert.equal(allocation({ need: 40, want: 20, save: 40 }, b01).outcome, 'meets_goal');
  assert.equal(allocation({ need: 20, want: 60, save: 20 }, b01).outcome, 'needs_review');
  assert.equal(allocation({ need: 50, want: 40, save: 30 }, b01).outcome, 'invalid_input');
  assert.equal(allocation({ need: 60, want: 20, save: 20 }, b02).outcome, 'meets_goal');
  assert.equal(allocation({ need: 40, want: 40, save: 20 }, b02).outcome, 'needs_review');
});

test('P01 accepts canonical package counts and never performs a wallet write', () => {
  const parameters = {
    budget: 60,
    requiredUnits: { food: 1, care: 1 },
    offers: [
      { id: 'food_30', kind: 'food', packSize: 1, packPrice: 30, maxPackages: 1, qualityKey: 'standard', properties: ['Еда'], alternativeGroup: 'food' },
      { id: 'food_40', kind: 'food', packSize: 1, packPrice: 40, maxPackages: 1, qualityKey: 'standard', properties: ['Еда'], alternativeGroup: 'food' },
      { id: 'care_10', kind: 'care', packSize: 1, packPrice: 10, maxPackages: 1, qualityKey: 'standard', properties: ['Уход'], alternativeGroup: 'care' },
      { id: 'care_15', kind: 'care', packSize: 1, packPrice: 15, maxPackages: 1, qualityKey: 'standard', properties: ['Уход'], alternativeGroup: 'care' },
      { id: 'fun_20', kind: 'fun', packSize: 1, packPrice: 20, maxPackages: 1, qualityKey: 'optional', properties: ['Развлечение'] },
    ],
    preferLowerCostForEqualCoverage: false,
  };
  const right = basket({ packageCountByOfferId: { food_30: 1, care_10: 1, fun_20: 1 }, statedTotal: 60, statedRemainder: 0 }, parameters);
  assert.equal(right.outcome, 'meets_goal');
  assert.deepEqual(right.calculation, { total: 60, remainder: 0, extraUnits: 1, minimum: 40 });
  assert.equal(basket({ packageCountByOfferId: { fun_20: 1 }, statedTotal: 20, statedRemainder: 40 }, parameters).outcome, 'needs_review');
  assert.equal(basket({ packageCountByOfferId: { food_40: 1, care_15: 1, fun_20: 1 }, statedTotal: 75, statedRemainder: 0 }, parameters).outcome, 'invalid_input');
  assert.match(right.explanation, /не меняются/);
});

test('P02 detects invalid competing offers and a more expensive equal coverage alternative', () => {
  const parameters = {
    budget: 50,
    requiredUnits: { food: 1, care: 1 },
    offers: [
      { id: 'food_a', kind: 'food', packSize: 1, packPrice: 30, maxPackages: 1, qualityKey: 'same', properties: ['Одна порция'], alternativeGroup: 'food' },
      { id: 'food_b', kind: 'food', packSize: 1, packPrice: 40, maxPackages: 1, qualityKey: 'same', properties: ['Одна порция'], alternativeGroup: 'food' },
      { id: 'care', kind: 'care', packSize: 1, packPrice: 10, maxPackages: 1, qualityKey: 'standard', properties: ['Уход'] },
    ],
    preferLowerCostForEqualCoverage: true,
  };
  assert.equal(basket({ packageCountByOfferId: { food_a: 1, care: 1 }, statedTotal: 40, statedRemainder: 10 }, parameters).outcome, 'meets_goal');
  assert.equal(basket({ packageCountByOfferId: { food_b: 1, care: 1 }, statedTotal: 50, statedRemainder: 0 }, parameters).outcome, 'valid_alternative');
  assert.equal(basket({ packageCountByOfferId: { food_a: 1, food_b: 1, care: 1 }, statedTotal: 80, statedRemainder: 0 }, parameters).outcome, 'invalid_input');
});
