import type { CommandEnvelope, CommandReceipt } from '../domain/contracts.ts';
import {
  evaluateLesson,
  markLessonExplanationSeen,
  revealLessonHint,
  saveLessonSolution,
  startLessonAttempt,
  type HintLevel,
  type LessonAttempt,
  type LessonDefinition,
  type LessonEvaluation,
  type LessonEvaluatorRegistry,
} from '../domain/lesson.ts';
import {
  LessonRepository,
  type LessonCompletionResult,
  type LessonDiscovery,
} from '../persistence/lesson-repository.ts';

export class LearningService {
  readonly #repository: LessonRepository;
  readonly #evaluators: LessonEvaluatorRegistry;

  constructor(
    repository: LessonRepository,
    evaluators: LessonEvaluatorRegistry,
  ) {
    this.#repository = repository;
    this.#evaluators = evaluators;
  }

  start(input: Readonly<{
    attemptId: string;
    profileId: string;
    periodId: string | null;
    periodState: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'WAITING';
    definition: LessonDefinition;
    startedAt: string;
  }>): Promise<LessonAttempt> {
    return this.#repository.createAttempt(startLessonAttempt(input));
  }

  listHomeHistory(profileId: string) { return this.#repository.listHomeHistory(profileId); }

  read(attemptId: string): Promise<LessonAttempt> {
    return this.#repository.readAttempt(attemptId);
  }

  listDiscoveries(profileId: string): Promise<readonly LessonDiscovery[]> {
    return this.#repository.listDiscoveries(profileId);
  }

  async save(
    attemptId: string,
    solution: Readonly<Record<string, unknown>>,
    updatedAt: string,
  ): Promise<LessonAttempt> {
    const previous = await this.#repository.readAttempt(attemptId);
    return this.#repository.updateAttempt(
      previous,
      saveLessonSolution(previous, solution, updatedAt),
    );
  }

  async revealHint(
    attemptId: string,
    level: HintLevel,
    updatedAt: string,
  ): Promise<Readonly<{ attempt: LessonAttempt; text: string }>> {
    const previous = await this.#repository.readAttempt(attemptId);
    const attempt = await this.#repository.updateAttempt(
      previous,
      revealLessonHint(previous, level, updatedAt),
    );
    return Object.freeze({
      attempt,
      text: previous.hints[level === 'L1' ? 0 : 1],
    });
  }

  async evaluate(
    attemptId: string,
    evaluationId: string,
    evaluatedAt: string,
  ): Promise<Readonly<{ attempt: LessonAttempt; evaluation: LessonEvaluation }>> {
    const previous = await this.#repository.readAttempt(attemptId);
    const evaluated = evaluateLesson(
      previous,
      this.#evaluators,
      evaluationId,
      evaluatedAt,
    );
    return this.#repository.saveEvaluation(
      previous,
      evaluated.attempt,
      evaluated.evaluation,
    );
  }

  async viewExplanation(
    attemptId: string,
    evaluationId: string,
    updatedAt: string,
  ): Promise<Readonly<{ attempt: LessonAttempt; evaluation: LessonEvaluation }>> {
    const previous = await this.#repository.readAttempt(attemptId);
    const evaluation = await this.#repository.readEvaluation(evaluationId);
    const attempt = await this.#repository.updateAttempt(
      previous,
      markLessonExplanationSeen(previous, evaluation, updatedAt),
    );
    return Object.freeze({ attempt, evaluation });
  }

  complete(
    envelope: CommandEnvelope<'CompleteLesson'>,
    committedAt: string,
  ): Promise<CommandReceipt<LessonCompletionResult>> {
    return this.#repository.complete(envelope, committedAt);
  }
}
