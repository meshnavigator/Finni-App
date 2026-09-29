import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  amount,
  counter,
  moneyDelta,
} from '../src/domain/index.ts';
import {
  DATABASE_FILES,
  SCHEMA_VERSION,
  SqliteRepository,
} from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const temporaryDirectories = [];
test.after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const makeDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'finni-s1-002-'));
  temporaryDirectories.push(directory);
  return directory;
};

const open = (mode, path) => {
  const database = new SqliteFileAdapter(path);
  return { database, repository: new SqliteRepository(mode, database) };
};

const seed = async (database, profileId = 'profile-1', periodId = 'period-1') => {
  await database.runAsync(
    `INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
     VALUES (?, 'Финни', 'round', 'plain', '2026-09-17T09:00:00.000Z', 'Europe/Moscow')`,
    profileId,
  );
  await database.runAsync(
    'INSERT INTO wallet_projection(profile_id, available, savings) VALUES (?, 0, 0)',
    profileId,
  );
  await database.runAsync(
    'INSERT INTO profile_state(profile_id, revision) VALUES (?, 0)',
    profileId,
  );
  await database.runAsync(
    `INSERT INTO period(
       id, profile_id, period_index, calendar_date, clock_generation, state,
       economy_version, opened_at
     ) VALUES (?, ?, 0, '2026-09-17', 0, 'ACTIVE', 'economy-v2', '2026-09-17T09:00:00.000Z')`,
    periodId,
    profileId,
  );
};

const command = ({
  commandId,
  operationId = `operation-${commandId}`,
  eventId = `event-${commandId}`,
  mode = 'normal',
  type = 'OpenPeriod',
  expectedRevision = 0,
  periodId = 'period-1',
  ledgerType = 'PERIOD_INCOME',
  value = 100,
  deltaAvailable = value,
  deltaSavings = 0,
  payload = { calendarDate: '2026-09-17' },
  sessionEpoch = 1,
}) => ({
  envelope: {
    type,
    meta: {
      commandId,
      profileId: 'profile-1',
      mode,
      expectedRevision: counter(expectedRevision),
      sessionEpoch: counter(sessionEpoch),
    },
    payload,
  },
  operationId,
  periodId,
  ledgerType,
  amount: amount(value),
  deltaAvailable: moneyDelta(deltaAvailable),
  deltaSavings: moneyDelta(deltaSavings),
  reasonCode: 'TEST',
  payloadSnapshot: payload,
  resultData: { operationId },
  feedback: { code: 'TEST', petReaction: 'calm' },
  audit: { eventId, eventType: 'MONEY_COMMITTED', payload: { operationId } },
  committedAt: '2026-09-17T09:01:00.000Z',
});

const assertCode = (code) => (error) => error?.domain?.code === code;

test('current schema migrates a real file transactionally and enforces CHECK/UNIQUE/FK', async () => {
  const directory = makeDirectory();
  const path = join(directory, DATABASE_FILES.normal);
  const { database, repository } = open('normal', path);
  assert.equal(await repository.initialize(), SCHEMA_VERSION);
  assert.deepEqual(await repository.inspect('PRAGMA user_version'), [
    { user_version: SCHEMA_VERSION },
  ]);
  await seed(database);

  await assert.rejects(
    database.runAsync(
      `INSERT INTO wallet_projection(profile_id, available, savings)
       VALUES ('missing-profile', 0, 0)`,
    ),
    /FOREIGN KEY constraint failed/,
  );
  await assert.rejects(
    database.runAsync(
      `UPDATE wallet_projection SET available = -1 WHERE profile_id = 'profile-1'`,
    ),
    /CHECK constraint failed/,
  );
  await assert.rejects(
    database.runAsync(
      `UPDATE wallet_projection SET available = 1.5 WHERE profile_id = 'profile-1'`,
    ),
    /(cannot store REAL|CHECK constraint failed)/,
  );
  await assert.rejects(
    database.runAsync(
      `INSERT INTO period(
         id, profile_id, period_index, calendar_date, clock_generation, state,
         economy_version, opened_at
       ) VALUES ('period-2', 'profile-1', 1, '2026-09-18', 0, 'DRAFT',
                 'economy-v2', '2026-09-18T09:00:00.000Z')`,
    ),
    /UNIQUE constraint failed/,
  );
  await repository.close();

  const reopened = open('normal', path);
  assert.equal(await reopened.repository.initialize(), SCHEMA_VERSION);
  assert.deepEqual(await reopened.repository.readWallet('profile-1'), {
    available: 0,
    savings: 0,
    revision: 0,
  });
  await reopened.repository.close();
});

test('COMMIT, durable receipt replay, conflict, induced ROLLBACK and restart stay consistent', async () => {
  const directory = makeDirectory();
  const path = join(directory, DATABASE_FILES.normal);
  const first = open('normal', path);
  await first.repository.initialize();
  await seed(first.database);

  const original = command({ commandId: 'income-1' });
  const receipt = await first.repository.executeMoneyCommand(original);
  assert.deepEqual(receipt.result.after, { available: 100, savings: 0 });
  assert.deepEqual(await first.repository.readWallet('profile-1'), {
    available: 100,
    savings: 0,
    revision: 1,
  });

  const repeated = await first.repository.executeMoneyCommand(command({
    commandId: 'income-1',
    expectedRevision: 999,
    sessionEpoch: 99,
  }));
  assert.deepEqual(repeated, receipt);
  assert.deepEqual(await first.repository.inspect(
    'SELECT COUNT(*) AS count FROM ledger_entry',
  ), [{ count: 1 }]);

  await assert.rejects(
    first.repository.executeMoneyCommand(command({
      commandId: 'income-1',
      payload: { calendarDate: '2026-09-18' },
    })),
    assertCode('IDEMPOTENCY_CONFLICT'),
  );

  await first.database.execAsync(`
    CREATE TRIGGER induce_receipt_failure
    BEFORE INSERT ON command_receipt
    WHEN NEW.command_id = 'reward-fail'
    BEGIN
      SELECT RAISE(ABORT, 'induced receipt failure');
    END;
  `);
  await assert.rejects(
    first.repository.executeMoneyCommand(command({
      commandId: 'reward-fail',
      type: 'CompleteLesson',
      expectedRevision: 1,
      ledgerType: 'LESSON_REWARD',
      value: 20,
      payload: {
        periodId: 'period-1',
        attemptId: 'attempt-1',
        evaluationId: 'evaluation-1',
      },
    })),
    assertCode('STORAGE_WRITE_FAILED'),
  );
  assert.deepEqual(await first.repository.readWallet('profile-1'), {
    available: 100,
    savings: 0,
    revision: 1,
  });
  assert.deepEqual(await first.repository.inspect(
    `SELECT
       (SELECT COUNT(*) FROM ledger_entry) AS ledger,
       (SELECT COUNT(*) FROM audit_event) AS audit,
       (SELECT COUNT(*) FROM command_receipt) AS receipts`,
  ), [{ ledger: 1, audit: 1, receipts: 1 }]);
  await first.repository.close();

  const reopened = open('normal', path);
  assert.equal(await reopened.repository.initialize(), SCHEMA_VERSION);
  assert.deepEqual(await reopened.repository.findReceipt('income-1'), receipt);
  assert.equal(await reopened.repository.verifyLedgerProjection('profile-1'), true);
  await reopened.repository.close();
});

test('database uniqueness is the final guard for income/reward and rolls back projections', async () => {
  const directory = makeDirectory();
  const path = join(directory, DATABASE_FILES.normal);
  const current = open('normal', path);
  await current.repository.initialize();
  await seed(current.database);
  await current.repository.executeMoneyCommand(command({ commandId: 'income-1' }));

  await assert.rejects(
    current.repository.executeMoneyCommand(command({
      commandId: 'income-2',
      expectedRevision: 1,
    })),
    assertCode('STORAGE_WRITE_FAILED'),
  );
  const reward = command({
    commandId: 'reward-1',
    type: 'CompleteLesson',
    expectedRevision: 1,
    ledgerType: 'LESSON_REWARD',
    value: 20,
    payload: {
      periodId: 'period-1', attemptId: 'attempt-1', evaluationId: 'evaluation-1',
    },
  });
  await current.repository.executeMoneyCommand(reward);
  await assert.rejects(
    current.repository.executeMoneyCommand(command({
      commandId: 'reward-2',
      type: 'CompleteLesson',
      expectedRevision: 2,
      ledgerType: 'LESSON_REWARD',
      value: 20,
      payload: {
        periodId: 'period-1', attemptId: 'attempt-2', evaluationId: 'evaluation-2',
      },
    })),
    assertCode('STORAGE_WRITE_FAILED'),
  );
  assert.deepEqual(await current.repository.readWallet('profile-1'), {
    available: 120,
    savings: 0,
    revision: 2,
  });
  assert.deepEqual(await current.repository.inspect(
    'SELECT type, COUNT(*) AS count FROM ledger_entry GROUP BY type ORDER BY type',
  ), [
    { type: 'LESSON_REWARD', count: 1 },
    { type: 'PERIOD_INCOME', count: 1 },
  ]);
  await current.repository.close();
});

test('RepositoryExecutor serializes concurrent commands on one connection', async () => {
  const directory = makeDirectory();
  const current = open('normal', join(directory, DATABASE_FILES.normal));
  await current.repository.initialize();
  await seed(current.database);
  await current.repository.executeMoneyCommand(command({ commandId: 'income-1' }));

  const deposit = (number, expectedRevision, value) => command({
    commandId: `deposit-${number}`,
    type: 'DepositSavings',
    expectedRevision,
    ledgerType: 'SAVINGS_DEPOSIT',
    value,
    deltaAvailable: -value,
    deltaSavings: value,
    payload: { periodId: 'period-1', amount: value },
  });
  const [first, second] = await Promise.all([
    current.repository.executeMoneyCommand(deposit(1, 1, 10)),
    current.repository.executeMoneyCommand(deposit(2, 2, 20)),
  ]);
  assert.equal(first.result.revision, 2);
  assert.equal(second.result.revision, 3);
  assert.deepEqual(await current.repository.readWallet('profile-1'), {
    available: 70,
    savings: 30,
    revision: 3,
  });
  assert.equal(await current.repository.verifyLedgerProjection('profile-1'), true);
  await current.repository.close();
});

test('normal/demo use distinct database files and reject cross-mode commands', async () => {
  assert.notEqual(DATABASE_FILES.normal, DATABASE_FILES.demo);
  const directory = makeDirectory();
  const normal = open('normal', join(directory, DATABASE_FILES.normal));
  const demo = open('demo', join(directory, DATABASE_FILES.demo));
  await Promise.all([normal.repository.initialize(), demo.repository.initialize()]);
  await seed(normal.database);
  await seed(demo.database);

  await normal.repository.executeMoneyCommand(command({ commandId: 'normal-income' }));
  await demo.repository.executeMoneyCommand(command({
    commandId: 'demo-reward',
    mode: 'demo',
    type: 'CompleteLesson',
    ledgerType: 'LESSON_REWARD',
    value: 20,
    payload: {
      periodId: 'period-1', attemptId: 'attempt-demo', evaluationId: 'evaluation-demo',
    },
  }));
  await assert.rejects(
    normal.repository.executeMoneyCommand(command({
      commandId: 'wrong-mode', mode: 'demo',
    })),
    assertCode('PROFILE_MODE_MISMATCH'),
  );
  assert.deepEqual(await normal.repository.readWallet('profile-1'), {
    available: 100, savings: 0, revision: 1,
  });
  assert.deepEqual(await demo.repository.readWallet('profile-1'), {
    available: 20, savings: 0, revision: 1,
  });
  assert.equal(await normal.repository.findReceipt('demo-reward'), null);
  assert.equal(await demo.repository.findReceipt('normal-income'), null);
  await Promise.all([normal.repository.close(), demo.repository.close()]);
});
