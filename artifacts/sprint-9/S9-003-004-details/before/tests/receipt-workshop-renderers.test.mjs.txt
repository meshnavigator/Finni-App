import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/ui/receipt-workshop-renderers.tsx', import.meta.url), 'utf8');
const root = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../src/content/local-lesson-catalog.ts', import.meta.url), 'utf8');

test('P03 renderer offers independent basket, selectable receipt lines and editable total/change', () => {
  assert.match(source, /accessibilityLabel="Проверка учебного чека"/);
  assert.match(source, /basket\.map/);
  assert.match(source, /receipt\.map/);
  assert.match(source, /flaggedLineIds/);
  assert.match(source, /Верный чек оставь без отметок/);
  assert.match(source, /Исправленный итог/);
  assert.match(source, /Ожидаемая сдача/);
});

test('B03 renderer presents both costs, owned materials and common plan without commerce commands', () => {
  assert.match(source, /accessibilityLabel="Учебная мастерская"/);
  assert.match(source, /checkedOwnedResourceIds/);
  assert.match(source, /Сделать/);
  assert.match(source, /Купить готовый/);
  assert.match(source, /Что получится по плану/);
  assert.match(source, /minHeight: 48/);
  assert.doesNotMatch(source, /ConfirmPurchase|DepositSavings|executeMoneyCommand/);
  assert.match(root, /\.register\('receipt_audit', ReceiptAuditRenderer\)/);
  assert.match(root, /\.register\('resource_choice', ResourceChoiceRenderer\)/);
  assert.match(catalog, /'LS-B03'/);
  assert.match(catalog, /'LS-P03'/);
});
