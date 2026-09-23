import type { LessonActionResult, LessonEvaluator } from '../domain/lesson.ts';

const integer = (value: unknown): value is number => Number.isSafeInteger(value) && typeof value === 'number' && value >= 0;
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function result(outcome: LessonActionResult['outcome'], consequence: string, explanation: string, nextStep: string, calculation: Record<string, unknown>): LessonActionResult {
  return { outcome, consequence, explanation, nextStep, calculation };
}

type Line = Readonly<{ id: string; itemId: string; quantity: number; unitPrice: number }>;
function lines(value: unknown): Line[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const parsed = value.filter((item): item is Line => record(item) && typeof item.id === 'string' && typeof item.itemId === 'string' && integer(item.quantity) && item.quantity > 0 && integer(item.unitPrice));
  return parsed.length === value.length && new Set(parsed.map((line) => line.id)).size === parsed.length ? parsed : null;
}

const lineKey = (line: Line): string => `${line.itemId}|${line.quantity}|${line.unitPrice}`;
const sameLines = (left: readonly Line[], right: readonly Line[]): boolean =>
  left.map(lineKey).sort().join('\n') === right.map(lineKey).sort().join('\n');

export const evaluateReceiptAudit: LessonEvaluator = (solution, raw) => {
  const basket = lines(raw.originalBasket);
  const receipt = lines(raw.receiptLines);
  const flagged = solution.flaggedLineIds;
  if (!basket || !receipt || !integer(raw.tendered) || !integer(raw.reportedTotal) || !integer(raw.reportedChange) ||
    !Array.isArray(flagged) || !flagged.every((id) => typeof id === 'string') ||
    new Set(flagged).size !== flagged.length || !integer(solution.correctedTotal) || !integer(solution.expectedChange) ||
    flagged.some((id) => !receipt.some((line) => line.id === id))) {
    return result('invalid_input', 'Проверь отмеченные строки и суммы.', 'Отмечать можно только строки учебного чека, а суммы записывают целыми неотрицательными числами.', 'Исправь проверку чека.', {});
  }
  const retained = receipt.filter((line) => !flagged.includes(line.id));
  const total = basket.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  if (!Number.isSafeInteger(total) || total > raw.tendered) {
    return result('invalid_input', 'Данные чека нельзя пересчитать.', 'Учебная сумма должна укладываться в переданную сумму.', 'Вернись к проверке.', {});
  }
  const change = raw.tendered - total;
  const calculation = { total, change, difference: raw.reportedTotal - total, flaggedLineIds: flagged };
  if (!sameLines(basket, retained)) {
    return result('needs_review', 'Строки корзины и чека пока не совпадают.', 'Сверь каждую вещь и её количество. Если строка повторяется, убери только один лишний повтор; в правильном чеке ничего убирать не нужно.', 'Сравни строки ещё раз и пересчитай итог.', calculation);
  }
  if (solution.correctedTotal !== total || solution.expectedChange !== change) {
    return result('needs_review', `Покупка стоит ${total}, сдача из ${raw.tendered} — ${change}.`, 'После сравнения строк пересчитай итог и сдачу отдельно.', 'Исправь расчёт или заверши с разбором.', calculation);
  }
  return result('meets_goal', flagged.length === 0 ? 'Все строки совпали.' : 'Лишний повтор найден.', `В корзине вещи на ${total}. Из ${raw.tendered} сдача ${change}. ${flagged.length === 0 ? 'Этот чек был верным.' : `В чеке было лишних строк: ${flagged.length}; расхождение ${raw.reportedTotal - total}.`}`, 'Можно завершить проверку или сравнить другой чек.', calculation);
};

type Resource = Readonly<{ id: string; title: string; packPrice: number }>;
function resources(value: unknown): Resource[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const parsed = value.filter((item): item is Resource => record(item) && typeof item.id === 'string' && typeof item.title === 'string' && integer(item.packPrice));
  return parsed.length === value.length && new Set(parsed.map((item) => item.id)).size === parsed.length ? parsed : null;
}

export const evaluateResourceChoice: LessonEvaluator = (solution, raw) => {
  const required = resources(raw.requiredResources);
  const checked = solution.checkedOwnedResourceIds;
  const owned = raw.ownedResourceIds;
  const allocation = solution.allocation;
  if (!required || !integer(raw.budget) || !integer(raw.needMinimum) || !integer(raw.savingTarget) || !integer(raw.readyPrice) ||
    !Array.isArray(owned) || !owned.every((id) => typeof id === 'string' && required.some((item) => item.id === id)) || new Set(owned).size !== owned.length ||
    !Array.isArray(checked) || !checked.every((id) => typeof id === 'string' && required.some((item) => item.id === id)) || new Set(checked).size !== checked.length ||
    (solution.method !== 'make' && solution.method !== 'buy') || !record(allocation) ||
    !integer(allocation.need) || !integer(allocation.want) || !integer(allocation.save)) {
    return result('invalid_input', 'Проверь материалы, способ и план.', 'Для плана нужны известные материалы и целые неотрицательные суммы.', 'Исправь учебный план.', {});
  }
  const total = allocation.need + allocation.want + allocation.save;
  if (!Number.isSafeInteger(total) || total > raw.budget) {
    return result('invalid_input', `Распределено ${total}, доступно ${raw.budget}.`, 'Общий план не может превышать учебный бюджет.', 'Уменьши одну из сумм.', { total, budget: raw.budget });
  }
  const actualOwned = new Set(owned);
  const missing = required.filter((item) => !actualOwned.has(item.id));
  const makeCost = missing.reduce((sum, item) => sum + item.packPrice, 0);
  const methodCost = solution.method === 'make' ? makeCost : raw.readyPrice;
  const calculation = { total, remainder: raw.budget - total, makeCost, buyCost: raw.readyPrice, methodCost, missingResourceIds: missing.map((item) => item.id), save: allocation.save };
  if (checked.length !== owned.length || checked.some((id) => !actualOwned.has(id))) {
    return result('needs_review', 'Список уже имеющегося заполнен неточно.', `В учебной коробке есть: ${required.filter((item) => actualOwned.has(item.id)).map((item) => item.title).join(', ') || 'ничего из списка'}.`, 'Сверь коробку и материалы.', calculation);
  }
  if (allocation.need < raw.needMinimum || allocation.want < methodCost || allocation.save < raw.savingTarget) {
    return result('needs_review', 'Способ пока не выполняет все условия плана.', `На нужное требуется ${raw.needMinimum}; выбранный способ стоит ${methodCost}, а на мечту нужно отложить хотя бы ${raw.savingTarget}. Для изготовления недостающие материалы стоят ${makeCost}, готовый вариант — ${raw.readyPrice}.`, 'Измени план или посмотри другой способ.', calculation);
  }
  const alternative = solution.method === 'buy' ? raw.readyPrice > makeCost : makeCost > raw.readyPrice;
  return result(alternative ? 'valid_alternative' : 'meets_goal', `${solution.method === 'make' ? 'Изготовление' : 'Готовый вариант'} выполнимо по плану.`, `На выбранный способ предусмотрено ${allocation.want} при стоимости ${methodCost}; на мечту — ${allocation.save}. Изготовление с учётом имеющихся материалов стоит ${makeCost}, готовый вариант — ${raw.readyPrice}. Оба способа зависят от того, что уже есть.`, 'Можно завершить занятие или сравнить другой способ.', calculation);
};
