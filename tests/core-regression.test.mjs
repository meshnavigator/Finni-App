import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { amount, counter } from '../src/domain/index.ts';
import {
  CommerceRepository,
  LifecycleRepository,
  RepositoryExecutor,
  SCHEMA_VERSION,
  SqliteRepository,
  migrateDatabase,
} from '../src/persistence/index.ts';
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_V3 } from '../src/persistence/schema.ts';
import { SCHEMA_V4 } from '../src/persistence/schema-v4.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const directories = [];
test.after(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
});

function temporaryFile(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  directories.push(directory);
  return join(directory, 'state.sqlite');
}

function proxyDatabase(base, overrides = {}) {
  return {
    execAsync: overrides.execAsync ?? ((...args) => base.execAsync(...args)),
    runAsync: overrides.runAsync ?? ((...args) => base.runAsync(...args)),
    getFirstAsync: (...args) => base.getFirstAsync(...args),
    getAllAsync: (...args) => base.getAllAsync(...args),
    closeAsync: () => base.closeAsync(),
  };
}

async function createV4Fixture(database) {
  await database.execAsync(SCHEMA_V1);
  await database.execAsync(SCHEMA_V2);
  await database.execAsync(SCHEMA_V3);
  await database.execAsync(SCHEMA_V4);
  await database.execAsync(readFileSync(
    new URL('./fixtures/profile-v4.sql', import.meta.url),
    'utf8',
  ));
  await database.execAsync('PRAGMA user_version = 4');
}

async function seedCommerce(database, available = 100) {
  await database.runAsync(`INSERT INTO profile(
    id, pet_name, shape_id, pattern_id, created_at, time_zone
  ) VALUES ('profile', 'Финни', 'round', 'plain',
    '2026-09-21T00:00:00.000Z', 'Europe/Moscow')`);
  await database.runAsync(
    "INSERT INTO wallet_projection(profile_id, available, savings) VALUES ('profile', ?, 0)",
    available,
  );
  await database.runAsync("INSERT INTO profile_state(profile_id, revision) VALUES ('profile', 0)");
  await database.runAsync(`INSERT INTO period(
    id, profile_id, period_index, calendar_date, clock_generation, state,
    economy_version, opened_at
  ) VALUES ('period', 'profile', 1, '2026-09-21', 0, 'ACTIVE',
    'economy-v2', '2026-09-21T00:00:00.000Z')`);
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

function transfer(commandId, revision, value) {
  return Object.freeze({
    type: 'DepositSavings',
    meta: meta(commandId, revision),
    payload: Object.freeze({ periodId: 'period', amount: amount(value) }),
  });
}

const storageCode = (code) => (error) => error?.domain?.code === code;

test('file-backed crash boundaries rollback before/after receipt and replay after lost COMMIT response', async () => {
  const path = temporaryFile('finni-core-crash-');
  const initial = new SqliteFileAdapter(path);
  await migrateDatabase(initial);
  await seedCommerce(initial);

  let receiptWriteAttempted = false;
  const diskFull = proxyDatabase(initial, {
    async runAsync(sql, ...params) {
      if (!receiptWriteAttempted && /INSERT INTO command_receipt/.test(sql)) {
        receiptWriteAttempted = true;
        const error = new Error('database or disk is full');
        error.code = 'SQLITE_FULL';
        throw error;
      }
      return initial.runAsync(sql, ...params);
    },
  });
  const beforeReceipt = new CommerceRepository('normal', diskFull);
  let uiReportedSuccess = false;
  await assert.rejects(async () => {
    await beforeReceipt.transfer(
      transfer('before-receipt', 0, 40),
      '2026-09-21T00:00:01.000Z',
    );
    uiReportedSuccess = true;
  }, storageCode('STORAGE_WRITE_FAILED'));
  assert.equal(uiReportedSuccess, false);
  assert.equal(receiptWriteAttempted, true);
  await beforeReceipt.close();

  const afterRollback = new SqliteFileAdapter(path);
  assert.deepEqual(
    await afterRollback.getFirstAsync('SELECT available, savings FROM wallet_projection'),
    { available: 100, savings: 0 },
  );
  assert.deepEqual(
    await afterRollback.getFirstAsync(`SELECT
      (SELECT COUNT(*) FROM ledger_entry) AS ledger,
      (SELECT COUNT(*) FROM audit_event) AS audit,
      (SELECT COUNT(*) FROM command_receipt) AS receipts`),
    { ledger: 0, audit: 0, receipts: 0 },
  );

  let blockCommit = true;
  const receiptNotCommitted = proxyDatabase(afterRollback, {
    async execAsync(sql) {
      if (blockCommit && /^\s*COMMIT\s*$/i.test(sql)) {
        blockCommit = false;
        throw new Error('simulated process stop after receipt before COMMIT');
      }
      await afterRollback.execAsync(sql);
    },
  });
  const beforeCommit = new CommerceRepository('normal', receiptNotCommitted);
  await assert.rejects(
    () => beforeCommit.transfer(
      transfer('after-receipt', 0, 30),
      '2026-09-21T00:00:02.000Z',
    ),
    storageCode('STORAGE_WRITE_FAILED'),
  );
  await beforeCommit.close();

  const afterReceiptRollback = new SqliteFileAdapter(path);
  assert.deepEqual(
    await afterReceiptRollback.getFirstAsync(`SELECT
      (SELECT COUNT(*) FROM ledger_entry) AS ledger,
      (SELECT COUNT(*) FROM command_receipt) AS receipts`),
    { ledger: 0, receipts: 0 },
  );

  let throwAfterCommit = true;
  const lostResponse = proxyDatabase(afterReceiptRollback, {
    async execAsync(sql) {
      await afterReceiptRollback.execAsync(sql);
      if (throwAfterCommit && /^\s*COMMIT\s*$/i.test(sql)) {
        throwAfterCommit = false;
        throw new Error('simulated process stop after COMMIT before response');
      }
    },
  });
  const committing = new CommerceRepository('normal', lostResponse);
  await assert.rejects(
    () => committing.transfer(
      transfer('after-commit', 0, 40),
      '2026-09-21T00:00:02.000Z',
    ),
    storageCode('STORAGE_WRITE_FAILED'),
  );
  await committing.close();

  const reopened = new SqliteFileAdapter(path);
  await migrateDatabase(reopened);
  const replaying = new CommerceRepository('normal', reopened);
  const replay = await replaying.transfer(
    transfer('after-commit', 999, 40),
    '2026-09-21T00:00:03.000Z',
  );
  assert.deepEqual(replay.result.after, { available: 60, savings: 40 });
  assert.deepEqual(
    await reopened.getFirstAsync('SELECT available, savings FROM wallet_projection'),
    { available: 60, savings: 40 },
  );
  assert.deepEqual(
    await reopened.getFirstAsync(`SELECT
      (SELECT COUNT(*) FROM ledger_entry) AS ledger,
      (SELECT COUNT(*) FROM audit_event) AS audit,
      (SELECT COUNT(*) FROM command_receipt) AS receipts`),
    { ledger: 1, audit: 1, receipts: 1 },
  );
  await replaying.close();
});

test('v4 fixture survives injected v5 migration failure and unsupported newer schema is never reset', async () => {
  const path = temporaryFile('finni-core-migration-');
  const database = new SqliteFileAdapter(path);
  await createV4Fixture(database);

  let injected = false;
  const failing = proxyDatabase(database, {
    async execAsync(sql) {
      if (!injected && sql.includes('ALTER TABLE profile_state ADD COLUMN pet_stage')) {
        injected = true;
        await database.execAsync('CREATE TABLE injected_partial_v5(value INTEGER) STRICT');
        throw new Error('injected v4 to v5 migration failure');
      }
      await database.execAsync(sql);
    },
  });
  await assert.rejects(
    () => migrateDatabase(failing),
    /injected v4 to v5 migration failure/,
  );
  assert.deepEqual(await database.getFirstAsync('PRAGMA user_version'), { user_version: 4 });
  assert.deepEqual(
    await database.getFirstAsync(`SELECT p.pet_name, p.shape_id, p.pattern_id,
      w.available, w.savings, s.revision, s.lifetime_growth
      FROM profile p
      JOIN wallet_projection w ON w.profile_id = p.id
      JOIN profile_state s ON s.profile_id = p.id
      WHERE p.id = 'fixture-v4-profile'`),
    {
      pet_name: 'Финни',
      shape_id: 'round',
      pattern_id: 'spots',
      available: 80,
      savings: 20,
      revision: 7,
      lifetime_growth: 3,
    },
  );
  assert.equal(
    (await database.getFirstAsync(`SELECT COUNT(*) AS count FROM sqlite_master
      WHERE type = 'table' AND name = 'injected_partial_v5'`))?.count,
    0,
  );
  assert.equal(
    (await database.getAllAsync('PRAGMA table_info(profile_state)'))
      .some((column) => column.name === 'pet_stage'),
    false,
  );

  assert.equal(await migrateDatabase(database), SCHEMA_VERSION);
  assert.deepEqual(
    await database.getFirstAsync(`SELECT revision, lifetime_growth, pet_stage
      FROM profile_state WHERE profile_id = 'fixture-v4-profile'`),
    { revision: 7, lifetime_growth: 3, pet_stage: 1 },
  );
  await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
  await assert.rejects(
    () => migrateDatabase(database),
    /Unsupported SQLite schema version 6; maximum is 5/,
  );
  assert.deepEqual(await database.getFirstAsync('PRAGMA user_version'), { user_version: 6 });
  assert.deepEqual(
    await database.getFirstAsync(`SELECT available, savings FROM wallet_projection
      WHERE profile_id = 'fixture-v4-profile'`),
    { available: 80, savings: 20 },
  );
  await database.closeAsync();
});

function purchase(commandId, revision) {
  return Object.freeze({
    type: 'ConfirmPurchase',
    meta: meta(commandId, revision),
    payload: Object.freeze({
      periodId: 'period',
      itemId: 'IT-01',
      acknowledgedPlanOverrun: false,
    }),
  });
}

function savingsTransfer(type, commandId, revision, value) {
  return Object.freeze({
    type,
    meta: meta(commandId, revision),
    payload: Object.freeze({ periodId: 'period', amount: amount(value) }),
  });
}

test('real S2 commands reconcile the complete ledger and projections after close and restart', async () => {
  const path = temporaryFile('finni-core-reconcile-');
  const database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  await database.execAsync(`
    INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
    VALUES ('profile', 'Финни', 'round', 'plain', '2026-09-21T00:00:00.000Z', 'Europe/Moscow');
    INSERT INTO wallet_projection(profile_id, available, savings)
    VALUES ('profile', 300, 0);
    INSERT INTO profile_state(profile_id, revision)
    VALUES ('profile', 3);
    INSERT INTO period(
      id, profile_id, period_index, calendar_date, clock_generation, state,
      economy_version, opened_at, closed_at, rule_bundle_json
    ) VALUES (
      'period-old-1', 'profile', 1, '2026-09-19', 0, 'CLOSED', 'economy-v2',
      '2026-09-19T00:00:00.000Z', '2026-09-19T01:00:00.000Z',
      '{"economyVersion":"economy-v2","catalogVersion":"bootstrap","goalsVersion":"bootstrap"}'
    );
    INSERT INTO period(
      id, profile_id, period_index, calendar_date, clock_generation, state,
      economy_version, opened_at, closed_at, rule_bundle_json
    ) VALUES (
      'period-old-2', 'profile', 2, '2026-09-20', 0, 'CLOSED', 'economy-v2',
      '2026-09-20T00:00:00.000Z', '2026-09-20T01:00:00.000Z',
      '{"economyVersion":"economy-v2","catalogVersion":"bootstrap","goalsVersion":"bootstrap"}'
    );
    INSERT INTO period(
      id, profile_id, period_index, calendar_date, clock_generation, state,
      economy_version, opened_at, rule_bundle_json, confirmed_plan_json,
      confirmed_at, budget_at_confirm, ledger_seq_at_confirm
    ) VALUES (
      'period', 'profile', 3, '2026-09-21', 0, 'ACTIVE', 'economy-v2',
      '2026-09-21T00:00:00.000Z',
      '{"economyVersion":"economy-v2","catalogVersion":"bootstrap","goalsVersion":"bootstrap"}',
      '{"need":30,"want":0,"save":180}',
      '2026-09-21T00:00:01.000Z', 300, 3
    );
    INSERT INTO command_receipt(
      command_id, command_type, business_identity, profile_id, mode,
      result_json, committed_at
    ) VALUES
      ('seed-income-1', 'OpenPeriod', 'seed-income-v1', 'profile', 'normal', '{}', '2026-09-19T00:00:00.000Z'),
      ('seed-income-2', 'OpenPeriod', 'seed-income-v2', 'profile', 'normal', '{}', '2026-09-20T00:00:00.000Z'),
      ('seed-income-3', 'OpenPeriod', 'seed-income-v3', 'profile', 'normal', '{}', '2026-09-21T00:00:00.000Z');
    INSERT INTO ledger_entry(
      operation_id, command_id, profile_id, period_id, type, amount,
      delta_available, delta_savings, reason_code, payload_snapshot, created_at
    ) VALUES
      ('income:seed-1', 'seed-income-1', 'profile', 'period-old-1', 'PERIOD_INCOME', 100, 100, 0, 'DAILY_INCOME', '{}', '2026-09-19T00:00:00.000Z'),
      ('income:seed-2', 'seed-income-2', 'profile', 'period-old-2', 'PERIOD_INCOME', 100, 100, 0, 'DAILY_INCOME', '{}', '2026-09-20T00:00:00.000Z'),
      ('income:seed-3', 'seed-income-3', 'profile', 'period', 'PERIOD_INCOME', 100, 100, 0, 'DAILY_INCOME', '{}', '2026-09-21T00:00:00.000Z');
  `);

  const executor = new RepositoryExecutor(database);
  const commerce = new CommerceRepository('normal', database, executor);
  const lifecycle = new LifecycleRepository('normal', database, executor);
  await commerce.purchase(purchase('buy-food', 3), '2026-09-21T00:00:02.000Z');
  await commerce.transfer(
    savingsTransfer('DepositSavings', 'deposit-180', 4, 180),
    '2026-09-21T00:00:03.000Z',
  );
  await commerce.transfer(
    savingsTransfer('WithdrawSavings', 'withdraw-10', 5, 10),
    '2026-09-21T00:00:04.000Z',
  );
  await commerce.selectGoal(Object.freeze({
    type: 'SelectGoal',
    meta: meta('select-goal', 6),
    payload: Object.freeze({ goalId: 'GL-01' }),
  }), '2026-09-21T00:00:05.000Z');
  await commerce.claimGoal(Object.freeze({
    type: 'ClaimGoal',
    meta: meta('claim-goal', 7),
    payload: Object.freeze({ periodId: 'period', goalId: 'GL-01' }),
  }), '2026-09-21T00:00:06.000Z');
  await lifecycle.closePeriod(Object.freeze({
    type: 'ClosePeriod',
    meta: meta('close-period', 8),
    payload: Object.freeze({ periodId: 'period' }),
  }), '2026-09-21T00:00:07.000Z');
  await executor.close();

  const reopened = new SqliteFileAdapter(path);
  const repository = new SqliteRepository('normal', reopened);
  assert.equal(await repository.initialize(), SCHEMA_VERSION);
  assert.equal(await repository.verifyLedgerProjection('profile'), true);
  const wallet = await repository.readWallet('profile');
  assert.deepEqual(wallet, { available: 100, savings: 20, revision: 9 });
  const entries = await repository.inspect(
    `SELECT delta_available, delta_savings FROM ledger_entry
     WHERE profile_id = 'profile' ORDER BY seq`,
  );
  let available = 0;
  let savings = 0;
  for (const entry of entries) {
    available += entry.delta_available;
    savings += entry.delta_savings;
    assert.ok(available >= 0, 'ledger replay must never produce a negative wallet');
    assert.ok(savings >= 0, 'ledger replay must never produce negative savings');
  }
  assert.deepEqual({ available, savings }, { available: 100, savings: 20 });
  assert.deepEqual(await repository.inspect(`SELECT
    (SELECT COUNT(*) FROM purchase) AS purchases,
    (SELECT COUNT(*) FROM goal_claim) AS claims,
    (SELECT COUNT(*) FROM period_summary) AS summaries,
    (SELECT COUNT(*) FROM command_receipt) AS receipts`), [
    { purchases: 1, claims: 1, summaries: 1, receipts: 9 },
  ]);
  await repository.close();
});
