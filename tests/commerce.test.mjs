import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { counter } from '../src/domain/index.ts';
import { CommerceRepository, migrateDatabase } from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const dirs = [];
test.after(() => dirs.forEach((directory) => rmSync(directory, { recursive: true, force: true })));

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'finni-s2-'));
  dirs.push(directory);
  const database = new SqliteFileAdapter(join(directory, 'commerce.sqlite'));
  await migrateDatabase(database);
  await database.runAsync(`INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
    VALUES ('profile', 'Финни', 'round', 'plain', '2026-09-21T00:00:00.000Z', 'Europe/Moscow')`);
  await database.runAsync("INSERT INTO wallet_projection(profile_id, available, savings) VALUES ('profile', 100, 0)");
  await database.runAsync("INSERT INTO profile_state(profile_id, revision) VALUES ('profile', 0)");
  await database.runAsync(`INSERT INTO period(id, profile_id, period_index, calendar_date, clock_generation, state, economy_version, opened_at)
    VALUES ('period', 'profile', 1, '2026-09-21', 0, 'ACTIVE', 'economy-v2', '2026-09-21T00:00:00.000Z')`);
  return { database, commerce: new CommerceRepository('normal', database) };
}

function meta(commandId, revision = 0) {
  return Object.freeze({ commandId, profileId: 'profile', mode: 'normal', expectedRevision: counter(revision), sessionEpoch: counter(0) });
}

test('catalog purchase previews funds and persists one immutable receipt/ledger row', async () => {
  const { database, commerce } = await setup();
  const preview = await commerce.previewPurchase('profile', 'period', 'IT-01');
  assert.equal(preview.after?.available, 70);
  const first = await commerce.purchase(Object.freeze({ type: 'ConfirmPurchase', meta: meta('buy'), payload: Object.freeze({ periodId: 'period', itemId: 'IT-01', acknowledgedPlanOverrun: false }) }), '2026-09-21T00:00:01.000Z');
  const replay = await commerce.purchase(Object.freeze({ type: 'ConfirmPurchase', meta: meta('buy', 1), payload: Object.freeze({ periodId: 'period', itemId: 'IT-01', acknowledgedPlanOverrun: false }) }), '2026-09-21T00:00:02.000Z');
  assert.deepEqual(replay.result, first.result);
  assert.equal((await database.getFirstAsync('SELECT available FROM wallet_projection'))?.available, 70);
  assert.equal((await database.getFirstAsync('SELECT COUNT(*) AS count FROM ledger_entry'))?.count, 1);
  await assert.rejects(() => commerce.purchase(Object.freeze({ type: 'ConfirmPurchase', meta: meta('buy-2', 1), payload: Object.freeze({ periodId: 'period', itemId: 'IT-02', acknowledgedPlanOverrun: false }) }), '2026-09-21T00:00:03.000Z'), /DAILY_SLOT_USED/);
  await commerce.close();
});

test('insufficient purchase changes neither projection nor history', async () => {
  const { database, commerce } = await setup();
  await database.runAsync("UPDATE wallet_projection SET available = 10 WHERE profile_id = 'profile'");
  const preview = await commerce.previewPurchase('profile', 'period', 'IT-01');
  assert.equal(preview.after, null);
  assert.equal(preview.missing, 20);
  await assert.rejects(() => commerce.purchase(Object.freeze({ type: 'ConfirmPurchase', meta: meta('poor'), payload: Object.freeze({ periodId: 'period', itemId: 'IT-01', acknowledgedPlanOverrun: false }) }), '2026-09-21T00:00:01.000Z'), /INSUFFICIENT_FUNDS/);
  assert.equal((await database.getFirstAsync('SELECT available FROM wallet_projection'))?.available, 10);
  assert.equal((await database.getFirstAsync('SELECT COUNT(*) AS count FROM ledger_entry'))?.count, 0);
  await commerce.close();
});
