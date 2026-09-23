import type { LessonActionResult, LessonEvaluator } from './lesson.ts';

export const SAVINGS_SCHEDULE = 'schedule';
export const SAVINGS_WITHDRAWAL_PREVIEW = 'withdrawal_preview';

function amount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function invalid(consequence: string, calculation: Readonly<Record<string, unknown>> = {}): LessonActionResult {
  return {
    outcome: 'invalid_input',
    consequence,
    explanation: 'Проверь учебные числа и попробуй ещё раз.',
    nextStep: 'Исправь ответ, затем снова посмотри, что получится.',
    calculation,
  };
}

function scheduleValues(
  solution: Readonly<Record<string, unknown>>,
  parameters: Readonly<Record<string, unknown>>,
): Readonly<{ initialSavings: number; goalCost: number; maxDeposits: number[]; deposits: number[] }> | null {
  if (!amount(parameters.initialSavings) || !amount(parameters.goalCost)) return null;
  const maxDeposits = parameters.maxDeposits;
  const deposits = solution.deposits;
  if (
    !Array.isArray(maxDeposits) || !Array.isArray(deposits) ||
    maxDeposits.length === 0 || deposits.length !== maxDeposits.length ||
    !maxDeposits.every(amount) || !deposits.every(amount)
  ) return null;
  return {
    initialSavings: parameters.initialSavings,
    goalCost: parameters.goalCost,
    maxDeposits,
    deposits,
  };
}

export function evaluateSavingsSchedule(
  solution: Readonly<Record<string, unknown>>,
  parameters: Readonly<Record<string, unknown>>,
): LessonActionResult {
  const values = scheduleValues(solution, parameters);
  if (!values) return invalid('Выбери три целых взноса для игровых дней.');
  if (values.deposits.some((deposit, index) => deposit > values.maxDeposits[index])) {
    return invalid('Взнос в каждый день не может быть больше указанного лимита.', {
      deposits: values.deposits,
      maxDeposits: values.maxDeposits,
    });
  }
  const added = values.deposits.reduce((sum, deposit) => sum + deposit, 0);
  const forecast = values.initialSavings + added;
  const remaining = Math.max(0, values.goalCost - forecast);
  const calculation = {
    deposits: [...values.deposits],
    added,
    forecast,
    remaining,
    goalCost: values.goalCost,
  };
  if (forecast >= values.goalCost) {
    const extra = forecast - values.goalCost;
    return {
      outcome: 'meets_goal',
      consequence: 'Три взноса добавят ' + added + '. Вместе получится ' + forecast
        + (extra > 0 ? ' — это на ' + extra + ' больше цены мечты.' : '.'),
      explanation: 'Это учебный план трёх будущих игровых дней. Он не обещает дату и не меняет твою настоящую копилку.',
      nextStep: 'Можно завершить задание и выбрать такой план в следующий игровой день.',
      calculation,
    };
  }
  return {
    outcome: 'needs_review',
    consequence: 'Получится ' + forecast + '. До мечты ещё ' + remaining + '.',
    explanation: 'Это план трёх будущих игровых дней. Его можно менять: увеличь один или несколько взносов, но не больше лимита на игровой день.',
    nextStep: 'Попробуй другой план из трёх взносов.',
    calculation,
  };
}

function withdrawalValues(
  solution: Readonly<Record<string, unknown>>,
  parameters: Readonly<Record<string, unknown>>,
): Readonly<{ available: number; savings: number; goalCost: number; itemCost: number; withdrawal: number; action: 'buy' | 'postpone' }> | null {
  if (
    !amount(parameters.available) || !amount(parameters.savings) ||
    !amount(parameters.goalCost) || !amount(parameters.itemCost) ||
    !amount(solution.withdrawal) ||
    (solution.action !== 'buy' && solution.action !== 'postpone')
  ) return null;
  return {
    available: parameters.available,
    savings: parameters.savings,
    goalCost: parameters.goalCost,
    itemCost: parameters.itemCost,
    withdrawal: solution.withdrawal,
    action: solution.action,
  };
}

export function evaluateSavingsWithdrawalPreview(
  solution: Readonly<Record<string, unknown>>,
  parameters: Readonly<Record<string, unknown>>,
): LessonActionResult {
  const values = withdrawalValues(solution, parameters);
  if (!values || values.withdrawal > values.savings) {
    return invalid('Выбери целую сумму снятия из учебной копилки и действие.');
  }
  const availableAfterWithdrawal = values.available + values.withdrawal;
  const savingsAfterWithdrawal = values.savings - values.withdrawal;
  const remaining = Math.max(0, values.goalCost - savingsAfterWithdrawal);
  const calculation = {
    withdrawal: values.withdrawal,
    availableAfterWithdrawal,
    savingsAfterWithdrawal,
    remaining,
    itemCost: values.itemCost,
    action: values.action,
  };
  if (values.action === 'buy' && availableAfterWithdrawal < values.itemCost) {
    return invalid(
      'В учебном кошельке не хватает ' + (values.itemCost - availableAfterWithdrawal) + '. Без отдельного снятия купить нельзя.',
      calculation,
    );
  }
  const availableAfterAction = values.action === 'buy'
    ? availableAfterWithdrawal - values.itemCost
    : availableAfterWithdrawal;
  const result = { ...calculation, availableAfterAction };
  if (values.action === 'buy') {
    return {
      outcome: 'meets_goal',
      consequence: 'Ты выбрал занятие сейчас. В учебном кошельке ' + availableAfterAction
        + ', в копилке ' + savingsAfterWithdrawal + '; до мечты ' + remaining + '.',
      explanation: 'Снятие не объявляется ошибкой: оно показывает выбор между занятием сейчас и большей суммой для мечты.',
      nextStep: 'Это только preview. Можно изменить сумму снятия и снова проверить пример.',
      calculation: result,
    };
  }
  return {
    outcome: 'meets_goal',
    consequence: 'Покупка подождёт. В учебном кошельке ' + availableAfterAction
      + ', в копилке ' + savingsAfterWithdrawal + '; до мечты ' + remaining + '.',
    explanation: 'Ты сохранил накопления в этом учебном примере. Никакие монеты твоего игрового дня не менялись.',
    nextStep: 'Можно завершить задание или изменить сумму и посмотреть другой вариант.',
    calculation: result,
  };
}

/** The content snapshot pins `mode`, so one registered mechanic safely routes both savings lessons. */
export const evaluateSavings: LessonEvaluator = (solution, parameters) => {
  if (parameters.mode === SAVINGS_SCHEDULE) {
    return evaluateSavingsSchedule(solution, parameters);
  }
  if (parameters.mode === SAVINGS_WITHDRAWAL_PREVIEW) {
    return evaluateSavingsWithdrawalPreview(solution, parameters);
  }
  return invalid('Не удалось определить учебный сценарий накоплений.');
};
