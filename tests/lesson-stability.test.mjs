import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { LearningService } from '../src/application/learning-service.ts';
import { LessonEvaluatorRegistry } from '../src/domain/lesson.ts';
import { counter } from '../src/domain/numeric.ts';
import { LessonRepository } from '../src/persistence/lesson-repository.ts';
import { migrateDatabase } from '../src/persistence/migrations.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const directories = [];
test.after(() => {
  for (const directory of directories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const definition = Object.freeze({
  lessonId: 'stability',
  contentVersion: '1.0.0',
  variantId: 'default',
  mechanic: 'allocation',
  parameters: Object.freeze({ budget: 100 }),
  hints: Object.freeze(['Проверь сумму', 'Сравни части']),
});

function temporaryPath(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  directories.push(directory);
  return join(directory, 'state.sqlite');
}

function evaluators() {
  return new LessonEvaluatorRegistry().register(
    'allocation',
    (solution, parameters) => Object.freeze({
      outcome: solution.answer === 'ok' ? 'meets_goal' : 'needs_review',
      consequence: 'Учебный результат рассчитан.',
      explanation: 'Расчёт использует снимок параметров попытки.',
      nextStep: 'Вернись в игровой день.',
      calculation: Object.freeze({ budget: parameters.budget }),
    }),
  );
}

async function seed(database) {
  await database.execAsync(
    "INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone) " +
      "VALUES ('profile', 'Финни', 'round', 'plain', " +
      "'2026-09-22T00:00:00.000Z', 'Europe/Moscow');" +
      "INSERT INTO wallet_projection(profile_id, available, savings) " +
      "VALUES ('profile', 0, 0);" +
      "INSERT INTO profile_state(profile_id, revision) VALUES ('profile', 0);" +
      "INSERT INTO period(id, profile_id, period_index, calendar_date, " +
      "clock_generation, state, economy_version, opened_at) VALUES " +
      "('period', 'profile', 1, '2026-09-22', 0, 'ACTIVE', " +
      "'economy-v2', '2026-09-22T00:00:00.000Z');",
  );
}

function completeCommand(commandId, attemptId, revision) {
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
      periodId: 'period',
      attemptId,
      evaluationId: 'evaluation-' + attemptId,
    }),
  });
}

async function prepare(learning, attemptId, lessonDefinition = definition) {
  await learning.start({
    attemptId,
    profileId: 'profile',
    periodId: 'period',
    periodState: 'ACTIVE',
    definition: lessonDefinition,
    startedAt: '2026-09-22T10:00:00.000Z',
  });
  await learning.save(
    attemptId,
    Object.freeze({ answer: 'ok' }),
    '2026-09-22T10:01:00.000Z',
  );
  const evaluated = await learning.evaluate(
    attemptId,
    'evaluation-' + attemptId,
    '2026-09-22T10:02:00.000Z',
  );
  await learning.viewExplanation(
    attemptId,
    evaluated.evaluation.evaluationId,
    '2026-09-22T10:03:00.000Z',
  );
  return evaluated.evaluation;
}

test('eight distinct lesson definitions share one period reward quota', async () => {
  const database = new SqliteFileAdapter(temporaryPath('finni-lesson-eight-'));
  await migrateDatabase(database);
  await seed(database);
  const repository = new LessonRepository('normal', database);
  const learning = new LearningService(repository, evaluators());

  const reasons = [];
  for (let index = 0; index < 8; index += 1) {
    const attemptId = 'attempt-' + index;
    await prepare(learning, attemptId, Object.freeze({
      ...definition,
      lessonId: 'lesson-' + index,
      variantId: index % 2 === 0 ? 'default' : 'alternative',
    }));
    const receipt = await learning.complete(
      completeCommand('complete-' + index, attemptId, index === 0 ? 0 : 1),
      '2026-09-22T10:04:00.000Z',
    );
    reasons.push(receipt.result.data.reward.reason);
  }

  assert.deepEqual(reasons, [
    'GRANTED',
    'ALREADY_GRANTED',
    'ALREADY_GRANTED',
    'ALREADY_GRANTED',
    'ALREADY_GRANTED',
    'ALREADY_GRANTED',
    'ALREADY_GRANTED',
    'ALREADY_GRANTED',
  ]);
  assert.deepEqual(await database.getFirstAsync(
    "SELECT (SELECT COUNT(*) FROM lesson_completion) AS completions, " +
      "(SELECT COUNT(*) FROM ledger_entry WHERE type = 'LESSON_REWARD') AS rewards, " +
      "(SELECT available FROM wallet_projection WHERE profile_id = 'profile') AS available",
  ), { completions: 8, rewards: 1, available: 20 });
  await repository.close();
});

test('draft solution, hints and pinned parameters survive restart without completion', async () => {
  const path = temporaryPath('finni-lesson-draft-');
  const initial = new SqliteFileAdapter(path);
  await migrateDatabase(initial);
  await seed(initial);
  const initialRepository = new LessonRepository('normal', initial);
  const initialLearning = new LearningService(initialRepository, evaluators());
  await initialLearning.start({
    attemptId: 'draft',
    profileId: 'profile',
    periodId: 'period',
    periodState: 'ACTIVE',
    definition,
    startedAt: '2026-09-22T10:00:00.000Z',
  });
  await initialLearning.save(
    'draft',
    Object.freeze({ answer: 'review' }),
    '2026-09-22T10:01:00.000Z',
  );
  await initialLearning.revealHint('draft', 'L1', '2026-09-22T10:02:00.000Z');
  await initialRepository.close();

  const reopenedDatabase = new SqliteFileAdapter(path);
  await migrateDatabase(reopenedDatabase);
  const reopenedRepository = new LessonRepository('normal', reopenedDatabase);
  const restored = await reopenedRepository.readAttempt('draft');
  assert.equal(restored.phase, 'draft');
  assert.deepEqual(restored.solution, { answer: 'review' });
  assert.deepEqual(restored.shownHints, ['L1']);
  assert.deepEqual(restored.parameters, { budget: 100 });
  assert.deepEqual(restored.hints, ['Проверь сумму', 'Сравни части']);
  assert.deepEqual(await reopenedDatabase.getFirstAsync(
    "SELECT (SELECT COUNT(*) FROM lesson_completion) AS completions, " +
      "(SELECT COUNT(*) FROM ledger_entry) AS ledger",
  ), { completions: 0, ledger: 0 });
  await reopenedRepository.close();
});

test('old evaluation and injected completion failure leave no partial reward state', async () => {
  const database = new SqliteFileAdapter(temporaryPath('finni-lesson-rollback-'));
  await migrateDatabase(database);
  await seed(database);
  const repository = new LessonRepository('normal', database);
  const learning = new LearningService(repository, evaluators());

  await prepare(learning, 'stale');
  await learning.save(
    'stale',
    Object.freeze({ answer: 'changed' }),
    '2026-09-22T10:03:30.000Z',
  );
  await assert.rejects(
    () => learning.complete(
      completeCommand('complete-stale', 'stale', 0),
      '2026-09-22T10:04:00.000Z',
    ),
    (error) => error?.domain?.code === 'ATTEMPT_STALE',
  );

  await prepare(learning, 'rollback');
  await database.execAsync(
    "CREATE TRIGGER reject_lesson_audit BEFORE INSERT ON audit_event " +
      "WHEN NEW.event_type = 'LESSON_COMPLETED' " +
      "BEGIN SELECT RAISE(ABORT, 'reject lesson audit'); END;",
  );
  await assert.rejects(
    () => learning.complete(
      completeCommand('complete-rollback', 'rollback', 0),
      '2026-09-22T10:04:00.000Z',
    ),
    (error) => error?.domain?.code === 'STORAGE_WRITE_FAILED',
  );
  assert.deepEqual(await database.getFirstAsync(
    "SELECT (SELECT COUNT(*) FROM lesson_completion) AS completions, " +
      "(SELECT COUNT(*) FROM ledger_entry) AS ledger, " +
      "(SELECT COUNT(*) FROM command_receipt) AS receipts, " +
      "(SELECT available FROM wallet_projection WHERE profile_id = 'profile') AS available, " +
      "(SELECT revision FROM profile_state WHERE profile_id = 'profile') AS revision",
  ), { completions: 0, ledger: 0, receipts: 0, available: 0, revision: 0 });
  assert.deepEqual(await database.getFirstAsync(
    "SELECT phase FROM lesson_attempt WHERE id = 'rollback'",
  ), { phase: 'explanation_seen' });
  await repository.close();
});
