import { LESSON_REWARD } from '../domain/economy.ts';

const counterCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} >= 0 AND ${column} <= ${Number.MAX_SAFE_INTEGER}`;

/** S3 lesson attempts, immutable evaluations, completions and reward binding. */
export const SCHEMA_V6 = `
CREATE TABLE lesson_attempt (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  period_id TEXT REFERENCES period(id) ON DELETE SET NULL,
  lesson_id TEXT NOT NULL CHECK(length(trim(lesson_id)) > 0),
  content_version TEXT NOT NULL CHECK(length(trim(content_version)) > 0),
  variant_id TEXT NOT NULL CHECK(length(trim(variant_id)) > 0),
  mechanic TEXT NOT NULL CHECK(mechanic IN (
    'allocation', 'basket', 'savings', 'receipt_audit', 'resource_choice'
  )),
  parameters_json TEXT NOT NULL CHECK(json_valid(parameters_json)),
  hints_json TEXT NOT NULL CHECK(json_valid(hints_json)),
  phase TEXT NOT NULL CHECK(phase IN (
    'draft', 'evaluated', 'explanation_seen', 'completed', 'archived'
  )),
  solution_revision INTEGER NOT NULL CHECK(${counterCheck('solution_revision')}),
  solution_json TEXT NOT NULL CHECK(json_valid(solution_json)),
  shown_hints_json TEXT NOT NULL CHECK(json_valid(shown_hints_json)),
  reward_eligible_at_start INTEGER NOT NULL CHECK(reward_eligible_at_start IN (0, 1)),
  current_evaluation_id TEXT,
  explanation_evaluation_id TEXT,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
) STRICT;

CREATE INDEX lesson_attempt_profile_history
  ON lesson_attempt(profile_id, started_at);
CREATE INDEX lesson_attempt_period_history
  ON lesson_attempt(period_id, started_at);

CREATE TABLE lesson_evaluation (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  attempt_id TEXT NOT NULL REFERENCES lesson_attempt(id) ON DELETE CASCADE,
  solution_revision INTEGER NOT NULL CHECK(${counterCheck('solution_revision')}),
  outcome TEXT NOT NULL CHECK(outcome IN (
    'meets_goal', 'valid_alternative', 'needs_review', 'invalid_input'
  )),
  consequence TEXT NOT NULL CHECK(length(trim(consequence)) > 0),
  explanation TEXT NOT NULL CHECK(length(trim(explanation)) > 0),
  next_step TEXT NOT NULL CHECK(length(trim(next_step)) > 0),
  calculation_json TEXT NOT NULL CHECK(json_valid(calculation_json)),
  evaluated_at TEXT NOT NULL,
  UNIQUE(attempt_id, solution_revision)
) STRICT;

CREATE TABLE lesson_completion (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  command_id TEXT NOT NULL UNIQUE
    REFERENCES command_receipt(command_id) DEFERRABLE INITIALLY DEFERRED,
  attempt_id TEXT NOT NULL UNIQUE REFERENCES lesson_attempt(id) ON DELETE CASCADE,
  evaluation_id TEXT NOT NULL UNIQUE REFERENCES lesson_evaluation(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  period_id TEXT REFERENCES period(id) ON DELETE SET NULL,
  lesson_id TEXT NOT NULL CHECK(length(trim(lesson_id)) > 0),
  completion_kind TEXT NOT NULL CHECK(completion_kind IN ('completed', 'reviewed')),
  outcome TEXT NOT NULL CHECK(outcome IN (
    'meets_goal', 'valid_alternative', 'needs_review'
  )),
  reward_granted INTEGER NOT NULL CHECK(reward_granted IN (0, 1)),
  reward_amount INTEGER NOT NULL CHECK(
    (reward_granted = 0 AND reward_amount = 0) OR
    (reward_granted = 1 AND reward_amount = ${LESSON_REWARD})
  ),
  reward_reason TEXT NOT NULL CHECK(reward_reason IN (
    'GRANTED', 'TRAINING', 'PERIOD_NOT_ACTIVE', 'ALREADY_GRANTED'
  )),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX lesson_completion_profile_history
  ON lesson_completion(profile_id, created_at);

CREATE TRIGGER lesson_evaluation_immutable_update
BEFORE UPDATE ON lesson_evaluation
BEGIN
  SELECT RAISE(ABORT, 'lesson_evaluation is immutable');
END;

CREATE TRIGGER lesson_completion_immutable_update
BEFORE UPDATE ON lesson_completion
BEGIN
  SELECT RAISE(ABORT, 'lesson_completion is immutable');
END;
`;
