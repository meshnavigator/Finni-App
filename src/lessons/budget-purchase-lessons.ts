import type { LessonActionResult, LessonDefinition, LessonEvaluator } from '../domain/lesson.ts';

type Item = Readonly<{ id: string; group: string; label: string; total: number; unitLabel: string; evidence?: string }>;
type AllocationParameters = Readonly<{ budget: number; requiredNeed: number; requiredSave: number }>;
type BasketParameters = Readonly<{ budget: number; requiredGroups: readonly string[]; items: readonly Item[]; evidenceIds?: readonly string[]; preferred?: string; alternative?: string }>;

export type LessonPresentation = Readonly<{ definition: LessonDefinition; title: string; intro: string }>;

const action = (outcome: LessonActionResult['outcome'], consequence: string, explanation: string, nextStep: string, calculation: Record<string, unknown>): LessonActionResult => Object.freeze({ outcome, consequence, explanation, nextStep, calculation: Object.freeze(calculation) });
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);

export const evaluateAllocation: LessonEvaluator = (solution, raw) => {
  const p = raw as AllocationParameters;
  const values = ['need', 'want', 'save'].map((key) => solution[key]);
  if (!values.every((value) => integer(value) && value >= 0)) return action('invalid_input', 'Нужны целые неотрицательные суммы.', 'У каждой карточки должна быть сумма без дробей и минуса.', 'Исправь все три суммы.', { budget: p.budget });
  const [need, want, save] = values as number[];
  const total = need + want + save;
  if (total > p.budget) return action('invalid_input', `Получилось ${total}, а есть ${p.budget}.`, `Уменьши одну или несколько сумм на ${total - p.budget}.`, 'Исправь распределение до проверки.', { need, want, save, total, budget: p.budget });
  if (need >= p.requiredNeed && save >= p.requiredSave) return action('meets_goal', 'Нужное покрыто, а на мечту осталась запланированная сумма.', `Всего распределено ${total}; остаток ${p.budget - total} можно не распределять в учебном примере.`, 'Можно завершить занятие или попробовать другой план.', { need, want, save, total, remainder: p.budget - total });
  return action('needs_review', 'План можно разобрать и изменить до начала дня.', `До нужного не хватает ${Math.max(0, p.requiredNeed - need)}, а до намеченной суммы на мечту — ${Math.max(0, p.requiredSave - save)}. Это не меняет твой настоящий день.`, 'Исправь план или заверши с разбором.', { need, want, save, total, missingNeed: Math.max(0, p.requiredNeed - need), missingSave: Math.max(0, p.requiredSave - save) });
};

export const evaluateBasket: LessonEvaluator = (solution, raw) => {
  const p = raw as BasketParameters;
  const ids = solution.selectedIds;
  const enteredRemainder = solution.remainder;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length || !integer(enteredRemainder) || enteredRemainder < 0) return action('invalid_input', 'Корзина или остаток заполнены не по правилам.', 'В корзине нельзя повторять позицию, а остаток записывают целым неотрицательным числом.', 'Исправь корзину или остаток.', { budget: p.budget });
  const items = ids.map((id) => p.items.find((item) => item.id === id));
  if (items.some((item) => !item) || new Set(items.map((item) => item!.group)).size !== items.length) return action('invalid_input', 'Выбрано два варианта одной покупки или неизвестная позиция.', 'В учебной корзине для каждой покупки выбирают один вариант.', 'Исправь структуру корзины.', { selectedIds: ids });
  const selected = items as Item[];
  const total = selected.reduce((sum, item) => sum + item.total, 0);
  if (total > p.budget) return action('invalid_input', `Корзина стоит ${total}, а в примере есть ${p.budget}.`, `Не хватает ${total - p.budget}. Можно убрать необязательную позицию или выбрать другой вариант.`, 'Измени корзину до проверки.', { total, budget: p.budget, shortage: total - p.budget });
  const groups = new Set(selected.map((item) => item.group));
  const missingGroups = p.requiredGroups.filter((group) => !groups.has(group));
  if (missingGroups.length) return action('needs_review', 'Деньги ещё есть, но список пока выполнен не полностью.', `Не выбраны: ${missingGroups.join(', ')}. Сначала сверяемся со списком, а не только с ценой.`, 'Добавь нужные позиции или заверши с разбором.', { total, remainder: p.budget - total, missingGroups });
  const revealed = Array.isArray(solution.revealedIds) ? solution.revealedIds : [];
  const hidden = (p.evidenceIds ?? []).filter((id) => !revealed.includes(id));
  if (hidden.length) return action('needs_review', 'Для сравнения пока не хватает сведений о предложениях.', 'Цена сама по себе не показывает, одинаковы ли количество и качество.', 'Открой свойства обоих вариантов и проверь корзину ещё раз.', { total, hidden });
  const remainder = p.budget - total;
  if (enteredRemainder !== remainder) return action('needs_review', 'Корзина подходит, но остаток можно пересчитать.', `${p.budget} − ${total} = ${remainder}. Учебный чек ничего не списывает с игрового баланса.`, 'Исправь остаток или заверши с разбором.', { total, enteredRemainder, remainder });
  if (p.alternative && ids.includes(p.alternative)) return action('valid_alternative', 'Список выполнен и денег хватило.', 'Этот вариант допустим. В этом условии другой набор оставил бы больше монет, но высокая цена не всегда означает плохой выбор.', 'Можно завершить занятие и сравнить итог с другим вариантом.', { total, remainder });
  return action('meets_goal', 'Список выполнен, а остаток совпадает с учебным чеком.', 'Сравнивают общую цену нужного количества и свойства товара. В этом примере деньги твоего дня не меняются.', 'Можно завершить занятие или посмотреть другой вариант.', { total, remainder, preferred: p.preferred ?? null });
};

const allocation = (lessonId: string, variantId: string, title: string, intro: string, parameters: AllocationParameters, hints: readonly [string, string]): LessonPresentation => Object.freeze({ title, intro, definition: Object.freeze({ lessonId, contentVersion: 's3-002-fixture-v1', variantId, mechanic: 'allocation', parameters: Object.freeze(parameters), hints }) });
const basket = (lessonId: string, variantId: string, title: string, intro: string, parameters: BasketParameters, hints: readonly [string, string]): LessonPresentation => Object.freeze({ title, intro, definition: Object.freeze({ lessonId, contentVersion: 's3-002-fixture-v1', variantId, mechanic: 'basket', parameters: Object.freeze(parameters), hints }) });

export const BUDGET_PURCHASE_LESSONS = Object.freeze({
  'LS-B01': allocation('LS-B01', 'basic-100', 'На что хватит сегодня?', 'У нас 100 учебных монет. На еду и уход нужно 40. Оставь хотя бы 30 на мечту.', { budget: 100, requiredNeed: 40, requiredSave: 30 }, ['На еду и уход нужно не меньше 40.', 'Сравни суммы на нужное и на мечту с двумя условиями.']),
  'LS-B02': allocation('LS-B02', 'changed-need-100', 'План можно изменить заранее', 'На нужное теперь потребуется 60 вместо 40. Оставь 20 на мечту и измени учебный черновик.', { budget: 100, requiredNeed: 60, requiredSave: 20 }, ['Новое нужное больше старого на 20.', 'Проверь: нужное 60 и мечта 20 — обе суммы важны.']),
  'LS-P01': basket('LS-P01', 'shopping-list-60', 'Дело о списке покупок', 'На учебную покупку есть 60. В списке еда и уход; развлечение можно добавить, если хватит.', { budget: 60, requiredGroups: ['еда', 'уход'], items: [{ id: 'food-30', group: 'еда', label: 'Еда: маленькая пачка', total: 30, unitLabel: '30 за пачку' }, { id: 'food-40', group: 'еда', label: 'Еда: большая пачка', total: 40, unitLabel: '40 за пачку' }, { id: 'care-10', group: 'уход', label: 'Уход: щётка', total: 10, unitLabel: '10 за штуку' }, { id: 'care-15', group: 'уход', label: 'Уход: набор ухода', total: 15, unitLabel: '15 за набор' }, { id: 'fun-20', group: 'развлечение', label: 'Развлечение: мяч', total: 20, unitLabel: '20 за штуку' }] }, ['В списке сначала еда и уход.', 'Сложи цены выбранных позиций и вычти их из 60.']),
  'LS-P02': basket('LS-P02', 'equal-goods', 'Дело о двух предложениях', 'На пример есть 50 монет. Нужны еда и уход: раскрой сведения о двух упаковках и сравни их.', { budget: 50, requiredGroups: ['еда', 'уход'], evidenceIds: ['food-30', 'food-40'], preferred: 'food-30', alternative: 'food-40', items: [{ id: 'food-30', group: 'еда', label: 'Еда: предложение А', total: 30, unitLabel: '30 за упаковку', evidence: 'Количество 1 упаковка, качество одинаковое.' }, { id: 'food-40', group: 'еда', label: 'Еда: предложение Б', total: 40, unitLabel: '40 за упаковку', evidence: 'Количество 1 упаковка, качество одинаковое.' }, { id: 'care-10', group: 'уход', label: 'Уход: щётка', total: 10, unitLabel: '10 за штуку' }] }, ['Открой сведения об обеих упаковках.', 'Когда количество и качество одинаковы, сравни общую цену набора.']),
  'LS-P02-quantity-two': basket('LS-P02', 'quantity-two', 'Дело о количестве: два карандаша', 'Нужны 2 карандаша. Сравним общую цену нужного количества, а не цену одной упаковки.', { budget: 50, requiredGroups: ['карандаши'], preferred: 'single-two', alternative: 'pack-three', items: [{ id: 'single-two', group: 'карандаши', label: 'Два отдельных карандаша', total: 20, unitLabel: '10 за карандаш, всего 20', evidence: 'Нужно 2, куплено 2.' }, { id: 'pack-three', group: 'карандаши', label: 'Набор из трёх карандашей', total: 25, unitLabel: '25 за набор из 3', evidence: 'Нужно 2, в наборе 3: один лишний.' }] }, ['Сколько карандашей нужно сейчас?', 'Сравни общую цену и соответствие нужному количеству.']),
  'LS-P02-quantity-three': basket('LS-P02', 'quantity-three', 'Дело о количестве: три карандаша', 'Теперь нужны 3 карандаша. Условие изменилось — проверь полезный выбор.', { budget: 50, requiredGroups: ['карандаши'], preferred: 'pack-three', alternative: 'single-three', items: [{ id: 'single-three', group: 'карандаши', label: 'Три отдельных карандаша', total: 30, unitLabel: '10 за карандаш, всего 30', evidence: 'Нужно 3, куплено 3.' }, { id: 'pack-three', group: 'карандаши', label: 'Набор из трёх карандашей', total: 25, unitLabel: '25 за набор из 3', evidence: 'Нужно 3, в наборе 3.' }] }, ['Условие теперь — три карандаша.', 'Сравни общую цену именно трёх нужных карандашей.']),
});
