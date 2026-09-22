import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { amount, counter } from '../src/domain/index.ts';
import { CommerceRepository, migrateDatabase } from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const dirs = [];
test.after(() => dirs.forEach((directory) => rmSync(directory, { recursive: true, force: true })));

async function setup(available = 100, savings = 0) {
  const directory = mkdtempSync(join(tmpdir(), 'finni-s2-savings-'));
  dirs.push(directory);
  const path = join(directory, 'commerce.sqlite');
  const database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  await database.runAsync(`INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
    VALUES ('profile', 'Финни', 'round', 'plain', '2026-09-21T00:00:00.000Z', 'Europe/Moscow')`);
  await database.runAsync('INSERT INTO wallet_projection(profile_id, available, savings) VALUES (?, ?, ?)', 'profile', available, savings);
  await database.runAsync("INSERT INTO profile_state(profile_id, revision) VALUES ('profile', 0)");
  await database.runAsync(`INSERT INTO period(id, profile_id, period_index, calendar_date, clock_generation, state, economy_version, opened_at)
    VALUES ('period', 'profile', 1, '2026-09-21', 0, 'ACTIVE', 'economy-v2', '2026-09-21T00:00:00.000Z')`);
  return { database, path, commerce: new CommerceRepository('normal', database) };
}

function meta(commandId, revision) {
  return Object.freeze({
    commandId,
    profileId: 'profile',
    mode: 'normal',
    expectedRevision: counter(revision),
    sessionEpoch: counter(0),
  });
}

function transfer(type, commandId, revision, value) {
  return Object.freeze({
    type,
    meta: meta(commandId, revision),
    payload: Object.freeze({ periodId: 'period', amount: amount(value) }),
  });
}

function selectGoal(commandId, revision, goalId) {
  return Object.freeze({
    type: 'SelectGoal',
    meta: meta(commandId, revision),
    payload: Object.freeze({ goalId }),
  });
}

function claimGoal(commandId, revision, goalId) {
  return Object.freeze({
    type: 'ClaimGoal',
    meta: meta(commandId, revision),
    payload: Object.freeze({ periodId: 'period', goalId }),
  });
}

test('deposit and confirmed withdrawal conserve funds and produce ordered history', async () => {
  const { database, commerce } = await setup();
  const depositPreview = await commerce.previewSavings('profile', 'deposit', amount(40));
  assert.deepEqual(depositPreview.after, { available: 60, savings: 40 });
  await commerce.transfer(transfer('DepositSavings', 'deposit-40', 0, 40), '2026-09-21T00:00:01.000Z');

  const withdrawalPreview = await commerce.previewSavings('profile', 'withdraw', amount(15));
  assert.deepEqual(withdrawalPreview.after, { available: 75, savings: 25 });
  await commerce.transfer(transfer('WithdrawSavings', 'withdraw-15', 1, 15), '2026-09-21T00:00:02.000Z');

  const insufficient = await commerce.previewSavings('profile', 'withdraw', amount(30));
  assert.equal(insufficient.after, null);
  assert.equal(insufficient.missing, 5);
  await assert.rejects(
    () => commerce.transfer(transfer('WithdrawSavings', 'withdraw-too-much', 2, 30), '2026-09-21T00:00:03.000Z'),
    /INSUFFICIENT_SAVINGS/,
  );

  const wallet = await database.getFirstAsync('SELECT available, savings FROM wallet_projection WHERE profile_id = ?', 'profile');
  assert.deepEqual(wallet, { available: 75, savings: 25 });
  assert.equal(wallet.available + wallet.savings, 100);
  const snapshot = await commerce.read('profile', 'period');
  assert.deepEqual(snapshot.history.map((entry) => entry.type), ['SAVINGS_WITHDRAWAL', 'SAVINGS_DEPOSIT']);
  assert.deepEqual(snapshot.history.map((entry) => [entry.deltaAvailable, entry.deltaSavings]), [[15, -15], [-40, 40]]);
  await commerce.close();
});

test('goal change preserves savings; claim keeps surplus and survives replay and restart', async () => {
  const { database, path, commerce } = await setup(200, 0);
  await commerce.transfer(transfer('DepositSavings', 'deposit-180', 0, 180), '2026-09-21T00:00:01.000Z');
  await commerce.selectGoal(selectGoal('select-2', 1, 'GL-02'), '2026-09-21T00:00:02.000Z');
  await commerce.selectGoal(selectGoal('select-1', 2, 'GL-01'), '2026-09-21T00:00:03.000Z');
  assert.deepEqual(await database.getFirstAsync('SELECT available, savings FROM wallet_projection'), { available: 20, savings: 180 });

  const command = claimGoal('claim-1', 3, 'GL-01');
  const first = await commerce.claimGoal(command, '2026-09-21T00:00:04.000Z');
  const replay = await commerce.claimGoal(claimGoal('claim-1', 4, 'GL-01'), '2026-09-21T00:00:05.000Z');
  assert.deepEqual(replay.result, first.result);
  assert.equal(first.result.after.savings, 30);
  assert.equal((await database.getFirstAsync("SELECT COUNT(*) AS count FROM ledger_entry WHERE type = 'GOAL_CLAIM'"))?.count, 1);
  await commerce.close();

  const restartedDatabase = new SqliteFileAdapter(path);
  await migrateDatabase(restartedDatabase);
  const restarted = new CommerceRepository('normal', restartedDatabase);
  const snapshot = await restarted.read('profile', 'period');
  assert.equal(snapshot.selectedGoal, null);
  assert.deepEqual(snapshot.claimedGoalIds, ['GL-01']);
  assert.deepEqual(snapshot.history.map((entry) => entry.type), ['GOAL_CLAIM', 'SAVINGS_DEPOSIT']);
  assert.deepEqual(await restartedDatabase.getFirstAsync('SELECT available, savings FROM wallet_projection'), { available: 20, savings: 30 });
  await assert.rejects(
    () => restarted.selectGoal(selectGoal('select-claimed', 4, 'GL-01'), '2026-09-21T00:00:06.000Z'),
    /GOAL_ALREADY_CLAIMED/,
  );
  await restarted.close();
});

test('concurrent transfers with one revision commit at most once', async () => {
  const { database, commerce } = await setup();
  const results = await Promise.allSettled([
    commerce.transfer(transfer('DepositSavings', 'concurrent-a', 0, 10), '2026-09-21T00:00:01.000Z'),
    commerce.transfer(transfer('DepositSavings', 'concurrent-b', 0, 20), '2026-09-21T00:00:01.000Z'),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.match(String(results.find((result) => result.status === 'rejected')?.reason), /STALE_STATE/);
  const wallet = await database.getFirstAsync('SELECT available, savings FROM wallet_projection');
  assert.equal(wallet.available + wallet.savings, 100);
  assert.ok(wallet.savings === 10 || wallet.savings === 20);
  assert.equal((await database.getFirstAsync("SELECT COUNT(*) AS count FROM ledger_entry WHERE type = 'SAVINGS_DEPOSIT'"))?.count, 1);
  assert.equal((await database.getFirstAsync("SELECT COUNT(*) AS count FROM command_receipt WHERE command_type = 'DepositSavings'"))?.count, 1);
  await commerce.close();
});

test('runtime boundary and accessible savings/history screens are wired', () => {
  const runtime = readFileSync(new URL('../src/application/app-runtime.ts', import.meta.url), 'utf8');
  const root = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');
  const savings = readFileSync(new URL('../src/ui/SavingsScreen.tsx', import.meta.url), 'utf8');
  const ledger = readFileSync(new URL('../src/ui/LedgerScreen.tsx', import.meta.url), 'utf8');

  assert.match(runtime, /positiveAmount\(value\)/);
  assert.match(runtime, /async depositSavings/);
  assert.match(runtime, /async withdrawSavings/);
  assert.match(runtime, /async claimGoal/);
  assert.match(runtime, /async history/);
  assert.match(root, /screen === 'savings'/);
  assert.match(root, /screen === 'history'/);
  assert.match(root, /runtime\.depositSavings\(current/);
  assert.match(root, /runtime\.withdrawSavings\(current/);
  assert.match(root, /runtime\.claimGoal\(current/);
  assert.match(savings, /accessibilityLiveRegion="polite"/);
  assert.match(savings, /Снять выбор цели/);
  assert.match(savings, /История операций/);
  assert.match(savings, /minHeight: 48/g);
  assert.match(ledger, /props\.snapshot\.commerce\?\.history/);
  assert.match(ledger, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(ledger, /Кошелёк/);
  assert.match(ledger, /Копилка/);
});
