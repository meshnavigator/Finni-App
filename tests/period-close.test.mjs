import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { plan, counter } from '../src/domain/index.ts';
import {
  BudgetPlanRepository,
  CommerceRepository,
  LifecycleRepository,
  ProfileRepository,
  RepositoryExecutor,
  migrateDatabase,
  readPeriodSummary,
} from '../src/persistence/index.ts';
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_V3 } from '../src/persistence/schema.ts';
import { SCHEMA_V4 } from '../src/persistence/schema-v4.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const dirs = [];
test.after(() => dirs.forEach((directory) => rmSync(directory, { recursive: true, force: true })));

function tempDatabase(prefix = 'finni-s2-close-') {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(directory);
  const path = join(directory, 'state.sqlite');
  return { path, database: new SqliteFileAdapter(path) };
}

async function insertProfile(database, values = {}) {
  await database.runAsync(`INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
    VALUES ('profile', 'Финни', 'round', 'plain', '2026-09-21T00:00:00.000Z', 'Europe/Moscow')`);
  await database.runAsync(
    'INSERT INTO wallet_projection(profile_id, available, savings) VALUES (?, ?, ?)',
    'profile', values.available ?? 100, values.savings ?? 0,
  );
  await database.runAsync(
    `INSERT INTO profile_state(profile_id, revision, savings_high_water, new_saving_periods, lifetime_growth, pet_stage)
     VALUES (?, ?, ?, ?, ?, ?)`,
    'profile', values.revision ?? 0, values.highWater ?? 0, values.newSavingPeriods ?? 0,
    values.lifetimeGrowth ?? 0, values.petStage ?? 1,
  );
  await database.runAsync(`INSERT INTO game_clock(
    profile_id, time_zone, virtual_date, clock_generation, next_eligible_date, max_opened_date, updated_at
  ) VALUES ('profile', 'Europe/Moscow', NULL, 0, NULL, '2026-09-21', '2026-09-21T00:00:00.000Z')`);
}

async function insertActivePeriod(database, id, index, values = {}) {
  const original = values.plan ?? { need: 40, want: 0, save: 0 };
  await database.runAsync(
    `INSERT INTO period(
       id, profile_id, period_index, calendar_date, clock_generation, state,
       economy_version, opened_at, rule_bundle_json, confirmed_plan_json,
       confirmed_at, budget_at_confirm, ledger_seq_at_confirm, expense_plan_overrun
     ) VALUES (?, 'profile', ?, ?, 0, 'ACTIVE', 'economy-v2', ?, ?, ?, ?, 100, 0, ?)`,
    id,
    index,
    `2026-09-${String(20 + index).padStart(2, '0')}`,
    `2026-09-${String(20 + index).padStart(2, '0')}T00:00:00.000Z`,
    JSON.stringify({ economyVersion: 'economy-v2', catalogVersion: 'bootstrap', goalsVersion: 'bootstrap' }),
    JSON.stringify(original),
    `2026-09-${String(20 + index).padStart(2, '0')}T00:00:01.000Z`,
    values.overrun ? 1 : 0,
  );
}

async function receipt(database, id, type) {
  await database.runAsync(
    `INSERT INTO command_receipt(command_id, command_type, business_identity, profile_id, mode, result_json, committed_at)
     VALUES (?, ?, '{}', 'profile', 'normal', '{}', '2026-09-21T00:00:00.000Z')`,
    id,
    type,
  );
}

async function purchaseNeed(database, periodId, suffix) {
  for (const item of [
    { id: 'IT-01', slot: 'food', price: 30 },
    { id: 'IT-03', slot: 'care', price: 10 },
  ]) {
    const id = `buy-${suffix}-${item.slot}`;
    await receipt(database, id, 'ConfirmPurchase');
    await database.runAsync(
      `INSERT INTO purchase(id, command_id, profile_id, period_id, slot, item_id, item_snapshot, price, created_at)
       VALUES (?, ?, 'profile', ?, ?, ?, '{}', ?, '2026-09-21T00:00:02.000Z')`,
      `purchase:${id}`, id, periodId, item.slot, item.id, item.price,
    );
    await database.runAsync(
      `INSERT INTO ledger_entry(operation_id, command_id, profile_id, period_id, type, amount,
       delta_available, delta_savings, reason_code, payload_snapshot, created_at)
       VALUES (?, ?, 'profile', ?, 'PURCHASE', ?, ?, 0, 'SHOP_PURCHASE', '{"category":"need"}', '2026-09-21T00:00:02.000Z')`,
      `ledger:${id}`, id, periodId, item.price, -item.price,
    );
  }
}

async function savingsMovement(database, periodId, suffix, kind, value) {
  const deposit = kind === 'deposit';
  const id = `${kind}-${suffix}`;
  const type = deposit ? 'DepositSavings' : 'WithdrawSavings';
  const ledgerType = deposit ? 'SAVINGS_DEPOSIT' : 'SAVINGS_WITHDRAWAL';
  await receipt(database, id, type);
  await database.runAsync(
    `INSERT INTO ledger_entry(operation_id, command_id, profile_id, period_id, type, amount,
     delta_available, delta_savings, reason_code, payload_snapshot, created_at)
     VALUES (?, ?, 'profile', ?, ?, ?, ?, ?, ?, '{}', '2026-09-21T00:00:03.000Z')`,
    `ledger:${id}`, id, periodId, ledgerType, value, deposit ? -value : value,
    deposit ? value : -value, ledgerType,
  );
}

async function goalClaim(database, periodId, suffix, goalId, cost) {
  const id = `claim-${suffix}`;
  await receipt(database, id, 'ClaimGoal');
  await database.runAsync(
    `INSERT INTO goal_claim(id, command_id, profile_id, goal_id, cost_snapshot, period_id, created_at)
     VALUES (?, ?, 'profile', ?, ?, ?, '2026-09-21T00:00:04.000Z')`,
    `goal:${id}`, id, goalId, cost, periodId,
  );
  await database.runAsync(
    `INSERT INTO ledger_entry(operation_id, command_id, profile_id, period_id, type, amount,
     delta_available, delta_savings, reason_code, payload_snapshot, created_at)
     VALUES (?, ?, 'profile', ?, 'GOAL_CLAIM', ?, 0, ?, 'GOAL_CLAIMED', '{}', '2026-09-21T00:00:04.000Z')`,
    `ledger:${id}`, id, periodId, cost, -cost,
  );
}

function closeCommand(id, revision, periodId) {
  return Object.freeze({
    type: 'ClosePeriod',
    meta: Object.freeze({ commandId: id, profileId: 'profile', mode: 'normal', expectedRevision: counter(revision), sessionEpoch: counter(0) }),
    payload: Object.freeze({ periodId }),
  });
}

test('schema v4 migrates sequentially to v5 and survives restart', async () => {
  const { path, database } = tempDatabase('finni-v4-v5-');
  await database.execAsync(SCHEMA_V1);
  await database.execAsync(SCHEMA_V2);
  await database.execAsync(SCHEMA_V3);
  await database.execAsync(SCHEMA_V4);
  await database.execAsync('PRAGMA user_version = 4');
  await database.runAsync(`INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
    VALUES ('profile', 'Финни', 'round', 'plain', '2026-09-21T00:00:00.000Z', 'Europe/Moscow')`);
  await database.runAsync("INSERT INTO wallet_projection(profile_id, available, savings) VALUES ('profile', 80, 20)");
  await database.runAsync("INSERT INTO profile_state(profile_id, revision) VALUES ('profile', 7)");
  await database.closeAsync();

  const restarted = new SqliteFileAdapter(path);
  assert.equal(await migrateDatabase(restarted), 5);
  assert.deepEqual(await restarted.getFirstAsync('SELECT revision, pet_stage FROM profile_state'), { revision: 7, pet_stage: 1 });
  assert.equal((await restarted.getFirstAsync("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'period_summary'"))?.count, 1);
  await restarted.closeAsync();
});

test('ClosePeriod is atomic, receipt-first idempotent, restart-safe and neutral for an empty day', async () => {
  const { path, database } = tempDatabase();
  await migrateDatabase(database);
  await insertProfile(database);
  await insertActivePeriod(database, 'empty', 1, { plan: plan(0, 0, 0) });
  const lifecycle = new LifecycleRepository('normal', database);
  const command = closeCommand('close-empty', 0, 'empty');
  const first = await lifecycle.closePeriod(command, '2026-09-21T01:00:00.000Z');
  const replay = await lifecycle.closePeriod(closeCommand('close-empty', 1, 'empty'), '2026-09-21T01:01:00.000Z');
  assert.deepEqual(replay.result, first.result);
  assert.equal(first.result.data.summary.periodGrowth, 0);
  assert.equal(first.result.data.summary.stageAfter, 1);
  assert.match(first.result.data.summary.explanation, /безопасности|сохранены/);
  assert.equal((await database.getFirstAsync('SELECT COUNT(*) AS count FROM period_summary'))?.count, 1);
  assert.deepEqual(await database.getFirstAsync('SELECT state FROM period WHERE id = ?', 'empty'), { state: 'CLOSED' });
  await lifecycle.close();

  const restartedDatabase = new SqliteFileAdapter(path);
  await migrateDatabase(restartedDatabase);
  const restored = await readPeriodSummary(restartedDatabase, 'empty');
  assert.equal(restored?.periodGrowth, 0);
  assert.equal(restored?.stageAfter, 1);
  await restartedDatabase.closeAsync();

  const failed = tempDatabase('finni-close-rollback-');
  await migrateDatabase(failed.database);
  await insertProfile(failed.database);
  await insertActivePeriod(failed.database, 'rollback', 1);
  await failed.database.execAsync(`CREATE TRIGGER reject_summary BEFORE INSERT ON period_summary
    BEGIN SELECT RAISE(ABORT, 'reject summary'); END;`);
  const failingLifecycle = new LifecycleRepository('normal', failed.database);
  await assert.rejects(() => failingLifecycle.closePeriod(closeCommand('close-fail', 0, 'rollback'), '2026-09-21T01:00:00.000Z'), /STORAGE_WRITE_FAILED/);
  assert.deepEqual(await failed.database.getFirstAsync('SELECT state FROM period WHERE id = ?', 'rollback'), { state: 'ACTIVE' });
  assert.deepEqual(await failed.database.getFirstAsync('SELECT revision, lifetime_growth, pet_stage FROM profile_state'), { revision: 0, lifetime_growth: 0, pet_stage: 1 });
  assert.equal((await failed.database.getFirstAsync("SELECT COUNT(*) AS count FROM command_receipt WHERE command_id = 'close-fail'"))?.count, 0);
  await failingLifecycle.close();
});

test('five closed periods apply high-water rules and reach stages 1 → 2 → 3', async () => {
  const { database } = tempDatabase('finni-five-periods-');
  await migrateDatabase(database);
  await insertProfile(database);
  const lifecycle = new LifecycleRepository('normal', database);
  const movements = [
    { kind: 'deposit', value: 40, savings: 40, savePlan: 40 },
    { kind: 'withdraw', value: 40, savings: 0, savePlan: 0 },
    { kind: 'deposit', value: 40, savings: 40, savePlan: 40 },
    { kind: 'deposit', value: 45, savings: 85, savePlan: 45 },
    { kind: 'deposit', value: 45, savings: 130, savePlan: 45 },
  ];
  const expectedGrowth = [3, 1, 2, 3, 3];
  const expectedStage = [1, 1, 2, 2, 3];
  for (let index = 0; index < movements.length; index += 1) {
    const day = index + 1;
    const periodId = `period-${day}`;
    const movement = movements[index];
    await insertActivePeriod(database, periodId, day, { plan: plan(40, 0, movement.savePlan) });
    await purchaseNeed(database, periodId, day);
    await savingsMovement(database, periodId, day, movement.kind, movement.value);
    await database.runAsync('UPDATE wallet_projection SET available = ?, savings = ? WHERE profile_id = ?', 1000 - movement.savings, movement.savings, 'profile');
    const closed = await lifecycle.closePeriod(closeCommand(`close-${day}`, index, periodId), `2026-09-${20 + day}T12:00:00.000Z`);
    assert.equal(closed.result.data.summary.periodGrowth, expectedGrowth[index]);
    assert.equal(closed.result.data.summary.stageAfter, expectedStage[index]);
    if (day === 3) assert.equal(closed.result.data.summary.criteria.newSaving, 0);
  }
  assert.deepEqual(
    await database.getFirstAsync('SELECT savings_high_water, new_saving_periods, lifetime_growth, pet_stage, revision FROM profile_state'),
    { savings_high_water: 130, new_saving_periods: 3, lifetime_growth: 12, pet_stage: 3, revision: 5 },
  );
  await lifecycle.close();
});

test('goal claim preserves committed saving and historical overrun blocks only the plan point', async () => {
  const { database } = tempDatabase('finni-claim-growth-');
  await migrateDatabase(database);
  await insertProfile(database, { available: 20, savings: 30, highWater: 180, newSavingPeriods: 1, lifetimeGrowth: 6, petStage: 2 });
  await insertActivePeriod(database, 'claim-period', 1, { plan: plan(40, 0, 40), overrun: true });
  await purchaseNeed(database, 'claim-period', 'claim');
  await savingsMovement(database, 'claim-period', 'claim', 'deposit', 40);
  await goalClaim(database, 'claim-period', 'claim', 'GL-01', 150);
  const lifecycle = new LifecycleRepository('normal', database);
  const closed = await lifecycle.closePeriod(closeCommand('close-claim', 0, 'claim-period'), '2026-09-21T12:00:00.000Z');
  const summary = closed.result.data.summary;
  assert.equal(summary.criteria.committedSavingEnd, 180);
  assert.equal(summary.criteria.newSaving, 0);
  assert.equal(summary.criteria.needPoint, 1);
  assert.equal(summary.criteria.planPoint, 0);
  assert.equal(summary.criteria.savePoint, 0);
  assert.equal(summary.stageBefore, 2);
  assert.equal(summary.stageAfter, 2);
  assert.equal(summary.facts.expensePlanOverrun, true);
  await lifecycle.close();
});

test('shared executor serializes repository facades and closes the database exactly once', async () => {
  const { database: base } = tempDatabase('finni-shared-executor-');
  let closeCount = 0;
  const database = {
    execAsync: (...args) => base.execAsync(...args),
    runAsync: (...args) => base.runAsync(...args),
    getFirstAsync: (...args) => base.getFirstAsync(...args),
    getAllAsync: (...args) => base.getAllAsync(...args),
    closeAsync: async () => { closeCount += 1; await base.closeAsync(); },
  };
  await migrateDatabase(database);
  await insertProfile(database);
  const executor = new RepositoryExecutor(database);
  const profiles = new ProfileRepository('normal', database, executor);
  const lifecycle = new LifecycleRepository('normal', database, executor);
  const budgets = new BudgetPlanRepository('normal', database, executor);
  const commerce = new CommerceRepository('normal', database, executor);
  const [first, second, commerceSnapshot] = await Promise.all([
    profiles.readProfile(),
    profiles.readProfile(),
    commerce.read('profile', null),
  ]);
  assert.equal(first?.id, 'profile');
  assert.equal(second?.id, 'profile');
  assert.deepEqual(commerceSnapshot.history, []);
  await Promise.all([profiles.close(), lifecycle.close(), budgets.close(), commerce.close()]);
  assert.equal(closeCount, 0);
  assert.deepEqual(await executor.run((connection) => connection.getFirstAsync('SELECT COUNT(*) AS count FROM profile')), { count: 1 });
  await Promise.all([executor.close(), executor.close()]);
  assert.equal(closeCount, 1);
});

test('period result UI wires close confirmation, saved summary and accessibility', () => {
  const runtime = readFileSync(new URL('../src/application/app-runtime.ts', import.meta.url), 'utf8');
  const root = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');
  const screen = readFileSync(new URL('../src/ui/PeriodResultScreen.tsx', import.meta.url), 'utf8');
  assert.match(runtime, /async closePeriod/);
  assert.equal((runtime.match(/new RepositoryExecutor\(/g) ?? []).length, 1);
  assert.match(runtime, /new ProfileRepository\(mode, database, this\.\#executor\)/);
  assert.match(runtime, /new LifecycleRepository\(mode, database, this\.\#executor\)/);
  assert.match(runtime, /new BudgetPlanRepository\(mode, database, this\.\#executor\)/);
  assert.match(runtime, /new CommerceRepository\(mode, database, this\.\#executor\)/);
  assert.match(runtime, /await this\.\#executor\.close\(\)/);
  assert.match(root, /screen === 'result'/);
  assert.match(root, /runSnapshot\([\s\S]*runtime\.closePeriod\(current\)/);
  assert.match(screen, /ПРЕДВАРИТЕЛЬНЫЙ ИТОГ/);
  assert.match(screen, /ИТОГ ДНЯ/);
  assert.match(screen, /Вернуться к дню/);
  assert.match(screen, /Финни не заболеет и ничего не потеряет/);
  assert.match(screen, /accessibilityLiveRegion="polite"/);
  assert.match(screen, /minHeight: 48/g);
});
