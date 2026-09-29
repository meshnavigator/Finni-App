import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  NormalClock,
  VirtualClock,
  calendarDateAt,
  counter,
  derivePeriodState,
  nextCalendarDate,
  plan,
} from '../src/domain/index.ts';
import {
  DATABASE_FILES,
  DEFAULT_RULE_BUNDLE,
  LifecycleRepository,
  SCHEMA_V1,
  SCHEMA_VERSION,
  migrateDatabase,
} from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const temporaryDirectories = [];
test.after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const directory = () => {
  const value = mkdtempSync(join(tmpdir(), 'finni-s1-003-'));
  temporaryDirectories.push(value);
  return value;
};

const seed = async (database, profileId = 'profile-1') => {
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
};

const open = async (mode, path) => {
  const database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  return { database, repository: new LifecycleRepository(mode, database) };
};

const command = (type, revision, payload, mode = 'normal', number = revision) => ({
  type,
  meta: {
    commandId: `${mode}-${type}-${number}`,
    profileId: 'profile-1',
    mode,
    expectedRevision: counter(revision),
    sessionEpoch: counter(1),
  },
  payload,
});

const assertCode = (code) => (error) => error?.domain?.code === code;

test('NormalClock/VirtualClock and projected state use calendar rules', () => {
  const instant = new Date('2026-03-28T21:30:00.000Z');
  assert.equal(calendarDateAt(instant, 'Europe/Moscow'), '2026-03-29');
  assert.equal(nextCalendarDate('2024-02-28'), '2024-02-29');
  const normal = new NormalClock('Europe/Moscow', () => instant);
  assert.equal(normal.calendarDate(), '2026-03-29');
  const virtual = new VirtualClock('2026-03-29', 'Europe/Moscow', () => instant);
  assert.equal(virtual.advance(), '2026-03-30');
  assert.equal(virtual.calendarDate(), '2026-03-30');
  assert.equal(derivePeriodState({
    profileExists: true,
    mode: 'normal',
    currentDate: '2026-09-17',
    openPeriodState: null,
    hasClosedPeriod: true,
    maxOpenedDate: '2026-09-17',
    nextEligibleDate: null,
  }), 'WAITING');
});

test('schema v1 migrates to lifecycle v2 without losing period clock/rule data', async () => {
  const path = join(directory(), DATABASE_FILES.normal);
  const database = new SqliteFileAdapter(path);
  await database.execAsync('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE');
  await database.execAsync(SCHEMA_V1);
  await database.execAsync('PRAGMA user_version = 1; COMMIT');
  await seed(database);
  await database.runAsync(
    `INSERT INTO period(
       id, profile_id, period_index, calendar_date, clock_generation, state,
       economy_version, opened_at, closed_at
     ) VALUES ('legacy-period', 'profile-1', 1, '2026-09-16', 0, 'CLOSED',
               'economy-v2', '2026-09-16T09:00:00.000Z', '2026-09-16T10:00:00.000Z')`,
  );
  assert.equal(await migrateDatabase(database), SCHEMA_VERSION);
  assert.deepEqual(await database.getAllAsync(
    `SELECT game_clock.max_opened_date, period.rule_bundle_json
     FROM game_clock JOIN period ON period.profile_id = game_clock.profile_id`,
  ), [{
    max_opened_date: '2026-09-16',
    rule_bundle_json: '{"economyVersion":"economy-v2","catalogVersion":"bootstrap","goalsVersion":"bootstrap"}',
  }]);
  await database.closeAsync();
});

test('OpenPeriod rolls back period, income, revision and receipt together', async () => {
  const path = join(directory(), DATABASE_FILES.normal);
  const current = await open('normal', path);
  await seed(current.database);
  await current.database.execAsync(`
    CREATE TRIGGER fail_lifecycle_receipt
    BEFORE INSERT ON command_receipt
    WHEN NEW.command_id = 'normal-OpenPeriod-rollback'
    BEGIN
      SELECT RAISE(ABORT, 'induced lifecycle receipt failure');
    END;
  `);
  const clock = new NormalClock(
    'Europe/Moscow',
    () => new Date('2026-09-17T09:00:00.000Z'),
  );
  await assert.rejects(
    current.repository.openPeriod(
      command('OpenPeriod', 0, { calendarDate: '2026-09-17' }, 'normal', 'rollback'),
      clock,
      'rolled-back-period',
      DEFAULT_RULE_BUNDLE,
    ),
    assertCode('STORAGE_WRITE_FAILED'),
  );
  assert.deepEqual(await current.database.getAllAsync(
    `SELECT
       (SELECT COUNT(*) FROM period) AS periods,
       (SELECT COUNT(*) FROM ledger_entry) AS ledger,
       (SELECT COUNT(*) FROM audit_event) AS audit,
       (SELECT COUNT(*) FROM command_receipt) AS receipts,
       (SELECT available FROM wallet_projection) AS available,
       (SELECT revision FROM profile_state) AS revision`,
  ), [{ periods: 0, ledger: 0, audit: 0, receipts: 0, available: 0, revision: 0 }]);
  await current.repository.close();
});

test('normal restart, clock rollback and large forward jump never duplicate income', async () => {
  const folder = directory();
  const path = join(folder, DATABASE_FILES.normal);
  let now = new Date('2026-09-17T09:00:00.000Z');
  const clock = new NormalClock('Europe/Moscow', () => now);
  const first = await open('normal', path);
  await seed(first.database);

  const opened = await first.repository.openPeriod(
    command('OpenPeriod', 0, { calendarDate: '2026-09-17' }),
    clock,
    'period-1',
    DEFAULT_RULE_BUNDLE,
  );
  assert.deepEqual(opened.result.after, { available: 100, savings: 0 });
  const repeated = await first.repository.openPeriod(
    command('OpenPeriod', 999, { calendarDate: '2026-09-17' }, 'normal', 0),
    clock,
    'ignored-period',
    DEFAULT_RULE_BUNDLE,
  );
  assert.deepEqual(repeated, opened);
  await first.repository.confirmPlan(
    command('ConfirmPlan', 1, {
      periodId: 'period-1', values: plan(0, 0, 0), acknowledgedLowNeed: true,
    }),
    '2026-09-17T09:01:00.000Z',
  );
  await first.repository.closePeriod(
    command('ClosePeriod', 2, { periodId: 'period-1' }),
    '2026-09-17T09:02:00.000Z',
  );

  now = new Date('2026-09-16T09:00:00.000Z');
  assert.equal((await first.repository.readLifecycle('profile-1', clock)).state, 'WAITING');
  await assert.rejects(
    first.repository.openPeriod(
      command('OpenPeriod', 3, { calendarDate: '2026-09-16' }, 'normal', 'rollback'),
      clock,
      'period-rollback',
      DEFAULT_RULE_BUNDLE,
    ),
    assertCode('NEXT_DAY_NOT_AVAILABLE'),
  );

  now = new Date('2027-09-17T09:00:00.000Z');
  const second = await first.repository.openPeriod(
    command('OpenPeriod', 3, { calendarDate: '2027-09-17' }, 'normal', 'forward'),
    clock,
    'period-2',
    { ...DEFAULT_RULE_BUNDLE, catalogVersion: 'catalog-v2' },
  );
  assert.deepEqual(second.result.after, { available: 200, savings: 0 });
  await first.repository.close();

  const restarted = await open('normal', path);
  const restored = await restarted.repository.readLifecycle('profile-1', clock);
  assert.equal(restored.state, 'DRAFT');
  assert.equal(restored.periodId, 'period-2');
  assert.equal(restored.available, 200);
  assert.equal(restored.ruleBundle.catalogVersion, 'catalog-v2');
  assert.deepEqual(await restarted.database.getAllAsync(
    `SELECT type, COUNT(*) AS count FROM ledger_entry GROUP BY type`,
  ), [{ type: 'PERIOD_INCOME', count: 2 }]);
  await restarted.repository.close();
});

test('five demo periods run without waiting and survive restart without touching normal', async () => {
  const folder = directory();
  const demoPath = join(folder, DATABASE_FILES.demo);
  const normalPath = join(folder, DATABASE_FILES.normal);
  let demo = await open('demo', demoPath);
  const normal = await open('normal', normalPath);
  await seed(demo.database);
  await seed(normal.database);
  const clock = new VirtualClock('2026-09-17', 'Europe/Moscow');

  let revision = 0;
  for (let day = 1; day <= 5; day += 1) {
    const state = await demo.repository.readLifecycle('profile-1', clock);
    assert.equal(state.state, 'READY');
    assert.equal(state.periodIndex, day === 1 ? null : day - 1);
    const currentDate = state.calendarDate;
    await demo.repository.openPeriod(
      command('OpenPeriod', revision, { calendarDate: currentDate }, 'demo', day),
      clock,
      `demo-period-${day}`,
      DEFAULT_RULE_BUNDLE,
    );
    revision += 1;
    await demo.repository.confirmPlan(
      command('ConfirmPlan', revision, {
        periodId: `demo-period-${day}`,
        values: plan(0, 0, 0),
        acknowledgedLowNeed: true,
      }, 'demo', day),
      `2026-09-${String(17 + day).padStart(2, '0')}T09:01:00.000Z`,
    );
    revision += 1;
    await demo.repository.closePeriod(
      command('ClosePeriod', revision, { periodId: `demo-period-${day}` }, 'demo', day),
      `2026-09-${String(17 + day).padStart(2, '0')}T09:02:00.000Z`,
    );
    revision += 1;
    if (day === 3) {
      const savedDate = (await demo.repository.readLifecycle('profile-1', clock)).calendarDate;
      await demo.repository.close();
      demo = await open('demo', demoPath);
      assert.equal(
        (await demo.repository.readLifecycle('profile-1', new VirtualClock('1999-01-01', 'UTC'))).calendarDate,
        savedDate,
      );
    }
    if (day < 5) {
      await demo.repository.advanceDemoDay(
        command('AdvanceDemoDay', revision, {}, 'demo', day),
        `2026-09-${String(17 + day).padStart(2, '0')}T09:03:00.000Z`,
      );
      revision += 1;
    }
  }

  const finalDemo = await demo.repository.readLifecycle('profile-1', clock);
  assert.equal(finalDemo.available, 500);
  assert.equal(finalDemo.periodIndex, 5);
  assert.equal((await normal.repository.readLifecycle(
    'profile-1',
    new NormalClock('Europe/Moscow', () => new Date('2026-09-17T09:00:00.000Z')),
  )).available, 0);
  await Promise.all([demo.repository.close(), normal.repository.close()]);
});

test('adult clock correction changes generation without income and blocks immediate reopening', async () => {
  const folder = directory();
  const path = join(folder, DATABASE_FILES.normal);
  let now = new Date('2030-01-01T09:00:00.000Z');
  const clock = new NormalClock('Europe/Moscow', () => now);
  const current = await open('normal', path);
  await seed(current.database);
  await current.repository.openPeriod(
    command('OpenPeriod', 0, { calendarDate: '2030-01-01' }),
    clock,
    'future-period',
    DEFAULT_RULE_BUNDLE,
  );
  await assert.rejects(
    current.repository.correctClock(
      command('CorrectClock', 1, {
        timeZone: 'Europe/Moscow', correctedDate: '2026-09-17',
      }),
      '2026-09-17T09:00:00.000Z',
    ),
    assertCode('PERIOD_NOT_ACTIVE'),
  );
  await current.repository.confirmPlan(
    command('ConfirmPlan', 1, {
      periodId: 'future-period', values: plan(0, 0, 0), acknowledgedLowNeed: true,
    }),
    '2030-01-01T09:01:00.000Z',
  );
  await current.repository.closePeriod(
    command('ClosePeriod', 2, { periodId: 'future-period' }),
    '2030-01-01T09:02:00.000Z',
  );
  const corrected = await current.repository.correctClock(
    command('CorrectClock', 3, {
      timeZone: 'Europe/Moscow', correctedDate: '2026-09-17',
    }),
    '2026-09-17T09:00:00.000Z',
  );
  assert.equal(corrected.result.revision, 4);
  assert.deepEqual(corrected.result.before, corrected.result.after);
  now = new Date('2026-09-17T09:00:00.000Z');
  const waiting = await current.repository.readLifecycle('profile-1', clock);
  assert.equal(waiting.clockGeneration, 1);
  assert.equal(waiting.nextEligibleDate, '2026-09-18');
  assert.equal(waiting.state, 'WAITING');
  now = new Date('2026-09-18T09:00:00.000Z');
  assert.equal((await current.repository.readLifecycle('profile-1', clock)).state, 'READY');
  const reopened = await current.repository.openPeriod(
    command('OpenPeriod', 4, { calendarDate: '2026-09-18' }, 'normal', 'corrected'),
    clock,
    'corrected-period',
    DEFAULT_RULE_BUNDLE,
  );
  assert.deepEqual(reopened.result.after, { available: 200, savings: 0 });
  await current.repository.close();
});
