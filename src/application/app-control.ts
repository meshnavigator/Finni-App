import type { Mode } from '../domain/contracts.ts';
import { failure } from '../domain/errors.ts';
import { addCounter, counter, type Counter } from '../domain/numeric.ts';

export type AdminOperation = 'RESET_PROFILE' | 'DELETE_PROFILE';
export type AdminPhase =
  | 'PREPARED'
  | 'QUEUE_STOPPED'
  | 'CONNECTION_CLOSED'
  | 'DATA_REMOVED'
  | 'UI_CLEARED'
  | 'VERIFIED';

export type PendingAdminIntent = Readonly<{
  id: string;
  mode: Mode;
  operation: AdminOperation;
  phase: AdminPhase;
}>;

export type AppControl = Readonly<{
  selectedMode: Mode;
  controlRevision: Counter;
  pendingAdminIntent: PendingAdminIntent | null;
}>;

/** Storage must compare revision and replace the row in one serialized transaction. */
export type AppControlStorage = Readonly<{
  read: () => Promise<string | null>;
  replaceInTransaction: (
    expectedRevision: Counter,
    nextRevision: Counter,
    serialized: string,
  ) => Promise<boolean>;
}>;

const phases: readonly AdminPhase[] = Object.freeze([
  'PREPARED',
  'QUEUE_STOPPED',
  'CONNECTION_CLOSED',
  'DATA_REMOVED',
  'UI_CLEARED',
  'VERIFIED',
]);

function requiredText(value: string, field: string): string {
  if (value.trim().length === 0) throw new TypeError(`${field} must not be empty`);
  return value;
}

function checkedMode(value: unknown): Mode {
  if (value !== 'normal' && value !== 'demo') throw new TypeError('Invalid mode');
  return value;
}

function checkedIntent(value: unknown): PendingAdminIntent | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object') throw new TypeError('Invalid admin intent');
  const input = value as Partial<PendingAdminIntent>;
  if (input.operation !== 'RESET_PROFILE' && input.operation !== 'DELETE_PROFILE') {
    throw new TypeError('Invalid admin operation');
  }
  if (!phases.includes(input.phase as AdminPhase)) throw new TypeError('Invalid admin phase');
  return Object.freeze({
    id: requiredText(input.id ?? '', 'intent.id'),
    mode: checkedMode(input.mode),
    operation: input.operation,
    phase: input.phase as AdminPhase,
  });
}

function parseControl(serialized: string | null): AppControl {
  if (serialized === null) {
    return Object.freeze({
      selectedMode: 'normal',
      controlRevision: counter(0),
      pendingAdminIntent: null,
    });
  }
  const parsed = JSON.parse(serialized) as Partial<AppControl>;
  return Object.freeze({
    selectedMode: checkedMode(parsed.selectedMode),
    controlRevision: counter(parsed.controlRevision),
    pendingAdminIntent: checkedIntent(parsed.pendingAdminIntent),
  });
}

export class AppControlStore {
  readonly #storage: AppControlStorage;

  constructor(storage: AppControlStorage) {
    this.#storage = storage;
  }

  async load(): Promise<AppControl> {
    return parseControl(await this.#storage.read());
  }

  async #replace(
    current: AppControl,
    change: Omit<AppControl, 'controlRevision'>,
  ): Promise<AppControl> {
    const next = Object.freeze({
      ...change,
      controlRevision: addCounter(current.controlRevision, counter(1)),
    });
    const replaced = await this.#storage.replaceInTransaction(
      current.controlRevision,
      next.controlRevision,
      JSON.stringify(next),
    );
    if (!replaced) throw failure('STALE_STATE', undefined, true);
    return next;
  }

  async selectMode(mode: Mode, expectedRevision: Counter): Promise<AppControl> {
    const current = await this.load();
    if (current.controlRevision !== counter(expectedRevision)) {
      throw failure('STALE_STATE', undefined, true);
    }
    if (current.pendingAdminIntent) throw failure('ADMIN_OPERATION_PENDING');
    return this.#replace(current, {
      selectedMode: mode,
      pendingAdminIntent: null,
    });
  }

  async beginAdminIntent(
    id: string,
    mode: Mode,
    operation: AdminOperation,
    expectedRevision: Counter,
  ): Promise<AppControl> {
    const current = await this.load();
    if (current.controlRevision !== counter(expectedRevision)) {
      throw failure('STALE_STATE', undefined, true);
    }
    if (current.pendingAdminIntent) throw failure('ADMIN_OPERATION_PENDING');
    const pendingAdminIntent = Object.freeze({
      id: requiredText(id, 'intent.id'),
      mode,
      operation,
      phase: 'PREPARED' as const,
    });
    return this.#replace(current, {
      selectedMode: current.selectedMode,
      pendingAdminIntent,
    });
  }

  async advanceAdminIntent(
    id: string,
    from: AdminPhase,
    to: AdminPhase,
  ): Promise<AppControl> {
    const current = await this.load();
    const intent = current.pendingAdminIntent;
    if (!intent || intent.id !== id || intent.phase !== from) {
      throw failure('ADMIN_OPERATION_PENDING', { phase: intent?.phase ?? 'missing' });
    }
    if (phases.indexOf(to) !== phases.indexOf(from) + 1) {
      throw new TypeError('Admin phase must advance exactly once');
    }
    return this.#replace(current, {
      selectedMode: current.selectedMode,
      pendingAdminIntent: Object.freeze({ ...intent, phase: to }),
    });
  }

  async completeAdminIntent(id: string): Promise<AppControl> {
    const current = await this.load();
    const intent = current.pendingAdminIntent;
    if (!intent || intent.id !== id || intent.phase !== 'VERIFIED') {
      throw failure('ADMIN_OPERATION_PENDING', { phase: intent?.phase ?? 'missing' });
    }
    return this.#replace(current, {
      selectedMode: current.selectedMode,
      pendingAdminIntent: null,
    });
  }
}
