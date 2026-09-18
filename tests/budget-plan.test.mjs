import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  additionalIncomeDraftModel,
  planDraftModel,
  planFactRows,
} from '../src/application/budget-plan-model.ts';
import { NormalClock } from '../src/domain/clocks.ts';
import { plan } from '../src/domain/economy.ts';
import { amount, counter, moneyDelta } from '../src/domain/numeric.ts';
import { BudgetPlanRepository } from '../src/persistence/budget-plan-repository.ts';
import { LifecycleRepository, DEFAULT_RULE_BUNDLE } from '../src/persistence/lifecycle-repository.ts';
import { migrateDatabase } from '../src/persistence/migrations.ts';
import { SqliteRepository } from '../src/persistence/sqlite-repository.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const folders = [];
test.after(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true });
});

function databasePath() {
  const folder = mkdtempSync(join(tmpdir(), 'finni-budget-'));
  folders.push(folder);
  return join(folder, 'budget.db');
}

async function seed(database) {
  await database.runAsync(
    `INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
     VALUES ('profile-1', 'Финни', 'round', 'plain', '2026-09-18T08:00:00.000Z', 'Europe/Moscow')`,
  );
  await database.runAsync(
    `INSERT INTO wallet_projection(profile_id, available, savings)
     VALUES ('profile-1', 0, 0)`,
  );
  await database.runAsync(
    `INSERT INTO profile_state(profile_id, revision) VALUES ('profile-1', 0)`,
  );
}

function command(type, revision, payload, commandId = type) {
  return Object.freeze({
    type,
    meta: Object.freeze({
      commandId,
      profileId: 'profile-1',
      mode: 'normal',
      expectedRevision: counter(revision),
      sessionEpoch: counter(0),
    }),
    payload: Object.freeze(payload),
  });
}

const assertCode = (code) => (error) => error?.domain?.code === code;

test('plan draft and additional-income component models validate exact integer input', () => {
  const valid = planDraftModel({ need: '40', want: '20', save: '30' }, amount(100));
  assert.equal(valid.distributed, 90);
  assert.equal(valid.remaining, 10);
  assert.equal(valid.confirmEnabled, true);

  const warning = planDraftModel({ need: '20', want: '60', save: '20' }, amount(100));
  assert.equal(warning.lowNeedWarning, true);
  assert.equal(warning.confirmEnabled, false);
  assert.equal(
    planDraftModel({ need: '20', want: '60', save: '20' }, amount(100), true)
      .confirmEnabled,
    true,
  );
  assert.equal(
    planDraftModel({ need: '50', want: '40', save: '30' }, amount(100)).overBudgetBy,
    20,
  );
  for (const invalid of ['-1', '1.5', 'NaN', 'Infinity', '1e30']) {
    assert.equal(
      planDraftModel({ need: invalid, want: '0', save: '0' }, amount(100)).valid,
      false,
    );
  }
});

test('confirm and additions are atomic, idempotent and survive a file-backed restart', async () => {
  const path = databasePath();
  let database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  await seed(database);
  let lifecycle = new LifecycleRepository('normal', database);
  let budgets = new BudgetPlanRepository('normal', database);
  const clock = new NormalClock(
    'Europe/Moscow',
    () => new Date('2026-09-18T08:00:00.000Z'),
  );

  await lifecycle.openPeriod(
    command('OpenPeriod', 0, { calendarDate: '2026-09-18' }, 'open-period'),
    clock,
    'period-1',
    DEFAULT_RULE_BUNDLE,
  );
  const confirmed = await lifecycle.confirmPlan(
    command('ConfirmPlan', 1, {
      periodId: 'period-1',
      values: plan(40, 0, 60),
      acknowledgedLowNeed: false,
    }, 'confirm-plan'),
    '2026-09-18T08:01:00.000Z',
  );
  assert.deepEqual(confirmed.result.before, confirmed.result.after);
  assert.equal(
    (await database.getFirstAsync('SELECT COUNT(*) AS count FROM ledger_entry')).count,
    1,
  );

  const money = new SqliteRepository('normal', database);
  await money.executeMoneyCommand({
    envelope: command('CompleteLesson', 2, {
      periodId: 'period-1', attemptId: 'attempt-1', evaluationId: 'evaluation-1',
    }, 'lesson-reward'),
    operationId: 'operation:lesson-reward',
    periodId: 'period-1',
    ledgerType: 'LESSON_REWARD',
    amount: amount(20),
    deltaAvailable: moneyDelta(20),
    deltaSavings: moneyDelta(0),
    reasonCode: 'LESSON_COMPLETED',
    payloadSnapshot: { lessonId: 'LS-B01' },
    resultData: { rewarded: true },
    feedback: { code: 'LESSON_REWARD_GRANTED', petReaction: 'happy' },
    audit: { eventId: 'event:lesson-reward', eventType: 'LESSON_COMPLETED', payload: {} },
    committedAt: '2026-09-18T08:02:00.000Z',
  });

  await assert.rejects(
    budgets.allocateAdditionalIncome(
      command('AllocateAdditionalIncome', 2, {
        periodId: 'period-1', addition: plan(0, 15, 0),
      }, 'stale-addition'),
      '2026-09-18T08:03:00.000Z',
    ),
    assertCode('STALE_STATE'),
  );
  const allocationCommand = command('AllocateAdditionalIncome', 3, {
    periodId: 'period-1', addition: plan(0, 15, 0),
  }, 'allocate-15');
  const allocated = await budgets.allocateAdditionalIncome(
    allocationCommand,
    '2026-09-18T08:03:00.000Z',
  );
  assert.deepEqual(allocated.result.before, allocated.result.after);
  assert.equal(allocated.result.data.availableIncome, 5);
  const repeated = await budgets.allocateAdditionalIncome(
    { ...allocationCommand, meta: { ...allocationCommand.meta, expectedRevision: counter(999) } },
    '2026-09-18T08:09:00.000Z',
  );
  assert.deepEqual(repeated, allocated);

  await assert.rejects(
    budgets.allocateAdditionalIncome(
      command('AllocateAdditionalIncome', 4, {
        periodId: 'period-1', addition: plan(0, 6, 0),
      }, 'allocate-too-much'),
      '2026-09-18T08:04:00.000Z',
    ),
    assertCode('EXTRA_INCOME_EXCEEDED'),
  );
  assert.deepEqual(await database.getFirstAsync(
    `SELECT
       (SELECT COUNT(*) FROM period_plan_addition) AS additions,
       (SELECT COUNT(*) FROM ledger_entry) AS ledger,
       (SELECT revision FROM profile_state WHERE profile_id = 'profile-1') AS revision`,
  ), { additions: 1, ledger: 2, revision: 4 });

  await lifecycle.closePeriod(
    command('ClosePeriod', 4, { periodId: 'period-1' }, 'close-period'),
    '2026-09-18T08:05:00.000Z',
  );
  await assert.rejects(
    budgets.allocateAdditionalIncome(
      command('AllocateAdditionalIncome', 5, {
        periodId: 'period-1', addition: plan(0, 5, 0),
      }, 'allocate-after-close'),
      '2026-09-18T08:06:00.000Z',
    ),
    assertCode('PERIOD_NOT_ACTIVE'),
  );
  await lifecycle.close();

  database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  lifecycle = new LifecycleRepository('normal', database);
  budgets = new BudgetPlanRepository('normal', database);
  const restored = await budgets.read('profile-1', 'period-1');
  assert.deepEqual(restored.original, { need: 40, want: 0, save: 60 });
  assert.deepEqual(restored.effective, { need: 40, want: 15, save: 60 });
  assert.equal(restored.budgetAtConfirm, 100);
  assert.equal(restored.postPlanIncome, 20);
  assert.equal(restored.availableIncome, 5);
  assert.equal(restored.additions.length, 1);
  assert.deepEqual(
    planFactRows(restored).map(({ label, original, added, effective, actual }) => ({
      label, original, added, effective, actual,
    })),
    [
      { label: 'Нужно', original: 40, added: 0, effective: 40, actual: 0 },
      { label: 'Хочется', original: 0, added: 15, effective: 15, actual: 0 },
      { label: 'На мечту', original: 60, added: 0, effective: 60, actual: 0 },
    ],
  );
  assert.equal(
    additionalIncomeDraftModel({ need: '0', want: '5', save: '0' }, restored).valid,
    false,
  );
  await lifecycle.close();
});
