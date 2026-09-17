import type { Mode } from '../domain/contracts.ts';
import { failure } from '../domain/errors.ts';
import { addCounter, counter, type Counter } from '../domain/numeric.ts';
import {
  AppControlStore,
  type AdminOperation,
  type AdminPhase,
  type AppControl,
  type PendingAdminIntent,
} from './app-control.ts';

export type RuntimeSession = Readonly<{
  mode: Mode;
  profileId: string | null;
  sessionEpoch: Counter;
}>;

export type RuntimeRepository = Readonly<{
  close: () => Promise<void>;
}>;

export type OpenedRuntime<R extends RuntimeRepository> = Readonly<{
  repository: R;
  profileId: string | null;
}>;

export type RuntimeFactory<R extends RuntimeRepository> = Readonly<{
  open: (mode: Mode) => Promise<OpenedRuntime<R>>;
}>;

export type AdminDataDriver = Readonly<{
  removeKnownModeData: (mode: Mode, operation: AdminOperation) => Promise<void>;
  verifyModeDataAbsent: (mode: Mode) => Promise<boolean>;
  clearUiState: (mode: Mode) => Promise<void>;
}>;

export type CoordinatorHooks = Readonly<{
  afterAdminPhase?: (phase: AdminPhase) => Promise<void> | void;
}>;

const nextPhase: Readonly<Partial<Record<AdminPhase, AdminPhase>>> = Object.freeze({
  PREPARED: 'QUEUE_STOPPED',
  QUEUE_STOPPED: 'CONNECTION_CLOSED',
  CONNECTION_CLOSED: 'DATA_REMOVED',
  DATA_REMOVED: 'UI_CLEARED',
  UI_CLEARED: 'VERIFIED',
});

export class LifecycleCoordinator<R extends RuntimeRepository> {
  readonly #control: AppControlStore;
  readonly #factory: RuntimeFactory<R>;
  readonly #admin: AdminDataDriver;
  readonly #hooks: CoordinatorHooks;
  #repository: R | null = null;
  #mode: Mode = 'normal';
  #profileId: string | null = null;
  #epoch: Counter = counter(0);
  #blocked = true;
  #tail: Promise<void> = Promise.resolve();

  constructor(
    control: AppControlStore,
    factory: RuntimeFactory<R>,
    admin: AdminDataDriver,
    hooks: CoordinatorHooks = {},
  ) {
    this.#control = control;
    this.#factory = factory;
    this.#admin = admin;
    this.#hooks = hooks;
  }

  session(): RuntimeSession {
    return Object.freeze({
      mode: this.#mode,
      profileId: this.#profileId,
      sessionEpoch: this.#epoch,
    });
  }

  async bootstrap(): Promise<RuntimeSession> {
    let control = await this.#control.load();
    this.#mode = control.selectedMode;
    this.#blocked = true;
    if (control.pendingAdminIntent) {
      control = await this.#resumeAdminIntent(control.pendingAdminIntent);
    }
    await this.#open(control.selectedMode);
    this.#epoch = addCounter(this.#epoch, counter(1));
    this.#blocked = false;
    return this.session();
  }

  submit<T>(
    captured: RuntimeSession,
    work: (repository: R) => Promise<T>,
  ): Promise<T> {
    if (this.#blocked) return Promise.reject(failure('SESSION_EXPIRED'));
    const result = this.#tail.then(async () => {
      if (
        captured.sessionEpoch !== this.#epoch ||
        captured.mode !== this.#mode ||
        captured.profileId !== this.#profileId ||
        !this.#repository
      ) {
        throw failure('SESSION_EXPIRED');
      }
      return work(this.#repository);
    });
    this.#tail = result.then(() => undefined, () => undefined);
    return result;
  }

  async switchMode(targetMode: Mode, expectedControlRevision: Counter): Promise<RuntimeSession> {
    await this.#beginBoundary();
    try {
      await this.#closeRepository();
      const control = await this.#control.selectMode(targetMode, expectedControlRevision);
      await this.#open(control.selectedMode);
      return this.session();
    } finally {
      this.#blocked = this.#repository === null;
    }
  }

  async runAdminOperation(
    intentId: string,
    operation: AdminOperation,
    expectedControlRevision: Counter,
  ): Promise<RuntimeSession> {
    await this.#beginBoundary();
    try {
      let control = await this.#control.beginAdminIntent(
        intentId,
        this.#mode,
        operation,
        expectedControlRevision,
      );
      await this.#afterPhase('PREPARED');
      control = await this.#resumeAdminIntent(control.pendingAdminIntent!);
      await this.#open(control.selectedMode);
      return this.session();
    } finally {
      this.#blocked = this.#repository === null;
    }
  }

  async #beginBoundary(): Promise<void> {
    if (this.#blocked) throw failure('ADMIN_OPERATION_PENDING');
    this.#blocked = true;
    this.#epoch = addCounter(this.#epoch, counter(1));
    await this.#tail;
  }

  async #open(mode: Mode): Promise<void> {
    const opened = await this.#factory.open(mode);
    this.#repository = opened.repository;
    this.#mode = mode;
    this.#profileId = opened.profileId;
  }

  async #closeRepository(): Promise<void> {
    const repository = this.#repository;
    this.#repository = null;
    this.#profileId = null;
    if (repository) await repository.close();
  }

  async #afterPhase(phase: AdminPhase): Promise<void> {
    await this.#hooks.afterAdminPhase?.(phase);
  }

  async #advance(
    intent: PendingAdminIntent,
    phase: AdminPhase,
  ): Promise<PendingAdminIntent> {
    const control = await this.#control.advanceAdminIntent(intent.id, intent.phase, phase);
    await this.#afterPhase(phase);
    return control.pendingAdminIntent!;
  }

  async #resumeAdminIntent(initial: PendingAdminIntent): Promise<AppControl> {
    let intent = initial;
    while (intent.phase !== 'VERIFIED') {
      switch (intent.phase) {
        case 'PREPARED':
          intent = await this.#advance(intent, nextPhase.PREPARED!);
          break;
        case 'QUEUE_STOPPED':
          await this.#closeRepository();
          intent = await this.#advance(intent, nextPhase.QUEUE_STOPPED!);
          break;
        case 'CONNECTION_CLOSED':
          await this.#admin.removeKnownModeData(intent.mode, intent.operation);
          intent = await this.#advance(intent, nextPhase.CONNECTION_CLOSED!);
          break;
        case 'DATA_REMOVED':
          await this.#admin.clearUiState(intent.mode);
          intent = await this.#advance(intent, nextPhase.DATA_REMOVED!);
          break;
        case 'UI_CLEARED':
          if (!(await this.#admin.verifyModeDataAbsent(intent.mode))) {
            throw failure('STORAGE_WRITE_FAILED', { phase: 'verify-delete' }, true);
          }
          intent = await this.#advance(intent, nextPhase.UI_CLEARED!);
          break;
      }
    }
    return this.#control.completeAdminIntent(intent.id);
  }
}
