import {
  canonicalBusinessParameters,
  type Clock,
  type CommandEnvelope,
  type CommandName,
  type CommandReceipt,
  type CommandSuccess,
  type LifecycleCommandName,
  type Mode,
  type MoneySnapshot,
} from '../domain/contracts.ts';
import {
  assertCalendarDate,
  assertTimeZone,
  nextCalendarDate,
} from '../domain/clocks.ts';
import { DomainFailure, failure } from '../domain/errors.ts';
import {
  confirmPlan,
  DAILY_INCOME,
  ECONOMY_VERSION,
  type PeriodState,
} from '../domain/economy.ts';
import {
  assertPeriodTransition,
  derivePeriodState,
  requireOpenPeriodDate,
  type StoredPeriodState,
} from '../domain/lifecycle.ts';
import {
  addCounter,
  amount,
  counter,
  safeAdd,
  type Amount,
  type Counter,
} from '../domain/numeric.ts';
import type { SqlDatabase } from './database.ts';
import { RepositoryExecutor } from './repository-executor.ts';

export type RuleBundleSnapshot = Readonly<{
  economyVersion: string;
  catalogVersion: string;
  goalsVersion: string;
}>;

export type LifecycleSnapshot = Readonly<{
  profileId: string;
  mode: Mode;
  state: PeriodState;
  revision: Counter;
  available: Amount;
  savings: Amount;
  periodId: string | null;
  periodIndex: Counter | null;
  calendarDate: string;
  timeZone: string;
  clockGeneration: Counter;
  nextEligibleDate: string | null;
  maxOpenedDate: string | null;
  ruleBundle: RuleBundleSnapshot | null;
}>;

type ReceiptRow = Readonly<{
  command_id: string;
  command_type: CommandName | LifecycleCommandName;
  business_identity: string;
  profile_id: string | null;
  mode: Mode;
  result_json: string;
}>;

type ProfileRow = Readonly<{
  profile_id: string;
  time_zone: string;
  clock_generation: number;
  virtual_date: string | null;
  next_eligible_date: string | null;
  max_opened_date: string | null;
  available: number;
  savings: number;
  revision: number;
}>;

type PeriodRow = Readonly<{
  id: string;
  period_index: number;
  calendar_date: string;
  state: StoredPeriodState;
  rule_bundle_json: string;
}>;

type CountRow = Readonly<{ count: number }>;
type MaxRow = Readonly<{ maximum: number }>;

function requiredText(value: string, field: string): string {
  if (value.trim().length === 0) throw new TypeError(`${field} must not be empty`);
  return value;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function snapshot(available: unknown, savings: unknown): MoneySnapshot {
  return Object.freeze({ available: amount(available), savings: amount(savings) });
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
    // Preserve the original failure if BEGIN itself did not complete.
  }
}

function parseRuleBundle(value: string): RuleBundleSnapshot {
  const parsed = JSON.parse(value) as Partial<RuleBundleSnapshot>;
  return Object.freeze({
    economyVersion: requiredText(parsed.economyVersion ?? '', 'economyVersion'),
    catalogVersion: requiredText(parsed.catalogVersion ?? '', 'catalogVersion'),
    goalsVersion: requiredText(parsed.goalsVersion ?? '', 'goalsVersion'),
  });
}

async function readProfile(database: SqlDatabase, profileId: string): Promise<ProfileRow> {
  const row = await database.getFirstAsync<ProfileRow>(
    `SELECT profile.id AS profile_id,
            game_clock.time_zone,
            game_clock.clock_generation,
            game_clock.virtual_date,
            game_clock.next_eligible_date,
            game_clock.max_opened_date,
            wallet_projection.available,
            wallet_projection.savings,
            profile_state.revision
     FROM profile
     JOIN game_clock ON game_clock.profile_id = profile.id
     JOIN wallet_projection ON wallet_projection.profile_id = profile.id
     JOIN profile_state ON profile_state.profile_id = profile.id
     WHERE profile.id = ?`,
    profileId,
  );
  if (!row) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
  return row;
}

async function readExistingReceipt<T>(
  database: SqlDatabase,
  envelope: CommandEnvelope,
  mode: Mode,
  identity: string,
): Promise<CommandReceipt<T> | null> {
  const row = await database.getFirstAsync<ReceiptRow>(
    `SELECT command_id, command_type, business_identity, profile_id, mode, result_json
     FROM command_receipt WHERE command_id = ?`,
    envelope.meta.commandId,
  );
  if (!row) return null;
  if (
    row.command_type !== envelope.type ||
    row.profile_id !== envelope.meta.profileId ||
    row.mode !== mode ||
    row.business_identity !== identity
  ) {
    throw failure('IDEMPOTENCY_CONFLICT');
  }
  return readReceipt<T>(row);
}

async function saveReceipt<T>(
  database: SqlDatabase,
  envelope: CommandEnvelope,
  mode: Mode,
  identity: string,
  result: CommandSuccess<T>,
  committedAt: string,
): Promise<CommandReceipt<T>> {
  await database.runAsync(
    `INSERT INTO command_receipt(
       command_id, command_type, business_identity, profile_id, mode, result_json, committed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

export class LifecycleRepository {
  readonly #mode: Mode;
  readonly #executor: RepositoryExecutor;

  constructor(mode: Mode, database: SqlDatabase) {
    this.#mode = mode;
    this.#executor = new RepositoryExecutor(database);
  }

  close(): Promise<void> {
    return this.#executor.close();
  }

  async #runTransaction<T>(work: (database: SqlDatabase) => Promise<T>): Promise<T> {
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        const result = await work(database);
        await database.execAsync('COMMIT');
        return result;
      } catch (error) {
        await rollbackQuietly(database);
        if (error instanceof DomainFailure || error instanceof TypeError) throw error;
        throw failure('STORAGE_WRITE_FAILED', undefined, true);
      }
    });
  }

  async initializeClock(profileId: string, clock: Clock): Promise<void> {
    requiredText(profileId, 'profileId');
    await this.#runTransaction(async (database) => {
      const profile = await database.getFirstAsync<{
        time_zone: string;
        clock_generation: number;
      }>(
        'SELECT time_zone, clock_generation FROM profile WHERE id = ?',
        profileId,
      );
      if (!profile) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
      const timeZone = assertTimeZone(profile.time_zone);
      const initialDate = assertCalendarDate(clock.calendarDate(timeZone));
      await database.runAsync(
        `INSERT OR IGNORE INTO game_clock(
           profile_id, time_zone, virtual_date, clock_generation,
           next_eligible_date, max_opened_date, updated_at
         ) VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
        profileId,
        timeZone,
        this.#mode === 'demo' ? initialDate : null,
        counter(profile.clock_generation),
        clock.nowUtc().toISOString(),
      );
      if (this.#mode === 'demo') {
        await database.runAsync(
          `UPDATE game_clock SET virtual_date = COALESCE(virtual_date, ?)
           WHERE profile_id = ?`,
          initialDate,
          profileId,
        );
      }
    });
  }

  async readLifecycle(profileId: string, clock: Clock): Promise<LifecycleSnapshot> {
    await this.initializeClock(profileId, clock);
    return this.#executor.run(async (database) => {
      const profile = await readProfile(database, profileId);
      const currentDate = this.#mode === 'demo'
        ? assertCalendarDate(profile.virtual_date ?? '')
        : assertCalendarDate(clock.calendarDate(profile.time_zone));
      const latest = await database.getFirstAsync<PeriodRow>(
        `SELECT id, period_index, calendar_date, state, rule_bundle_json
         FROM period WHERE profile_id = ? ORDER BY period_index DESC LIMIT 1`,
        profileId,
      );
      const open = await database.getFirstAsync<PeriodRow>(
        `SELECT id, period_index, calendar_date, state, rule_bundle_json
         FROM period WHERE profile_id = ? AND state IN ('DRAFT', 'ACTIVE') LIMIT 1`,
        profileId,
      );
      const state = derivePeriodState({
        profileExists: true,
        mode: this.#mode,
        currentDate,
        openPeriodState: open?.state === 'DRAFT' || open?.state === 'ACTIVE'
          ? open.state
          : null,
        hasClosedPeriod: latest?.state === 'CLOSED',
        maxOpenedDate: profile.max_opened_date,
        nextEligibleDate: profile.next_eligible_date,
      });
      const visible = open ?? latest;
      return Object.freeze({
        profileId,
        mode: this.#mode,
        state,
        revision: counter(profile.revision),
        available: amount(profile.available),
        savings: amount(profile.savings),
        periodId: visible?.id ?? null,
        periodIndex: visible ? counter(visible.period_index) : null,
        calendarDate: currentDate,
        timeZone: profile.time_zone,
        clockGeneration: counter(profile.clock_generation),
        nextEligibleDate: profile.next_eligible_date,
        maxOpenedDate: profile.max_opened_date,
        ruleBundle: visible ? parseRuleBundle(visible.rule_bundle_json) : null,
      });
    });
  }

  async openPeriod(
    envelope: CommandEnvelope<'OpenPeriod'>,
    clock: Clock,
    periodId: string,
    ruleBundle: RuleBundleSnapshot,
  ): Promise<CommandReceipt<Readonly<{
    periodId: string;
    periodIndex: Counter;
    calendarDate: string;
    ruleBundle: RuleBundleSnapshot;
  }>>> {
    if (envelope.meta.mode !== this.#mode) throw failure('PROFILE_MODE_MISMATCH');
    requiredText(periodId, 'periodId');
    const checkedRules = parseRuleBundle(json(ruleBundle));
    await this.initializeClock(envelope.meta.profileId, clock);
    const identity = canonicalBusinessParameters(
      envelope.type,
      envelope.meta,
      envelope.payload,
    );
    return this.#runTransaction(async (database) => {
      const repeated = await readExistingReceipt<Readonly<{
        periodId: string;
        periodIndex: Counter;
        calendarDate: string;
        ruleBundle: RuleBundleSnapshot;
      }>>(database, envelope, this.#mode, identity);
      if (repeated) return repeated;

      const profile = await readProfile(database, envelope.meta.profileId);
      if (counter(profile.revision) !== counter(envelope.meta.expectedRevision)) {
        throw failure('STALE_STATE', undefined, true);
      }
      const open = await database.getFirstAsync<PeriodRow>(
        `SELECT id, period_index, calendar_date, state, rule_bundle_json
         FROM period WHERE profile_id = ? AND state IN ('DRAFT', 'ACTIVE') LIMIT 1`,
        envelope.meta.profileId,
      );
      if (open) throw failure('PERIOD_NOT_ACTIVE', { state: open.state });
      const currentDate = this.#mode === 'demo'
        ? assertCalendarDate(profile.virtual_date ?? '')
        : assertCalendarDate(clock.calendarDate(profile.time_zone));
      if (assertCalendarDate(envelope.payload.calendarDate) !== currentDate) {
        throw failure('NEXT_DAY_NOT_AVAILABLE', { currentDate });
      }
      requireOpenPeriodDate(
        currentDate,
        profile.max_opened_date,
        profile.next_eligible_date,
      );
      const maximum = await database.getFirstAsync<MaxRow>(
        'SELECT COALESCE(MAX(period_index), 0) AS maximum FROM period WHERE profile_id = ?',
        envelope.meta.profileId,
      );
      const periodIndex = addCounter(counter(maximum?.maximum ?? 0), counter(1));
      const before = snapshot(profile.available, profile.savings);
      const after = snapshot(safeAdd(before.available, DAILY_INCOME), before.savings);
      const revision = addCounter(counter(profile.revision), counter(1));
      const committedAt = clock.nowUtc().toISOString();

      await database.runAsync(
        `INSERT INTO period(
           id, profile_id, period_index, calendar_date, clock_generation, state,
           economy_version, opened_at, rule_bundle_json
         ) VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)`,
        periodId,
        envelope.meta.profileId,
        periodIndex,
        currentDate,
        counter(profile.clock_generation),
        checkedRules.economyVersion,
        committedAt,
        json(checkedRules),
      );
      await database.runAsync(
        `INSERT INTO ledger_entry(
           operation_id, command_id, profile_id, period_id, type, amount,
           delta_available, delta_savings, reason_code, payload_snapshot, created_at
         ) VALUES (?, ?, ?, ?, 'PERIOD_INCOME', ?, ?, 0, 'DAILY_INCOME', ?, ?)`,
        `income:${envelope.meta.commandId}`,
        envelope.meta.commandId,
        envelope.meta.profileId,
        periodId,
        DAILY_INCOME,
        DAILY_INCOME,
        json({ calendarDate: currentDate, economyVersion: checkedRules.economyVersion }),
        committedAt,
      );
      await database.runAsync(
        'UPDATE wallet_projection SET available = ? WHERE profile_id = ?',
        after.available,
        envelope.meta.profileId,
      );
      await database.runAsync(
        'UPDATE profile_state SET revision = ? WHERE profile_id = ?',
        revision,
        envelope.meta.profileId,
      );
      await database.runAsync(
        `UPDATE game_clock SET max_opened_date = ?, updated_at = ? WHERE profile_id = ?`,
        currentDate,
        committedAt,
        envelope.meta.profileId,
      );
      await database.runAsync(
        `INSERT INTO audit_event(
           event_id, command_id, profile_id, event_type, payload_json, created_at
         ) VALUES (?, ?, ?, 'PERIOD_OPENED', ?, ?)`,
        `event:${envelope.meta.commandId}`,
        envelope.meta.commandId,
        envelope.meta.profileId,
        json({ periodId, periodIndex, calendarDate: currentDate }),
        committedAt,
      );
      const data = Object.freeze({
        periodId,
        periodIndex,
        calendarDate: currentDate,
        ruleBundle: checkedRules,
      });
      const result: CommandSuccess<typeof data> = Object.freeze({
        ok: true,
        data,
        before,
        after,
        revision,
        feedback: Object.freeze({
          code: 'PERIOD_INCOME_GRANTED',
          params: Object.freeze({ amount: DAILY_INCOME }),
          petReaction: 'happy',
        }),
      });
      return saveReceipt(database, envelope, this.#mode, identity, result, committedAt);
    });
  }

  confirmPlan(
    envelope: CommandEnvelope<'ConfirmPlan'>,
    committedAt: string,
  ): Promise<CommandReceipt<Readonly<{ periodId: string; state: 'ACTIVE' }>>> {
    return this.#transitionPeriod(envelope, 'DRAFT', 'ACTIVE', committedAt);
  }

  closePeriod(
    envelope: CommandEnvelope<'ClosePeriod'>,
    committedAt: string,
  ): Promise<CommandReceipt<Readonly<{ periodId: string; state: 'CLOSED' }>>> {
    return this.#transitionPeriod(envelope, 'ACTIVE', 'CLOSED', committedAt);
  }

  async #transitionPeriod<K extends 'ConfirmPlan' | 'ClosePeriod'>(
    envelope: CommandEnvelope<K>,
    from: StoredPeriodState,
    to: StoredPeriodState,
    committedAt: string,
  ): Promise<CommandReceipt<Readonly<{ periodId: string; state: K extends 'ConfirmPlan' ? 'ACTIVE' : 'CLOSED' }>>> {
    if (envelope.meta.mode !== this.#mode) throw failure('PROFILE_MODE_MISMATCH');
    assertPeriodTransition(from, to);
    const identity = canonicalBusinessParameters(envelope.type, envelope.meta, envelope.payload);
    return this.#runTransaction(async (database) => {
      type ResultData = Readonly<{
        periodId: string;
        state: K extends 'ConfirmPlan' ? 'ACTIVE' : 'CLOSED';
      }>;
      const repeated = await readExistingReceipt<ResultData>(
        database,
        envelope,
        this.#mode,
        identity,
      );
      if (repeated) return repeated;
      const profile = await readProfile(database, envelope.meta.profileId);
      if (counter(profile.revision) !== counter(envelope.meta.expectedRevision)) {
        throw failure('STALE_STATE', undefined, true);
      }
      const periodId = envelope.payload.periodId;
      const period = await database.getFirstAsync<PeriodRow>(
        `SELECT id, period_index, calendar_date, state, rule_bundle_json
         FROM period WHERE id = ? AND profile_id = ?`,
        periodId,
        envelope.meta.profileId,
      );
      if (!period || period.state !== from) throw failure('PERIOD_NOT_ACTIVE', { state: period?.state ?? 'missing' });
      if (envelope.type === 'ConfirmPlan') {
        const payload = envelope.payload as CommandEnvelope<'ConfirmPlan'>['payload'];
        confirmPlan(payload.values, amount(profile.available));
        await database.runAsync(
          `UPDATE period
           SET state = 'ACTIVE', confirmed_plan_json = ?, confirmed_at = ?,
               budget_at_confirm = ?,
               ledger_seq_at_confirm = (
                 SELECT COALESCE(MAX(seq), 0) FROM ledger_entry WHERE period_id = ?
               )
           WHERE id = ?`,
          json(payload.values),
          committedAt,
          profile.available,
          periodId,
          periodId,
        );
      } else {
        await database.runAsync(
          `UPDATE period SET state = 'CLOSED', closed_at = ? WHERE id = ?`,
          committedAt,
          periodId,
        );
      }
      const revision = addCounter(counter(profile.revision), counter(1));
      await database.runAsync(
        'UPDATE profile_state SET revision = ? WHERE profile_id = ?',
        revision,
        envelope.meta.profileId,
      );
      await database.runAsync(
        `INSERT INTO audit_event(
           event_id, command_id, profile_id, event_type, payload_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        `event:${envelope.meta.commandId}`,
        envelope.meta.commandId,
        envelope.meta.profileId,
        to === 'ACTIVE' ? 'PLAN_CONFIRMED' : 'PERIOD_CLOSED',
        json({ periodId, from, to }),
        committedAt,
      );
      const before = snapshot(profile.available, profile.savings);
      const data = Object.freeze({ periodId, state: to }) as ResultData;
      const result: CommandSuccess<ResultData> = Object.freeze({
        ok: true,
        data,
        before,
        after: before,
        revision,
        feedback: Object.freeze({
          code: to === 'ACTIVE' ? 'PLAN_CONFIRMED' : 'PERIOD_CLOSED',
          params: Object.freeze({}),
          petReaction: 'calm',
        }),
      });
      return saveReceipt(database, envelope, this.#mode, identity, result, committedAt);
    });
  }

  async advanceDemoDay(
    envelope: CommandEnvelope<'AdvanceDemoDay'>,
    committedAt: string,
  ): Promise<CommandReceipt<Readonly<{ calendarDate: string }>>> {
    if (this.#mode !== 'demo' || envelope.meta.mode !== 'demo') {
      throw failure('PROFILE_MODE_MISMATCH');
    }
    const identity = canonicalBusinessParameters(envelope.type, envelope.meta, envelope.payload);
    return this.#runTransaction(async (database) => {
      const repeated = await readExistingReceipt<Readonly<{ calendarDate: string }>>(
        database,
        envelope,
        this.#mode,
        identity,
      );
      if (repeated) return repeated;
      const profile = await readProfile(database, envelope.meta.profileId);
      if (counter(profile.revision) !== counter(envelope.meta.expectedRevision)) {
        throw failure('STALE_STATE', undefined, true);
      }
      const open = await database.getFirstAsync<CountRow>(
        `SELECT COUNT(*) AS count FROM period
         WHERE profile_id = ? AND state IN ('DRAFT', 'ACTIVE')`,
        envelope.meta.profileId,
      );
      const periods = await database.getFirstAsync<CountRow>(
        `SELECT COUNT(*) AS count FROM period WHERE profile_id = ?`,
        envelope.meta.profileId,
      );
      if ((open?.count ?? 0) !== 0 || (periods?.count ?? 0) === 0) {
        throw failure('PERIOD_NOT_ACTIVE');
      }
      const calendarDate = nextCalendarDate(profile.virtual_date ?? '');
      const revision = addCounter(counter(profile.revision), counter(1));
      await database.runAsync(
        `UPDATE game_clock SET virtual_date = ?, updated_at = ? WHERE profile_id = ?`,
        calendarDate,
        committedAt,
        envelope.meta.profileId,
      );
      await database.runAsync(
        'UPDATE profile_state SET revision = ? WHERE profile_id = ?',
        revision,
        envelope.meta.profileId,
      );
      await database.runAsync(
        `INSERT INTO audit_event(
           event_id, command_id, profile_id, event_type, payload_json, created_at
         ) VALUES (?, ?, ?, 'DEMO_DAY_ADVANCED', ?, ?)`,
        `event:${envelope.meta.commandId}`,
        envelope.meta.commandId,
        envelope.meta.profileId,
        json({ calendarDate }),
        committedAt,
      );
      const before = snapshot(profile.available, profile.savings);
      const result: CommandSuccess<Readonly<{ calendarDate: string }>> = Object.freeze({
        ok: true,
        data: Object.freeze({ calendarDate }),
        before,
        after: before,
        revision,
        feedback: Object.freeze({
          code: 'DEMO_DAY_ADVANCED',
          params: Object.freeze({ calendarDate }),
          petReaction: 'calm',
        }),
      });
      return saveReceipt(database, envelope, this.#mode, identity, result, committedAt);
    });
  }

  async correctClock(
    envelope: CommandEnvelope<'CorrectClock'>,
    committedAt: string,
  ): Promise<CommandReceipt<Readonly<{
    clockGeneration: Counter;
    nextEligibleDate: string;
    timeZone: string;
  }>>> {
    if (envelope.meta.mode !== this.#mode) throw failure('PROFILE_MODE_MISMATCH');
    const identity = canonicalBusinessParameters(envelope.type, envelope.meta, envelope.payload);
    return this.#runTransaction(async (database) => {
      type ResultData = Readonly<{
        clockGeneration: Counter;
        nextEligibleDate: string;
        timeZone: string;
      }>;
      const repeated = await readExistingReceipt<ResultData>(
        database,
        envelope,
        this.#mode,
        identity,
      );
      if (repeated) return repeated;
      const profile = await readProfile(database, envelope.meta.profileId);
      if (counter(profile.revision) !== counter(envelope.meta.expectedRevision)) {
        throw failure('STALE_STATE', undefined, true);
      }
      const open = await database.getFirstAsync<CountRow>(
        `SELECT COUNT(*) AS count FROM period
         WHERE profile_id = ? AND state IN ('DRAFT', 'ACTIVE')`,
        envelope.meta.profileId,
      );
      if ((open?.count ?? 0) !== 0) throw failure('PERIOD_NOT_ACTIVE');
      const timeZone = assertTimeZone(envelope.payload.timeZone);
      const correctedDate = assertCalendarDate(envelope.payload.correctedDate);
      const nextEligibleDate = nextCalendarDate(correctedDate);
      const clockGeneration = addCounter(counter(profile.clock_generation), counter(1));
      const revision = addCounter(counter(profile.revision), counter(1));
      await database.runAsync(
        `UPDATE game_clock
         SET time_zone = ?, virtual_date = ?, clock_generation = ?,
             next_eligible_date = ?, max_opened_date = NULL, updated_at = ?
         WHERE profile_id = ?`,
        timeZone,
        this.#mode === 'demo' ? correctedDate : null,
        clockGeneration,
        nextEligibleDate,
        committedAt,
        envelope.meta.profileId,
      );
      await database.runAsync(
        `UPDATE profile SET time_zone = ?, clock_generation = ? WHERE id = ?`,
        timeZone,
        clockGeneration,
        envelope.meta.profileId,
      );
      await database.runAsync(
        'UPDATE profile_state SET revision = ? WHERE profile_id = ?',
        revision,
        envelope.meta.profileId,
      );
      await database.runAsync(
        `INSERT INTO audit_event(
           event_id, command_id, profile_id, event_type, payload_json, created_at
         ) VALUES (?, ?, ?, 'CLOCK_CORRECTED', ?, ?)`,
        `event:${envelope.meta.commandId}`,
        envelope.meta.commandId,
        envelope.meta.profileId,
        json({ correctedDate, nextEligibleDate, timeZone, clockGeneration }),
        committedAt,
      );
      const before = snapshot(profile.available, profile.savings);
      const data = Object.freeze({ clockGeneration, nextEligibleDate, timeZone });
      const result: CommandSuccess<ResultData> = Object.freeze({
        ok: true,
        data,
        before,
        after: before,
        revision,
        feedback: Object.freeze({
          code: 'CLOCK_CORRECTED',
          params: Object.freeze({ nextEligibleDate }),
          petReaction: 'calm',
        }),
      });
      return saveReceipt(database, envelope, this.#mode, identity, result, committedAt);
    });
  }
}

export const DEFAULT_RULE_BUNDLE: RuleBundleSnapshot = Object.freeze({
  economyVersion: ECONOMY_VERSION,
  catalogVersion: 'catalog-v1',
  goalsVersion: 'goals-v1',
});
