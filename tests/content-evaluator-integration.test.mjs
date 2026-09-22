import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { LessonEvaluatorRegistry } from '../src/domain/lesson.ts';
import { evaluateSavings } from '../src/domain/savings-lesson.ts';
import { evaluateAllocation, evaluateBasket } from '../src/lessons/budget-purchase-lessons.ts';
import { lessonDefinitionSnapshot, loadContentBundle } from '../src/content/loader.ts';

const bundleRoot = join(process.cwd(), 'content', 'bundles', '1.2.0');
const lessonIds = ['LS-B01', 'LS-B02', 'LS-P01', 'LS-P02', 'LS-S01', 'LS-S02'];

async function bundle() {
  const manifest = JSON.parse(await readFile(join(bundleRoot, 'manifest.json'), 'utf8'));
  const documents = {};
  for (const file of manifest.files.filter((item) => item.kind === 'lesson')) {
    documents[file.path] = JSON.parse(await readFile(join(bundleRoot, file.path), 'utf8'));
  }
  return loadContentBundle(manifest, documents);
}

test('actual lesson evaluator registry matches every canonical fixture for the six runnable lessons', async () => {
  const registry = new LessonEvaluatorRegistry()
    .register('allocation', evaluateAllocation)
    .register('basket', evaluateBasket)
    .register('savings', evaluateSavings);
  const content = await bundle();
  for (const lessonId of lessonIds) {
    const lesson = content.lessons.get(lessonId);
    assert.ok(lesson, `missing ${lessonId}`);
    for (const variant of lesson.variants) {
      const definition = lessonDefinitionSnapshot(lesson, variant.id);
      assert.equal(definition.parameters.mode, lesson.mode, `${lessonId}/${variant.id} snapshot mode`);
      for (const fixture of variant.fixtures) {
        const actual = registry.evaluate(definition.mechanic, fixture.solution, definition.parameters);
        assert.equal(actual.outcome, fixture.expectedOutcome, `${lessonId}/${variant.id}: ${JSON.stringify(fixture.solution)}`);
      }
    }
  }
});
