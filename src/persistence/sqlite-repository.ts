import {
  canonicalBusinessParameters,
  type CommandEnvelope,
  type CommandName,
  type CommandReceipt,
  type CommandSuccess,
  type Mode,
  type MoneySnapshot,
  type PetReaction,
} from '../domain/contracts.ts';
import { DomainFailure, failure } from '../domain/errors.ts';
import {
  addCounter,
  amount,
  counter,
  moneyDelta,
  safeAdd,
  type Amount,
  type Counter,
  type MoneyDelta,
} from '../domain/numeric.ts';
import type { SqlDatabase, SqlValue } from './database.ts';
import { migrateDatabase } from './migrations.ts';
import { RepositoryExecutor } from './repository-executor.ts';

export type LedgerType =
  | 'PERIOD_INCOME'
  | 'LESSON_REWARD'
  | 'PURCHASE'
  | 'SAVINGS_DEPOSIT'
  | 'SAVINGS_WITHDRAWAL'
  | 'GOAL_CLAIM';

export type PersistMoneyCommand<T, K extends CommandName = CommandName> = Readonly<{
  envelope: CommandEnvelope<K>;
  operationId: string;
  periodId: string;
  ledgerType: LedgerType;
  amount: Amount;
  deltaAvailable: MoneyDelta;
  deltaSavings: MoneyDelta;
  reasonCode: string;
  payloadSnapshot: Readonly<Record<string, unknown>>;
  resultData: T;
  feedback: Readonly<{
    code: string;
    params?: Readonly<Record<string, string | number>>;
    petReaction: PetReaction;
  }>;
  audit: Readonly<{
    eventId: string;
    eventType: string;
    payload: Readonly<Record<string, unknown>>;
  }>;
  committedAt: string;
}>;

export type WalletState = Readonly<{
  available: Amount;
  savings: Amount;
  revision: Counter;
}>;

type ReceiptRow = Readonly<{
  command_id: string;
  command_type: CommandName;
  business_identity: string;
  profile_id: string | null;
  mode: Mode;
  result_json: string;
}>;

type WalletRow = Readonly<{
  available: number;
  savings: number;
  revision: number;
}>;

type LedgerSumRow = Readonly<{
  available_delta: number;
  savings_delta: number;
}>;

function requiredText(value: string, field: string): string {
  if (value.trim().length === 0) throw new TypeError(`${field} must not be empty`);
  return value;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function readReceipt(row: ReceiptRow): CommandReceipt {
  return Object.freeze({
    commandId: row.command_id,
    commandType: row.command_type,
    businessIdentity: row.business_identity,
    profileId: row.profile_id,
    mode: row.mode,
    result: JSON.parse(row.result_json) as CommandReceipt['result'],
  });
}

function snapshot(available: unknown, savings: unknown): MoneySnapshot {
  return Object.freeze({ available: amount(available), savings: amount(savings) });
}

async function rollbackQuietly(database: SqlDatabase): Promise<void> {
  try {
    await database.execAsync('ROLLBACK');
  } catch {
    // Preserve the command failure; ROLLBACK can fail only if BEGIN failed.
  }
}

export class SqliteRepository {
  readonly #mode: Mode;
  readonly #executor: RepositoryExecutor;

  constructor(mode: Mode, database: SqlDatabase) {
    this.#mode = mode;
    this.#executor = new RepositoryExecutor(database);
  }

  initialize(): Promise<number> {
    return this.#executor.run(migrateDatabase);
  }

  close(): Promise<void> {
    return this.#executor.close();
  }

  readWallet(profileId: string): Promise<WalletState> {
    requiredText(profileId, 'profileId');
    return this.#executor.run(async (database) => {
      const row = await database.getFirstAsync<WalletRow>(
        `SELECT wallet.available, wallet.savings, state.revision
         FROM wallet_projection AS wallet
         JOIN profile_state AS state ON state.profile_id = wallet.profile_id
         WHERE wallet.profile_id = ?`,
        profileId,
      );
      if (!row) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
      return Object.freeze({
        available: amount(row.available),
        savings: amount(row.savings),
        revision: counter(row.revision),
      });
    });
  }

  findReceipt(commandId: string): Promise<CommandReceipt | null> {
    requiredText(commandId, 'commandId');
    return this.#executor.run(async (database) => {
      const row = await database.getFirstAsync<ReceiptRow>(
        `SELECT command_id, command_type, business_identity, profile_id, mode, result_json
         FROM command_receipt WHERE command_id = ?`,
        commandId,
      );
      return row ? readReceipt(row) : null;
    });
  }

  async executeMoneyCommand<T, K extends CommandName>(
    command: PersistMoneyCommand<T, K>,
  ): Promise<CommandReceipt<T>> {
    if (command.envelope.meta.mode !== this.#mode) {
      throw failure('PROFILE_MODE_MISMATCH');
    }
    requiredText(command.operationId, 'operationId');
    requiredText(command.periodId, 'periodId');
    requiredText(command.reasonCode, 'reasonCode');
    requiredText(command.audit.eventId, 'audit.eventId');
    requiredText(command.audit.eventType, 'audit.eventType');
    amount(command.amount);
    moneyDelta(command.deltaAvailable);
    moneyDelta(command.deltaSavings);

    const identity = canonicalBusinessParameters(
      command.envelope.type,
      command.envelope.meta,
      command.envelope.payload,
    );

    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        const existing = await database.getFirstAsync<ReceiptRow>(
          `SELECT command_id, command_type, business_identity, profile_id, mode, result_json
           FROM command_receipt WHERE command_id = ?`,
          command.envelope.meta.commandId,
        );
        if (existing) {
          if (
            existing.command_type !== command.envelope.type ||
            existing.profile_id !== command.envelope.meta.profileId ||
            existing.mode !== this.#mode ||
            existing.business_identity !== identity
          ) {
            throw failure('IDEMPOTENCY_CONFLICT');
          }
          await database.execAsync('COMMIT');
          return readReceipt(existing) as CommandReceipt<T>;
        }

        const wallet = await database.getFirstAsync<WalletRow>(
          `SELECT wallet.available, wallet.savings, state.revision
           FROM wallet_projection AS wallet
           JOIN profile_state AS state ON state.profile_id = wallet.profile_id
           WHERE wallet.profile_id = ?`,
          command.envelope.meta.profileId,
        );
        if (!wallet) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
        const actualRevision = counter(wallet.revision);
        if (actualRevision !== counter(command.envelope.meta.expectedRevision)) {
          throw failure('STALE_STATE', undefined, true);
        }

        const before = snapshot(wallet.available, wallet.savings);
        const after = snapshot(
          safeAdd(before.available, command.deltaAvailable),
          safeAdd(before.savings, command.deltaSavings),
        );
        const revision = addCounter(actualRevision, counter(1));

        await database.runAsync(
          `INSERT INTO ledger_entry(
             operation_id, command_id, profile_id, period_id, type, amount,
             delta_available, delta_savings, reason_code, payload_snapshot, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          command.operationId,
          command.envelope.meta.commandId,
          command.envelope.meta.profileId,
          command.periodId,
          command.ledgerType,
          command.amount,
          command.deltaAvailable,
          command.deltaSavings,
          command.reasonCode,
          json(command.payloadSnapshot),
          command.committedAt,
        );
        await database.runAsync(
          `UPDATE wallet_projection SET available = ?, savings = ? WHERE profile_id = ?`,
          after.available,
          after.savings,
          command.envelope.meta.profileId,
        );
        await database.runAsync(
          `UPDATE profile_state SET revision = ? WHERE profile_id = ?`,
          revision,
          command.envelope.meta.profileId,
        );
        await database.runAsync(
          `INSERT INTO audit_event(
             event_id, command_id, profile_id, event_type, payload_json, created_at
           ) VALUES (?, ?, ?, ?, ?, ?)`,
          command.audit.eventId,
          command.envelope.meta.commandId,
          command.envelope.meta.profileId,
          command.audit.eventType,
          json(command.audit.payload),
          command.committedAt,
        );

        const result: CommandSuccess<T> = Object.freeze({
          ok: true,
          data: command.resultData,
          before,
          after,
          revision,
          feedback: Object.freeze({
            code: command.feedback.code,
            params: Object.freeze({ ...(command.feedback.params ?? {}) }),
            petReaction: command.feedback.petReaction,
          }),
        });
        await database.runAsync(
          `INSERT INTO command_receipt(
             command_id, command_type, business_identity, profile_id, mode, result_json, committed_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          command.envelope.meta.commandId,
          command.envelope.type,
          identity,
          command.envelope.meta.profileId,
          this.#mode,
          json(result),
          command.committedAt,
        );
        await database.execAsync('COMMIT');
        return Object.freeze({
          commandId: command.envelope.meta.commandId,
          commandType: command.envelope.type,
          businessIdentity: identity,
          profileId: command.envelope.meta.profileId,
          mode: this.#mode,
          result,
        });
      } catch (error) {
        await rollbackQuietly(database);
        if (error instanceof DomainFailure) throw error;
        throw failure('STORAGE_WRITE_FAILED', undefined, true);
      }
    });
  }

  verifyLedgerProjection(profileId: string): Promise<boolean> {
    requiredText(profileId, 'profileId');
    return this.#executor.run(async (database) => {
      const wallet = await database.getFirstAsync<WalletRow>(
        `SELECT wallet.available, wallet.savings, state.revision
         FROM wallet_projection AS wallet
         JOIN profile_state AS state ON state.profile_id = wallet.profile_id
         WHERE wallet.profile_id = ?`,
        profileId,
      );
      if (!wallet) return false;
      const sums = await database.getFirstAsync<LedgerSumRow>(
        `SELECT COALESCE(SUM(delta_available), 0) AS available_delta,
                COALESCE(SUM(delta_savings), 0) AS savings_delta
         FROM ledger_entry WHERE profile_id = ?`,
        profileId,
      );
      return wallet.available === (sums?.available_delta ?? 0)
        && wallet.savings === (sums?.savings_delta ?? 0);
    });
  }

  /** Read-only inspection for diagnostics and integration assertions. */
  inspect<T>(sql: string, ...params: SqlValue[]): Promise<T[]> {
    if (!/^\s*(SELECT|PRAGMA)\b/i.test(sql)) {
      return Promise.reject(new TypeError('inspect accepts read-only SQL'));
    }
    return this.#executor.run((database) => database.getAllAsync<T>(sql, ...params));
  }
}
