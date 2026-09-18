import {
  plan,
  planTotal,
  planWarnings,
  type Plan,
} from '../domain/economy.ts';
import { amount, type Amount } from '../domain/numeric.ts';
import type { BudgetPlanSnapshot } from '../persistence/budget-plan-repository.ts';

export type PlanDraftFields = Readonly<{
  need: string;
  want: string;
  save: string;
}>;

export type PlanDraftModel = Readonly<{
  values: Plan | null;
  distributed: number;
  remaining: number;
  valid: boolean;
  overBudgetBy: number;
  lowNeedWarning: boolean;
  confirmEnabled: boolean;
}>;

function parseField(value: string): Amount {
  const normalized = value.trim();
  if (normalized === '') return amount(0);
  if (!/^\d+$/.test(normalized)) throw new TypeError('Введите целое число');
  return amount(Number(normalized));
}

export function planDraftModel(
  fields: PlanDraftFields,
  available: Amount,
  acknowledgedLowNeed = false,
): PlanDraftModel {
  const budget = amount(available);
  try {
    const values = plan(
      parseField(fields.need),
      parseField(fields.want),
      parseField(fields.save),
    );
    const distributed = planTotal(values);
    const overBudgetBy = Math.max(0, distributed - budget);
    const lowNeedWarning = planWarnings(values).includes('NEED_BELOW_REFERENCE');
    return Object.freeze({
      values,
      distributed,
      remaining: Math.max(0, budget - distributed),
      valid: overBudgetBy === 0,
      overBudgetBy,
      lowNeedWarning,
      confirmEnabled: overBudgetBy === 0 && (!lowNeedWarning || acknowledgedLowNeed),
    });
  } catch {
    return Object.freeze({
      values: null,
      distributed: 0,
      remaining: budget,
      valid: false,
      overBudgetBy: 0,
      lowNeedWarning: false,
      confirmEnabled: false,
    });
  }
}

export function additionalIncomeDraftModel(
  fields: PlanDraftFields,
  budget: BudgetPlanSnapshot,
): Readonly<{
  values: Plan | null;
  total: number;
  remainingAfter: number;
  valid: boolean;
}> {
  try {
    const values = plan(
      parseField(fields.need),
      parseField(fields.want),
      parseField(fields.save),
    );
    const total = planTotal(values);
    const valid = budget.state === 'ACTIVE' && total > 0 && total <= budget.availableIncome;
    return Object.freeze({
      values,
      total,
      remainingAfter: Math.max(0, budget.availableIncome - total),
      valid,
    });
  } catch {
    return Object.freeze({
      values: null,
      total: 0,
      remainingAfter: budget.availableIncome,
      valid: false,
    });
  }
}

export function planFactRows(budget: BudgetPlanSnapshot) {
  if (!budget.original || !budget.effective) return Object.freeze([]);
  return Object.freeze([
    Object.freeze({
      key: 'need' as const,
      label: 'Нужно',
      original: budget.original.need,
      added: budget.effective.need - budget.original.need,
      effective: budget.effective.need,
      actual: budget.facts.need,
    }),
    Object.freeze({
      key: 'want' as const,
      label: 'Хочется',
      original: budget.original.want,
      added: budget.effective.want - budget.original.want,
      effective: budget.effective.want,
      actual: budget.facts.want,
    }),
    Object.freeze({
      key: 'save' as const,
      label: 'На мечту',
      original: budget.original.save,
      added: budget.effective.save - budget.original.save,
      effective: budget.effective.save,
      actual: budget.facts.netSavings,
    }),
  ]);
}
