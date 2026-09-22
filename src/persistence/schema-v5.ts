import { AMOUNT_LIMIT } from '../domain/numeric.ts';

const amountCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} >= 0 AND ${column} <= ${AMOUNT_LIMIT}`;

const counterCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} >= 0 AND ${column} <= ${Number.MAX_SAFE_INTEGER}`;

const netFlowCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} BETWEEN -${Number.MAX_SAFE_INTEGER} AND ${Number.MAX_SAFE_INTEGER}`;

/** S2 close-period snapshot and monotonic pet progress. */
export const SCHEMA_V5 = `
ALTER TABLE profile_state ADD COLUMN pet_stage INTEGER NOT NULL DEFAULT 1
  CHECK(typeof(pet_stage) = 'integer' AND pet_stage BETWEEN 1 AND 3);

CREATE TABLE period_summary (
  period_id TEXT PRIMARY KEY NOT NULL REFERENCES period(id) ON DELETE CASCADE,
  command_id TEXT NOT NULL UNIQUE REFERENCES command_receipt(command_id) DEFERRABLE INITIALLY DEFERRED,
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  rule_snapshot_json TEXT NOT NULL CHECK(json_valid(rule_snapshot_json)),
  plan_snapshot_json TEXT NOT NULL CHECK(json_valid(plan_snapshot_json)),
  facts_json TEXT NOT NULL CHECK(json_valid(facts_json)),
  criteria_json TEXT NOT NULL CHECK(json_valid(criteria_json)),
  available_at_close INTEGER NOT NULL CHECK(${amountCheck('available_at_close')}),
  savings_at_close INTEGER NOT NULL CHECK(${amountCheck('savings_at_close')}),
  net_saving INTEGER NOT NULL CHECK(${netFlowCheck('net_saving')}),
  period_growth INTEGER NOT NULL CHECK(${counterCheck('period_growth')} AND period_growth <= 3),
  savings_high_water_before INTEGER NOT NULL CHECK(${counterCheck('savings_high_water_before')}),
  savings_high_water_after INTEGER NOT NULL CHECK(${counterCheck('savings_high_water_after')}),
  new_saving_periods_before INTEGER NOT NULL CHECK(${counterCheck('new_saving_periods_before')}),
  new_saving_periods_after INTEGER NOT NULL CHECK(${counterCheck('new_saving_periods_after')}),
  lifetime_growth_before INTEGER NOT NULL CHECK(${counterCheck('lifetime_growth_before')}),
  lifetime_growth_after INTEGER NOT NULL CHECK(${counterCheck('lifetime_growth_after')}),
  stage_before INTEGER NOT NULL CHECK(typeof(stage_before) = 'integer' AND stage_before BETWEEN 1 AND 3),
  stage_after INTEGER NOT NULL CHECK(typeof(stage_after) = 'integer' AND stage_after BETWEEN 1 AND 3),
  explanation TEXT NOT NULL CHECK(length(trim(explanation)) > 0),
  next_safe_step TEXT NOT NULL CHECK(length(trim(next_safe_step)) > 0),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX period_summary_profile_history ON period_summary(profile_id, created_at);

CREATE TRIGGER period_summary_immutable_update
BEFORE UPDATE ON period_summary
BEGIN
  SELECT RAISE(ABORT, 'period_summary is immutable');
END;
`;
