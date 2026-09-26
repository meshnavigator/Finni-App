import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { LessonRendererRegistry } from '../src/ui/lesson-renderer-registry.ts';

test('renderer registry extends mechanics without changing LessonShell navigation', () => {
  const registry = new LessonRendererRegistry();
  const renderer = () => null;
  registry.register('basket', renderer);
  assert.equal(registry.has('basket'), true);
  assert.equal(registry.resolve('basket'), renderer);
  assert.equal(registry.render('basket', {
    lessonId: 'LS-P01',
    parameters: Object.freeze({}),
    solution: Object.freeze({}),
    disabled: false,
    onChange: () => {},
  }).type, renderer);
  assert.throws(() => registry.register('basket', renderer), /already registered/);
  assert.throws(() => registry.resolve('allocation'), /No renderer registered/);
});

test('LessonShell exposes hints and the full action-to-next-step contract', () => {
  const source = readFileSync(
    new URL('../src/ui/LessonShell.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /В примере свои монеты/);
  assert.match(source, /Подсказка/);
  assert.match(source, /Показать пример/);
  assert.match(source, /rewardEligibleAtStart/);
  assert.match(source, /Это тренировочное прохождение без награды/);
  assert.match(source, /Проверить решение/);
  assert.match(source, /Что получилось/);
  assert.match(source, /Показать объяснение/);
  assert.match(source, /Почему так/);
  assert.match(source, /Следующий шаг/);
  assert.match(source, /Завершить с разбором/);
  assert.match(source, /phase !== 'completed'/);
  assert.match(source, /невалидный ввод нельзя завершить/);
  assert.match(source, /Короткая справка/);
  assert.match(source, /returnLabel/);
  assert.match(source, /onHelp/);
  assert.match(source, /minHeight: 48/);
  assert.doesNotMatch(source, /onRevealHint\([^)]*onComplete/);
});

test('needs-review result explicitly invites the child to edit and check again', () => {
  const source = readFileSync(new URL('../src/ui/LessonShell.tsx', import.meta.url), 'utf8');
  assert.match(source, /evaluation.outcome === 'needs_review'/);
  assert.match(source, /Измени ответ выше, затем снова нажми «Проверить решение»/);
});
test('P03 offers the neutral seller line only after a checked receipt discrepancy', () => {
  const source = readFileSync(new URL('../src/ui/LessonShell.tsx', import.meta.url), 'utf8');
  assert.match(source, /evaluation.calculation.awaitingSellerResponse === true/);
  assert.match(source, /Кажется, мяч указан дважды. Давайте проверим/);
  assert.match(source, /sellerResponse: 'neutral_question'/);
  assert.match(source, /\.\.\.props\.attempt\.solution, sellerResponse: 'neutral_question'/);
  assert.match(source, /awaitingSellerResponse !== true/);
});