import { AppControlStore, type AdminOperation } from './app-control.ts';
import { AppRuntime, type AppSnapshot } from './app-runtime.ts';
import {
  LifecycleCoordinator,
  type RuntimeFactory,
  type RuntimeSession,
} from './lifecycle-coordinator.ts';
import type { Mode } from '../domain/contracts.ts';
import { createExpoAdminDataDriver } from '../persistence/expo-admin-data.ts';
import { openExpoAppControlStorage } from '../persistence/expo-control.ts';
import { openExpoDatabase } from '../persistence/expo-database.ts';
import type { PresentationPreferences, SqliteAppControlStorage } from '../persistence/app-control-sqlite.ts';

const runtimeFactory: RuntimeFactory<AppRuntime> = Object.freeze({
  async open(mode: Mode) {
    const database = await openExpoDatabase(mode);
    try {
      const repository = await AppRuntime.initialize(mode, database);
      const snapshot = await repository.load();
      return Object.freeze({ repository, profileId: snapshot.profile?.id ?? null });
    } catch (error) {
      await database.closeAsync();
      throw error;
    }
  },
});

function intentId(operation: AdminOperation): string {
  return `${operation.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ProductionAppController {
  readonly #storage: SqliteAppControlStorage;
  readonly #control: AppControlStore;
  readonly #coordinator: LifecycleCoordinator<AppRuntime>;
  #session: RuntimeSession;

  private constructor(
    storage: SqliteAppControlStorage,
    control: AppControlStore,
    coordinator: LifecycleCoordinator<AppRuntime>,
    session: RuntimeSession,
  ) {
    this.#storage = storage;
    this.#control = control;
    this.#coordinator = coordinator;
    this.#session = session;
  }

  static async initialize(
    clearUiState: (mode: Mode) => Promise<void> | void,
  ): Promise<Readonly<{
    controller: ProductionAppController;
    snapshot: AppSnapshot | null;
    startupError: unknown | null;
  }>> {
    const storage = await openExpoAppControlStorage();
    const control = new AppControlStore(storage);
    const coordinator = new LifecycleCoordinator(
      control,
      runtimeFactory,
      createExpoAdminDataDriver(clearUiState),
    );
    try {
      let session: RuntimeSession;
      try {
        session = await coordinator.bootstrap();
      } catch (startupError) {
        session = coordinator.session();
        const controller = new ProductionAppController(storage, control, coordinator, session);
        return Object.freeze({ controller, snapshot: null, startupError });
      }
      const controller = new ProductionAppController(storage, control, coordinator, session);
      return Object.freeze({ controller, snapshot: await controller.load(), startupError: null });
    } catch (error) {
      await coordinator.shutdown();
      await storage.close();
      throw error;
    }
  }

  presentationPreferences(): Promise<PresentationPreferences> {
    return this.#storage.readPresentationPreferences();
  }

  setMotionEnabled(enabled: boolean): Promise<void> {
    return this.#storage.setMotionEnabled(enabled);
  }

  setSoundEnabled(enabled: boolean): Promise<void> {
    return this.#storage.setSoundEnabled(enabled);
  }

  mode(): Mode {
    return this.#session.mode;
  }

  session(): RuntimeSession {
    return this.#session;
  }

  submit<T>(work: (runtime: AppRuntime) => Promise<T>): Promise<T> {
    return this.#coordinator.submit(this.#session, work);
  }

  load(): Promise<AppSnapshot> {
    return this.submit((runtime) => runtime.load());
  }

  async runSnapshot(work: (runtime: AppRuntime) => Promise<AppSnapshot>): Promise<AppSnapshot> {
    const captured = this.#session;
    const snapshot = await this.#coordinator.submit(captured, work);
    const profileId = snapshot.profile?.id ?? null;
    if (profileId !== captured.profileId) {
      this.#session = await this.#coordinator.synchronizeProfile(captured, profileId);
    }
    return snapshot;
  }

  async switchMode(mode: Mode): Promise<AppSnapshot> {
    const control = await this.#control.load();
    this.#session = await this.#coordinator.switchMode(mode, control.controlRevision);
    return this.load();
  }

  async runAdmin(operation: AdminOperation): Promise<AppSnapshot> {
    const control = await this.#control.load();
    this.#session = await this.#coordinator.runAdminOperation(
      intentId(operation),
      operation,
      control.controlRevision,
    );
    return this.load();
  }

  async close(): Promise<void> {
    await this.#coordinator.shutdown();
    await this.#storage.close();
  }
}
