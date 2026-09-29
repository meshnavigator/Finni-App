import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as d from '../src/domain/index.ts';

const fixture = JSON.parse(
  await readFile(new URL('../fixtures/economy-v2.json', import.meta.url), 'utf8'),
);

test('SRS 19.1 fixture reaches B40/S30, growth 13 and stage three', () => {
  let balances = { available: d.amount(0), savings: d.amount(0) };
  let highWater = d.counter(0);
  let lifetimeGrowth = d.counter(0);
  let savingPeriods = d.counter(0);
  let closedPeriods = d.counter(0);
  let claimedGoalCost = d.counter(0);
  let stage = 1;

  for (const period of fixture.fivePeriods) {
    const movement = {
      income: d.amount(period.income),
      reward: d.amount(period.reward),
      needExpense: d.amount(period.actual.need),
      wantExpense: d.amount(period.actual.want),
      deposits: d.amount(period.actual.deposit),
      claimedGoalCost: d.amount(period.actual.claim),
    };
    balances = d.calculateBalances({ before: balances, ...movement });
    claimedGoalCost = d.addCounter(
      claimedGoalCost,
      d.counter(period.actual.claim),
    );
    const result = d.calculateGrowth({
      savingsAtClose: balances.savings,
      lifetimeClaimedGoalCost: claimedGoalCost,
      savingsHighWaterBefore: highWater,
      deposits: d.counter(period.actual.deposit),
      withdrawals: d.counter(0),
      foodPurchased: true,
      carePurchased: true,
      expensePlanOverrun: period.expensePlanOverrun,
      actualNeed: d.amount(period.actual.need),
      actualWant: d.amount(period.actual.want),
      effective: d.plan(...period.plan),
      closedPeriodsBefore: closedPeriods,
      lifetimeGrowthBefore: lifetimeGrowth,
      newSavingPeriodsBefore: savingPeriods,
      previousStage: stage,
    });
    highWater = result.savingsHighWaterAfter;
    lifetimeGrowth = result.lifetimeGrowthAfter;
    savingPeriods = result.newSavingPeriodsAfter;
    closedPeriods = d.addCounter(closedPeriods, d.counter(1));
    stage = result.stageAfter;

    assert.deepEqual(
      {
        available: balances.available,
        savings: balances.savings,
        periodGrowth: result.periodGrowth,
        lifetimeGrowth,
        stage,
        newSaving: result.newSaving,
      },
      period.expected,
      `period ${period.day}`,
    );
  }

  assert.equal(savingPeriods, fixture.final.newSavingPeriods);
  assert.equal(d.totalFunds(balances), fixture.final.totalFunds);
});

test('SRS 19.7 fixture keeps the audited counterexamples explicit', () => {
  assert.deepEqual(fixture.counterexamples.recovery.newSaving, [40, 0, 0, 5]);
  assert.equal(fixture.counterexamples.negativeNetFlow.netSaving, -20);
  assert.equal(fixture.counterexamples.sameDayRoundTrip.savePoint, 0);
  assert.equal(fixture.counterexamples.claim.committedSaving, 180);
});
