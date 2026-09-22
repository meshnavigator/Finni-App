import {
  canonicalBusinessParameters,
  moneySnapshot,
  type CommandEnvelope,
  type CommandReceipt,
  type CommandSuccess,
  type Mode,
  type MoneySnapshot,
} from '../domain/contracts.ts';
import {
  catalogItem,
  savingsGoal,
  type CatalogItem,
  type SavingsGoal,
} from '../domain/catalog.ts';
import { calculateBalances, type Plan } from '../domain/economy.ts';
import { DomainFailure, failure } from '../domain/errors.ts';
import { addCounter, amount, counter, type Amount, type Counter } from '../domain/numeric.ts';
import type { SqlDatabase } from './database.ts';
import { RepositoryExecutor } from './repository-executor.ts';

export type PurchasePreview = Readonly<{
  item: CatalogItem;
  before: MoneySnapshot;
  after: MoneySnapshot | null;
  missing: Amount | null;
  occupiedSlot: boolean;
  planOverrun: boolean;
}>;

export type SavingsPreview = Readonly<{
  kind: 'deposit' | 'withdraw';
  amount: Amount;
  before: MoneySnapshot;
  after: MoneySnapshot | null;
  missing: Amount | null;
}>;

export type LedgerHistoryEntry = Readonly<{
  seq: Counter;
  type: string;
  amount: Amount;
  deltaAvailable: number;
  deltaSavings: number;
  reasonCode: string;
  payload: Readonly<Record<string, unknown>>;
  createdAt: string;
}>;

export type CommerceSnapshot = Readonly<{
  purchases: readonly Readonly<{ item: CatalogItem; createdAt: string }> [];
  selectedGoal: SavingsGoal | null;
  claimedGoalIds: readonly string[];
  history: readonly LedgerHistoryEntry[];
}>;

type ProfileRow = Readonly<{ available: number; savings: number; revision: number }>;
type PeriodRow = Readonly<{ state: 'DRAFT' | 'ACTIVE' | 'CLOSED'; confirmed_plan_json: string | null; expense_plan_overrun: number }>;
type PurchaseRow = Readonly<{ item_id: string; created_at: string }>;
type ReceiptRow = Readonly<{ command_id: string; command_type: string; business_identity: string; profile_id: string | null; mode: Mode; result_json: string }>;
type GoalRow = Readonly<{ goal_id: string | null }>;
type HistoryRow = Readonly<{ seq: number; type: string; amount: number; delta_available: number; delta_savings: number; reason_code: string; payload_snapshot: string; created_at: string }>;

function json(value: unknown): string { return JSON.stringify(value); }
function checkedPlan(value: string): Plan {
  const parsed = JSON.parse(value) as Plan;
  return Object.freeze({ need: amount(parsed.need), want: amount(parsed.want), save: amount(parsed.save) });
}
function receipt<T>(row: ReceiptRow): CommandReceipt<T> {
  return Object.freeze({ commandId: row.command_id, commandType: row.command_type as CommandReceipt<T>['commandType'], businessIdentity: row.business_identity, profileId: row.profile_id, mode: row.mode, result: JSON.parse(row.result_json) as CommandReceipt<T>['result'] });
}
async function rollback(database: SqlDatabase): Promise<void> { try { await database.execAsync('ROLLBACK'); } catch { /* original error wins */ } }

export class CommerceRepository {
  readonly #mode: Mode;
  readonly #executor: RepositoryExecutor;
  readonly #ownsExecutor: boolean;

  constructor(mode: Mode, database: SqlDatabase, executor?: RepositoryExecutor) {
    this.#mode = mode;
    this.#executor = executor ?? new RepositoryExecutor(database);
    this.#ownsExecutor = !executor;
  }

  close(): Promise<void> { return this.#ownsExecutor ? this.#executor.close() : Promise.resolve(); }

  async read(profileId: string, periodId: string | null): Promise<CommerceSnapshot> {
    return this.#executor.run(async (database) => {
      const purchaseRows = periodId ? await database.getAllAsync<PurchaseRow>(
        'SELECT item_id, created_at FROM purchase WHERE profile_id = ? AND period_id = ? ORDER BY created_at, id', profileId, periodId,
      ) : [];
      const selection = await database.getFirstAsync<GoalRow>('SELECT goal_id FROM goal_selection WHERE profile_id = ?', profileId);
      const claimed = await database.getAllAsync<Readonly<{ goal_id: string }>>('SELECT goal_id FROM goal_claim WHERE profile_id = ? ORDER BY created_at, id', profileId);
      const history = await database.getAllAsync<HistoryRow>(
        `SELECT seq, type, amount, delta_available, delta_savings, reason_code, payload_snapshot, created_at
         FROM ledger_entry WHERE profile_id = ? ORDER BY seq DESC LIMIT 50`, profileId,
      );
      return Object.freeze({
        purchases: Object.freeze(purchaseRows.map((row) => Object.freeze({ item: catalogItem(row.item_id), createdAt: row.created_at }))),
        selectedGoal: selection?.goal_id ? savingsGoal(selection.goal_id) : null,
        claimedGoalIds: Object.freeze(claimed.map((row) => row.goal_id)),
        history: Object.freeze(history.map((row) => Object.freeze({ seq: counter(row.seq), type: row.type, amount: amount(row.amount), deltaAvailable: row.delta_available, deltaSavings: row.delta_savings, reasonCode: row.reason_code, payload: JSON.parse(row.payload_snapshot) as Record<string, unknown>, createdAt: row.created_at }))),
      });
    });
  }

  async previewPurchase(profileId: string, periodId: string, itemId: string): Promise<PurchasePreview> {
    const item = catalogItem(itemId);
    return this.#executor.run(async (database) => {
      const profile = await this.#profile(database, profileId);
      const period = await this.#activePeriod(database, profileId, periodId);
      const exists = await database.getFirstAsync<Readonly<{ id: string }>>('SELECT id FROM purchase WHERE period_id = ? AND slot = ?', periodId, item.slot);
      const before = moneySnapshot(profile.available, profile.savings);
      let after: MoneySnapshot | null = null;
      let missing: Amount | null = null;
      try { after = moneySnapshot(calculateBalances({ before, [item.category === 'need' ? 'needExpense' : 'wantExpense']: item.price }).available, before.savings); }
      catch (error) { if (error instanceof DomainFailure && error.domain.code === 'INSUFFICIENT_FUNDS') missing = amount(error.domain.params?.missing ?? 0); else throw error; }
      const plan = period.confirmed_plan_json ? checkedPlan(period.confirmed_plan_json) : null;
      const spent = await database.getFirstAsync<Readonly<{ spent: number }>>(
        `SELECT COALESCE(SUM(amount), 0) AS spent FROM ledger_entry
         WHERE period_id = ? AND type = 'PURCHASE' AND json_extract(payload_snapshot, '$.category') = ?`, periodId, item.category,
      );
      const planOverrun = Boolean(plan && amount((spent?.spent ?? 0) + item.price) > plan[item.category]);
      return Object.freeze({ item, before, after, missing, occupiedSlot: Boolean(exists), planOverrun });
    });
  }

  async previewSavings(profileId: string, kind: 'deposit' | 'withdraw', value: Amount): Promise<SavingsPreview> {
    const transfer = amount(value);
    return this.#executor.run(async (database) => {
      const profile = await this.#profile(database, profileId);
      const before = moneySnapshot(profile.available, profile.savings);
      try {
        const afterBalances = calculateBalances({ before, [kind === 'deposit' ? 'deposits' : 'withdrawals']: transfer });
        return Object.freeze({ kind, amount: transfer, before, after: moneySnapshot(afterBalances.available, afterBalances.savings), missing: null });
      } catch (error) {
        if (error instanceof DomainFailure) return Object.freeze({ kind, amount: transfer, before, after: null, missing: amount(error.domain.params?.missing ?? 0) });
        throw error;
      }
    });
  }

  purchase(envelope: CommandEnvelope<'ConfirmPurchase'>, committedAt: string): Promise<CommandReceipt<PurchasePreview>> {
    return this.#moneyCommand(envelope, committedAt, async (database, profile, before) => {
      const preview = await this.previewPurchaseInside(database, envelope.meta.profileId, envelope.payload.periodId, envelope.payload.itemId, before);
      if (preview.occupiedSlot) throw failure('DAILY_SLOT_USED', { slot: preview.item.slot });
      if (!preview.after) throw failure('INSUFFICIENT_FUNDS', { missing: preview.missing ?? 0 });
      if (preview.planOverrun && !envelope.payload.acknowledgedPlanOverrun) throw failure('PLAN_OVER_BUDGET', { acknowledgementRequired: 1 });
      const revision = addCounter(counter(profile.revision), counter(1));
      const payload = Object.freeze({ item: preview.item, category: preview.item.category, slot: preview.item.slot, planOverrun: preview.planOverrun, planSnapshot: await this.planSnapshot(database, envelope.payload.periodId) });
      await database.runAsync(`INSERT INTO purchase(id, command_id, profile_id, period_id, slot, item_id, item_snapshot, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, `purchase:${envelope.meta.commandId}`, envelope.meta.commandId, envelope.meta.profileId, envelope.payload.periodId, preview.item.slot, preview.item.id, json(payload), preview.item.price, committedAt);
      await this.ledger(database, envelope, envelope.payload.periodId, 'PURCHASE', preview.item.price, -preview.item.price, 0, 'SHOP_PURCHASE', payload, committedAt);
      await database.runAsync('UPDATE wallet_projection SET available = ? WHERE profile_id = ?', preview.after.available, envelope.meta.profileId);
      if (preview.planOverrun) await database.runAsync('UPDATE period SET expense_plan_overrun = 1 WHERE id = ?', envelope.payload.periodId);
      await this.reviseAudit(database, envelope, revision, 'PURCHASE_CONFIRMED', payload, committedAt);
      return Object.freeze({ data: preview, before, after: preview.after, revision, feedback: Object.freeze({ code: 'PURCHASE_CONFIRMED', params: Object.freeze({ itemId: preview.item.id, amount: preview.item.price }), petReaction: 'happy' as const }) });
    });
  }

  selectGoal(envelope: CommandEnvelope<'SelectGoal'>, committedAt: string): Promise<CommandReceipt<Readonly<{ goal: SavingsGoal | null }>>> {
    return this.#moneyCommand(envelope, committedAt, async (database, profile, before) => {
      const goal = envelope.payload.goalId === null ? null : savingsGoal(envelope.payload.goalId);
      if (goal) {
        const claimed = await database.getFirstAsync<Readonly<{ id: string }>>('SELECT id FROM goal_claim WHERE profile_id = ? AND goal_id = ?', envelope.meta.profileId, goal.id);
        if (claimed) throw failure('GOAL_ALREADY_CLAIMED');
      }
      const revision = addCounter(counter(profile.revision), counter(1));
      await database.runAsync(`INSERT INTO goal_selection(profile_id, goal_id, selected_at, revision) VALUES (?, ?, ?, ?)
        ON CONFLICT(profile_id) DO UPDATE SET goal_id = excluded.goal_id, selected_at = excluded.selected_at, revision = excluded.revision`, envelope.meta.profileId, goal?.id ?? null, committedAt, revision);
      await this.reviseAudit(database, envelope, revision, 'GOAL_SELECTED', { goalId: goal?.id ?? null }, committedAt);
      return Object.freeze({ data: Object.freeze({ goal }), before, after: before, revision, feedback: Object.freeze({ code: 'GOAL_SELECTED', params: Object.freeze({ goalId: goal?.id ?? 'none' }), petReaction: 'thoughtful' as const }) });
    });
  }

  transfer(envelope: CommandEnvelope<'DepositSavings' | 'WithdrawSavings'>, committedAt: string): Promise<CommandReceipt<SavingsPreview>> {
    return this.#moneyCommand(envelope, committedAt, async (database, profile, before) => {
      await this.#activePeriod(database, envelope.meta.profileId, envelope.payload.periodId);
      const kind = envelope.type === 'DepositSavings' ? 'deposit' : 'withdraw';
      const preview = this.previewSavingsInside(kind, envelope.payload.amount, before);
      if (!preview.after) throw failure(kind === 'deposit' ? 'INSUFFICIENT_FUNDS' : 'INSUFFICIENT_SAVINGS', { missing: preview.missing ?? 0 });
      const revision = addCounter(counter(profile.revision), counter(1));
      const type = kind === 'deposit' ? 'SAVINGS_DEPOSIT' : 'SAVINGS_WITHDRAWAL';
      await this.ledger(database, envelope, envelope.payload.periodId, type, preview.amount, kind === 'deposit' ? -preview.amount : preview.amount, kind === 'deposit' ? preview.amount : -preview.amount, type, { kind, amount: preview.amount }, committedAt);
      await database.runAsync('UPDATE wallet_projection SET available = ?, savings = ? WHERE profile_id = ?', preview.after.available, preview.after.savings, envelope.meta.profileId);
      await this.reviseAudit(database, envelope, revision, type, { amount: preview.amount }, committedAt);
      return Object.freeze({ data: preview, before, after: preview.after, revision, feedback: Object.freeze({ code: type, params: Object.freeze({ amount: preview.amount }), petReaction: 'calm' as const }) });
    });
  }

  claimGoal(envelope: CommandEnvelope<'ClaimGoal'>, committedAt: string): Promise<CommandReceipt<Readonly<{ goal: SavingsGoal }>>> {
    return this.#moneyCommand(envelope, committedAt, async (database, profile, before) => {
      await this.#activePeriod(database, envelope.meta.profileId, envelope.payload.periodId);
      const goal = savingsGoal(envelope.payload.goalId);
      const selection = await database.getFirstAsync<GoalRow>('SELECT goal_id FROM goal_selection WHERE profile_id = ?', envelope.meta.profileId);
      if (selection?.goal_id !== goal.id) throw failure('CONTENT_INVALID', { reason: 'GOAL_NOT_SELECTED' });
      const existing = await database.getFirstAsync<Readonly<{ id: string }>>('SELECT id FROM goal_claim WHERE profile_id = ? AND goal_id = ?', envelope.meta.profileId, goal.id);
      if (existing) throw failure('GOAL_ALREADY_CLAIMED');
      if (before.savings < goal.cost) throw failure('INSUFFICIENT_SAVINGS', { missing: goal.cost - before.savings });
      const after = moneySnapshot(before.available, before.savings - goal.cost);
      const revision = addCounter(counter(profile.revision), counter(1));
      const payload = Object.freeze({ goal, costSnapshot: goal.cost, savingsSurplus: after.savings });
      await database.runAsync('INSERT INTO goal_claim(id, command_id, profile_id, goal_id, cost_snapshot, period_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', `claim:${envelope.meta.commandId}`, envelope.meta.commandId, envelope.meta.profileId, goal.id, goal.cost, envelope.payload.periodId, committedAt);
      await this.ledger(database, envelope, envelope.payload.periodId, 'GOAL_CLAIM', goal.cost, 0, -goal.cost, 'GOAL_CLAIMED', payload, committedAt);
      await database.runAsync('UPDATE wallet_projection SET savings = ? WHERE profile_id = ?', after.savings, envelope.meta.profileId);
      await database.runAsync('DELETE FROM goal_selection WHERE profile_id = ?', envelope.meta.profileId);
      await this.reviseAudit(database, envelope, revision, 'GOAL_CLAIMED', payload, committedAt);
      return Object.freeze({ data: Object.freeze({ goal }), before, after, revision, feedback: Object.freeze({ code: 'GOAL_CLAIMED', params: Object.freeze({ goalId: goal.id, amount: goal.cost }), petReaction: 'inspired' as const }) });
    });
  }

  async #moneyCommand<K extends 'ConfirmPurchase' | 'SelectGoal' | 'DepositSavings' | 'WithdrawSavings' | 'ClaimGoal', T>(envelope: CommandEnvelope<K>, committedAt: string, work: (database: SqlDatabase, profile: ProfileRow, before: MoneySnapshot) => Promise<Omit<CommandSuccess<T>, 'ok'>>): Promise<CommandReceipt<T>> {
    if (envelope.meta.mode !== this.#mode) throw failure('PROFILE_MODE_MISMATCH');
    const identity = canonicalBusinessParameters(envelope.type, envelope.meta, envelope.payload);
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        const repeated = await database.getFirstAsync<ReceiptRow>('SELECT command_id, command_type, business_identity, profile_id, mode, result_json FROM command_receipt WHERE command_id = ?', envelope.meta.commandId);
        if (repeated) {
          if (repeated.command_type !== envelope.type || repeated.profile_id !== envelope.meta.profileId || repeated.mode !== this.#mode || repeated.business_identity !== identity) throw failure('IDEMPOTENCY_CONFLICT');
          await database.execAsync('COMMIT');
          return receipt<T>(repeated);
        }
        const profile = await this.#profile(database, envelope.meta.profileId);
        if (counter(profile.revision) !== counter(envelope.meta.expectedRevision)) throw failure('STALE_STATE', undefined, true);
        const before = moneySnapshot(profile.available, profile.savings);
        const partial = await work(database, profile, before);
        const result: CommandSuccess<T> = Object.freeze({ ok: true, ...partial });
        await database.runAsync('INSERT INTO command_receipt(command_id, command_type, business_identity, profile_id, mode, result_json, committed_at) VALUES (?, ?, ?, ?, ?, ?, ?)', envelope.meta.commandId, envelope.type, identity, envelope.meta.profileId, this.#mode, json(result), committedAt);
        await database.execAsync('COMMIT');
        return Object.freeze({ commandId: envelope.meta.commandId, commandType: envelope.type, businessIdentity: identity, profileId: envelope.meta.profileId, mode: this.#mode, result });
      } catch (error) { await rollback(database); if (error instanceof DomainFailure || error instanceof TypeError) throw error; throw failure('STORAGE_WRITE_FAILED', undefined, true); }
    });
  }

  async #profile(database: SqlDatabase, profileId: string): Promise<ProfileRow> {
    const row = await database.getFirstAsync<ProfileRow>('SELECT wallet.available, wallet.savings, state.revision FROM wallet_projection AS wallet JOIN profile_state AS state ON state.profile_id = wallet.profile_id WHERE wallet.profile_id = ?', profileId);
    if (!row) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
    return row;
  }
  async #activePeriod(database: SqlDatabase, profileId: string, periodId: string): Promise<PeriodRow> {
    const row = await database.getFirstAsync<PeriodRow>('SELECT state, confirmed_plan_json, expense_plan_overrun FROM period WHERE id = ? AND profile_id = ?', periodId, profileId);
    if (!row || row.state !== 'ACTIVE') throw failure('PERIOD_NOT_ACTIVE');
    return row;
  }
  previewSavingsInside(kind: 'deposit' | 'withdraw', transfer: Amount, before: MoneySnapshot): SavingsPreview {
    try { const after = calculateBalances({ before, [kind === 'deposit' ? 'deposits' : 'withdrawals']: amount(transfer) }); return Object.freeze({ kind, amount: amount(transfer), before, after: moneySnapshot(after.available, after.savings), missing: null }); }
    catch (error) { if (error instanceof DomainFailure) return Object.freeze({ kind, amount: amount(transfer), before, after: null, missing: amount(error.domain.params?.missing ?? 0) }); throw error; }
  }
  async previewPurchaseInside(database: SqlDatabase, profileId: string, periodId: string, itemId: string, before: MoneySnapshot): Promise<PurchasePreview> {
    const item = catalogItem(itemId); const period = await this.#activePeriod(database, profileId, periodId);
    const exists = await database.getFirstAsync<Readonly<{ id: string }>>('SELECT id FROM purchase WHERE period_id = ? AND slot = ?', periodId, item.slot);
    let after: MoneySnapshot | null = null; let missing: Amount | null = null;
    try { const balances = calculateBalances({ before, [item.category === 'need' ? 'needExpense' : 'wantExpense']: item.price }); after = moneySnapshot(balances.available, balances.savings); }
    catch (error) { if (error instanceof DomainFailure && error.domain.code === 'INSUFFICIENT_FUNDS') missing = amount(error.domain.params?.missing ?? 0); else throw error; }
    const plan = period.confirmed_plan_json ? checkedPlan(period.confirmed_plan_json) : null;
    const spent = await database.getFirstAsync<Readonly<{ spent: number }>>(`SELECT COALESCE(SUM(amount), 0) AS spent FROM ledger_entry WHERE period_id = ? AND type = 'PURCHASE' AND json_extract(payload_snapshot, '$.category') = ?`, periodId, item.category);
    return Object.freeze({ item, before, after, missing, occupiedSlot: Boolean(exists), planOverrun: Boolean(plan && amount((spent?.spent ?? 0) + item.price) > plan[item.category]) });
  }
  async planSnapshot(database: SqlDatabase, periodId: string): Promise<Plan | null> { const row = await database.getFirstAsync<Readonly<{ confirmed_plan_json: string | null }>>('SELECT confirmed_plan_json FROM period WHERE id = ?', periodId); return row?.confirmed_plan_json ? checkedPlan(row.confirmed_plan_json) : null; }
  async ledger(database: SqlDatabase, envelope: CommandEnvelope, periodId: string, type: string, value: Amount, deltaAvailable: number, deltaSavings: number, reason: string, payload: unknown, createdAt: string): Promise<void> { await database.runAsync(`INSERT INTO ledger_entry(operation_id, command_id, profile_id, period_id, type, amount, delta_available, delta_savings, reason_code, payload_snapshot, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, `ledger:${envelope.meta.commandId}`, envelope.meta.commandId, envelope.meta.profileId, periodId, type, value, deltaAvailable, deltaSavings, reason, json(payload), createdAt); }
  async reviseAudit(database: SqlDatabase, envelope: CommandEnvelope, revision: Counter, eventType: string, payload: unknown, createdAt: string): Promise<void> { await database.runAsync('UPDATE profile_state SET revision = ? WHERE profile_id = ?', revision, envelope.meta.profileId); await database.runAsync(`INSERT INTO audit_event(event_id, command_id, profile_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`, `event:${envelope.meta.commandId}`, envelope.meta.commandId, envelope.meta.profileId, eventType, json(payload), createdAt); }
}
