import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import * as d from '../src/domain/index.ts';

const assertCode = (code) => (error) => error?.domain?.code === code;

const baseGrowth = (overrides = {}) =>
  d.calculateGrowth({
    savingsAtClose: d.amount(0),
    lifetimeClaimedGoalCost: d.counter(0),
    savingsHighWaterBefore: d.counter(0),
    deposits: d.counter(0),
    withdrawals: d.counter(0),
    foodPurchased: true,
    carePurchased: true,
    expensePlanOverrun: false,
    actualNeed: d.amount(40),
    actualWant: d.amount(20),
    effective: d.plan(40, 20, 40),
    closedPeriodsBefore: d.counter(0),
    lifetimeGrowthBefore: d.counter(0),
    newSavingPeriodsBefore: d.counter(0),
    previousStage: 1,
    ...overrides,
  });

test('numeric contracts enforce Amount, Delta, Counter and NetFlow boundaries', () => {
  for (const value of [-1, 1.5, NaN, Infinity, 1e30, '10']) {
    assert.throws(() => d.amount(value), assertCode('INVALID_AMOUNT'));
  }
  assert.equal(d.amount(d.AMOUNT_LIMIT), d.AMOUNT_LIMIT);
  assert.throws(() => d.positiveAmount(0), assertCode('INVALID_AMOUNT'));
  assert.equal(d.moneyDelta(-d.AMOUNT_LIMIT), -d.AMOUNT_LIMIT);
  assert.equal(d.netFlow(-20), -20);
  assert.equal(d.planTotal(d.plan(1e9, 1e9, 1e9)), 3e9);
  assert.equal(d.totalFunds({ available: d.amount(1e9), savings: d.amount(1e9) }), 2e9);
  assert.throws(
    () => d.addCounter(d.counter(Number.MAX_SAFE_INTEGER), d.counter(1)),
    assertCode('NUMERIC_LIMIT'),
  );
});

test('TC-005/006: period income is exactly 100 and repeated decisions are deterministic', () => {
  assert.deepEqual(d.decidePeriodIncome(false), {
    granted: true,
    income: 100,
    reason: 'GRANTED',
  });
  assert.deepEqual(d.decidePeriodIncome(true), {
    granted: false,
    income: 0,
    reason: 'ALREADY_GRANTED',
  });
  assert.deepEqual(d.decidePeriodIncome(false), d.decidePeriodIncome(false));
});

test('TC-007–013: plan validation, immutability and reward separation', () => {
  const balances = Object.freeze({ available: d.amount(100), savings: d.amount(0) });
  assert.deepEqual(d.confirmPlan(d.plan(40, 20, 40), balances.available), {
    need: 40,
    want: 20,
    save: 40,
  });
  assert.deepEqual(balances, { available: 100, savings: 0 });
  assert.throws(
    () => d.confirmPlan(d.plan(50, 40, 30), balances.available),
    assertCode('PLAN_OVER_BUDGET'),
  );
  assert.deepEqual(d.confirmPlan(d.plan(40, 0, 30), balances.available), {
    need: 40,
    want: 0,
    save: 30,
  });
  assert.deepEqual(d.planWarnings(d.plan(20, 60, 20)), ['NEED_BELOW_REFERENCE']);
  for (const value of [-1, 1.5, NaN, Infinity, 1e30]) {
    assert.throws(() => d.plan(value, 0, 0), assertCode('INVALID_AMOUNT'));
  }

  const original = d.confirmPlan(d.plan(40, 0, 60), balances.available);
  const state = Object.freeze({
    original,
    supplements: Object.freeze([]),
    postPlanIncome: d.amount(20),
    expensePlanOverrun: false,
  });
  const supplemented = d.allocateAdditionalIncome(state, d.plan(0, 20, 0));
  assert.deepEqual(original, { need: 40, want: 0, save: 60 });
  assert.deepEqual(state.supplements, []);
  assert.deepEqual(d.effectivePlan(supplemented), { need: 40, want: 20, save: 60 });
  assert.deepEqual(d.decideLessonReward({
    periodActive: true,
    explanationViewed: true,
    alreadyGrantedForPeriod: false,
  }), { granted: true, reward: 20, reason: 'GRANTED' });
  assert.deepEqual(d.decideLessonReward({
    periodActive: true,
    explanationViewed: true,
    alreadyGrantedForPeriod: true,
  }), { granted: false, reward: 0, reason: 'ALREADY_GRANTED' });
});

test('balance formula preserves B+S and rejects insufficient projections', () => {
  const before = { available: d.amount(100), savings: d.amount(50) };
  const movement = {
    reward: d.amount(20),
    needExpense: d.amount(40),
    wantExpense: d.amount(20),
    deposits: d.amount(10),
    withdrawals: d.amount(30),
  };
  const after = d.calculateBalances({ before, ...movement });
  assert.deepEqual(after, { available: 80, savings: 30 });
  assert.equal(d.totalFunds(after), d.expectedTotalFunds(before, movement));
  assert.throws(
    () => d.calculateBalances({ before: { available: d.amount(0), savings: d.amount(0) }, needExpense: d.amount(1) }),
    assertCode('INSUFFICIENT_FUNDS'),
  );
  assert.throws(
    () => d.calculateBalances({ before: { available: d.amount(0), savings: d.amount(0) }, withdrawals: d.amount(1) }),
    assertCode('INSUFFICIENT_SAVINGS'),
  );
});

test('TC-153–158: additions use reward quota, preserve overruns and preconditions', () => {
  const initial = {
    original: d.plan(40, 0, 60),
    supplements: [],
    postPlanIncome: d.amount(20),
    expensePlanOverrun: false,
  };
  const supplemented = d.allocateAdditionalIncome(initial, d.plan(0, 20, 0));
  assert.deepEqual(d.effectivePlan(supplemented), d.plan(40, 20, 60));
  assert.equal(d.availableAdditionalIncome(supplemented), 0);
  const result = baseGrowth({
    savingsAtClose: d.amount(60),
    deposits: d.counter(60),
    actualWant: d.amount(20),
    effective: d.effectivePlan(supplemented),
  });
  assert.equal(result.periodGrowth, 3);

  const fifteen = d.allocateAdditionalIncome(initial, d.plan(0, 15, 0));
  assert.throws(
    () => d.allocateAdditionalIncome(fifteen, d.plan(0, 6, 0)),
    assertCode('EXTRA_INCOME_EXCEEDED'),
  );
  const withdrawalIsNotIncome = { ...initial, postPlanIncome: d.amount(0) };
  assert.throws(
    () => d.allocateAdditionalIncome(withdrawalIsNotIncome, d.plan(0, 20, 0)),
    assertCode('EXTRA_INCOME_EXCEEDED'),
  );

  const overrun = d.recordPurchasePlanOverrun(initial, 'want', d.amount(20));
  assert.equal(
    d.allocateAdditionalIncome(overrun, d.plan(0, 20, 0)).expensePlanOverrun,
    true,
  );
  assert.throws(
    () => d.assertActiveRevision('CLOSED', d.counter(1), d.counter(1)),
    assertCode('PERIOD_NOT_ACTIVE'),
  );
  assert.throws(
    () => d.assertActiveRevision('ACTIVE', d.counter(1), d.counter(2)),
    assertCode('STALE_STATE'),
  );
});

test('TC-157 boundary: canonical identity is stable across restart metadata', () => {
  const meta = {
    commandId: 'command-1',
    profileId: 'profile-1',
    mode: 'normal',
    expectedRevision: d.counter(1),
    sessionEpoch: d.counter(9),
  };
  const first = d.canonicalBusinessParameters('DepositSavings', meta, {
    amount: 20,
    periodId: 'period-1',
  });
  const repeated = d.canonicalBusinessParameters(
    'DepositSavings',
    { ...meta, expectedRevision: d.counter(2), sessionEpoch: d.counter(10) },
    { periodId: 'period-1', amount: 20 },
  );
  assert.equal(first, repeated);
  assert.notEqual(
    first,
    d.canonicalBusinessParameters('DepositSavings', meta, {
      amount: 21,
      periodId: 'period-1',
    }),
  );
});

test('TC-159–164: high-water blocks repeated savings credit and allows signed flow', () => {
  let high = d.counter(0);
  const close = (savings, deposits, withdrawals) => {
    const result = baseGrowth({
      savingsAtClose: d.amount(savings),
      deposits: d.counter(deposits),
      withdrawals: d.counter(withdrawals),
      savingsHighWaterBefore: high,
    });
    high = result.savingsHighWaterAfter;
    return result;
  };
  assert.equal(close(40, 40, 0).newSaving, 40);
  assert.equal(close(0, 0, 40).newSaving, 0);
  assert.equal(close(40, 40, 0).savePoint, 0);
  assert.equal(close(45, 5, 0).newSaving, 5);
  assert.equal(baseGrowth({
    savingsAtClose: d.amount(30),
    deposits: d.counter(10),
    withdrawals: d.counter(30),
    savingsHighWaterBefore: d.counter(50),
  }).netSaving, -20);
  assert.equal(baseGrowth({
    savingsAtClose: d.amount(0),
    deposits: d.counter(40),
    withdrawals: d.counter(40),
  }).savePoint, 0);
  assert.equal(baseGrowth({
    savingsAtClose: d.amount(30),
    lifetimeClaimedGoalCost: d.counter(150),
    savingsHighWaterBefore: d.counter(180),
  }).committedSavingEnd, 180);
  assert.throws(
    () => d.addCounter(d.counter(Number.MAX_SAFE_INTEGER), d.counter(1)),
    assertCode('NUMERIC_LIMIT'),
  );
});

test('domain source imports neither React nor SQLite', () => {
  const directory = new URL('../src/domain/', import.meta.url);
  const source = readdirSync(directory)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => readFileSync(new URL(name, directory), 'utf8'))
    .join('\n');
  assert.doesNotMatch(source, /from ['"][^'"]*(?:react|expo|sqlite)[^'"]*['"]/i);
  assert.deepEqual(d.ERROR_CODES, [
    'INVALID_AMOUNT', 'PLAN_OVER_BUDGET', 'INSUFFICIENT_FUNDS',
    'INSUFFICIENT_SAVINGS', 'STALE_STATE', 'PERIOD_NOT_ACTIVE',
    'NEXT_DAY_NOT_AVAILABLE', 'DAILY_SLOT_USED', 'REWARD_ALREADY_CLAIMED',
    'GOAL_ALREADY_CLAIMED', 'IDEMPOTENCY_CONFLICT', 'CONTENT_INVALID',
    'UNSUPPORTED_VERSION', 'STORAGE_WRITE_FAILED', 'PROFILE_MODE_MISMATCH',
    'LIMIT_REACHED', 'NUMERIC_LIMIT', 'EXTRA_INCOME_EXCEEDED',
    'SESSION_EXPIRED', 'ADMIN_OPERATION_PENDING',
    'ATTEMPT_STALE', 'EXPLANATION_REQUIRED', 'INVALID_LESSON_OUTCOME',
  ]);
});
