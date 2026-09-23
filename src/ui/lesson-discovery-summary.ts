import type { LessonDiscovery } from '../persistence/lesson-repository.ts';

function whole(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function allocation(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const values = value as Record<string, unknown>;
  return whole(values.need) && whole(values.want) && whole(values.save)
    ? `Нужно ${values.need}, хочется ${values.want}, на мечту ${values.save}.`
    : null;
}

export function discoveryAction(discovery: LessonDiscovery): string {
  const { mechanic, solution } = discovery.attempt;
  if (mechanic === 'allocation') {
    return allocation(solution) ?? 'Мы разобрали учебный план.';
  }
  if (mechanic === 'basket') {
    const counts = solution.packageCountByOfferId;
    const selected = counts && typeof counts === 'object' && !Array.isArray(counts)
      ? Object.values(counts).filter(whole).reduce((sum, count) => sum + count, 0)
      : 0;
    return `Выбрано упаковок: ${selected}. Итог в учебном чеке: ${solution.statedTotal}; остаток: ${solution.statedRemainder}.`;
  }
  if (mechanic === 'savings') {
    if (Array.isArray(solution.deposits)) {
      return `Взносы по дням: ${solution.deposits.join(', ')}.`;
    }
    return `Учебное снятие: ${solution.withdrawal}; решение: ${solution.action === 'buy' ? 'выбрать вещь' : 'отложить покупку'}.`;
  }
  if (mechanic === 'receipt_audit') {
    const lines = Array.isArray(solution.flaggedLineIds) ? solution.flaggedLineIds.length : 0;
    return `Отмечено строк: ${lines}. Итог после проверки: ${solution.correctedTotal}; сдача: ${solution.expectedChange}.`;
  }
  if (mechanic === 'resource_choice') {
    return `${solution.method === 'make' ? 'Изготовить' : 'Взять готовое'}. ${allocation(solution.allocation) ?? ''}`.trim();
  }
  return 'Мы разобрали учебную ситуацию.';
}

export function discoveryOutcome(discovery: LessonDiscovery): string {
  if (discovery.completionKind === 'reviewed') return 'Завершили с разбором';
  if (discovery.evaluation.outcome === 'valid_alternative') return 'Допустимый другой вариант';
  return 'Разобрали решение';
}

export function discoveryHelp(discovery: LessonDiscovery): string {
  if (discovery.attempt.shownHints.length === 0) return 'Подсказки в приложении не открывались.';
  return `Открыты подсказки: ${discovery.attempt.shownHints.join(', ')}.`;
}