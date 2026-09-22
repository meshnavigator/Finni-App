import assert from 'node:assert/strict';
import test from 'node:test';
import { BUDGET_PURCHASE_LESSONS, evaluateAllocation, evaluateBasket } from '../src/lessons/budget-purchase-lessons.ts';

const allocation = (key, solution) => evaluateAllocation(solution, BUDGET_PURCHASE_LESSONS[key].definition.parameters);
const basket = (key, solution) => evaluateBasket(solution, BUDGET_PURCHASE_LESSONS[key].definition.parameters);

test('B01 and B02 distinguish a goal, reviewed plan and invalid total', () => {
  assert.equal(allocation('LS-B01', { need: 40, want: 20, save: 40 }).outcome, 'meets_goal');
  assert.equal(allocation('LS-B01', { need: 20, want: 60, save: 20 }).outcome, 'needs_review');
  assert.equal(allocation('LS-B01', { need: 50, want: 40, save: 30 }).outcome, 'invalid_input');
  assert.equal(allocation('LS-B02', { need: 60, want: 20, save: 20 }).outcome, 'meets_goal');
  assert.equal(allocation('LS-B02', { need: 60, want: 40, save: 0 }).outcome, 'needs_review');
});

test('P01 requires the list, a valid receipt remainder and never charges the wallet', () => {
  const right = basket('LS-P01', { selectedIds: ['food-40', 'care-15'], remainder: 5 });
  assert.equal(right.outcome, 'meets_goal');
  assert.deepEqual(right.calculation, { total: 55, remainder: 5, preferred: null });
  assert.equal(basket('LS-P01', { selectedIds: ['fun-20'], remainder: 40 }).outcome, 'needs_review');
  assert.equal(basket('LS-P01', { selectedIds: ['food-40', 'care-15', 'fun-20'], remainder: 0 }).outcome, 'invalid_input');
  assert.match(right.explanation, /не меняются/);
});

test('P02 requires evidence and treats same-goods higher price as a valid alternative', () => {
  const base = { selectedIds: ['food-30', 'care-10'], remainder: 10, revealedIds: ['food-30', 'food-40'] };
  assert.equal(basket('LS-P02', base).outcome, 'meets_goal');
  assert.equal(basket('LS-P02', { ...base, revealedIds: ['food-30'] }).outcome, 'needs_review');
  assert.equal(basket('LS-P02', { selectedIds: ['food-40', 'care-10'], remainder: 0, revealedIds: ['food-30', 'food-40'] }).outcome, 'valid_alternative');
  assert.equal(basket('LS-P02', { ...base, remainder: 9 }).outcome, 'needs_review');
});

test('P02 quantity variants change the useful choice and preserve total/pack semantics', () => {
  assert.equal(basket('LS-P02-quantity-two', { selectedIds: ['single-two'], remainder: 30 }).outcome, 'meets_goal');
  assert.equal(basket('LS-P02-quantity-two', { selectedIds: ['pack-three'], remainder: 25 }).outcome, 'valid_alternative');
  assert.equal(basket('LS-P02-quantity-three', { selectedIds: ['pack-three'], remainder: 25 }).outcome, 'meets_goal');
  assert.equal(basket('LS-P02-quantity-three', { selectedIds: ['single-three'], remainder: 20 }).outcome, 'valid_alternative');
  assert.match(BUDGET_PURCHASE_LESSONS['LS-P02-quantity-two'].definition.parameters.items[0].unitLabel, /всего 20/);
});
