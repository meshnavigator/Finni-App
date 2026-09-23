import { failure } from './errors.ts';

export const LESSON_MECHANICS = [
  'allocation',
  'basket',
  'savings',
  'receipt_audit',
  'resource_choice',
] as const;

export type LessonMechanic = (typeof LESSON_MECHANICS)[number];
export type LessonOutcome =
  | 'meets_goal'
  | 'valid_alternative'
  | 'needs_review'
  | 'invalid_input';
export type HintLevel = 'L1' | 'L2';
export type AttemptPhase =
  | 'draft'
  | 'evaluated'
  | 'explanation_seen'
  | 'completed'
  | 'archived';
export type CompletionKind = 'completed' | 'reviewed';
export type LessonRewardReason =
  | 'GRANTED'
  | 'TRAINING'
  | 'PERIOD_NOT_ACTIVE'
  | 'ALREADY_GRANTED';

export type LessonActionResult = Readonly<{
  outcome: LessonOutcome;
  consequence: string;
  explanation: string;
  nextStep: string;
  calculation: Readonly<Record<string, unknown>>;
}>;

export type LessonEvaluator = (
  solution: Readonly<Record<string, unknown>>,
  parameters: Readonly<Record<string, unknown>>,
) => LessonActionResult;

export type LessonDefinition = Readonly<{
  lessonId: string;
  contentVersion: string;
  variantId: string;
  mechanic: LessonMechanic;
  parameters: Readonly<Record<string, unknown>>;
  hints: readonly [string, string];
}>;

export type LessonAttempt = Readonly<{
  attemptId: string;
  profileId: string;
  periodId: string | null;
  lessonId: string;
  contentVersion: string;
  variantId: string;
  mechanic: LessonMechanic;
  parameters: Readonly<Record<string, unknown>>;
  hints: readonly [string, string];
  phase: AttemptPhase;
  solutionRevision: number;
  solution: Readonly<Record<string, unknown>>;
  shownHints: readonly HintLevel[];
  rewardEligibleAtStart: boolean;
  currentEvaluationId: string | null;
  explanationEvaluationId: string | null;
  startedAt: string;
  updatedAt: string;
}>;

export type LessonEvaluation = Readonly<{
  evaluationId: string;
  attemptId: string;
  solutionRevision: number;
  outcome: LessonOutcome;
  consequence: string;
  explanation: string;
  nextStep: string;
  calculation: Readonly<Record<string, unknown>>;
  evaluatedAt: string;
}>;

function requiredText(value: string, field: string): string {
  if (value.trim().length === 0) throw new TypeError(`${field} must not be empty`);
  return value;
}

function immutableRecord(
  value: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...value });
}

function assertCurrentEvaluation(
  attempt: LessonAttempt,
  evaluation: LessonEvaluation,
): void {
  if (
    evaluation.attemptId !== attempt.attemptId ||
    evaluation.evaluationId !== attempt.currentEvaluationId ||
    evaluation.solutionRevision !== attempt.solutionRevision
  ) {
    throw failure('ATTEMPT_STALE');
  }
}

export class LessonEvaluatorRegistry {
  readonly #evaluators = new Map<LessonMechanic, LessonEvaluator>();

  register(mechanic: LessonMechanic, evaluator: LessonEvaluator): this {
    if (this.#evaluators.has(mechanic)) {
      throw new TypeError(`Evaluator already registered for ${mechanic}`);
    }
    this.#evaluators.set(mechanic, evaluator);
    return this;
  }

  evaluate(
    mechanic: LessonMechanic,
    solution: Readonly<Record<string, unknown>>,
    parameters: Readonly<Record<string, unknown>>,
  ): LessonActionResult {
    const evaluator = this.#evaluators.get(mechanic);
    if (!evaluator) throw failure('CONTENT_INVALID', { mechanic });
    const result = evaluator(immutableRecord(solution), immutableRecord(parameters));
    requiredText(result.consequence, 'consequence');
    requiredText(result.explanation, 'explanation');
    requiredText(result.nextStep, 'nextStep');
    return Object.freeze({
      ...result,
      calculation: immutableRecord(result.calculation),
    });
  }

  has(mechanic: LessonMechanic): boolean {
    return this.#evaluators.has(mechanic);
  }
}

export function startLessonAttempt(input: Readonly<{
  attemptId: string;
  profileId: string;
  periodId: string | null;
  definition: LessonDefinition;
  periodState: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'WAITING';
  startedAt: string;
}>): LessonAttempt {
  requiredText(input.attemptId, 'attemptId');
  requiredText(input.profileId, 'profileId');
  requiredText(input.definition.lessonId, 'lessonId');
  requiredText(input.definition.contentVersion, 'contentVersion');
  requiredText(input.definition.variantId, 'variantId');
  requiredText(input.startedAt, 'startedAt');
  if (input.periodState === 'ACTIVE' && input.periodId === null) {
    throw new TypeError('periodId is required for an ACTIVE lesson');
  }
  return Object.freeze({
    attemptId: input.attemptId,
    profileId: input.profileId,
    periodId: input.periodId,
    lessonId: input.definition.lessonId,
    contentVersion: input.definition.contentVersion,
    variantId: input.definition.variantId,
    mechanic: input.definition.mechanic,
    parameters: immutableRecord(input.definition.parameters),
    hints: Object.freeze([...input.definition.hints]) as readonly [string, string],
    phase: 'draft',
    solutionRevision: 0,
    solution: input.definition.mechanic === 'allocation' &&
      typeof input.definition.parameters.initialPlan === 'object' &&
      input.definition.parameters.initialPlan !== null &&
      !Array.isArray(input.definition.parameters.initialPlan)
      ? immutableRecord(input.definition.parameters.initialPlan as Readonly<Record<string, unknown>>)
      : Object.freeze({}),
    shownHints: Object.freeze([]),
    rewardEligibleAtStart: input.periodState === 'ACTIVE',
    currentEvaluationId: null,
    explanationEvaluationId: null,
    startedAt: input.startedAt,
    updatedAt: input.startedAt,
  });
}

export function saveLessonSolution(
  attempt: LessonAttempt,
  solution: Readonly<Record<string, unknown>>,
  updatedAt: string,
): LessonAttempt {
  if (attempt.phase === 'completed' || attempt.phase === 'archived') {
    throw failure('ATTEMPT_STALE');
  }
  requiredText(updatedAt, 'updatedAt');
  return Object.freeze({
    ...attempt,
    phase: 'draft',
    solutionRevision: attempt.solutionRevision + 1,
    solution: immutableRecord(solution),
    currentEvaluationId: null,
    explanationEvaluationId: null,
    updatedAt,
  });
}

export function revealLessonHint(
  attempt: LessonAttempt,
  level: HintLevel,
  updatedAt: string,
): LessonAttempt {
  if (attempt.phase === 'completed' || attempt.phase === 'archived') {
    throw failure('ATTEMPT_STALE');
  }
  requiredText(updatedAt, 'updatedAt');
  const shownHints = attempt.shownHints.includes(level)
    ? attempt.shownHints
    : Object.freeze([...attempt.shownHints, level]);
  return Object.freeze({ ...attempt, shownHints, updatedAt });
}

export function evaluateLesson(
  attempt: LessonAttempt,
  registry: LessonEvaluatorRegistry,
  evaluationId: string,
  evaluatedAt: string,
): Readonly<{ attempt: LessonAttempt; evaluation: LessonEvaluation }> {
  if (attempt.phase !== 'draft') throw failure('ATTEMPT_STALE');
  requiredText(evaluationId, 'evaluationId');
  requiredText(evaluatedAt, 'evaluatedAt');
  const action = registry.evaluate(
    attempt.mechanic,
    attempt.solution,
    attempt.parameters,
  );
  const evaluation: LessonEvaluation = Object.freeze({
    evaluationId,
    attemptId: attempt.attemptId,
    solutionRevision: attempt.solutionRevision,
    outcome: action.outcome,
    consequence: action.consequence,
    explanation: action.explanation,
    nextStep: action.nextStep,
    calculation: action.calculation,
    evaluatedAt,
  });
  return Object.freeze({
    evaluation,
    attempt: Object.freeze({
      ...attempt,
      phase: 'evaluated',
      currentEvaluationId: evaluationId,
      explanationEvaluationId: null,
      updatedAt: evaluatedAt,
    }),
  });
}

export function markLessonExplanationSeen(
  attempt: LessonAttempt,
  evaluation: LessonEvaluation,
  updatedAt: string,
): LessonAttempt {
  if (attempt.phase !== 'evaluated' && attempt.phase !== 'explanation_seen') {
    throw failure('EXPLANATION_REQUIRED');
  }
  assertCurrentEvaluation(attempt, evaluation);
  requiredText(updatedAt, 'updatedAt');
  return Object.freeze({
    ...attempt,
    phase: 'explanation_seen',
    explanationEvaluationId: evaluation.evaluationId,
    updatedAt,
  });
}

export function completeLessonAttempt(
  attempt: LessonAttempt,
  evaluation: LessonEvaluation,
  updatedAt: string,
): Readonly<{ attempt: LessonAttempt; completionKind: CompletionKind }> {
  assertCurrentEvaluation(attempt, evaluation);
  if (
    attempt.phase !== 'explanation_seen' ||
    attempt.explanationEvaluationId !== evaluation.evaluationId
  ) {
    throw failure('EXPLANATION_REQUIRED');
  }
  if (evaluation.outcome === 'invalid_input') {
    throw failure('INVALID_LESSON_OUTCOME');
  }
  requiredText(updatedAt, 'updatedAt');
  return Object.freeze({
    completionKind: evaluation.outcome === 'needs_review' ? 'reviewed' : 'completed',
    attempt: Object.freeze({ ...attempt, phase: 'completed', updatedAt }),
  });
}
