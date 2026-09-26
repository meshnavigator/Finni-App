import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ReceiptPresentationController } from '../src/application/receipt-presentation.ts';
import { amount, counter } from '../src/domain/index.ts';
import { CommerceRepository, migrateDatabase } from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const directories = [];
test.after(() => directories.forEach((directory) => rmSync(directory, { recursive: true, force: true })));

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'finni-receipt-presentation-'));
  directories.push(directory);
  const path = join(directory, 'state.sqlite');
  const database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  await database.runAsync(`INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
    VALUES ('profile', 'Финни', 'round', 'plain', '2026-09-26T00:00:00.000Z', 'Europe/Moscow')`);
  await database.runAsync('INSERT INTO wallet_projection(profile_id, available, savings) VALUES (?, ?, ?)', 'profile', 100, 0);
  await database.runAsync("INSERT INTO profile_state(profile_id, revision) VALUES ('profile', 0)");
  await database.runAsync(`INSERT INTO period(id, profile_id, period_index, calendar_date, clock_generation, state, economy_version, opened_at)
    VALUES ('period', 'profile', 1, '2026-09-26', 0, 'ACTIVE', 'economy-v2', '2026-09-26T00:00:00.000Z')`);
  return { database, path, commerce: new CommerceRepository('normal', database) };
}

function transfer(commandId, revision, value) {
  return {
    type: 'DepositSavings',
    meta: { commandId, profileId: 'profile', mode: 'normal', expectedRevision: counter(revision), sessionEpoch: counter(1) },
    payload: { periodId: 'period', amount: amount(value) },
  };
}

const normal = Object.freeze({ profileId: 'profile', mode: 'normal', sessionEpoch: 1 });

test('persisted savings receipt is shown once; replay and restart preserve exact money', async () => {
  const { database, commerce } = await setup();
  const presentation = new ReceiptPresentationController();
  presentation.bind(normal);
  const command = transfer('deposit-once', 0, 30);
  const receipt = await commerce.transfer(command, '2026-09-26T00:00:01.000Z');
  assert.equal(presentation.accept(receipt, normal, 1), true);
  const event = presentation.next();
  assert.equal(event.commandId, 'deposit-once');
  assert.deepEqual(event.before, { available: 100, savings: 0 });
  assert.deepEqual(event.after, { available: 70, savings: 30 });
  assert.equal(presentation.accept(receipt, normal, 1), false);
  assert.equal(presentation.complete(event.id), null);
  const repeated = await commerce.transfer(command, '2026-09-26T00:00:02.000Z');
  assert.deepEqual(repeated, receipt);
  assert.equal(presentation.accept(repeated, normal, 1), false);
  const restarted = new ReceiptPresentationController();
  restarted.bind(normal);
  assert.equal(restarted.next(), null); // Boot reads snapshots; it never enqueues history.
  assert.deepEqual(await database.getFirstAsync('SELECT available, savings FROM wallet_projection WHERE profile_id = ?', 'profile'),
    { available: 70, savings: 30 });
  await commerce.close();
});

test('failed save, stale revision, foreign mode/profile/epoch and cancellation never show success', async () => {
  const { database, commerce } = await setup();
  const presentation = new ReceiptPresentationController();
  presentation.bind(normal);
  await assert.rejects(() => commerce.transfer(transfer('too-much', 0, 101), '2026-09-26T00:00:01.000Z'));
  assert.equal(presentation.next(), null);
  const receipt = await commerce.transfer(transfer('saved', 0, 20), '2026-09-26T00:00:02.000Z');
  assert.equal(presentation.accept(receipt, normal, 0), false);
  assert.equal(presentation.accept(receipt, { ...normal, sessionEpoch: 0 }, 1), false);
  assert.equal(presentation.accept(receipt, { ...normal, profileId: 'other' }, 1), false);
  assert.equal(presentation.accept(receipt, normal, 1), true);
  presentation.cancel();
  assert.equal(presentation.next(), null);
  assert.equal(presentation.accept(receipt, normal, 1), false);
  presentation.bind({ ...normal, mode: 'demo', sessionEpoch: 2 });
  assert.equal(presentation.accept(receipt, normal, 1), false);
  assert.deepEqual(await database.getFirstAsync('SELECT available, savings FROM wallet_projection WHERE profile_id = ?', 'profile'),
    { available: 80, savings: 20 });
  await commerce.close();
});

test('storage failure rolls back the transfer and produces no presentation event', async () => {
  const { database, commerce } = await setup();
  const presentation = new ReceiptPresentationController();
  presentation.bind(normal);
  await database.execAsync(`CREATE TRIGGER reject_receipt BEFORE INSERT ON command_receipt
    BEGIN SELECT RAISE(ABORT, 'receipt write failed'); END;`);
  await assert.rejects(() => commerce.transfer(transfer('storage-failed', 0, 20), '2026-09-26T00:00:01.000Z'));
  assert.equal(presentation.next(), null);
  assert.deepEqual(await database.getFirstAsync('SELECT available, savings FROM wallet_projection WHERE profile_id = ?', 'profile'),
    { available: 100, savings: 0 });
  assert.equal((await database.getFirstAsync('SELECT COUNT(*) AS count FROM command_receipt')).count, 0);
  await commerce.close();
});

test('crash after commit and before delivery loads the saved snapshot without replay', async () => {
  const { path, commerce } = await setup();
  await commerce.transfer(transfer('committed-before-crash', 0, 30), '2026-09-26T00:00:01.000Z');
  await commerce.close();
  const reopened = new SqliteFileAdapter(path);
  await migrateDatabase(reopened);
  const presentation = new ReceiptPresentationController();
  presentation.bind(normal);
  assert.equal(presentation.next(), null);
  assert.deepEqual(await reopened.getFirstAsync('SELECT available, savings FROM wallet_projection WHERE profile_id = ?', 'profile'),
    { available: 70, savings: 30 });
  assert.equal((await reopened.getFirstAsync('SELECT COUNT(*) AS count FROM command_receipt')).count, 1);
  await reopened.closeAsync();
});

test('milestones outrank ordinary effects and completion never runs a domain command', () => {
  const presentation = new ReceiptPresentationController();
  presentation.bind(normal);
  const receipt = (commandId, commandType, revision, data = {}, feedback = 'DONE') => ({
    commandId, commandType, profileId: 'profile', mode: 'normal', businessIdentity: commandId,
    result: { ok: true, data, before: { available: 70, savings: 30 }, after: { available: 70, savings: 30 },
      revision, feedback: { code: feedback, params: {}, petReaction: 'inspired' } },
  });
  assert.equal(presentation.accept(receipt('lesson', 'CompleteLesson', 2, {}, 'LESSON_REWARD_GRANTED'), normal, 2), true);
  assert.equal(presentation.accept(receipt('goal', 'ClaimGoal', 3), normal, 3), true);
  assert.equal(presentation.accept(receipt('stage', 'ClosePeriod', 4,
    { summary: { stageBefore: 2, stageAfter: 3, periodGrowth: 2 } }), normal, 4), true);
  assert.equal(presentation.next().commandId, 'goal');
  const first = presentation.next();
  assert.equal(presentation.complete(first.id).commandId, 'stage');
  const second = presentation.next();
  assert.equal(presentation.complete(second.id).commandId, 'lesson');
  const third = presentation.next();
  assert.equal(presentation.complete(third.id), null);
  assert.equal(presentation.next(), null);
  assert.equal(presentation.accept(receipt('practice', 'CompleteLesson', 5, {}, 'LESSON_TRAINING'), normal, 5), false);
});
