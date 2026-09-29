import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (name) => readFileSync(new URL(`../src/ui/${name}`, import.meta.url), 'utf8');

test('shop separates browsing from buying and explains blocked choices in the visible detail', () => {
  const shop = source('ShopScreen.tsx');
  assert.match(shop, /label="Подробнее"/);
  assert.match(shop, /Купить за/);
  assert.match(shop, /Куплено сегодня/);
  assert.match(shop, /Сегодня уже выбрано/);
  assert.match(shop, /Нужно.*По желанию|По желанию.*Нужно/s);
  assert.match(shop, /Сначала подтверди план на день/);
  assert.match(shop, /await props\.onPreview\(item\.id\)/);
  assert.match(shop, /catch \{[\s\S]*Не получилось проверить покупку/);
  assert.match(shop, /Не хватает \{preview\.missing/);
  assert.match(shop, /label="В Домик"/);
});

test('lesson amount edits stay enabled while ordered saves complete', () => {
  const app = source('AppRoot.tsx');
  assert.match(app, /const saveLessonDraft =/);
  assert.match(app, /setLessonAttempt\(\(current\) => current\?\.attemptId === attemptId/);
  assert.match(app, /lessonSaveQueue\.current = lessonSaveQueue\.current\.then/);
  assert.match(app, /await lessonSaveQueue\.current/);
  assert.match(app, /onSolutionChange=\{saveLessonDraft\}/);
});

test('amount entry screens reserve scroll space when the keyboard opens', () => {
  const hook = source('use-keyboard-scroll-inset.ts');
  assert.match(hook, /keyboardDidShow/);
  assert.match(hook, /keyboardDidHide/);
  assert.match(hook, /event\.endCoordinates\.height/);
  for (const name of ['SavingsScreen.tsx', 'BudgetPlanScreen.tsx', 'LessonShell.tsx']) {
    const screen = source(name);
    assert.match(screen, /useKeyboardScrollInset\(\)/, name);
    assert.match(screen, /paddingBottom: .*keyboardInset/, name);
  }
});

test('low need acknowledgement keeps its threshold with child facing copy', () => {
  const plan = source('BudgetPlanScreen.tsx');
  assert.match(plan, /draft\.lowNeedWarning/);
  assert.match(plan, /На нужное меньше 40 монет\. Всё равно продолжить\?/);
  assert.match(plan, /acknowledgedLowNeed/);
});
