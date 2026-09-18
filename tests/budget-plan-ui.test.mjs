import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('budget plan component wires draft, confirmation and additional-income states', () => {
  const screen = readFileSync(
    new URL('../src/ui/BudgetPlanScreen.tsx', import.meta.url),
    'utf8',
  );
  const root = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');

  assert.match(screen, /ПЛАН НА ДЕНЬ/);
  assert.match(screen, /Распределено:/);
  assert.match(screen, /Осталось:/);
  assert.match(screen, /Подтвердить план/);
  assert.match(screen, /ПЛАН \/ ПОЛУЧИЛОСЬ/);
  assert.match(screen, /Первоначальный план:/);
  assert.match(screen, /Распределить новый доход/);
  assert.match(screen, /Добавить к плану/);
  assert.match(screen, /Оставить пока/);
  assert.match(screen, /minHeight: 48/g);
  assert.match(screen, /keyboardType="number-pad"/);
  assert.match(root, /runtime\.current\.confirmPlan/);
  assert.match(root, /runtime\.current\.allocateAdditionalIncome/);
  assert.match(root, /screen === 'plan'/);
});
