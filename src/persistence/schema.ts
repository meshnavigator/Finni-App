import { AMOUNT_LIMIT } from '../domain/numeric.ts';

export const SCHEMA_VERSION = 3;

const moneyCheck = (column: string, positive = false): string =>
  `typeof(${column}) = 'integer' AND ${column} ${positive ? '>' : '>='} 0 AND ${column} <= ${AMOUNT_LIMIT}`;

const deltaCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} BETWEEN -${AMOUNT_LIMIT} AND ${AMOUNT_LIMIT}`;

const counterCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} >= 0 AND ${column} <= ${Number.MAX_SAFE_INTEGER}`;

export const SCHEMA_V1 = `
CREATE TABLE profile (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  pet_name TEXT NOT NULL,
  shape_id TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  clock_generation INTEGER NOT NULL DEFAULT 0 CHECK(${counterCheck('clock_generation')})
) STRICT;

CREATE TABLE wallet_projection (
  profile_id TEXT PRIMARY KEY NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  available INTEGER NOT NULL CHECK(${moneyCheck('available')}),
  savings INTEGER NOT NULL CHECK(${moneyCheck('savings')})
) STRICT;

CREATE TABLE profile_state (
  profile_id TEXT PRIMARY KEY NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK(${counterCheck('revision')}),
  savings_high_water INTEGER NOT NULL DEFAULT 0 CHECK(${counterCheck('savings_high_water')}),
  new_saving_periods INTEGER NOT NULL DEFAULT 0 CHECK(${counterCheck('new_saving_periods')}),
  lifetime_growth INTEGER NOT NULL DEFAULT 0 CHECK(${counterCheck('lifetime_growth')})
) STRICT;

CREATE TABLE period (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  period_index INTEGER NOT NULL CHECK(${counterCheck('period_index')}),
  calendar_date TEXT NOT NULL,
  clock_generation INTEGER NOT NULL CHECK(${counterCheck('clock_generation')}),
  state TEXT NOT NULL CHECK(state IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  economy_version TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  UNIQUE(profile_id, clock_generation, calendar_date),
  UNIQUE(profile_id, period_index)
) STRICT;

CREATE UNIQUE INDEX one_open_period_per_profile
  ON period(profile_id) WHERE state IN ('DRAFT', 'ACTIVE');

CREATE TABLE command_receipt (
  command_id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(command_id)) > 0),
  command_type TEXT NOT NULL CHECK(length(trim(command_type)) > 0),
  business_identity TEXT NOT NULL CHECK(length(business_identity) > 0),
  profile_id TEXT REFERENCES profile(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK(mode IN ('normal', 'demo')),
  result_json TEXT NOT NULL CHECK(json_valid(result_json)),
  committed_at TEXT NOT NULL
) STRICT;

CREATE INDEX command_receipt_profile ON command_receipt(profile_id, committed_at);

CREATE TABLE ledger_entry (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL UNIQUE CHECK(length(trim(operation_id)) > 0),
  command_id TEXT NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  period_id TEXT NOT NULL REFERENCES period(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('PERIOD_INCOME', 'LESSON_REWARD', 'PURCHASE', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL', 'GOAL_CLAIM')),
  amount INTEGER NOT NULL CHECK(${moneyCheck('amount', true)}),
  delta_available INTEGER NOT NULL CHECK(${deltaCheck('delta_available')}),
  delta_savings INTEGER NOT NULL CHECK(${deltaCheck('delta_savings')}),
  reason_code TEXT NOT NULL,
  payload_snapshot TEXT NOT NULL CHECK(json_valid(payload_snapshot)),
  created_at TEXT NOT NULL,
  FOREIGN KEY(command_id) REFERENCES command_receipt(command_id) DEFERRABLE INITIALLY DEFERRED,
  CHECK(
    (type = 'PERIOD_INCOME' AND amount = 100 AND delta_available = amount AND delta_savings = 0) OR
    (type = 'LESSON_REWARD' AND amount = 20 AND delta_available = amount AND delta_savings = 0) OR
    (type = 'PURCHASE' AND delta_available = -amount AND delta_savings = 0) OR
    (type = 'SAVINGS_DEPOSIT' AND delta_available = -amount AND delta_savings = amount) OR
    (type = 'SAVINGS_WITHDRAWAL' AND delta_available = amount AND delta_savings = -amount) OR
    (type = 'GOAL_CLAIM' AND delta_available = 0 AND delta_savings = -amount)
  )
) STRICT;

CREATE UNIQUE INDEX one_period_income ON ledger_entry(period_id) WHERE type = 'PERIOD_INCOME';
CREATE UNIQUE INDEX one_lesson_reward ON ledger_entry(period_id) WHERE type = 'LESSON_REWARD';
CREATE INDEX ledger_profile_history ON ledger_entry(profile_id, seq);
CREATE INDEX ledger_period_history ON ledger_entry(period_id, seq);

CREATE TABLE audit_event (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE CHECK(length(trim(event_id)) > 0),
  command_id TEXT NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(length(trim(event_type)) > 0),
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY(command_id) REFERENCES command_receipt(command_id) DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX audit_profile_history ON audit_event(profile_id, seq);
`;

export const SCHEMA_V2 = `
CREATE TABLE game_clock (
  profile_id TEXT PRIMARY KEY NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  time_zone TEXT NOT NULL,
  virtual_date TEXT,
  clock_generation INTEGER NOT NULL DEFAULT 0 CHECK(${counterCheck('clock_generation')}),
  next_eligible_date TEXT,
  max_opened_date TEXT,
  updated_at TEXT NOT NULL
) STRICT;

INSERT INTO game_clock(
  profile_id, time_zone, virtual_date, clock_generation,
  next_eligible_date, max_opened_date, updated_at
)
SELECT
  profile.id,
  profile.time_zone,
  NULL,
  profile.clock_generation,
  NULL,
  (
    SELECT MAX(period.calendar_date)
    FROM period
    WHERE period.profile_id = profile.id
      AND period.clock_generation = profile.clock_generation
  ),
  profile.created_at
FROM profile;

ALTER TABLE period ADD COLUMN rule_bundle_json TEXT NOT NULL
  DEFAULT '{"economyVersion":"economy-v2","catalogVersion":"bootstrap","goalsVersion":"bootstrap"}'
  CHECK(json_valid(rule_bundle_json));
ALTER TABLE period ADD COLUMN confirmed_plan_json TEXT
  CHECK(confirmed_plan_json IS NULL OR json_valid(confirmed_plan_json));
ALTER TABLE period ADD COLUMN confirmed_at TEXT;

CREATE INDEX period_profile_state ON period(profile_id, state, period_index);
`;

export const SCHEMA_V3 = `
ALTER TABLE period ADD COLUMN budget_at_confirm INTEGER
  CHECK(budget_at_confirm IS NULL OR (${moneyCheck('budget_at_confirm')}));
ALTER TABLE period ADD COLUMN ledger_seq_at_confirm INTEGER
  CHECK(ledger_seq_at_confirm IS NULL OR (${counterCheck('ledger_seq_at_confirm')}));

CREATE TABLE period_plan_addition (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  addition_id TEXT NOT NULL UNIQUE CHECK(length(trim(addition_id)) > 0),
  command_id TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  period_id TEXT NOT NULL REFERENCES period(id) ON DELETE CASCADE,
  need INTEGER NOT NULL CHECK(${moneyCheck('need')}),
  want INTEGER NOT NULL CHECK(${moneyCheck('want')}),
  save INTEGER NOT NULL CHECK(${moneyCheck('save')}),
  created_at TEXT NOT NULL,
  FOREIGN KEY(command_id) REFERENCES command_receipt(command_id) DEFERRABLE INITIALLY DEFERRED,
  CHECK(need + want + save > 0)
) STRICT;

CREATE INDEX period_plan_addition_history
  ON period_plan_addition(period_id, seq);
`;
