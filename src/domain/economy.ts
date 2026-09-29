import { failure } from './errors.ts';
import {
  AMOUNT_LIMIT,
  addCounter,
  amount,
  counter,
  netFlow,
  safeAdd,
  safeSubtract,
  type Amount,
  type Counter,
  type NetFlow,
} from './numeric.ts';

export const ECONOMY_VERSION = 'economy-v2';
export const DAILY_INCOME = 100;
export const LESSON_REWARD = 20;

export type Balances = Readonly<{
  available: Amount;
  savings: Amount;
}>;

export type BalanceMovement = Readonly<{
  income?: Amount;
  reward?: Amount;
  needExpense?: Amount;
  wantExpense?: Amount;
  deposits?: Amount;
  withdrawals?: Amount;
  claimedGoalCost?: Amount;
}>;

export type BalanceInputs = Readonly<{
  before: Balances;
}> &
  BalanceMovement;

function optionalAmount(value: Amount | undefined): Amount {
  return value === undefined ? amount(0) : amount(value);
}

function checkedAmountResult(value: number): Amount {
  if (value < 0 || value > AMOUNT_LIMIT) {
    throw failure('NUMERIC_LIMIT', {
      min: 0,
      max: AMOUNT_LIMIT,
    });
  }

  return amount(value);
}

function addToAmount(left: Amount, right: Amount): Amount {
  return checkedAmountResult(safeAdd(amount(left), amount(right)));
}

function subtractFromAvailable(left: Amount, right: Amount): Amount {
  const result = safeSubtract(amount(left), amount(right));
  if (result < 0) {
    throw failure('INSUFFICIENT_FUNDS', { missing: -result });
  }

  return amount(result);
}

function subtractFromSavings(left: Amount, right: Amount): Amount {
  const result = safeSubtract(amount(left), amount(right));
  if (result < 0) {
    throw failure('INSUFFICIENT_SAVINGS', { missing: -result });
  }

  return amount(result);
}

/**
 * Applies the SRS formula in event order. Each intermediate balance is checked,
 * so a later debit cannot hide an earlier overflow of an Amount projection.
 */
export function calculateBalances(input: BalanceInputs): Balances {
  const income = optionalAmount(input.income);
  const reward = optionalAmount(input.reward);
  const needExpense = optionalAmount(input.needExpense);
  const wantExpense = optionalAmount(input.wantExpense);
  const deposits = optionalAmount(input.deposits);
  const withdrawals = optionalAmount(input.withdrawals);
  const claimedGoalCost = optionalAmount(input.claimedGoalCost);

  let available = amount(input.before.available);
  let savings = amount(input.before.savings);

  available = addToAmount(available, income);
  available = addToAmount(available, reward);
  available = subtractFromAvailable(available, needExpense);
  available = subtractFromAvailable(available, wantExpense);
  available = subtractFromAvailable(available, deposits);
  savings = addToAmount(savings, deposits);
  savings = subtractFromSavings(savings, withdrawals);
  available = addToAmount(available, withdrawals);
  savings = subtractFromSavings(savings, claimedGoalCost);

  return Object.freeze({ available, savings });
}

/** B + S is an aggregate Counter, not an Amount component. */
export function totalFunds(balances: Balances): Counter {
  return counter(
    safeAdd(amount(balances.available), amount(balances.savings)),
  );
}

export function expectedTotalFunds(
  before: Balances,
  movement: BalanceMovement,
): Counter {
  let total = totalFunds(before);
  total = counter(safeAdd(total, optionalAmount(movement.income)));
  total = counter(safeAdd(total, optionalAmount(movement.reward)));
  total = counter(safeSubtract(total, optionalAmount(movement.needExpense)));
  total = counter(safeSubtract(total, optionalAmount(movement.wantExpense)));
  total = counter(safeSubtract(total, optionalAmount(movement.claimedGoalCost)));
  return total;
}

export type PeriodIncomeDecision = Readonly<{
  granted: boolean;
  income: Amount;
  reason: 'GRANTED' | 'ALREADY_GRANTED';
}>;

export function decidePeriodIncome(
  alreadyGrantedForPeriod: boolean,
): PeriodIncomeDecision {
  return Object.freeze(
    alreadyGrantedForPeriod
      ? { granted: false, income: amount(0), reason: 'ALREADY_GRANTED' as const }
      : { granted: true, income: amount(DAILY_INCOME), reason: 'GRANTED' as const },
  );
}

export type LessonRewardDecision = Readonly<{
  granted: boolean;
  reward: Amount;
  reason:
    | 'GRANTED'
    | 'PERIOD_NOT_ACTIVE'
    | 'EXPLANATION_REQUIRED'
    | 'ALREADY_GRANTED';
}>;

export type LessonRewardInput = Readonly<{
  periodActive: boolean;
  explanationViewed: boolean;
  alreadyGrantedForPeriod: boolean;
}>;

export function decideLessonReward(
  input: LessonRewardInput,
): LessonRewardDecision {
  if (!input.periodActive) {
    return Object.freeze({
      granted: false,
      reward: amount(0),
      reason: 'PERIOD_NOT_ACTIVE',
    });
  }
  if (!input.explanationViewed) {
    return Object.freeze({
      granted: false,
      reward: amount(0),
      reason: 'EXPLANATION_REQUIRED',
    });
  }
  if (input.alreadyGrantedForPeriod) {
    return Object.freeze({
      granted: false,
      reward: amount(0),
      reason: 'ALREADY_GRANTED',
    });
  }

  return Object.freeze({
    granted: true,
    reward: amount(LESSON_REWARD),
    reason: 'GRANTED',
  });
}

export type Plan = Readonly<{
  need: Amount;
  want: Amount;
  save: Amount;
}>;

export function plan(need: unknown, want: unknown, save: unknown): Plan {
  return Object.freeze({
    need: amount(need),
    want: amount(want),
    save: amount(save),
  });
}

/** The sum is a Counter because three valid Amount components may exceed 1e9. */
export function planTotal(value: Plan): Counter {
  const checked = plan(value.need, value.want, value.save);
  return counter(
    safeAdd(safeAdd(checked.need, checked.want), checked.save),
  );
}

export function confirmPlan(value: Plan, available: Amount): Plan {
  const checked = plan(value.need, value.want, value.save);
  const budget = amount(available);
  const total = planTotal(checked);
  if (total > budget) {
    throw failure('PLAN_OVER_BUDGET', {
      excess: safeSubtract(total, budget),
    });
  }

  return checked;
}

export type PlanWarning = 'NEED_BELOW_REFERENCE';

export function planWarnings(value: Plan): readonly PlanWarning[] {
  const checked = plan(value.need, value.want, value.save);
  return checked.need < 40 ? Object.freeze(['NEED_BELOW_REFERENCE']) : [];
}

export type SupplementState = Readonly<{
  original: Plan;
  supplements: readonly Plan[];
  postPlanIncome: Amount;
  expensePlanOverrun: boolean;
}>;

function checkedSupplementState(state: SupplementState): SupplementState {
  return Object.freeze({
    original: plan(state.original.need, state.original.want, state.original.save),
    supplements: Object.freeze(
      state.supplements.map((extra) =>
        plan(extra.need, extra.want, extra.save),
      ),
    ),
    postPlanIncome: amount(state.postPlanIncome),
    expensePlanOverrun: Boolean(state.expensePlanOverrun),
  });
}

export function effectivePlan(state: SupplementState): Plan {
  const checked = checkedSupplementState(state);
  return checked.supplements.reduce(
    (result, extra) =>
      plan(
        checkedAmountResult(safeAdd(result.need, extra.need)),
        checkedAmountResult(safeAdd(result.want, extra.want)),
        checkedAmountResult(safeAdd(result.save, extra.save)),
      ),
    checked.original,
  );
}

export function allocatedAdditionalIncome(state: SupplementState): Counter {
  const checked = checkedSupplementState(state);
  return checked.supplements.reduce(
    (sum, extra) => addCounter(sum, planTotal(extra)),
    counter(0),
  );
}

export function availableAdditionalIncome(state: SupplementState): Amount {
  const checked = checkedSupplementState(state);
  const remaining = safeSubtract(
    checked.postPlanIncome,
    allocatedAdditionalIncome(checked),
  );
  if (remaining < 0) {
    throw failure('EXTRA_INCOME_EXCEEDED', { available: 0 });
  }

  return amount(remaining);
}

export function allocateAdditionalIncome(
  state: SupplementState,
  addition: Plan,
): SupplementState {
  const checked = checkedSupplementState(state);
  const checkedAddition = plan(addition.need, addition.want, addition.save);
  const total = planTotal(checkedAddition);
  if (total === 0) {
    throw failure('INVALID_AMOUNT', { min: 1 });
  }
  const available = availableAdditionalIncome(checked);
  if (total > available) {
    throw failure('EXTRA_INCOME_EXCEEDED', { available });
  }

  return Object.freeze({
    ...checked,
    supplements: Object.freeze([...checked.supplements, checkedAddition]),
  });
}

export function recordPurchasePlanOverrun(
  state: SupplementState,
  category: 'need' | 'want',
  actualAfterPurchase: Amount,
): SupplementState {
  const checked = checkedSupplementState(state);
  const actual = amount(actualAfterPurchase);
  const limit = effectivePlan(checked)[category];
  return Object.freeze({
    ...checked,
    expensePlanOverrun: checked.expensePlanOverrun || actual > limit,
  });
}

export type PeriodState =
  | 'NO_PROFILE'
  | 'READY'
  | 'DRAFT'
  | 'ACTIVE'
  | 'CLOSED'
  | 'WAITING'
  | 'STORAGE_ERROR';

export function assertActiveRevision(
  periodState: PeriodState,
  expectedRevision: Counter,
  actualRevision: Counter,
): void {
  if (periodState !== 'ACTIVE') {
    throw failure('PERIOD_NOT_ACTIVE');
  }
  if (counter(expectedRevision) !== counter(actualRevision)) {
    throw failure('STALE_STATE', undefined, true);
  }
}

export type GrowthInput = Readonly<{
  savingsAtClose: Amount;
  lifetimeClaimedGoalCost: Counter;
  savingsHighWaterBefore: Counter;
  deposits: Counter;
  withdrawals: Counter;
  foodPurchased: boolean;
  carePurchased: boolean;
  expensePlanOverrun: boolean;
  actualNeed: Amount;
  actualWant: Amount;
  effective: Plan;
  closedPeriodsBefore: Counter;
  lifetimeGrowthBefore: Counter;
  newSavingPeriodsBefore: Counter;
  previousStage: 1 | 2 | 3;
}>;

export type GrowthResult = Readonly<{
  netSaving: NetFlow;
  committedSavingEnd: Counter;
  newSaving: Counter;
  needPoint: 0 | 1;
  planPoint: 0 | 1;
  savePoint: 0 | 1;
  periodGrowth: Counter;
  savingsHighWaterAfter: Counter;
  lifetimeGrowthAfter: Counter;
  newSavingPeriodsAfter: Counter;
  stageAfter: 1 | 2 | 3;
}>;

export function calculateGrowth(input: GrowthInput): GrowthResult {
  const savingsAtClose = amount(input.savingsAtClose);
  const lifetimeClaimedGoalCost = counter(input.lifetimeClaimedGoalCost);
  const highWaterBefore = counter(input.savingsHighWaterBefore);
  const deposits = counter(input.deposits);
  const withdrawals = counter(input.withdrawals);
  const actualNeed = amount(input.actualNeed);
  const actualWant = amount(input.actualWant);
  const effective = plan(
    input.effective.need,
    input.effective.want,
    input.effective.save,
  );
  const closedPeriodsBefore = counter(input.closedPeriodsBefore);
  const lifetimeGrowthBefore = counter(input.lifetimeGrowthBefore);
  const newSavingPeriodsBefore = counter(input.newSavingPeriodsBefore);
  if (![1, 2, 3].includes(input.previousStage)) {
    throw failure('INVALID_AMOUNT', { min: 1, max: 3 });
  }

  const netSaving = netFlow(safeSubtract(deposits, withdrawals));
  const committedSavingEnd = addCounter(
    counter(savingsAtClose),
    lifetimeClaimedGoalCost,
  );
  const newSaving = counter(
    Math.max(0, safeSubtract(committedSavingEnd, highWaterBefore)),
  );
  const needsCovered = input.foodPurchased && input.carePurchased;
  const needPoint: 0 | 1 = needsCovered ? 1 : 0;
  const planPoint: 0 | 1 =
    needsCovered &&
    !input.expensePlanOverrun &&
    actualNeed <= effective.need &&
    actualWant <= effective.want &&
    netSaving >= effective.save
      ? 1
      : 0;
  const savePoint: 0 | 1 = newSaving > 0 ? 1 : 0;
  const periodGrowth = counter(needPoint + planPoint + savePoint);
  const lifetimeGrowthAfter = addCounter(
    lifetimeGrowthBefore,
    periodGrowth,
  );
  const newSavingPeriodsAfter = addCounter(
    newSavingPeriodsBefore,
    counter(savePoint),
  );
  const closedPeriodsAfter = addCounter(closedPeriodsBefore, counter(1));
  const calculatedStage: 1 | 2 | 3 =
    closedPeriodsAfter >= 5 &&
    lifetimeGrowthAfter >= 12 &&
    newSavingPeriodsAfter >= 3
      ? 3
      : closedPeriodsAfter >= 2 && lifetimeGrowthAfter >= 6
        ? 2
        : 1;

  return Object.freeze({
    netSaving,
    committedSavingEnd,
    newSaving,
    needPoint,
    planPoint,
    savePoint,
    periodGrowth,
    savingsHighWaterAfter: counter(
      Math.max(highWaterBefore, committedSavingEnd),
    ),
    lifetimeGrowthAfter,
    newSavingPeriodsAfter,
    stageAfter: Math.max(input.previousStage, calculatedStage) as 1 | 2 | 3,
  });
}
