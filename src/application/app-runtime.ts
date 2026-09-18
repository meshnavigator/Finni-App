import { NormalClock } from '../domain/clocks.ts';
import type { Plan } from '../domain/economy.ts';
import { counter } from '../domain/numeric.ts';
import type { PetAppearance } from '../domain/pet-profile.ts';
import type { Mode } from '../domain/contracts.ts';
import type { SqlDatabase } from '../persistence/database.ts';
import { BudgetPlanRepository, type BudgetPlanSnapshot } from '../persistence/budget-plan-repository.ts';
import {
  LifecycleRepository,
  type LifecycleSnapshot,
  type RuleBundleSnapshot,
} from '../persistence/lifecycle-repository.ts';
import { migrateDatabase } from '../persistence/migrations.ts';
import {
  ProfileRepository,
  type ProfileSnapshot,
} from '../persistence/profile-repository.ts';

export type AppSnapshot = Readonly<{
  profile: ProfileSnapshot | null;
  lifecycle: LifecycleSnapshot | null;
  budget: BudgetPlanSnapshot | null;
}>;

const RULE_BUNDLE: RuleBundleSnapshot = Object.freeze({
  economyVersion: 'economy-v2',
  catalogVersion: 'bootstrap',
  goalsVersion: 'bootstrap',
});

function identifier(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export class AppRuntime {
  readonly #mode: Mode;
  readonly #profiles: ProfileRepository;
  readonly #lifecycle: LifecycleRepository;
  readonly #budgets: BudgetPlanRepository;

  private constructor(mode: Mode, database: SqlDatabase) {
    this.#mode = mode;
    this.#profiles = new ProfileRepository(mode, database);
    this.#lifecycle = new LifecycleRepository(mode, database);
    this.#budgets = new BudgetPlanRepository(mode, database);
  }

  static async initialize(mode: Mode, database: SqlDatabase): Promise<AppRuntime> {
    await migrateDatabase(database);
    return new AppRuntime(mode, database);
  }

  async close(): Promise<void> {
    await this.#profiles.close();
  }

  async load(): Promise<AppSnapshot> {
    const profile = await this.#profiles.readProfile();
    if (!profile) return Object.freeze({ profile: null, lifecycle: null, budget: null });
    const lifecycle = await this.#lifecycle.readLifecycle(
      profile.id,
      new NormalClock(profile.timeZone),
    );
    const budget = lifecycle.periodId
      ? await this.#budgets.read(profile.id, lifecycle.periodId)
      : null;
    return Object.freeze({ profile, lifecycle, budget });
  }

  async createProfile(appearance: PetAppearance): Promise<AppSnapshot> {
    const timeZone = localTimeZone();
    const clock = new NormalClock(timeZone);
    await this.#profiles.createProfile({
      appearance,
      timeZone,
      calendarDate: clock.calendarDate(),
      createdAt: clock.nowUtc().toISOString(),
    });
    return this.load();
  }

  async updatePet(
    profile: ProfileSnapshot,
    appearance: PetAppearance,
  ): Promise<AppSnapshot> {
    await this.#profiles.updatePet(profile.id, profile.revision, appearance);
    return this.load();
  }

  async openDay(snapshot: AppSnapshot): Promise<AppSnapshot> {
    if (!snapshot.profile || !snapshot.lifecycle) {
      throw new TypeError('Профиль ещё не создан');
    }
    const clock = new NormalClock(snapshot.profile.timeZone);
    await this.#lifecycle.openPeriod(
      Object.freeze({
        type: 'OpenPeriod' as const,
        meta: Object.freeze({
          commandId: identifier('open-day'),
          profileId: snapshot.profile.id,
          mode: this.#mode,
          expectedRevision: counter(snapshot.lifecycle.revision),
          sessionEpoch: counter(0),
        }),
        payload: Object.freeze({ calendarDate: clock.calendarDate() }),
      }),
      clock,
      identifier('period'),
      RULE_BUNDLE,
    );
    return this.load();
  }

  async confirmPlan(
    snapshot: AppSnapshot,
    values: Plan,
    acknowledgedLowNeed: boolean,
  ): Promise<AppSnapshot> {
    if (!snapshot.profile || !snapshot.lifecycle?.periodId) {
      throw new TypeError('Период ещё не открыт');
    }
    await this.#lifecycle.confirmPlan(
      Object.freeze({
        type: 'ConfirmPlan' as const,
        meta: Object.freeze({
          commandId: identifier('confirm-plan'),
          profileId: snapshot.profile.id,
          mode: this.#mode,
          expectedRevision: counter(snapshot.lifecycle.revision),
          sessionEpoch: counter(0),
        }),
        payload: Object.freeze({
          periodId: snapshot.lifecycle.periodId,
          values,
          acknowledgedLowNeed,
        }),
      }),
      new Date().toISOString(),
    );
    return this.load();
  }

  async allocateAdditionalIncome(
    snapshot: AppSnapshot,
    addition: Plan,
  ): Promise<AppSnapshot> {
    if (!snapshot.profile || !snapshot.lifecycle?.periodId) {
      throw new TypeError('Активный период не найден');
    }
    await this.#budgets.allocateAdditionalIncome(
      Object.freeze({
        type: 'AllocateAdditionalIncome' as const,
        meta: Object.freeze({
          commandId: identifier('allocate-income'),
          profileId: snapshot.profile.id,
          mode: this.#mode,
          expectedRevision: counter(snapshot.lifecycle.revision),
          sessionEpoch: counter(0),
        }),
        payload: Object.freeze({
          periodId: snapshot.lifecycle.periodId,
          addition,
        }),
      }),
      new Date().toISOString(),
    );
    return this.load();
  }
}
