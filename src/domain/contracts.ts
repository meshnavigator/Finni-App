import type { DomainError } from './errors.ts';
import type { PeriodState, Plan } from './economy.ts';
import {
  amount,
  counter,
  requireSafeInteger,
  type Amount,
  type Counter,
} from './numeric.ts';

export type Mode = 'normal' | 'demo';
export type PetReaction = 'calm' | 'happy' | 'thoughtful' | 'inspired';

export type Clock = Readonly<{
  nowUtc: () => Date;
  calendarDate: (timeZone: string) => string;
  timeZone: () => string;
}>;

export type CommandMeta = Readonly<{
  commandId: string;
  profileId: string;
  mode: Mode;
  expectedRevision: Counter;
  sessionEpoch: Counter;
}>;

export type LifecycleMeta = Readonly<{
  commandId: string;
  mode: Mode;
  controlRevision: Counter;
  sessionEpoch: Counter;
}>;

export type MoneySnapshot = Readonly<{
  available: Amount;
  savings: Amount;
}>;

export type CommandSuccess<T> = Readonly<{
  ok: true;
  data: T;
  before: MoneySnapshot;
  after: MoneySnapshot;
  revision: Counter;
  feedback: Readonly<{
    code: string;
    params: Readonly<Record<string, string | number>>;
    petReaction: PetReaction;
  }>;
}>;

export type CommandFailureResult = Readonly<{
  ok: false;
  error: DomainError;
}>;

export type CommandResult<T> = CommandSuccess<T> | CommandFailureResult;

export type CommandPayloads = Readonly<{
  OpenPeriod: Readonly<{ calendarDate: string }>;
  UpdatePet: Readonly<{
    name: string;
    shapeId: string;
    patternId: string;
  }>;
  SavePlanDraft: Readonly<{ periodId: string; values: Plan }>;
  ConfirmPlan: Readonly<{
    periodId: string;
    values: Plan;
    acknowledgedLowNeed: boolean;
  }>;
  PreviewPurchase: Readonly<{ periodId: string; itemId: string }>;
  ConfirmPurchase: Readonly<{
    periodId: string;
    itemId: string;
    acknowledgedPlanOverrun: boolean;
  }>;
  SelectGoal: Readonly<{ goalId: string | null }>;
  DepositSavings: Readonly<{ periodId: string; amount: Amount }>;
  WithdrawSavings: Readonly<{ periodId: string; amount: Amount }>;
  ClaimGoal: Readonly<{ periodId: string; goalId: string }>;
  StartLesson: Readonly<{
    attemptId: string;
    periodId: string | null;
    lessonId: string;
    contentVersion: string;
    variantId: string;
    mechanic: string;
    parameters: Readonly<Record<string, unknown>>;
    hints: readonly [string, string];
  }>;
  SaveAttempt: Readonly<{
    attemptId: string;
    data: Readonly<Record<string, unknown>>;
  }>;
  EvaluateAttempt: Readonly<{ attemptId: string }>;
  CompleteLesson: Readonly<{
    periodId: string | null;
    attemptId: string;
    evaluationId: string;
  }>;
  AllocateAdditionalIncome: Readonly<{
    periodId: string;
    addition: Plan;
  }>;
  ClosePeriod: Readonly<{ periodId: string }>;
  AdvanceDemoDay: Readonly<Record<string, never>>;
  CorrectClock: Readonly<{ timeZone: string; correctedDate: string }>;
}>;

export type CommandName = keyof CommandPayloads;

export type CommandEnvelope<K extends CommandName = CommandName> = Readonly<{
  type: K;
  meta: CommandMeta;
  payload: CommandPayloads[K];
}>;

export type LifecyclePayloads = Readonly<{
  CreateProfile: Readonly<{
    name: string;
    shapeId: string;
    patternId: string;
    timeZone: string;
  }>;
  ResetProfile: Readonly<{ profileId: string }>;
  DeleteProfile: Readonly<{ profileId: string }>;
  SwitchMode: Readonly<{ targetMode: Mode }>;
}>;

export type LifecycleCommandName = keyof LifecyclePayloads;

export type LifecycleEnvelope<
  K extends LifecycleCommandName = LifecycleCommandName,
> = Readonly<{
  type: K;
  meta: LifecycleMeta;
  payload: LifecyclePayloads[K];
}>;

export type CommandReceipt<T = unknown> = Readonly<{
  commandId: string;
  profileId: string | null;
  mode: Mode;
  commandType: CommandName | LifecycleCommandName;
  businessIdentity: string;
  result: CommandResult<T>;
}>;

/** Persistence owns atomicity; domain owns the receipt and command shapes. */
export type RepositoryTransaction = Readonly<{
  findReceipt: (commandId: string) => Promise<CommandReceipt | null>;
  saveReceipt: (receipt: CommandReceipt) => Promise<void>;
  readPeriodState: (profileId: string) => Promise<PeriodState>;
  readRevision: (profileId: string) => Promise<Counter>;
}>;

export type Repository = Readonly<{
  transact: <T>(
    mode: Mode,
    work: (transaction: RepositoryTransaction) => Promise<T>,
  ) => Promise<T>;
}>;

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${field} must not be empty`);
  }
}

function normalizeCanonical(value: unknown): unknown {
  if (typeof value === 'number') {
    return requireSafeInteger(value);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeCanonical);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [
          key,
          normalizeCanonical((value as Record<string, unknown>)[key]),
        ]),
    );
  }
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return value;
  }

  throw new TypeError('Business parameters must be JSON-compatible');
}

/** Revision and sessionEpoch are excluded so a repeat can resolve its receipt. */
export function canonicalBusinessParameters(
  type: CommandName | LifecycleCommandName,
  meta: CommandMeta | LifecycleMeta,
  parameters: Readonly<Record<string, unknown>>,
): string {
  assertNonEmpty(type, 'type');
  assertNonEmpty(meta.commandId, 'commandId');
  if ('profileId' in meta) {
    assertNonEmpty(meta.profileId, 'profileId');
    counter(meta.expectedRevision);
  } else {
    counter(meta.controlRevision);
  }
  counter(meta.sessionEpoch);

  return JSON.stringify(
    normalizeCanonical({
      type,
      profileId: 'profileId' in meta ? meta.profileId : null,
      mode: meta.mode,
      parameters,
    }),
  );
}

export function moneySnapshot(
  available: unknown,
  savings: unknown,
): MoneySnapshot {
  return Object.freeze({
    available: amount(available),
    savings: amount(savings),
  });
}
