import {
  canonicalBusinessParameters,
  type CommandEnvelope,
  type CommandReceipt,
  type CommandSuccess,
  type Mode,
  type MoneySnapshot,
} from '../domain/contracts.ts';
import { LESSON_REWARD } from '../domain/economy.ts';
import { DomainFailure, failure } from '../domain/errors.ts';
import {
  completeLessonAttempt,
  type CompletionKind,
  type LessonAttempt,
  type LessonEvaluation,
  type LessonMechanic,
  type LessonOutcome,
  type LessonRewardReason,
} from '../domain/lesson.ts';
import {
  addCounter,
  amount,
  counter,
  safeAdd,
  type Amount,
} from '../domain/numeric.ts';
import type { SqlDatabase } from './database.ts';
import { RepositoryExecutor } from './repository-executor.ts';

export type LessonCompletionResult = Readonly<{
  attemptId: string;
  evaluationId: string;
  lessonId: string;
  completionKind: CompletionKind;
  outcome: Exclude<LessonOutcome, 'invalid_input'>;
  reward: Readonly<{
    granted: boolean;
    amount: Amount;
    reason: LessonRewardReason;
  }>;
}>;

/** A completed attempt and its original evaluation, never recalculated from current content. */
export type LessonDiscovery = Readonly<{
  attempt: LessonAttempt;
  evaluation: LessonEvaluation;
  completionKind: CompletionKind;
  rewardReason: LessonRewardReason;
  completedAt: string;
}>;

export type HomeLessonHistory = Readonly<{ lessonId: string; phase: LessonAttempt['phase']; sequence: number }>;

type CompletionRow = Readonly<{
  attempt_id: string;
  evaluation_id: string;
  completion_kind: CompletionKind;
  reward_reason: LessonRewardReason;
  created_at: string;
}>;

type AttemptRow = Readonly<{
  id: string;
  profile_id: string;
  period_id: string | null;
  lesson_id: string;
  content_version: string;
  variant_id: string;
  mechanic: LessonMechanic;
  parameters_json: string;
  hints_json: string;
  phase: LessonAttempt['phase'];
  solution_revision: number;
  solution_json: string;
  shown_hints_json: string;
  reward_eligible_at_start: number;
  current_evaluation_id: string | null;
  explanation_evaluation_id: string | null;
  started_at: string;
  updated_at: string;
}>;

type EvaluationRow = Readonly<{
  id: string;
  attempt_id: string;
  solution_revision: number;
  outcome: LessonOutcome;
  consequence: string;
  explanation: string;
  next_step: string;
  calculation_json: string;
  evaluated_at: string;
}>;

type ReceiptRow = Readonly<{
  command_id: string;
  command_type: 'CompleteLesson';
  business_identity: string;
  profile_id: string | null;
  mode: Mode;
  result_json: string;
}>;

type ProfileRow = Readonly<{
  available: number;
  savings: number;
  revision: number;
}>;

type PeriodRow = Readonly<{ state: 'DRAFT' | 'ACTIVE' | 'CLOSED' }>;

function json(value: unknown): string {
  return JSON.stringify(value);
}

function attemptFromRow(row: AttemptRow): LessonAttempt {
  return Object.freeze({
    attemptId: row.id,
    profileId: row.profile_id,
    periodId: row.period_id,
    lessonId: row.lesson_id,
    contentVersion: row.content_version,
    variantId: row.variant_id,
    mechanic: row.mechanic,
    parameters: Object.freeze(
      JSON.parse(row.parameters_json) as Record<string, unknown>,
    ),
    hints: Object.freeze(JSON.parse(row.hints_json) as [string, string]),
    phase: row.phase,
    solutionRevision: counter(row.solution_revision),
    solution: Object.freeze(JSON.parse(row.solution_json) as Record<string, unknown>),
    shownHints: Object.freeze(JSON.parse(row.shown_hints_json) as LessonAttempt['shownHints']),
    rewardEligibleAtStart: row.reward_eligible_at_start === 1,
    currentEvaluationId: row.current_evaluation_id,
    explanationEvaluationId: row.explanation_evaluation_id,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
  });
}

function evaluationFromRow(row: EvaluationRow): LessonEvaluation {
  return Object.freeze({
    evaluationId: row.id,
    attemptId: row.attempt_id,
    solutionRevision: counter(row.solution_revision),
    outcome: row.outcome,
    consequence: row.consequence,
    explanation: row.explanation,
    nextStep: row.next_step,
    calculation: Object.freeze(
      JSON.parse(row.calculation_json) as Record<string, unknown>,
    ),
    evaluatedAt: row.evaluated_at,
  });
}

function readReceipt(row: ReceiptRow): CommandReceipt<LessonCompletionResult> {
  return Object.freeze({
    commandId: row.command_id,
    commandType: row.command_type,
    businessIdentity: row.business_identity,
    profileId: row.profile_id,
    mode: row.mode,
    result: JSON.parse(row.result_json) as CommandReceipt<LessonCompletionResult>['result'],
  });
}

function moneySnapshot(row: ProfileRow): MoneySnapshot {
  return Object.freeze({ available: amount(row.available), savings: amount(row.savings) });
}

async function rollbackQuietly(database: SqlDatabase): Promise<void> {
  try {
    await database.execAsync('ROLLBACK');
  } catch {
    // Preserve the original failure.
  }
}

async function findAttempt(
  database: SqlDatabase,
  attemptId: string,
): Promise<AttemptRow | null> {
  return database.getFirstAsync<AttemptRow>(
    `SELECT id, profile_id, period_id, lesson_id, content_version, variant_id,
            mechanic, parameters_json, hints_json, phase, solution_revision,
            solution_json, shown_hints_json,
            reward_eligible_at_start, current_evaluation_id,
            explanation_evaluation_id, started_at, updated_at
     FROM lesson_attempt WHERE id = ?`,
    attemptId,
  );
}

async function findEvaluation(
  database: SqlDatabase,
  evaluationId: string,
): Promise<EvaluationRow | null> {
  return database.getFirstAsync<EvaluationRow>(
    `SELECT id, attempt_id, solution_revision, outcome, consequence,
            explanation, next_step, calculation_json, evaluated_at
     FROM lesson_evaluation WHERE id = ?`,
    evaluationId,
  );
}

export class LessonRepository {
  readonly #mode: Mode;
  readonly #executor: RepositoryExecutor;
  readonly #ownsExecutor: boolean;

  constructor(mode: Mode, database: SqlDatabase, executor?: RepositoryExecutor) {
    this.#mode = mode;
    this.#executor = executor ?? new RepositoryExecutor(database);
    this.#ownsExecutor = !executor;
  }

  close(): Promise<void> {
    return this.#ownsExecutor ? this.#executor.close() : Promise.resolve();
  }

  listHomeHistory(profileId: string): Promise<readonly HomeLessonHistory[]> {
    return this.#executor.run(async (database) => {
      const rows = await database.getAllAsync<Readonly<{ lesson_id: string; phase: LessonAttempt['phase']; sequence: number }>>(
        'SELECT lesson_id, phase, MAX(rowid) AS sequence FROM lesson_attempt WHERE profile_id = ? GROUP BY lesson_id, phase ORDER BY sequence DESC', profileId,
      );
      return Object.freeze(rows.map((row) => Object.freeze({ lessonId: row.lesson_id, phase: row.phase, sequence: row.sequence })));
    });
  }

  readAttempt(attemptId: string): Promise<LessonAttempt> {
    return this.#executor.run(async (database) => {
      const row = await findAttempt(database, attemptId);
      if (!row) throw failure('ATTEMPT_STALE');
      return attemptFromRow(row);
    });
  }

  readEvaluation(evaluationId: string): Promise<LessonEvaluation> {
    return this.#executor.run(async (database) => {
      const row = await findEvaluation(database, evaluationId);
      if (!row) throw failure('ATTEMPT_STALE');
      return evaluationFromRow(row);
    });
  }

  listDiscoveries(profileId: string): Promise<readonly LessonDiscovery[]> {
    return this.#executor.run(async (database) => {
      const rows = await database.getAllAsync<CompletionRow>(
        `SELECT attempt_id, evaluation_id, completion_kind, reward_reason, created_at
         FROM lesson_completion WHERE profile_id = ?
         ORDER BY created_at DESC, id DESC`,
        profileId,
      );
      const discoveries: LessonDiscovery[] = [];
      for (const row of rows) {
        const attemptRow = await findAttempt(database, row.attempt_id);
        const evaluationRow = await findEvaluation(database, row.evaluation_id);
        if (!attemptRow || !evaluationRow ||
            attemptRow.profile_id !== profileId ||
            attemptRow.phase !== 'completed' ||
            attemptRow.current_evaluation_id !== row.evaluation_id ||
            evaluationRow.attempt_id !== row.attempt_id) {
          throw failure('STORAGE_WRITE_FAILED', { entity: 'lesson_completion' });
        }
        discoveries.push(Object.freeze({
          attempt: attemptFromRow(attemptRow),
          evaluation: evaluationFromRow(evaluationRow),
          completionKind: row.completion_kind,
          rewardReason: row.reward_reason,
          completedAt: row.created_at,
        }));
      }
      return Object.freeze(discoveries);
    });
  }

  createAttempt(attempt: LessonAttempt): Promise<LessonAttempt> {
    return this.#executor.run(async (database) => {
      if (attempt.rewardEligibleAtStart) {
        const period = attempt.periodId
          ? await database.getFirstAsync<PeriodRow>(
              'SELECT state FROM period WHERE id = ? AND profile_id = ?',
              attempt.periodId,
              attempt.profileId,
            )
          : null;
        if (period?.state !== 'ACTIVE') throw failure('PERIOD_NOT_ACTIVE');
      }
      try {
        await database.runAsync(
          `INSERT INTO lesson_attempt(
             id, profile_id, period_id, lesson_id, content_version, variant_id,
             mechanic, parameters_json, hints_json, phase, solution_revision,
             solution_json, shown_hints_json,
             reward_eligible_at_start, current_evaluation_id,
             explanation_evaluation_id, started_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          attempt.attemptId,
          attempt.profileId,
          attempt.periodId,
          attempt.lessonId,
          attempt.contentVersion,
          attempt.variantId,
          attempt.mechanic,
          json(attempt.parameters),
          json(attempt.hints),
          attempt.phase,
          attempt.solutionRevision,
          json(attempt.solution),
          json(attempt.shownHints),
          attempt.rewardEligibleAtStart ? 1 : 0,
          attempt.currentEvaluationId,
          attempt.explanationEvaluationId,
          attempt.startedAt,
          attempt.updatedAt,
        );
        return attempt;
      } catch (error) {
        if (error instanceof DomainFailure || error instanceof TypeError) throw error;
        throw failure('STORAGE_WRITE_FAILED', undefined, true);
      }
    });
  }

  updateAttempt(
    previous: LessonAttempt,
    next: LessonAttempt,
  ): Promise<LessonAttempt> {
    return this.#executor.run(async (database) => {
      const result = await database.runAsync(
        `UPDATE lesson_attempt
         SET phase = ?, solution_revision = ?, solution_json = ?,
             shown_hints_json = ?, current_evaluation_id = ?,
             explanation_evaluation_id = ?, updated_at = ?
         WHERE id = ? AND profile_id = ? AND phase = ?
           AND solution_revision = ?
           AND current_evaluation_id IS ?
           AND explanation_evaluation_id IS ?`,
        next.phase,
        next.solutionRevision,
        json(next.solution),
        json(next.shownHints),
        next.currentEvaluationId,
        next.explanationEvaluationId,
        next.updatedAt,
        previous.attemptId,
        previous.profileId,
        previous.phase,
        previous.solutionRevision,
        previous.currentEvaluationId,
        previous.explanationEvaluationId,
      );
      if (result.changes !== 1) throw failure('ATTEMPT_STALE');
      return next;
    });
  }

  saveEvaluation(
    previous: LessonAttempt,
    next: LessonAttempt,
    evaluation: LessonEvaluation,
  ): Promise<Readonly<{ attempt: LessonAttempt; evaluation: LessonEvaluation }>> {
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        await database.runAsync(
          `INSERT INTO lesson_evaluation(
             id, attempt_id, solution_revision, outcome, consequence,
             explanation, next_step, calculation_json, evaluated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          evaluation.evaluationId,
          evaluation.attemptId,
          evaluation.solutionRevision,
          evaluation.outcome,
          evaluation.consequence,
          evaluation.explanation,
          evaluation.nextStep,
          json(evaluation.calculation),
          evaluation.evaluatedAt,
        );
        const result = await database.runAsync(
          `UPDATE lesson_attempt
           SET phase = ?, current_evaluation_id = ?,
               explanation_evaluation_id = NULL, updated_at = ?
           WHERE id = ? AND profile_id = ? AND phase = ?
             AND solution_revision = ? AND current_evaluation_id IS ?`,
          next.phase,
          next.currentEvaluationId,
          next.updatedAt,
          previous.attemptId,
          previous.profileId,
          previous.phase,
          previous.solutionRevision,
          previous.currentEvaluationId,
        );
        if (result.changes !== 1) throw failure('ATTEMPT_STALE');
        await database.execAsync('COMMIT');
        return Object.freeze({ attempt: next, evaluation });
      } catch (error) {
        await rollbackQuietly(database);
        if (error instanceof DomainFailure || error instanceof TypeError) throw error;
        throw failure('STORAGE_WRITE_FAILED', undefined, true);
      }
    });
  }

  complete(
    envelope: CommandEnvelope<'CompleteLesson'>,
    committedAt: string,
  ): Promise<CommandReceipt<LessonCompletionResult>> {
    if (envelope.meta.mode !== this.#mode) {
      return Promise.reject(failure('PROFILE_MODE_MISMATCH'));
    }
    const identity = canonicalBusinessParameters(
      envelope.type,
      envelope.meta,
      envelope.payload,
    );
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        const existing = await database.getFirstAsync<ReceiptRow>(
          `SELECT command_id, command_type, business_identity, profile_id,
                  mode, result_json
           FROM command_receipt WHERE command_id = ?`,
          envelope.meta.commandId,
        );
        if (existing) {
          if (
            existing.command_type !== envelope.type ||
            existing.profile_id !== envelope.meta.profileId ||
            existing.mode !== this.#mode ||
            existing.business_identity !== identity
          ) {
            throw failure('IDEMPOTENCY_CONFLICT');
          }
          await database.execAsync('COMMIT');
          return readReceipt(existing);
        }

        const attemptRow = await findAttempt(database, envelope.payload.attemptId);
        const evaluationRow = await findEvaluation(
          database,
          envelope.payload.evaluationId,
        );
        if (!attemptRow || !evaluationRow) throw failure('ATTEMPT_STALE');
        const attempt = attemptFromRow(attemptRow);
        const evaluation = evaluationFromRow(evaluationRow);
        if (
          attempt.profileId !== envelope.meta.profileId ||
          attempt.periodId !== envelope.payload.periodId
        ) {
          throw failure('ATTEMPT_STALE');
        }
        const completed = completeLessonAttempt(attempt, evaluation, committedAt);
        const profile = await database.getFirstAsync<ProfileRow>(
          `SELECT wallet.available, wallet.savings, state.revision
           FROM wallet_projection AS wallet
           JOIN profile_state AS state ON state.profile_id = wallet.profile_id
           WHERE wallet.profile_id = ?`,
          envelope.meta.profileId,
        );
        if (!profile) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
        const period = attempt.periodId
          ? await database.getFirstAsync<PeriodRow>(
              'SELECT state FROM period WHERE id = ? AND profile_id = ?',
              attempt.periodId,
              attempt.profileId,
            )
          : null;
        const rewardExists = attempt.periodId
          ? Boolean(await database.getFirstAsync<{ present: number }>(
              `SELECT 1 AS present FROM ledger_entry
               WHERE period_id = ? AND type = 'LESSON_REWARD'`,
              attempt.periodId,
            ))
          : false;
        const reason: LessonRewardReason = !attempt.rewardEligibleAtStart
          ? 'TRAINING'
          : period?.state !== 'ACTIVE'
            ? 'PERIOD_NOT_ACTIVE'
            : rewardExists
              ? 'ALREADY_GRANTED'
              : 'GRANTED';
        const granted = reason === 'GRANTED';
        const actualRevision = counter(profile.revision);
        if (
          granted &&
          actualRevision !== counter(envelope.meta.expectedRevision)
        ) {
          throw failure('STALE_STATE', undefined, true);
        }

        const before = moneySnapshot(profile);
        const after = Object.freeze({
          available: granted
            ? amount(safeAdd(before.available, amount(LESSON_REWARD)))
            : before.available,
          savings: before.savings,
        });
        const revision = granted
          ? addCounter(actualRevision, counter(1))
          : actualRevision;
        if (granted && attempt.periodId) {
          await database.runAsync(
            `INSERT INTO ledger_entry(
               operation_id, command_id, profile_id, period_id, type, amount,
               delta_available, delta_savings, reason_code,
               payload_snapshot, created_at
             ) VALUES (?, ?, ?, ?, 'LESSON_REWARD', ?, ?, 0,
               'LESSON_COMPLETED', ?, ?)`,
            `lesson-reward:${attempt.periodId}`,
            envelope.meta.commandId,
            attempt.profileId,
            attempt.periodId,
            LESSON_REWARD,
            LESSON_REWARD,
            json({
              attemptId: attempt.attemptId,
              evaluationId: evaluation.evaluationId,
              lessonId: attempt.lessonId,
            }),
            committedAt,
          );
          await database.runAsync(
            'UPDATE wallet_projection SET available = ? WHERE profile_id = ?',
            after.available,
            attempt.profileId,
          );
          await database.runAsync(
            'UPDATE profile_state SET revision = ? WHERE profile_id = ?',
            revision,
            attempt.profileId,
          );
        }

        const outcome = evaluation.outcome as Exclude<LessonOutcome, 'invalid_input'>;
        const data: LessonCompletionResult = Object.freeze({
          attemptId: attempt.attemptId,
          evaluationId: evaluation.evaluationId,
          lessonId: attempt.lessonId,
          completionKind: completed.completionKind,
          outcome,
          reward: Object.freeze({
            granted,
            amount: amount(granted ? LESSON_REWARD : 0),
            reason,
          }),
        });
        const result: CommandSuccess<LessonCompletionResult> = Object.freeze({
          ok: true,
          data,
          before,
          after,
          revision,
          feedback: Object.freeze({
            code: granted ? 'LESSON_REWARD_GRANTED' : `LESSON_${reason}`,
            params: Object.freeze({}),
            petReaction: 'happy',
          }),
        });
        await database.runAsync(
          `INSERT INTO command_receipt(
             command_id, command_type, business_identity, profile_id,
             mode, result_json, committed_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          envelope.meta.commandId,
          envelope.type,
          identity,
          envelope.meta.profileId,
          this.#mode,
          json(result),
          committedAt,
        );
        await database.runAsync(
          `INSERT INTO lesson_completion(
             id, command_id, attempt_id, evaluation_id, profile_id, period_id,
             lesson_id, completion_kind, outcome, reward_granted,
             reward_amount, reward_reason, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          `completion:${envelope.meta.commandId}`,
          envelope.meta.commandId,
          attempt.attemptId,
          evaluation.evaluationId,
          attempt.profileId,
          attempt.periodId,
          attempt.lessonId,
          completed.completionKind,
          outcome,
          granted ? 1 : 0,
          granted ? LESSON_REWARD : 0,
          reason,
          committedAt,
        );
        await database.runAsync(
          `UPDATE lesson_attempt
           SET phase = 'completed', completed_at = ?, updated_at = ?
           WHERE id = ? AND phase = 'explanation_seen'
             AND current_evaluation_id = ?
             AND explanation_evaluation_id = ?`,
          committedAt,
          committedAt,
          attempt.attemptId,
          evaluation.evaluationId,
          evaluation.evaluationId,
        );
        await database.runAsync(
          `INSERT INTO audit_event(
             event_id, command_id, profile_id, event_type,
             payload_json, created_at
           ) VALUES (?, ?, ?, 'LESSON_COMPLETED', ?, ?)`,
          `event:${envelope.meta.commandId}`,
          envelope.meta.commandId,
          attempt.profileId,
          json(data),
          committedAt,
        );
        await database.execAsync('COMMIT');
        return Object.freeze({
          commandId: envelope.meta.commandId,
          commandType: envelope.type,
          businessIdentity: identity,
          profileId: envelope.meta.profileId,
          mode: this.#mode,
          result,
        });
      } catch (error) {
        await rollbackQuietly(database);
        if (error instanceof DomainFailure || error instanceof TypeError) throw error;
        throw failure('STORAGE_WRITE_FAILED', undefined, true);
      }
    });
  }
}
