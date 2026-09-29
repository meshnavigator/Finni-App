import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const renderer = readFileSync(new URL('../src/ui/budget-purchase-renderers.tsx', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../src/ui/LessonShell.tsx', import.meta.url), 'utf8');
const root = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../src/content/local-lesson-catalog.ts', import.meta.url), 'utf8');

test('allocation and basket renderers expose canonical editable learning actions', () => {
  assert.match(renderer, /accessibilityLabel="Учебное распределение"/);
  assert.match(renderer, /accessibilityLabel="Учебная корзина"/);
  assert.match(renderer, /packageCountByOfferId/);
  assert.match(renderer, /statedTotal/);
  assert.match(renderer, /statedRemainder/);
  assert.match(renderer, /onRevealEvidence/);
  assert.match(renderer, /Открыть сведения/);
  assert.match(renderer, /Цена указана за всю упаковку/);
  assert.match(renderer, /minHeight: 48/);
  assert.doesNotMatch(renderer, /selectedIds|revealedIds|remainder/);
});

test('pinned content definitions route all eight demo lessons through LessonShell', () => {
  assert.match(shell, /parameters: props\.attempt\.parameters/);
  assert.match(shell, /revealedEvidenceIds/);
  assert.match(root, /runtime\.startLesson\(snapshot, presentation\.definition\)/);
  assert.match(root, /LOCAL_DEMO_LESSONS/);
  assert.match(root, /new LessonRendererRegistry\(\)/);
  assert.match(root, /\.register\('savings', SavingsLessonRenderer\)/);
  for (const lessonId of ['LS-B01', 'LS-B02', 'LS-B03', 'LS-P01', 'LS-P02', 'LS-P03', 'LS-S01', 'LS-S02']) {
    assert.match(catalog, new RegExp(lessonId));
  }
});
