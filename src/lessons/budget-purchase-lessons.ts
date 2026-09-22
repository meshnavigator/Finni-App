import type { LessonActionResult, LessonEvaluator } from '../domain/lesson.ts';

type AllocationParameters = Readonly<{
  budget: number;
  needMinimum: number;
  savingTarget: number;
}>;

type BasketOffer = Readonly<{
  id: string;
  kind: string;
  packSize: number;
  packPrice: number;
  maxPackages: number;
  alternativeGroup?: string;
}>;

type BasketParameters = Readonly<{
  budget: number;
  requiredUnits: Readonly<Record<string, number>>;
  offers: readonly BasketOffer[];
  preferLowerCostForEqualCoverage: boolean;
}>;

const integer = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value);

const action = (
  outcome: LessonActionResult['outcome'],
  consequence: string,
  explanation: string,
  nextStep: string,
  calculation: Readonly<Record<string, unknown>>,
): LessonActionResult => Object.freeze({
  outcome,
  consequence,
  explanation,
  nextStep,
  calculation: Object.freeze(calculation),
});

function allocationParameters(raw: Readonly<Record<string, unknown>>): AllocationParameters | null {
  const { budget, needMinimum, savingTarget } = raw;
  return integer(budget) && budget >= 0 &&
    integer(needMinimum) && needMinimum >= 0 &&
    integer(savingTarget) && savingTarget >= 0
    ? { budget, needMinimum, savingTarget }
    : null;
}

function basketParameters(raw: Readonly<Record<string, unknown>>): BasketParameters | null {
  const { budget, requiredUnits, offers, preferLowerCostForEqualCoverage } = raw;
  if (!integer(budget) || budget < 0 || typeof preferLowerCostForEqualCoverage !== 'boolean' ||
    typeof requiredUnits !== 'object' || requiredUnits === null || Array.isArray(requiredUnits) ||
    !Array.isArray(offers)) return null;
  if (!Object.values(requiredUnits).every((value) => integer(value) && value >= 0)) return null;
  const parsedOffers: BasketOffer[] = [];
  for (const rawOffer of offers) {
    if (typeof rawOffer !== 'object' || rawOffer === null || Array.isArray(rawOffer)) return null;
    const offer = rawOffer as Record<string, unknown>;
    if (typeof offer.id !== 'string' || typeof offer.kind !== 'string' ||
      !integer(offer.packSize) || offer.packSize < 1 ||
      !integer(offer.packPrice) || offer.packPrice < 0 ||
      !integer(offer.maxPackages) || offer.maxPackages < 1 ||
      (offer.alternativeGroup !== undefined && typeof offer.alternativeGroup !== 'string')) return null;
    parsedOffers.push({
      id: offer.id,
      kind: offer.kind,
      packSize: offer.packSize,
      packPrice: offer.packPrice,
      maxPackages: offer.maxPackages,
      alternativeGroup: offer.alternativeGroup,
    });
  }
  if (new Set(parsedOffers.map((offer) => offer.id)).size !== parsedOffers.length) return null;
  return {
    budget,
    requiredUnits: requiredUnits as Readonly<Record<string, number>>,
    offers: parsedOffers,
    preferLowerCostForEqualCoverage,
  };
}

function basketMinimum(parameters: BasketParameters): number {
  let best = Number.POSITIVE_INFINITY;
  const walk = (index: number, counts: readonly number[], total: number): void => {
    if (index === parameters.offers.length) {
      const groups = new Set<string>();
      const units: Record<string, number> = {};
      for (let offset = 0; offset < parameters.offers.length; offset += 1) {
        const offer = parameters.offers[offset];
        const count = counts[offset];
        if (count > 0 && offer.alternativeGroup) {
          if (groups.has(offer.alternativeGroup)) return;
          groups.add(offer.alternativeGroup);
        }
        units[offer.kind] = (units[offer.kind] ?? 0) + count * offer.packSize;
      }
      if (Object.entries(parameters.requiredUnits).every(([kind, required]) => (units[kind] ?? 0) >= required)) {
        best = Math.min(best, total);
      }
      return;
    }
    const offer = parameters.offers[index];
    for (let count = 0; count <= offer.maxPackages; count += 1) {
      walk(index + 1, [...counts, count], total + count * offer.packPrice);
    }
  };
  walk(0, [], 0);
  return best;
}

export const evaluateAllocation: LessonEvaluator = (solution, rawParameters) => {
  const parameters = allocationParameters(rawParameters);
  const values = ['need', 'want', 'save'].map((key) => solution[key]);
  if (!parameters || !values.every((value) => integer(value) && value >= 0)) {
    return action('invalid_input', 'Нужны целые неотрицательные суммы.', 'У каждой карточки должна быть сумма без дробей и минуса.', 'Исправь все три суммы.', {});
  }
  const [need, want, save] = values as number[];
  const total = need + want + save;
  if (!Number.isSafeInteger(total) || total > parameters.budget) {
    return action('invalid_input', `Получилось ${total}, а есть ${parameters.budget}.`, 'Сумма трёх частей не должна быть больше учебного бюджета.', 'Исправь распределение до проверки.', { need, want, save, total, budget: parameters.budget });
  }
  if (need >= parameters.needMinimum && save >= parameters.savingTarget) {
    return action('meets_goal', 'Нужное покрыто, а на мечту запланирована сумма.', `Всего распределено ${total}; остаток ${parameters.budget - total} можно не распределять в учебном примере.`, 'Можно завершить занятие или попробовать другой план.', { need, want, save, total, remainder: parameters.budget - total });
  }
  return action('needs_review', 'План можно разобрать и изменить до начала дня.', `До нужного не хватает ${Math.max(0, parameters.needMinimum - need)}, а до намеченной суммы на мечту — ${Math.max(0, parameters.savingTarget - save)}. Это не меняет твой настоящий день.`, 'Исправь план или заверши с разбором.', { need, want, save, total, missingNeed: Math.max(0, parameters.needMinimum - need), missingSave: Math.max(0, parameters.savingTarget - save) });
};

export const evaluateBasket: LessonEvaluator = (solution, rawParameters) => {
  const parameters = basketParameters(rawParameters);
  const counts = solution.packageCountByOfferId;
  const statedTotal = solution.statedTotal;
  const statedRemainder = solution.statedRemainder;
  if (!parameters || typeof counts !== 'object' || counts === null || Array.isArray(counts) ||
    !integer(statedTotal) || statedTotal < 0 || !integer(statedRemainder) || statedRemainder < 0 ||
    !Object.values(counts).every((count) => integer(count) && count >= 0)) {
    return action('invalid_input', 'Корзина или учебный чек заполнены не по правилам.', 'Количество упаковок, итог и остаток записывают целыми неотрицательными числами.', 'Исправь корзину или расчёт.', {});
  }
  const selected = counts as Readonly<Record<string, number>>;
  const knownIds = new Set(parameters.offers.map((offer) => offer.id));
  if (Object.keys(selected).some((offerId) => !knownIds.has(offerId))) {
    return action('invalid_input', 'В корзине есть неизвестное предложение.', 'Выбери предложения из учебного списка.', 'Исправь корзину.', {});
  }
  const groups = new Set<string>();
  const units: Record<string, number> = {};
  let total = 0;
  for (const offer of parameters.offers) {
    const count = selected[offer.id] ?? 0;
    if (count > offer.maxPackages) {
      return action('invalid_input', 'Выбрано слишком много одинаковых упаковок.', 'Проверь доступное число упаковок.', 'Исправь количество упаковок.', { offerId: offer.id, maxPackages: offer.maxPackages });
    }
    if (count > 0 && offer.alternativeGroup) {
      if (groups.has(offer.alternativeGroup)) {
        return action('invalid_input', 'Выбраны одновременно два взаимоисключающих предложения.', 'Для одной покупки выбирают один вариант.', 'Исправь корзину.', {});
      }
      groups.add(offer.alternativeGroup);
    }
    total += count * offer.packPrice;
    units[offer.kind] = (units[offer.kind] ?? 0) + count * offer.packSize;
  }
  if (!Number.isSafeInteger(total) || total > parameters.budget) {
    return action('invalid_input', `Корзина стоит ${total}, а в примере есть ${parameters.budget}.`, 'Учебная корзина не может быть дороже её бюджета.', 'Измени корзину до проверки.', { total, budget: parameters.budget });
  }
  const covered = Object.entries(parameters.requiredUnits)
    .every(([kind, required]) => (units[kind] ?? 0) >= required);
  const arithmeticCorrect = statedTotal === total && statedRemainder === parameters.budget - total;
  if (!covered || !arithmeticCorrect) {
    return action('needs_review', 'Проверь список и учебный чек.', `В корзине на ${total}; остаток должен быть ${parameters.budget - total}. Учебный пример не списывает монеты твоего дня.`, 'Сверь количество нужных товаров и пересчитай итог.', { total, remainder: parameters.budget - total, covered, arithmeticCorrect });
  }
  const minimum = basketMinimum(parameters);
  const extraUnits = Object.entries(units)
    .map(([kind, count]) => Math.max(0, count - (parameters.requiredUnits[kind] ?? 0)))
    .reduce((sum, count) => sum + count, 0);
  if (parameters.preferLowerCostForEqualCoverage && total > minimum) {
    return action('valid_alternative', 'Список выполнен и денег хватило.', 'Этот вариант допустим. При одинаковом покрытии можно сравнить общую цену и выбрать более экономный набор.', 'Можно завершить занятие и сравнить итог с другим вариантом.', { total, remainder: parameters.budget - total, extraUnits, minimum });
  }
  return action('meets_goal', 'Список выполнен, а остаток совпадает с учебным чеком.', 'Сравнивают общую цену нужного количества и свойства товара. В этом примере деньги твоего дня не меняются.', 'Можно завершить занятие или посмотреть другой вариант.', { total, remainder: parameters.budget - total, extraUnits, minimum });
};
