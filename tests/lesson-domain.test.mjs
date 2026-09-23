import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LessonEvaluatorRegistry,
  completeLessonAttempt,
  evaluateLesson,
  markLessonExplanationSeen,
  revealLessonHint,
  saveLessonSolution,
  startLessonAttempt,
} from '../src/domain/lesson.ts';

const definition = Object.freeze({
  lessonId: 'test-lesson',
  contentVersion: 'test-v1',
  variantId: 'default',
  mechanic: 'allocation',
  parameters: Object.freeze({}),
  hints: Object.freeze(['Проверь сумму', 'Сравни числа']),
});

function registry() {
  return new LessonEvaluatorRegistry().register('allocation', (solution) => {
    const outcome = solution.answer === 'ok'
      ? 'meets_goal'
      : solution.answer === 'review'
        ? 'needs_review'
        : 'invalid_input';
    return Object.freeze({
      outcome,
      consequence: 'Суммы изменились в учебном примере.',
      explanation: 'Сначала сравниваем доступную сумму и выбранные части.',
      nextStep: 'Можно исправить решение или вернуться в свой день.',
      calculation: Object.freeze({ answer: solution.answer ?? null }),
    });
  });
}

const code = (expected) => (error) => error?.domain?.code === expected;

function start(state = 'ACTIVE') {
  return startLessonAttempt({
    attemptId: `attempt-${state}`,
    profileId: 'profile',
    periodId: state === 'WAITING' ? null : 'period',
    definition,
    periodState: state,
    startedAt: '2026-09-22T10:00:00.000Z',
  });
}

test('registry is extensible by mechanic and rejects accidental replacement', () => {
  const evaluators = registry();
  assert.equal(evaluators.has('allocation'), true);
  assert.equal(evaluators.has('basket'), false);
  assert.throws(
    () => evaluators.register('allocation', () => { throw new Error('unused'); }),
    /already registered/,
  );
});

test('hints do not change the answer, revision or confirm an attempt', () => {
  const drafted = saveLessonSolution(
    start(),
    Object.freeze({ answer: 'ok' }),
    '2026-09-22T10:01:00.000Z',
  );
  const hinted = revealLessonHint(drafted, 'L2', '2026-09-22T10:02:00.000Z');
  assert.deepEqual(hinted.solution, drafted.solution);
  assert.equal(hinted.solutionRevision, drafted.solutionRevision);
  assert.equal(hinted.phase, 'draft');
  assert.deepEqual(hinted.shownHints, ['L2']);
});

test('action flows through consequence, explanation and next step before completion', () => {
  const drafted = saveLessonSolution(
    start(),
    Object.freeze({ answer: 'ok' }),
    '2026-09-22T10:01:00.000Z',
  );
  const evaluated = evaluateLesson(
    drafted,
    registry(),
    'evaluation-1',
    '2026-09-22T10:02:00.000Z',
  );
  assert.equal(evaluated.evaluation.outcome, 'meets_goal');
  assert.match(evaluated.evaluation.consequence, /учебном примере/);
  assert.match(evaluated.evaluation.explanation, /сравниваем/);
  assert.match(evaluated.evaluation.nextStep, /исправить/);
  assert.throws(
    () => completeLessonAttempt(
      evaluated.attempt,
      evaluated.evaluation,
      '2026-09-22T10:03:00.000Z',
    ),
    code('EXPLANATION_REQUIRED'),
  );
  const seen = markLessonExplanationSeen(
    evaluated.attempt,
    evaluated.evaluation,
    '2026-09-22T10:03:00.000Z',
  );
  assert.equal(
    completeLessonAttempt(seen, evaluated.evaluation, '2026-09-22T10:04:00.000Z')
      .completionKind,
    'completed',
  );
});

test('reviewed unsuccessful outcome completes, invalid input never does', () => {
  const reviewedDraft = saveLessonSolution(
    start(),
    Object.freeze({ answer: 'review' }),
    '2026-09-22T10:01:00.000Z',
  );
  const reviewed = evaluateLesson(
    reviewedDraft,
    registry(),
    'evaluation-reviewed',
    '2026-09-22T10:02:00.000Z',
  );
  const reviewedSeen = markLessonExplanationSeen(
    reviewed.attempt,
    reviewed.evaluation,
    '2026-09-22T10:03:00.000Z',
  );
  assert.equal(
    completeLessonAttempt(
      reviewedSeen,
      reviewed.evaluation,
      '2026-09-22T10:04:00.000Z',
    ).completionKind,
    'reviewed',
  );

  const invalidDraft = saveLessonSolution(
    start(),
    Object.freeze({ answer: 'invalid' }),
    '2026-09-22T10:05:00.000Z',
  );
  const invalid = evaluateLesson(
    invalidDraft,
    registry(),
    'evaluation-invalid',
    '2026-09-22T10:06:00.000Z',
  );
  const invalidSeen = markLessonExplanationSeen(
    invalid.attempt,
    invalid.evaluation,
    '2026-09-22T10:07:00.000Z',
  );
  assert.throws(
    () => completeLessonAttempt(
      invalidSeen,
      invalid.evaluation,
      '2026-09-22T10:08:00.000Z',
    ),
    code('INVALID_LESSON_OUTCOME'),
  );
});

test('editing after evaluation invalidates both evaluation and explanation binding', () => {
  const drafted = saveLessonSolution(
    start(),
    Object.freeze({ answer: 'ok' }),
    '2026-09-22T10:01:00.000Z',
  );
  const evaluated = evaluateLesson(
    drafted,
    registry(),
    'evaluation-old',
    '2026-09-22T10:02:00.000Z',
  );
  const edited = saveLessonSolution(
    evaluated.attempt,
    Object.freeze({ answer: 'review' }),
    '2026-09-22T10:03:00.000Z',
  );
  assert.equal(edited.currentEvaluationId, null);
  assert.equal(edited.explanationEvaluationId, null);
  assert.throws(
    () => markLessonExplanationSeen(
      edited,
      evaluated.evaluation,
      '2026-09-22T10:04:00.000Z',
    ),
    code('EXPLANATION_REQUIRED'),
  );
});

test('reward eligibility is captured at start and cannot be upgraded later', () => {
  assert.equal(start('ACTIVE').rewardEligibleAtStart, true);
  assert.equal(start('DRAFT').rewardEligibleAtStart, false);
  assert.equal(start('CLOSED').rewardEligibleAtStart, false);
  assert.equal(start('WAITING').rewardEligibleAtStart, false);
});
