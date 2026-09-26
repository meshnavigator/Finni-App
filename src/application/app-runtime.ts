import { NormalClock } from '../domain/clocks.ts';
import type { Plan } from '../domain/economy.ts';
import { counter, positiveAmount } from '../domain/numeric.ts';
import type { PetAppearance } from '../domain/pet-profile.ts';
import type { CommandReceipt, Mode } from '../domain/contracts.ts';
import type { SqlDatabase } from '../persistence/database.ts';
import { BudgetPlanRepository, type BudgetPlanSnapshot } from '../persistence/budget-plan-repository.ts';
import { CommerceRepository, type CommerceSnapshot } from '../persistence/commerce-repository.ts';
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
import { RepositoryExecutor } from '../persistence/repository-executor.ts';
import { LessonRepository, type HomeLessonHistory } from '../persistence/lesson-repository.ts';
import { LearningService } from './learning-service.ts';
import {
  LessonEvaluatorRegistry,
  type HintLevel,
  type LessonAttempt,
  type LessonDefinition,
} from '../domain/lesson.ts';
import { evaluateAllocation, evaluateBasket } from '../lessons/budget-purchase-lessons.ts';
import { evaluateReceiptAudit, evaluateResourceChoice } from '../lessons/receipt-workshop-lessons.ts';
import { evaluateSavings } from '../domain/savings-lesson.ts';

export type AppSnapshot = Readonly<{
  profile: ProfileSnapshot | null;
  lifecycle: LifecycleSnapshot | null;
  budget: BudgetPlanSnapshot | null;
  commerce: CommerceSnapshot | null;
  homeLessons?: readonly HomeLessonHistory[];
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
  readonly #commerce: CommerceRepository;
  readonly #learning: LearningService;
  readonly #executor: RepositoryExecutor;

  private constructor(mode: Mode, database: SqlDatabase) {
    this.#mode = mode;
    this.#executor = new RepositoryExecutor(database);
    this.#profiles = new ProfileRepository(mode, database, this.#executor);
    this.#lifecycle = new LifecycleRepository(mode, database, this.#executor);
    this.#budgets = new BudgetPlanRepository(mode, database, this.#executor);
    this.#commerce = new CommerceRepository(mode, database, this.#executor);
    const evaluators = new LessonEvaluatorRegistry()
      .register('allocation', evaluateAllocation)
      .register('basket', evaluateBasket)
      .register('savings', evaluateSavings)
      .register('receipt_audit', evaluateReceiptAudit)
      .register('resource_choice', evaluateResourceChoice);
    this.#learning = new LearningService(
      new LessonRepository(mode, database, this.#executor),
      evaluators,
    );
  }

  static async initialize(mode: Mode, database: SqlDatabase): Promise<AppRuntime> {
    await migrateDatabase(database);
    return new AppRuntime(mode, database);
  }

  async close(): Promise<void> {
    await this.#executor.close();
  }

  startLesson(snapshot: AppSnapshot, definition: LessonDefinition): Promise<LessonAttempt> {
    if (!snapshot.profile) throw new TypeError('Профиль ещё не создан');
    const state = snapshot.lifecycle?.state;
    const periodState = state === 'DRAFT' || state === 'ACTIVE' || state === 'CLOSED' || state === 'WAITING'
      ? state
      : 'WAITING';
    return this.#learning.start({
      attemptId: identifier('lesson'),
      profileId: snapshot.profile.id,
      periodId: snapshot.lifecycle?.periodId ?? null,
      periodState,
      definition,
      startedAt: new Date().toISOString(),
    });
  }

  listLessonDiscoveries(profileId: string) {
    return this.#learning.listDiscoveries(profileId);
  }

  saveLesson(attemptId: string, solution: Readonly<Record<string, unknown>>): Promise<LessonAttempt> {
    return this.#learning.save(attemptId, solution, new Date().toISOString());
  }

  revealLessonHint(attemptId: string, level: HintLevel) {
    return this.#learning.revealHint(attemptId, level, new Date().toISOString());
  }

  evaluateLesson(attemptId: string) {
    return this.#learning.evaluate(attemptId, identifier('lesson-evaluation'), new Date().toISOString());
  }

  viewLessonExplanation(attemptId: string, evaluationId: string) {
    return this.#learning.viewExplanation(attemptId, evaluationId, new Date().toISOString());
  }

  completeLesson(snapshot: AppSnapshot, attemptId: string, evaluationId: string) {
    if (!snapshot.profile) throw new TypeError('Профиль ещё не создан');
    return this.#learning.complete(Object.freeze({
      type: 'CompleteLesson' as const,
      meta: Object.freeze({
        commandId: identifier('complete-lesson'),
        profileId: snapshot.profile.id,
        mode: this.#mode,
        expectedRevision: snapshot.lifecycle?.revision ?? counter(0),
        sessionEpoch: counter(0),
      }),
      payload: Object.freeze({
        periodId: snapshot.lifecycle?.periodId ?? null,
        attemptId,
        evaluationId,
      }),
    }), new Date().toISOString());
  }

  async load(): Promise<AppSnapshot> {
    const profile = await this.#profiles.readProfile();
    if (!profile) return Object.freeze({ profile: null, lifecycle: null, budget: null, commerce: null });
    const lifecycle = await this.#lifecycle.readLifecycle(
      profile.id,
      new NormalClock(profile.timeZone),
    );
    const budget = lifecycle.periodId
      ? await this.#budgets.read(profile.id, lifecycle.periodId)
      : null;
    const commerce = await this.#commerce.read(profile.id, lifecycle.periodId);
    const homeLessons = await this.#learning.listHomeHistory(profile.id);
    return Object.freeze({ profile, lifecycle, budget, commerce, homeLessons });
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

  async closePeriod(snapshot: AppSnapshot): Promise<AppSnapshot> {
    await this.closePeriodReceipt(snapshot);
    return this.load();
  }

  closePeriodReceipt(snapshot: AppSnapshot): Promise<CommandReceipt> {
    if (!snapshot.profile || !snapshot.lifecycle?.periodId) throw new TypeError('Активный период не найден');
    return this.#lifecycle.closePeriod(Object.freeze({
      type: 'ClosePeriod' as const,
      meta: Object.freeze({ commandId: identifier('close-period'), profileId: snapshot.profile.id, mode: this.#mode, expectedRevision: counter(snapshot.lifecycle.revision), sessionEpoch: counter(0) }),
      payload: Object.freeze({ periodId: snapshot.lifecycle.periodId }),
    }), new Date().toISOString());
  }

  async previewPurchase(snapshot: AppSnapshot, itemId: string) {
    if (!snapshot.profile || !snapshot.lifecycle?.periodId) throw new TypeError('Активный период не найден');
    return this.#commerce.previewPurchase(snapshot.profile.id, snapshot.lifecycle.periodId, itemId);
  }

  async previewSavings(snapshot: AppSnapshot, kind: 'deposit' | 'withdraw', value: number) {
    if (!snapshot.profile) throw new TypeError('Профиль не найден');
    return this.#commerce.previewSavings(snapshot.profile.id, kind, positiveAmount(value));
  }

  async purchase(snapshot: AppSnapshot, itemId: string, acknowledgedPlanOverrun: boolean): Promise<AppSnapshot> {
    await this.purchaseReceipt(snapshot, itemId, acknowledgedPlanOverrun);
    return this.load();
  }

  purchaseReceipt(snapshot: AppSnapshot, itemId: string, acknowledgedPlanOverrun: boolean): Promise<CommandReceipt> {
    if (!snapshot.profile || !snapshot.lifecycle?.periodId) throw new TypeError('Активный период не найден');
    return this.#commerce.purchase(Object.freeze({
      type: 'ConfirmPurchase' as const,
      meta: Object.freeze({ commandId: identifier('purchase'), profileId: snapshot.profile.id, mode: this.#mode, expectedRevision: counter(snapshot.lifecycle.revision), sessionEpoch: counter(0) }),
      payload: Object.freeze({ periodId: snapshot.lifecycle.periodId, itemId, acknowledgedPlanOverrun }),
    }), new Date().toISOString());
  }

  async selectGoal(snapshot: AppSnapshot, goalId: string | null): Promise<AppSnapshot> {
    await this.selectGoalReceipt(snapshot, goalId);
    return this.load();
  }

  selectGoalReceipt(snapshot: AppSnapshot, goalId: string | null): Promise<CommandReceipt> {
    if (!snapshot.profile || !snapshot.lifecycle) throw new TypeError('Профиль не найден');
    return this.#commerce.selectGoal(Object.freeze({
      type: 'SelectGoal' as const,
      meta: Object.freeze({ commandId: identifier('goal'), profileId: snapshot.profile.id, mode: this.#mode, expectedRevision: counter(snapshot.lifecycle.revision), sessionEpoch: counter(0) }),
      payload: Object.freeze({ goalId }),
    }), new Date().toISOString());
  }

  async depositSavings(snapshot: AppSnapshot, value: number): Promise<AppSnapshot> {
    return this.transferSavings(snapshot, 'DepositSavings', value);
  }

  depositSavingsReceipt(snapshot: AppSnapshot, value: number): Promise<CommandReceipt> {
    return this.transferSavingsReceipt(snapshot, 'DepositSavings', value);
  }

  async withdrawSavings(snapshot: AppSnapshot, value: number): Promise<AppSnapshot> {
    return this.transferSavings(snapshot, 'WithdrawSavings', value);
  }

  withdrawSavingsReceipt(snapshot: AppSnapshot, value: number): Promise<CommandReceipt> {
    return this.transferSavingsReceipt(snapshot, 'WithdrawSavings', value);
  }

  async claimGoal(snapshot: AppSnapshot, goalId: string): Promise<AppSnapshot> {
    await this.claimGoalReceipt(snapshot, goalId);
    return this.load();
  }

  claimGoalReceipt(snapshot: AppSnapshot, goalId: string): Promise<CommandReceipt> {
    if (!snapshot.profile || !snapshot.lifecycle?.periodId) throw new TypeError('Активный период не найден');
    return this.#commerce.claimGoal(Object.freeze({
      type: 'ClaimGoal' as const,
      meta: Object.freeze({ commandId: identifier('claim-goal'), profileId: snapshot.profile.id, mode: this.#mode, expectedRevision: counter(snapshot.lifecycle.revision), sessionEpoch: counter(0) }),
      payload: Object.freeze({ periodId: snapshot.lifecycle.periodId, goalId }),
    }), new Date().toISOString());
  }

  async history(snapshot: AppSnapshot): Promise<CommerceSnapshot['history']> {
    if (!snapshot.profile) throw new TypeError('Профиль не найден');
    return (await this.#commerce.read(snapshot.profile.id, snapshot.lifecycle?.periodId ?? null)).history;
  }

  private async transferSavings(
    snapshot: AppSnapshot,
    type: 'DepositSavings' | 'WithdrawSavings',
    value: number,
  ): Promise<AppSnapshot> {
    await this.transferSavingsReceipt(snapshot, type, value);
    return this.load();
  }

  private transferSavingsReceipt(
    snapshot: AppSnapshot,
    type: 'DepositSavings' | 'WithdrawSavings',
    value: number,
  ): Promise<CommandReceipt> {
    if (!snapshot.profile || !snapshot.lifecycle?.periodId) throw new TypeError('Активный период не найден');
    const transfer = positiveAmount(value);
    return this.#commerce.transfer(Object.freeze({
      type,
      meta: Object.freeze({ commandId: identifier(type === 'DepositSavings' ? 'deposit' : 'withdraw'), profileId: snapshot.profile.id, mode: this.#mode, expectedRevision: counter(snapshot.lifecycle.revision), sessionEpoch: counter(0) }),
      payload: Object.freeze({ periodId: snapshot.lifecycle.periodId, amount: transfer }),
    }), new Date().toISOString());
  }

}
