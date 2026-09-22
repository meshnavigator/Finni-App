import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const renderer = readFileSync(new URL('../src/ui/budget-purchase-renderers.tsx', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../src/ui/LessonShell.tsx', import.meta.url), 'utf8');
const root = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');

test('allocation and basket renderers expose editable, accessible learning actions', () => {
  assert.match(renderer, /accessibilityLabel="Учебное распределение"/);
  assert.match(renderer, /accessibilityLabel="Учебная корзина"/);
  assert.match(renderer, /accessibilityRole="checkbox"/);
  assert.match(renderer, /Открыть сведения/);
  assert.match(renderer, /Цена указана за всю позицию/);
  assert.match(renderer, /minHeight: 48/);
});

test('pinned parameters reach the renderer and the first route runs through AppRuntime', () => {
  assert.match(shell, /parameters: props\.attempt\.parameters/);
  assert.match(root, /runtime\.startLesson\(snapshot, presentation\.definition\)/);
  assert.match(root, /runtime\.completeLesson\(snapshot, lessonAttempt\.attemptId/);
  assert.match(root, /BUDGET_PURCHASE_LESSONS\['LS-P02'\]/);
  assert.match(root, /new LessonRendererRegistry\(\)/);
});
