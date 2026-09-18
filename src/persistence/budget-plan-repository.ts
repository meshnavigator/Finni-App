import {
  canonicalBusinessParameters,
  type CommandEnvelope,
  type CommandReceipt,
  type CommandSuccess,
  type Mode,
  type MoneySnapshot,
} from '../domain/contracts.ts';
import {
  allocateAdditionalIncome,
  allocatedAdditionalIncome,
  availableAdditionalIncome,
  effectivePlan,
  plan,
  type PeriodState,
  type Plan,
  type SupplementState,
} from '../domain/economy.ts';
import { DomainFailure, failure } from '../domain/errors.ts';
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
import { RepositoryExecutor } from './repository-executor.ts';

export type PlanAdditionSnapshot = Readonly<{
  id: string;
  values: Plan;
  createdAt: string;
}>;

export type PlanFactSnapshot = Readonly<{
  need: Amount;
  want: Amount;
  deposits: Counter;
  withdrawals: Counter;
  netSavings: NetFlow;
  goalClaims: Counter;
}>;

export type BudgetPlanSnapshot = Readonly<{
  periodId: string;
  state: PeriodState;
  original: Plan | null;
  effective: Plan | null;
  additions: readonly PlanAdditionSnapshot[];
  budgetAtConfirm: Amount | null;
  confirmedAt: string | null;
  postPlanIncome: Amount;
  allocatedIncome: Counter;
  availableIncome: Amount;
  facts: PlanFactSnapshot;
}>;

type PeriodRow = Readonly<{
  id: string;
  state: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  confirmed_plan_json: string | null;
  confirmed_at: string | null;
  budget_at_confirm: number | null;
  ledger_seq_at_confirm: number | null;
}>;

type AdditionRow = Readonly<{
  addition_id: string;
  need: number;
  want: number;
  save: number;
  created_at: string;
}>;

type FactRow = Readonly<{
  post_plan_income: number;
  need: number;
  want: number;
  deposits: number;
  withdrawals: number;
  goal_claims: number;
}>;

type ProfileRow = Readonly<{
  available: number;
  savings: number;
  revision: number;
}>;

type ReceiptRow = Readonly<{
  command_id: string;
  command_type: 'AllocateAdditionalIncome';
  business_identity: string;
  profile_id: string | null;
  mode: Mode;
  result_json: string;
}>;

function json(value: unknown): string {
  return JSON.stringify(value);
}

function snapshot(available: unknown, savings: unknown): MoneySnapshot {
  return Object.freeze({ available: amount(available), savings: amount(savings) });
}

function parsePlan(value: string): Plan {
  const parsed = JSON.parse(value) as Partial<Plan>;
  return plan(parsed.need, parsed.want, parsed.save);
}

function readReceipt<T>(row: ReceiptRow): CommandReceipt<T> {
  return Object.freeze({
    commandId: row.command_id,
    commandType: row.command_type,
    businessIdentity: row.business_identity,
    profileId: row.profile_id,
    mode: row.mode,
    result: JSON.parse(row.result_json) as CommandReceipt<T>['result'],
  });
}

async function rollbackQuietly(database: SqlDatabase): Promise<void> {
  try {
    await database.execAsync('ROLLBACK');
  } catch {
    // Preserve the original transaction failure.
  }
}

async function periodRows(
  database: SqlDatabase,
  profileId: string,
  periodId: string,
): Promise<Readonly<{ period: PeriodRow; additions: readonly AdditionRow[]; facts: FactRow }>> {
  const period = await database.getFirstAsync<PeriodRow>(
    `SELECT id, state, confirmed_plan_json, confirmed_at,
            budget_at_confirm, ledger_seq_at_confirm
     FROM period WHERE id = ? AND profile_id = ?`,
    periodId,
    profileId,
  );
  if (!period) throw failure('STORAGE_WRITE_FAILED', { entity: 'period' });
  const additions = await database.getAllAsync<AdditionRow>(
    `SELECT addition_id, need, want, save, created_at
     FROM period_plan_addition WHERE period_id = ? ORDER BY seq`,
    periodId,
  );
  const boundary = period.ledger_seq_at_confirm ?? Number.MAX_SAFE_INTEGER;
  const facts = await database.getFirstAsync<FactRow>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'LESSON_REWARD' AND seq > ? THEN amount ELSE 0 END), 0) AS post_plan_income,
       COALESCE(SUM(CASE WHEN type = 'PURCHASE' AND json_extract(payload_snapshot, '$.category') = 'need' THEN amount ELSE 0 END), 0) AS need,
       COALESCE(SUM(CASE WHEN type = 'PURCHASE' AND json_extract(payload_snapshot, '$.category') = 'want' THEN amount ELSE 0 END), 0) AS want,
       COALESCE(SUM(CASE WHEN type = 'SAVINGS_DEPOSIT' THEN amount ELSE 0 END), 0) AS deposits,
       COALESCE(SUM(CASE WHEN type = 'SAVINGS_WITHDRAWAL' THEN amount ELSE 0 END), 0) AS withdrawals,
       COALESCE(SUM(CASE WHEN type = 'GOAL_CLAIM' THEN amount ELSE 0 END), 0) AS goal_claims
     FROM ledger_entry WHERE period_id = ?`,
    boundary,
    periodId,
  );
  return Object.freeze({
    period,
    additions: Object.freeze(additions),
    facts: facts ?? {
      post_plan_income: 0,
      need: 0,
      want: 0,
      deposits: 0,
      withdrawals: 0,
      goal_claims: 0,
    },
  });
}

function toSnapshot(rows: Awaited<ReturnType<typeof periodRows>>): BudgetPlanSnapshot {
  const additions = Object.freeze(rows.additions.map((row) => Object.freeze({
    id: row.addition_id,
    values: plan(row.need, row.want, row.save),
    createdAt: row.created_at,
  })));
  const original = rows.period.confirmed_plan_json
    ? parsePlan(rows.period.confirmed_plan_json)
    : null;
  const postPlanIncome = amount(rows.facts.post_plan_income);
  const state: SupplementState | null = original
    ? Object.freeze({
        original,
        supplements: Object.freeze(additions.map((entry) => entry.values)),
        postPlanIncome,
        expensePlanOverrun: false,
      })
    : null;
  return Object.freeze({
    periodId: rows.period.id,
    state: rows.period.state,
    original,
    effective: state ? effectivePlan(state) : null,
    additions,
    budgetAtConfirm: rows.period.budget_at_confirm === null
      ? null
      : amount(rows.period.budget_at_confirm),
    confirmedAt: rows.period.confirmed_at,
    postPlanIncome,
    allocatedIncome: state ? allocatedAdditionalIncome(state) : counter(0),
    availableIncome: state ? availableAdditionalIncome(state) : amount(0),
    facts: Object.freeze({
      need: amount(rows.facts.need),
      want: amount(rows.facts.want),
      deposits: counter(rows.facts.deposits),
      withdrawals: counter(rows.facts.withdrawals),
      netSavings: netFlow(rows.facts.deposits - rows.facts.withdrawals),
      goalClaims: counter(rows.facts.goal_claims),
    }),
  });
}

export class BudgetPlanRepository {
  readonly #mode: Mode;
  readonly #executor: RepositoryExecutor;

  constructor(mode: Mode, database: SqlDatabase) {
    this.#mode = mode;
    this.#executor = new RepositoryExecutor(database);
  }

  read(profileId: string, periodId: string): Promise<BudgetPlanSnapshot> {
    return this.#executor.run(async (database) =>
      toSnapshot(await periodRows(database, profileId, periodId)));
  }

  async allocateAdditionalIncome(
    envelope: CommandEnvelope<'AllocateAdditionalIncome'>,
    committedAt: string,
  ): Promise<CommandReceipt<Readonly<{
    periodId: string;
    addition: Plan;
    effective: Plan;
    availableIncome: Amount;
  }>>> {
    if (envelope.meta.mode !== this.#mode) throw failure('PROFILE_MODE_MISMATCH');
    const addition = plan(
      envelope.payload.addition.need,
      envelope.payload.addition.want,
      envelope.payload.addition.save,
    );
    const identity = canonicalBusinessParameters(
      envelope.type,
      envelope.meta,
      envelope.payload,
    );
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        type ResultData = Readonly<{
          periodId: string;
          addition: Plan;
          effective: Plan;
          availableIncome: Amount;
        }>;
        const existing = await database.getFirstAsync<ReceiptRow>(
          `SELECT command_id, command_type, business_identity, profile_id, mode, result_json
           FROM command_receipt WHERE command_id = ?`,
          envelope.meta.commandId,
        );
        if (existing) {
          if (
            existing.command_type !== envelope.type ||
            existing.profile_id !== envelope.meta.profileId ||
            existing.mode !== this.#mode ||
            existing.business_identity !== identity
          ) {
            throw failure('IDEMPOTENCY_CONFLICT');
          }
          await database.execAsync('COMMIT');
          return readReceipt<ResultData>(existing);
        }

        const profile = await database.getFirstAsync<ProfileRow>(
          `SELECT wallet.available, wallet.savings, state.revision
           FROM wallet_projection AS wallet
           JOIN profile_state AS state ON state.profile_id = wallet.profile_id
           WHERE wallet.profile_id = ?`,
          envelope.meta.profileId,
        );
        if (!profile) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
        if (counter(profile.revision) !== counter(envelope.meta.expectedRevision)) {
          throw failure('STALE_STATE', undefined, true);
        }
        const rows = await periodRows(
          database,
          envelope.meta.profileId,
          envelope.payload.periodId,
        );
        if (rows.period.state !== 'ACTIVE' || !rows.period.confirmed_plan_json) {
          throw failure('PERIOD_NOT_ACTIVE');
        }
        const original = parsePlan(rows.period.confirmed_plan_json);
        const checked = allocateAdditionalIncome(
          Object.freeze({
            original,
            supplements: Object.freeze(rows.additions.map((row) =>
              plan(row.need, row.want, row.save))),
            postPlanIncome: amount(rows.facts.post_plan_income),
            expensePlanOverrun: false,
          }),
          addition,
        );
        await database.runAsync(
          `INSERT INTO period_plan_addition(
             addition_id, command_id, profile_id, period_id,
             need, want, save, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `addition:${envelope.meta.commandId}`,
          envelope.meta.commandId,
          envelope.meta.profileId,
          envelope.payload.periodId,
          addition.need,
          addition.want,
          addition.save,
          committedAt,
        );
        const revision = addCounter(counter(profile.revision), counter(1));
        await database.runAsync(
          'UPDATE profile_state SET revision = ? WHERE profile_id = ?',
          revision,
          envelope.meta.profileId,
        );
        await database.runAsync(
          `INSERT INTO audit_event(
             event_id, command_id, profile_id, event_type, payload_json, created_at
           ) VALUES (?, ?, ?, 'PLAN_INCOME_ALLOCATED', ?, ?)`,
          `event:${envelope.meta.commandId}`,
          envelope.meta.commandId,
          envelope.meta.profileId,
          json({ periodId: envelope.payload.periodId, addition }),
          committedAt,
        );
        const money = snapshot(profile.available, profile.savings);
        const data: ResultData = Object.freeze({
          periodId: envelope.payload.periodId,
          addition,
          effective: effectivePlan(checked),
          availableIncome: availableAdditionalIncome(checked),
        });
        const result: CommandSuccess<ResultData> = Object.freeze({
          ok: true,
          data,
          before: money,
          after: money,
          revision,
          feedback: Object.freeze({
            code: 'PLAN_INCOME_ALLOCATED',
            params: Object.freeze({}),
            petReaction: 'calm',
          }),
        });
        await database.runAsync(
          `INSERT INTO command_receipt(
             command_id, command_type, business_identity, profile_id,
             mode, result_json, committed_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          envelope.meta.commandId,
          envelope.type,
          identity,
          envelope.meta.profileId,
          this.#mode,
          json(result),
          committedAt,
        );
        await database.execAsync('COMMIT');
        return Object.freeze({
          commandId: envelope.meta.commandId,
          commandType: envelope.type,
          businessIdentity: identity,
          profileId: envelope.meta.profileId,
          mode: this.#mode,
          result,
        });
      } catch (error) {
        await rollbackQuietly(database);
        if (error instanceof DomainFailure || error instanceof TypeError) throw error;
        throw failure('STORAGE_WRITE_FAILED', undefined, true);
      }
    });
  }
}
