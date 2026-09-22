import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  evaluateSavingsSchedule,
  evaluateSavingsWithdrawalPreview,
} from '../src/domain/savings-lesson.ts';

const schedule = {
  scenario: 'schedule',
  initialSavings: 30,
  goalCost: 90,
  maxDeposits: [30, 30, 30],
};

const withdrawal = {
  scenario: 'withdrawal_preview',
  available: 10,
  savings: 60,
  goalCost: 90,
  itemCost: 20,
};

test('S01 accepts flexible integer deposits and preserves an over-goal forecast', () => {
  const goal = evaluateSavingsSchedule({ deposits: [10, 20, 30] }, schedule);
  assert.equal(goal.outcome, 'meets_goal');
  assert.deepEqual(goal.calculation, {
    deposits: [10, 20, 30],
    added: 60,
    forecast: 90,
    remaining: 0,
    goalCost: 90,
  });
  const extra = evaluateSavingsSchedule({ deposits: [30, 30, 30] }, schedule);
  assert.equal(extra.outcome, 'meets_goal');
  assert.equal(extra.calculation.forecast, 120);
  assert.match(extra.consequence, /30 больше/);
});

test('S01 shows the remaining amount and rejects invalid day deposits', () => {
  const incomplete = evaluateSavingsSchedule({ deposits: [10, 10, 10] }, schedule);
  assert.equal(incomplete.outcome, 'valid_alternative');
  assert.equal(incomplete.calculation.forecast, 60);
  assert.equal(incomplete.calculation.remaining, 30);
  assert.match(incomplete.explanation, /игровых дней/);
  const invalid = evaluateSavingsSchedule({ deposits: [10, 40, 10] }, schedule);
  assert.equal(invalid.outcome, 'invalid_input');
  assert.equal(invalid.calculation.maxDeposits[1], 30);
});

test('S02 preview calculates purchase and postponement without a money command', () => {
  const purchased = evaluateSavingsWithdrawalPreview(
    { withdrawal: 10, action: 'buy' },
    withdrawal,
  );
  assert.equal(purchased.outcome, 'valid_alternative');
  assert.deepEqual(purchased.calculation, {
    withdrawal: 10,
    availableAfterWithdrawal: 20,
    savingsAfterWithdrawal: 50,
    remaining: 40,
    itemCost: 20,
    action: 'buy',
    availableAfterAction: 0,
  });
  assert.match(purchased.nextStep, /preview/);
  const postponed = evaluateSavingsWithdrawalPreview(
    { withdrawal: 0, action: 'postpone' },
    withdrawal,
  );
  assert.equal(postponed.outcome, 'meets_goal');
  assert.equal(postponed.calculation.savingsAfterWithdrawal, 60);
  assert.equal(postponed.calculation.remaining, 30);
});

test('S02 blocks an unfunded purchase and malformed withdrawals', () => {
  const unfunded = evaluateSavingsWithdrawalPreview(
    { withdrawal: 0, action: 'buy' },
    withdrawal,
  );
  assert.equal(unfunded.outcome, 'invalid_input');
  assert.match(unfunded.consequence, /не хватает 10/);
  assert.equal(
    evaluateSavingsWithdrawalPreview({ withdrawal: 61, action: 'postpone' }, withdrawal).outcome,
    'invalid_input',
  );
  assert.equal(
    evaluateSavingsWithdrawalPreview({ withdrawal: 10.5, action: 'buy' }, withdrawal).outcome,
    'invalid_input',
  );
});

test('savings renderer exposes both canonical SRS scenarios and a non-mutating preview', () => {
  const source = readFileSync(
    new URL('../src/ui/SavingsLessonRenderer.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /initialSavings/);
  assert.match(source, /maxDeposits/);
  assert.match(source, /deposits/);
  assert.match(source, /available/);
  assert.match(source, /itemCost/);
  assert.match(source, /postpone/);
  assert.match(source, /Это preview: монеты твоего игрового дня не меняются/);
  assert.match(source, /minHeight: 48/);
  assert.doesNotMatch(source, /repository|ledger|TransferToSavings/);
});
