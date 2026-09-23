import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { LearningService } from '../src/application/learning-service.ts';
import { counter } from '../src/domain/numeric.ts';
import { LessonEvaluatorRegistry } from '../src/domain/lesson.ts';
import { LessonRepository } from '../src/persistence/lesson-repository.ts';
import { migrateDatabase } from '../src/persistence/migrations.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const directories = [];
test.after(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
});

const definition = Object.freeze({
  lessonId: 'engine-test',
  contentVersion: '1.0.0-test',
  variantId: 'default',
  mechanic: 'allocation',
  parameters: Object.freeze({}),
  hints: Object.freeze(['Проверь условие', 'Сравни числа']),
});

function evaluators() {
  return new LessonEvaluatorRegistry().register('allocation', (solution) => {
    const outcome = solution.answer === 'ok'
      ? 'meets_goal'
      : solution.answer === 'review'
        ? 'needs_review'
        : 'invalid_input';
    return Object.freeze({
      outcome,
      consequence: 'Учебный баланс пересчитан.',
      explanation: 'Это расчёт только внутри занятия.',
      nextStep: 'Вернись к своему дню и реши отдельно.',
      calculation: Object.freeze({ answer: solution.answer ?? null }),
    });
  });
}

function temporaryPath(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  directories.push(directory);
  return join(directory, 'state.sqlite');
}

async function seed(database, state = 'ACTIVE') {
  await database.execAsync(`
    INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
    VALUES ('profile', 'Финни', 'round', 'plain',
      '2026-09-22T00:00:00.000Z', 'Europe/Moscow');
    INSERT INTO wallet_projection(profile_id, available, savings)
    VALUES ('profile', 0, 0);
    INSERT INTO profile_state(profile_id, revision)
    VALUES ('profile', 0);
    INSERT INTO period(
      id, profile_id, period_index, calendar_date, clock_generation, state,
      economy_version, opened_at
    ) VALUES (
      'period', 'profile', 1, '2026-09-22', 0, '${state}',
      'economy-v2', '2026-09-22T00:00:00.000Z'
    );
  `);
}

function service(repository) {
  return new LearningService(repository, evaluators());
}

async function prepare(
  learning,
  attemptId,
  periodState = 'ACTIVE',
  periodId = 'period',
  answer = 'ok',
) {
  await learning.start({
    attemptId,
    profileId: 'profile',
    periodId,
    periodState,
    definition,
    startedAt: `2026-09-22T10:00:${attemptId.length}.000Z`,
  });
  await learning.save(
    attemptId,
    Object.freeze({ answer }),
    '2026-09-22T10:01:00.000Z',
  );
  const evaluated = await learning.evaluate(
    attemptId,
    `evaluation-${attemptId}`,
    '2026-09-22T10:02:00.000Z',
  );
  await learning.viewExplanation(
    attemptId,
    evaluated.evaluation.evaluationId,
    '2026-09-22T10:03:00.000Z',
  );
  return evaluated.evaluation;
}

function completeCommand(commandId, attemptId, revision = 0, periodId = 'period') {
  return Object.freeze({
    type: 'CompleteLesson',
    meta: Object.freeze({
      commandId,
      profileId: 'profile',
      mode: 'normal',
      expectedRevision: counter(revision),
      sessionEpoch: counter(0),
    }),
    payload: Object.freeze({
      periodId,
      attemptId,
      evaluationId: `evaluation-${attemptId}`,
    }),
  });
}

test('restart preserves current evaluation/explanation and replay returns one completion/reward', async () => {
  const path = temporaryPath('finni-lesson-restart-');
  const initial = new SqliteFileAdapter(path);
  await migrateDatabase(initial);
  await seed(initial);
  const firstRepository = new LessonRepository('normal', initial);
  const first = service(firstRepository);
  await prepare(first, 'restart');
  await firstRepository.close();

  const reopenedDatabase = new SqliteFileAdapter(path);
  await migrateDatabase(reopenedDatabase);
  const reopenedRepository = new LessonRepository('normal', reopenedDatabase);
  const reopened = service(reopenedRepository);
  const restored = await reopened.read('restart');
  assert.equal(restored.phase, 'explanation_seen');
  assert.equal(restored.currentEvaluationId, 'evaluation-restart');
  assert.equal(restored.explanationEvaluationId, 'evaluation-restart');
  assert.deepEqual(restored.parameters, definition.parameters);
  assert.deepEqual(restored.hints, definition.hints);

  const command = completeCommand('complete-restart', 'restart');
  const receipt = await reopened.complete(command, '2026-09-22T10:04:00.000Z');
  assert.equal(receipt.result.ok, true);
  assert.equal(receipt.result.data.reward.reason, 'GRANTED');
  const replay = await reopened.complete(
    Object.freeze({
      ...command,
      meta: Object.freeze({ ...command.meta, expectedRevision: counter(999) }),
    }),
    '2026-09-22T11:00:00.000Z',
  );
  assert.deepEqual(replay, receipt);
  assert.deepEqual(await reopenedDatabase.getFirstAsync(`SELECT
    (SELECT COUNT(*) FROM lesson_completion) AS completions,
    (SELECT COUNT(*) FROM ledger_entry WHERE type = 'LESSON_REWARD') AS rewards,
    (SELECT available FROM wallet_projection WHERE profile_id = 'profile') AS available
  `), { completions: 1, rewards: 1, available: 20 });
  await reopenedRepository.close();
});

test('concurrent completions persist both outcomes but grant exactly one reward', async () => {
  const path = temporaryPath('finni-lesson-concurrent-');
  const database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  await seed(database);
  const repository = new LessonRepository('normal', database);
  const learning = service(repository);
  await prepare(learning, 'first');
  await prepare(learning, 'second');

  const receipts = await Promise.all([
    learning.complete(
      completeCommand('complete-first', 'first'),
      '2026-09-22T10:04:00.000Z',
    ),
    learning.complete(
      completeCommand('complete-second', 'second'),
      '2026-09-22T10:04:00.000Z',
    ),
  ]);
  assert.deepEqual(
    receipts.map((receipt) => receipt.result.data.reward.reason),
    ['GRANTED', 'ALREADY_GRANTED'],
  );
  assert.deepEqual(await database.getFirstAsync(`SELECT
    (SELECT COUNT(*) FROM lesson_completion) AS completions,
    (SELECT COUNT(*) FROM ledger_entry WHERE type = 'LESSON_REWARD') AS rewards,
    (SELECT available FROM wallet_projection WHERE profile_id = 'profile') AS available,
    (SELECT revision FROM profile_state WHERE profile_id = 'profile') AS revision
  `), { completions: 2, rewards: 1, available: 20, revision: 1 });
  await repository.close();
});

test('draft-start remains training after activation and active-start gets no reward after close', async () => {
  const trainingPath = temporaryPath('finni-lesson-training-');
  const trainingDatabase = new SqliteFileAdapter(trainingPath);
  await migrateDatabase(trainingDatabase);
  await seed(trainingDatabase, 'DRAFT');
  const trainingRepository = new LessonRepository('normal', trainingDatabase);
  const training = service(trainingRepository);
  await prepare(training, 'training', 'DRAFT');
  await trainingDatabase.runAsync("UPDATE period SET state = 'ACTIVE' WHERE id = 'period'");
  const trainingReceipt = await training.complete(
    completeCommand('complete-training', 'training'),
    '2026-09-22T10:04:00.000Z',
  );
  assert.equal(trainingReceipt.result.data.reward.reason, 'TRAINING');
  assert.equal(trainingReceipt.result.data.reward.amount, 0);
  assert.equal(
    (await trainingDatabase.getFirstAsync('SELECT COUNT(*) AS count FROM ledger_entry')).count,
    0,
  );
  await trainingRepository.close();

  const closedPath = temporaryPath('finni-lesson-closed-');
  const closedDatabase = new SqliteFileAdapter(closedPath);
  await migrateDatabase(closedDatabase);
  await seed(closedDatabase);
  const closedRepository = new LessonRepository('normal', closedDatabase);
  const closed = service(closedRepository);
  await prepare(closed, 'closed');
  await closedDatabase.runAsync(
    "UPDATE period SET state = 'CLOSED', closed_at = '2026-09-22T10:03:30.000Z' WHERE id = 'period'",
  );
  const closedReceipt = await closed.complete(
    completeCommand('complete-closed', 'closed'),
    '2026-09-22T10:04:00.000Z',
  );
  assert.equal(closedReceipt.result.data.reward.reason, 'PERIOD_NOT_ACTIVE');
  assert.equal(closedReceipt.result.data.reward.amount, 0);
  assert.equal(
    (await closedDatabase.getFirstAsync('SELECT COUNT(*) AS count FROM ledger_entry')).count,
    0,
  );
  await closedRepository.close();
});

test('waiting attempts are persisted as training and reviewed outcomes are explicit', async () => {
  const path = temporaryPath('finni-lesson-waiting-');
  const database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  await seed(database);
  const repository = new LessonRepository('normal', database);
  const learning = service(repository);
  await prepare(learning, 'waiting', 'WAITING', null, 'review');
  const receipt = await learning.complete(
    completeCommand('complete-waiting', 'waiting', 0, null),
    '2026-09-22T10:04:00.000Z',
  );
  assert.equal(receipt.result.data.completionKind, 'reviewed');
  assert.equal(receipt.result.data.reward.reason, 'TRAINING');
  assert.deepEqual(await database.getFirstAsync(
    'SELECT completion_kind, outcome, reward_granted FROM lesson_completion',
  ), { completion_kind: 'reviewed', outcome: 'needs_review', reward_granted: 0 });
  await repository.close();
});

test('invalid input and stale evaluation cannot create completion or reward', async () => {
  const path = temporaryPath('finni-lesson-invalid-');
  const database = new SqliteFileAdapter(path);
  await migrateDatabase(database);
  await seed(database);
  const repository = new LessonRepository('normal', database);
  const learning = service(repository);
  await prepare(learning, 'invalid', 'ACTIVE', 'period', 'invalid');
  await assert.rejects(
    () => learning.complete(
      completeCommand('complete-invalid', 'invalid'),
      '2026-09-22T10:04:00.000Z',
    ),
    (error) => error?.domain?.code === 'INVALID_LESSON_OUTCOME',
  );
  assert.deepEqual(await database.getFirstAsync(`SELECT
    (SELECT COUNT(*) FROM lesson_completion) AS completions,
    (SELECT COUNT(*) FROM ledger_entry) AS ledger,
    (SELECT COUNT(*) FROM command_receipt) AS receipts
  `), { completions: 0, ledger: 0, receipts: 0 });
  await repository.close();
});
