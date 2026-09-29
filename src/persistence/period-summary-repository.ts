import {
  canonicalBusinessParameters,
  moneySnapshot,
  type CommandEnvelope,
  type CommandReceipt,
  type CommandSuccess,
  type Mode,
} from '../domain/contracts.ts';
import {
  calculateGrowth,
  effectivePlan,
  plan,
  type GrowthResult,
  type Plan,
} from '../domain/economy.ts';
import { failure } from '../domain/errors.ts';
import {
  addCounter,
  amount,
  counter,
  netFlow,
  type Amount,
  type Counter,
  type NetFlow,
} from '../domain/numeric.ts';
import type { SqlDatabase } from './database.ts';

export type PeriodSummarySnapshot = Readonly<{
  periodId: string;
  ruleBundle: Readonly<{ economyVersion: string; catalogVersion: string; goalsVersion: string }>;
  plan: Readonly<{ original: Plan; additions: readonly Plan[]; effective: Plan }>;
  facts: Readonly<{
    available: Amount;
    savings: Amount;
    actualNeed: Amount;
    actualWant: Amount;
    deposits: Counter;
    withdrawals: Counter;
    goalClaims: Counter;
    lifetimeClaimedGoalCost: Counter;
    foodPurchased: boolean;
    carePurchased: boolean;
    expensePlanOverrun: boolean;
  }>;
  criteria: Readonly<{
    needsCovered: boolean;
    netSaving: NetFlow;
    committedSavingEnd: Counter;
    newSaving: Counter;
    needPoint: 0 | 1;
    planPoint: 0 | 1;
    savePoint: 0 | 1;
  }>;
  periodGrowth: Counter;
  savingsHighWaterBefore: Counter;
  savingsHighWaterAfter: Counter;
  newSavingPeriodsBefore: Counter;
  newSavingPeriodsAfter: Counter;
  lifetimeGrowthBefore: Counter;
  lifetimeGrowthAfter: Counter;
  stageBefore: 1 | 2 | 3;
  stageAfter: 1 | 2 | 3;
  explanation: string;
  nextSafeStep: string;
  createdAt: string;
}>;

export type ClosePeriodData = Readonly<{
  periodId: string;
  state: 'CLOSED';
  summary: PeriodSummarySnapshot;
}>;

type ReceiptRow = Readonly<{
  command_id: string;
  command_type: string;
  business_identity: string;
  profile_id: string | null;
  mode: Mode;
  result_json: string;
}>;

type ProfileRow = Readonly<{
  available: number;
  savings: number;
  revision: number;
  savings_high_water: number;
  new_saving_periods: number;
  lifetime_growth: number;
  pet_stage: number;
}>;

type PeriodRow = Readonly<{
  id: string;
  state: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  rule_bundle_json: string;
  confirmed_plan_json: string | null;
  budget_at_confirm: number | null;
  expense_plan_overrun: number;
}>;

type AdditionRow = Readonly<{ need: number; want: number; save: number }>;
type FactRow = Readonly<{
  actual_need: number;
  actual_want: number;
  deposits: number;
  withdrawals: number;
  goal_claims: number;
}>;

type SummaryRow = Readonly<{
  period_id: string;
  rule_snapshot_json: string;
  plan_snapshot_json: string;
  facts_json: string;
  criteria_json: string;
  period_growth: number;
  savings_high_water_before: number;
  savings_high_water_after: number;
  new_saving_periods_before: number;
  new_saving_periods_after: number;
  lifetime_growth_before: number;
  lifetime_growth_after: number;
  stage_before: number;
  stage_after: number;
  explanation: string;
  next_safe_step: string;
  created_at: string;
}>;

function json(value: unknown): string {
  return JSON.stringify(value);
}

function stage(value: number): 1 | 2 | 3 {
  if (value !== 1 && value !== 2 && value !== 3) throw failure('STORAGE_WRITE_FAILED', { entity: 'pet_stage' });
  return value;
}

function parsePlan(value: unknown): Plan {
  const parsed = value as Partial<Plan>;
  return plan(parsed.need, parsed.want, parsed.save);
}

function summaryFromRow(row: SummaryRow): PeriodSummarySnapshot {
  const rules = JSON.parse(row.rule_snapshot_json) as PeriodSummarySnapshot['ruleBundle'];
  const planSnapshot = JSON.parse(row.plan_snapshot_json) as Readonly<{
    original: Plan;
    additions: readonly Plan[];
    effective: Plan;
  }>;
  const facts = JSON.parse(row.facts_json) as PeriodSummarySnapshot['facts'];
  const criteria = JSON.parse(row.criteria_json) as PeriodSummarySnapshot['criteria'];
  return Object.freeze({
    periodId: row.period_id,
    ruleBundle: Object.freeze({ ...rules }),
    plan: Object.freeze({
      original: parsePlan(planSnapshot.original),
      additions: Object.freeze(planSnapshot.additions.map(parsePlan)),
      effective: parsePlan(planSnapshot.effective),
    }),
    facts: Object.freeze({
      available: amount(facts.available),
      savings: amount(facts.savings),
      actualNeed: amount(facts.actualNeed),
      actualWant: amount(facts.actualWant),
      deposits: counter(facts.deposits),
      withdrawals: counter(facts.withdrawals),
      goalClaims: counter(facts.goalClaims),
      lifetimeClaimedGoalCost: counter(facts.lifetimeClaimedGoalCost),
      foodPurchased: Boolean(facts.foodPurchased),
      carePurchased: Boolean(facts.carePurchased),
      expensePlanOverrun: Boolean(facts.expensePlanOverrun),
    }),
    criteria: Object.freeze({
      needsCovered: Boolean(criteria.needsCovered),
      netSaving: netFlow(criteria.netSaving),
      committedSavingEnd: counter(criteria.committedSavingEnd),
      newSaving: counter(criteria.newSaving),
      needPoint: criteria.needPoint === 1 ? 1 : 0,
      planPoint: criteria.planPoint === 1 ? 1 : 0,
      savePoint: criteria.savePoint === 1 ? 1 : 0,
    }),
    periodGrowth: counter(row.period_growth),
    savingsHighWaterBefore: counter(row.savings_high_water_before),
    savingsHighWaterAfter: counter(row.savings_high_water_after),
    newSavingPeriodsBefore: counter(row.new_saving_periods_before),
    newSavingPeriodsAfter: counter(row.new_saving_periods_after),
    lifetimeGrowthBefore: counter(row.lifetime_growth_before),
    lifetimeGrowthAfter: counter(row.lifetime_growth_after),
    stageBefore: stage(row.stage_before),
    stageAfter: stage(row.stage_after),
    explanation: row.explanation,
    nextSafeStep: row.next_safe_step,
    createdAt: row.created_at,
  });
}

export async function readPeriodSummary(
  database: SqlDatabase,
  periodId: string | null,
): Promise<PeriodSummarySnapshot | null> {
  if (!periodId) return null;
  const row = await database.getFirstAsync<SummaryRow>(
    `SELECT period_id, rule_snapshot_json, plan_snapshot_json, facts_json, criteria_json,
            period_growth, savings_high_water_before, savings_high_water_after,
            new_saving_periods_before, new_saving_periods_after,
            lifetime_growth_before, lifetime_growth_after, stage_before, stage_after,
            explanation, next_safe_step, created_at
     FROM period_summary WHERE period_id = ?`,
    periodId,
  );
  return row ? summaryFromRow(row) : null;
}

function outcome(growth: GrowthResult, foodPurchased: boolean, carePurchased: boolean): Readonly<{
  explanation: string;
  nextSafeStep: string;
}> {
  const needsCovered = foodPurchased && carePurchased;
  const explanation = growth.periodGrowth === 3
    ? 'Ты позаботился о Финни, сохранил свой план и сделал новый шаг к мечте.'
    : growth.periodGrowth === 0
      ? 'День завершён. Финни в безопасности, а все монеты и решения сохранены.'
      : `Сегодня получилось ${growth.periodGrowth} из 3 шагов роста. Все достижения сохранены.`;
  const nextSafeStep = !needsCovered
    ? 'В следующий день можно сначала выбрать еду и уход. Это новый выбор, не штраф.'
    : growth.planPoint === 0
      ? 'Перед следующей покупкой сравни остаток с планом — его можно составить иначе в новом дне.'
      : growth.savePoint === 0
        ? 'Попробуй увеличить копилку выше прежнего результата, когда это будет удобно.'
        : 'Продолжай выбирать посильный план и проверять результат.';
  return Object.freeze({ explanation, nextSafeStep });
}

export async function closePeriodTransaction(
  database: SqlDatabase,
  envelope: CommandEnvelope<'ClosePeriod'>,
  mode: Mode,
  committedAt: string,
): Promise<CommandReceipt<ClosePeriodData>> {
  const identity = canonicalBusinessParameters(envelope.type, envelope.meta, envelope.payload);
  const repeated = await database.getFirstAsync<ReceiptRow>(
    `SELECT command_id, command_type, business_identity, profile_id, mode, result_json
     FROM command_receipt WHERE command_id = ?`,
    envelope.meta.commandId,
  );
  if (repeated) {
    if (repeated.command_type !== envelope.type || repeated.profile_id !== envelope.meta.profileId || repeated.mode !== mode || repeated.business_identity !== identity) {
      throw failure('IDEMPOTENCY_CONFLICT');
    }
    return Object.freeze({
      commandId: repeated.command_id,
      commandType: 'ClosePeriod',
      businessIdentity: repeated.business_identity,
      profileId: repeated.profile_id,
      mode: repeated.mode,
      result: JSON.parse(repeated.result_json) as CommandReceipt<ClosePeriodData>['result'],
    });
  }

  const profile = await database.getFirstAsync<ProfileRow>(
    `SELECT wallet.available, wallet.savings, state.revision, state.savings_high_water,
            state.new_saving_periods, state.lifetime_growth, state.pet_stage
     FROM wallet_projection AS wallet
     JOIN profile_state AS state ON state.profile_id = wallet.profile_id
     WHERE wallet.profile_id = ?`,
    envelope.meta.profileId,
  );
  if (!profile) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
  if (counter(profile.revision) !== counter(envelope.meta.expectedRevision)) {
    throw failure('STALE_STATE', undefined, true);
  }
  const period = await database.getFirstAsync<PeriodRow>(
    `SELECT id, state, rule_bundle_json, confirmed_plan_json,
            budget_at_confirm, expense_plan_overrun
     FROM period WHERE id = ? AND profile_id = ?`,
    envelope.payload.periodId,
    envelope.meta.profileId,
  );
  if (!period || period.state !== 'ACTIVE' || !period.confirmed_plan_json) {
    throw failure('PERIOD_NOT_ACTIVE', { state: period?.state ?? 'missing' });
  }

  const additions = await database.getAllAsync<AdditionRow>(
    'SELECT need, want, save FROM period_plan_addition WHERE period_id = ? ORDER BY seq',
    period.id,
  );
  const original = parsePlan(JSON.parse(period.confirmed_plan_json));
  const additionPlans = Object.freeze(additions.map((entry) => plan(entry.need, entry.want, entry.save)));
  const effective = effectivePlan(Object.freeze({
    original,
    supplements: additionPlans,
    postPlanIncome: amount(0),
    expensePlanOverrun: Boolean(period.expense_plan_overrun),
  }));
  const facts = await database.getFirstAsync<FactRow>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'PURCHASE' AND json_extract(payload_snapshot, '$.category') = 'need' THEN amount ELSE 0 END), 0) AS actual_need,
       COALESCE(SUM(CASE WHEN type = 'PURCHASE' AND json_extract(payload_snapshot, '$.category') = 'want' THEN amount ELSE 0 END), 0) AS actual_want,
       COALESCE(SUM(CASE WHEN type = 'SAVINGS_DEPOSIT' THEN amount ELSE 0 END), 0) AS deposits,
       COALESCE(SUM(CASE WHEN type = 'SAVINGS_WITHDRAWAL' THEN amount ELSE 0 END), 0) AS withdrawals,
       COALESCE(SUM(CASE WHEN type = 'GOAL_CLAIM' THEN amount ELSE 0 END), 0) AS goal_claims
     FROM ledger_entry WHERE period_id = ?`,
    period.id,
  );
  const slots = await database.getAllAsync<Readonly<{ slot: string }>>(
    "SELECT slot FROM purchase WHERE period_id = ? AND slot IN ('food', 'care')",
    period.id,
  );
  const lifetimeClaims = await database.getFirstAsync<Readonly<{ total: number }>>(
    'SELECT COALESCE(SUM(cost_snapshot), 0) AS total FROM goal_claim WHERE profile_id = ?',
    envelope.meta.profileId,
  );
  const closed = await database.getFirstAsync<Readonly<{ count: number }>>(
    'SELECT COUNT(*) AS count FROM period_summary WHERE profile_id = ?',
    envelope.meta.profileId,
  );
  const checkedFacts = facts ?? { actual_need: 0, actual_want: 0, deposits: 0, withdrawals: 0, goal_claims: 0 };
  const foodPurchased = slots.some((entry) => entry.slot === 'food');
  const carePurchased = slots.some((entry) => entry.slot === 'care');
  const stageBefore = stage(profile.pet_stage);
  const growth = calculateGrowth(Object.freeze({
    savingsAtClose: amount(profile.savings),
    lifetimeClaimedGoalCost: counter(lifetimeClaims?.total ?? 0),
    savingsHighWaterBefore: counter(profile.savings_high_water),
    deposits: counter(checkedFacts.deposits),
    withdrawals: counter(checkedFacts.withdrawals),
    foodPurchased,
    carePurchased,
    expensePlanOverrun: Boolean(period.expense_plan_overrun),
    actualNeed: amount(checkedFacts.actual_need),
    actualWant: amount(checkedFacts.actual_want),
    effective,
    closedPeriodsBefore: counter(closed?.count ?? 0),
    lifetimeGrowthBefore: counter(profile.lifetime_growth),
    newSavingPeriodsBefore: counter(profile.new_saving_periods),
    previousStage: stageBefore,
  }));
  const words = outcome(growth, foodPurchased, carePurchased);
  const ruleBundle = JSON.parse(period.rule_bundle_json) as PeriodSummarySnapshot['ruleBundle'];
  const planSnapshot = Object.freeze({ original, additions: additionPlans, effective });
  const factsSnapshot: PeriodSummarySnapshot['facts'] = Object.freeze({
    available: amount(profile.available),
    savings: amount(profile.savings),
    actualNeed: amount(checkedFacts.actual_need),
    actualWant: amount(checkedFacts.actual_want),
    deposits: counter(checkedFacts.deposits),
    withdrawals: counter(checkedFacts.withdrawals),
    goalClaims: counter(checkedFacts.goal_claims),
    lifetimeClaimedGoalCost: counter(lifetimeClaims?.total ?? 0),
    foodPurchased,
    carePurchased,
    expensePlanOverrun: Boolean(period.expense_plan_overrun),
  });
  const criteria: PeriodSummarySnapshot['criteria'] = Object.freeze({
    needsCovered: foodPurchased && carePurchased,
    netSaving: growth.netSaving,
    committedSavingEnd: growth.committedSavingEnd,
    newSaving: growth.newSaving,
    needPoint: growth.needPoint,
    planPoint: growth.planPoint,
    savePoint: growth.savePoint,
  });
  const revision = addCounter(counter(profile.revision), counter(1));

  await database.runAsync(
    `INSERT INTO period_summary(
       period_id, command_id, profile_id, rule_snapshot_json, plan_snapshot_json,
       facts_json, criteria_json, available_at_close, savings_at_close, net_saving,
       period_growth, savings_high_water_before, savings_high_water_after,
       new_saving_periods_before, new_saving_periods_after,
       lifetime_growth_before, lifetime_growth_after, stage_before, stage_after,
       explanation, next_safe_step, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    period.id,
    envelope.meta.commandId,
    envelope.meta.profileId,
    json(ruleBundle),
    json(planSnapshot),
    json(factsSnapshot),
    json(criteria),
    profile.available,
    profile.savings,
    growth.netSaving,
    growth.periodGrowth,
    profile.savings_high_water,
    growth.savingsHighWaterAfter,
    profile.new_saving_periods,
    growth.newSavingPeriodsAfter,
    profile.lifetime_growth,
    growth.lifetimeGrowthAfter,
    stageBefore,
    growth.stageAfter,
    words.explanation,
    words.nextSafeStep,
    committedAt,
  );
  await database.runAsync(
    `UPDATE profile_state
     SET savings_high_water = ?, new_saving_periods = ?, lifetime_growth = ?,
         pet_stage = ?, revision = ? WHERE profile_id = ?`,
    growth.savingsHighWaterAfter,
    growth.newSavingPeriodsAfter,
    growth.lifetimeGrowthAfter,
    growth.stageAfter,
    revision,
    envelope.meta.profileId,
  );
  await database.runAsync(
    "UPDATE period SET state = 'CLOSED', closed_at = ? WHERE id = ?",
    committedAt,
    period.id,
  );
  await database.runAsync(
    `INSERT INTO audit_event(event_id, command_id, profile_id, event_type, payload_json, created_at)
     VALUES (?, ?, ?, 'PERIOD_CLOSED', ?, ?)`,
    `event:${envelope.meta.commandId}`,
    envelope.meta.commandId,
    envelope.meta.profileId,
    json({ periodId: period.id, periodGrowth: growth.periodGrowth, stageBefore, stageAfter: growth.stageAfter }),
    committedAt,
  );

  const inserted = await readPeriodSummary(database, period.id);
  if (!inserted) throw failure('STORAGE_WRITE_FAILED', { entity: 'period_summary' });
  const data: ClosePeriodData = Object.freeze({ periodId: period.id, state: 'CLOSED', summary: inserted });
  const money = moneySnapshot(profile.available, profile.savings);
  const result: CommandSuccess<ClosePeriodData> = Object.freeze({
    ok: true,
    data,
    before: money,
    after: money,
    revision,
    feedback: Object.freeze({
      code: 'PERIOD_CLOSED',
      params: Object.freeze({ growth: growth.periodGrowth, stage: growth.stageAfter }),
      petReaction: growth.periodGrowth > 0 ? 'inspired' : 'calm',
    }),
  });
  await database.runAsync(
    `INSERT INTO command_receipt(command_id, command_type, business_identity, profile_id, mode, result_json, committed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    envelope.meta.commandId,
    envelope.type,
    identity,
    envelope.meta.profileId,
    mode,
    json(result),
    committedAt,
  );
  return Object.freeze({
    commandId: envelope.meta.commandId,
    commandType: envelope.type,
    businessIdentity: identity,
    profileId: envelope.meta.profileId,
    mode,
    result,
  });
}
