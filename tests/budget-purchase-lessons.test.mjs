import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAllocation, evaluateBasket } from '../src/lessons/budget-purchase-lessons.ts';
import { startLessonAttempt } from '../src/domain/lesson.ts';

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

test('B02 starts from the visible 40/40/20 draft and accepts only an edited plan', () => {
  const parameters = { budget: 100, needMinimum: 60, savingTarget: 20, initialPlan: { need: 40, want: 40, save: 20 } };
  const attempt = startLessonAttempt({
    attemptId: 'b02-draft', profileId: 'profile', periodId: null, periodState: 'DRAFT',
    definition: { lessonId: 'LS-B02', contentVersion: '1.2.0', variantId: 'changed-need-60', mechanic: 'allocation', parameters, hints: ['one', 'two'] },
    startedAt: '2026-09-23T00:00:00.000Z',
  });
  assert.deepEqual(attempt.solution, parameters.initialPlan);
  const unchanged = allocation(attempt.solution, parameters);
  assert.equal(unchanged.outcome, 'needs_review');
  assert.equal(unchanged.calculation.unchangedDraft, true);
  assert.equal(allocation({ need: 60, want: 20, save: 20 }, parameters).outcome, 'meets_goal');
  assert.equal(allocation({ need: 40, want: 40, save: 20 }, parameters).outcome, 'needs_review');
});

test('P02 explains exact prices, quantities and leftovers in both pencil variants', () => {
  const offers = [
    { id: 'single', kind: 'pencil', packSize: 1, packPrice: 10, maxPackages: 3 },
    { id: 'pack_three', kind: 'pencil', packSize: 3, packPrice: 25, maxPackages: 1 },
  ];
  const two = { budget: 50, requiredUnits: { pencil: 2 }, offers, preferLowerCostForEqualCoverage: true };
  const separate = basket({ packageCountByOfferId: { single: 2 }, statedTotal: 20, statedRemainder: 30 }, two);
  const pack = basket({ packageCountByOfferId: { pack_three: 1 }, statedTotal: 25, statedRemainder: 25 }, two);
  assert.equal(separate.outcome, 'meets_goal');
  assert.equal(pack.outcome, 'valid_alternative');
  assert.match(separate.explanation, /отдельные по 10 стоят 20, набор из 3 стоит 25/);
  assert.match(pack.explanation, /3 карандаша; на 1 больше нужного/);
  assert.match(pack.explanation, /Остаток 25/);
  const three = { ...two, requiredUnits: { pencil: 3 } };
  const threeSingles = basket({ packageCountByOfferId: { single: 3 }, statedTotal: 30, statedRemainder: 20 }, three);
  const threePack = basket({ packageCountByOfferId: { pack_three: 1 }, statedTotal: 25, statedRemainder: 25 }, three);
  assert.equal(threeSingles.outcome, 'valid_alternative');
  assert.equal(threePack.outcome, 'meets_goal');
  assert.match(threePack.explanation, /отдельные по 10 стоят 30, набор из 3 стоит 25/);
  assert.match(threePack.explanation, /лишних нет/);
});