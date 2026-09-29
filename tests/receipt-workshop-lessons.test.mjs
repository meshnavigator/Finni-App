import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { LearningService } from '../src/application/learning-service.ts';
import { lessonDefinitionSnapshot, loadContentBundle } from '../src/content/loader.ts';
import { LessonEvaluatorRegistry } from '../src/domain/lesson.ts';
import { counter } from '../src/domain/numeric.ts';
import { evaluateReceiptAudit, evaluateResourceChoice } from '../src/lessons/receipt-workshop-lessons.ts';
import { migrateDatabase } from '../src/persistence/migrations.ts';
import { LessonRepository } from '../src/persistence/lesson-repository.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const bundleRoot = join(process.cwd(), 'content', 'bundles', '1.2.0');
const manifest = JSON.parse(readFileSync(join(bundleRoot, 'manifest.json'), 'utf8'));
const documents = Object.fromEntries(manifest.files.filter((item) => item.kind === 'lesson').map((item) => [item.path, JSON.parse(readFileSync(join(bundleRoot, item.path), 'utf8'))]));
const lessons = loadContentBundle(manifest, documents).lessons;
const registry = new LessonEvaluatorRegistry().register('receipt_audit', evaluateReceiptAudit).register('resource_choice', evaluateResourceChoice);

function definition(id, variantId) {
  const lesson = lessons.get(id);
  assert.ok(lesson);
  return lessonDefinitionSnapshot(lesson, variantId);
}

test('P03 detects either duplicate, accepts a correct receipt, and explains incorrect change', () => {
  const duplicate = definition('LS-P03', 'duplicate-line');
  for (const lineId of ['receipt-ball-a', 'receipt-ball-b']) {
    const pending = registry.evaluate(duplicate.mechanic, { flaggedLineIds: [lineId], correctedTotal: 60, expectedChange: 40 }, duplicate.parameters);
    assert.equal(pending.outcome, 'needs_review');
    assert.equal(pending.calculation.awaitingSellerResponse, true);
    const evaluation = registry.evaluate(duplicate.mechanic, { flaggedLineIds: [lineId], correctedTotal: 60, expectedChange: 40, sellerResponse: 'neutral_question' }, duplicate.parameters);
    assert.equal(evaluation.outcome, 'meets_goal');
    assert.equal(evaluation.calculation.difference, 20);
    assert.match(evaluation.explanation, /была одна лишняя строка/);
    assert.match(evaluation.nextStep, /спокойный вопрос/);
    assert.match(evaluation.nextStep, /настоящей покупки нет/);
  }
  const wrongChange = registry.evaluate(duplicate.mechanic, { flaggedLineIds: ['receipt-ball-b'], correctedTotal: 60, expectedChange: 20 }, duplicate.parameters);
  assert.equal(wrongChange.outcome, 'needs_review');
  assert.match(wrongChange.explanation, /сдачу/);
  const correct = definition('LS-P03', 'correct-receipt');
  const correctResult = registry.evaluate(correct.mechanic, { flaggedLineIds: [], correctedTotal: 60, expectedChange: 40 }, correct.parameters);
  assert.equal(correctResult.outcome, 'meets_goal');
  assert.doesNotMatch(correctResult.nextStep, /продавца/);
  assert.equal(registry.evaluate(correct.mechanic, { flaggedLineIds: ['receipt-ball'], correctedTotal: 40, expectedChange: 60 }, correct.parameters).outcome, 'needs_review');
});

test('B03 prices owned materials and common budget; handmade is not always cheaper', () => {
  const available = definition('LS-B03', 'materials-available');
  const make = registry.evaluate(available.mechanic, { checkedOwnedResourceIds: ['paper', 'pencil'], method: 'make', allocation: { need: 40, want: 10, save: 50 } }, available.parameters);
  assert.equal(make.outcome, 'meets_goal');
  assert.equal(make.calculation.makeCost, 10);
  const buy = registry.evaluate(available.mechanic, { checkedOwnedResourceIds: ['paper', 'pencil'], method: 'buy', allocation: { need: 40, want: 35, save: 25 } }, available.parameters);
  assert.equal(buy.outcome, 'valid_alternative');
  const missing = definition('LS-B03', 'materials-missing');
  const ready = registry.evaluate(missing.mechanic, { checkedOwnedResourceIds: [], method: 'buy', allocation: { need: 40, want: 35, save: 25 } }, missing.parameters);
  assert.equal(ready.outcome, 'meets_goal');
  assert.equal(ready.calculation.makeCost, 45);
  assert.equal(ready.calculation.buyCost, 35);
  assert.equal(registry.evaluate(missing.mechanic, { checkedOwnedResourceIds: [], method: 'make', allocation: { need: 40, want: 45, save: 15 } }, missing.parameters).outcome, 'needs_review');
  assert.equal(registry.evaluate(available.mechanic, { checkedOwnedResourceIds: ['paper', 'pencil'], method: 'buy', allocation: { need: 40, want: 35, save: 40 } }, available.parameters).outcome, 'invalid_input');
});

test('P03 and B03 training completions create no financial ledger entry', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'finni-s3-005-'));
  const database = new SqliteFileAdapter(join(directory, 'state.sqlite'));
  try {
    await migrateDatabase(database);
    await database.execAsync(`
      INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone)
      VALUES ('profile', 'Финни', 'round', 'plain', '2026-09-23T00:00:00.000Z', 'Europe/Moscow');
      INSERT INTO wallet_projection(profile_id, available, savings) VALUES ('profile', 100, 0);
      INSERT INTO profile_state(profile_id, revision) VALUES ('profile', 0);
      INSERT INTO period(id, profile_id, period_index, calendar_date, clock_generation, state, economy_version, opened_at)
      VALUES ('period', 'profile', 1, '2026-09-23', 0, 'DRAFT', 'economy-v2', '2026-09-23T00:00:00.000Z');
    `);
    const repository = new LessonRepository('normal', database);
    const learning = new LearningService(repository, registry);
    const cases = [
      ['receipt', definition('LS-P03', 'duplicate-line'), { flaggedLineIds: ['receipt-ball-b'], correctedTotal: 60, expectedChange: 40, sellerResponse: 'neutral_question' }],
      ['workshop', definition('LS-B03', 'materials-available'), { checkedOwnedResourceIds: ['paper', 'pencil'], method: 'make', allocation: { need: 40, want: 10, save: 50 } }],
    ];
    for (const [id, lesson, solution] of cases) {
      await learning.start({ attemptId: id, profileId: 'profile', periodId: 'period', periodState: 'DRAFT', definition: lesson, startedAt: '2026-09-23T10:00:00.000Z' });
      await learning.save(id, solution, '2026-09-23T10:01:00.000Z');
      const { evaluation } = await learning.evaluate(id, `evaluation-${id}`, '2026-09-23T10:02:00.000Z');
      assert.equal(evaluation.outcome, 'meets_goal');
      await learning.viewExplanation(id, evaluation.evaluationId, '2026-09-23T10:03:00.000Z');
      const receipt = await learning.complete({ type: 'CompleteLesson', meta: { commandId: `complete-${id}`, profileId: 'profile', mode: 'normal', expectedRevision: counter(0), sessionEpoch: counter(0) }, payload: { periodId: 'period', attemptId: id, evaluationId: evaluation.evaluationId } }, '2026-09-23T10:04:00.000Z');
      assert.equal(receipt.result.data.reward.reason, 'TRAINING');
    }
    assert.deepEqual(await database.getFirstAsync(`SELECT
      (SELECT COUNT(*) FROM lesson_completion) AS completions,
      (SELECT COUNT(*) FROM ledger_entry) AS ledger,
      (SELECT available FROM wallet_projection WHERE profile_id = 'profile') AS available
    `), { completions: 2, ledger: 0, available: 100 });
    await repository.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
