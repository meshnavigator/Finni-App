import { AMOUNT_LIMIT } from '../domain/numeric.ts';

const moneyCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} > 0 AND ${column} <= ${AMOUNT_LIMIT}`;

const counterCheck = (column: string): string =>
  `typeof(${column}) = 'integer' AND ${column} >= 0 AND ${column} <= ${Number.MAX_SAFE_INTEGER}`;

/** S2 transaction data: slot identity, goal selection and immutable claims. */
export const SCHEMA_V4 = `
ALTER TABLE period ADD COLUMN expense_plan_overrun INTEGER NOT NULL DEFAULT 0
  CHECK(expense_plan_overrun IN (0, 1));

CREATE TABLE purchase (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  command_id TEXT NOT NULL UNIQUE REFERENCES command_receipt(command_id) DEFERRABLE INITIALLY DEFERRED,
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  period_id TEXT NOT NULL REFERENCES period(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK(slot IN ('food', 'care', 'activity')),
  item_id TEXT NOT NULL,
  item_snapshot TEXT NOT NULL CHECK(json_valid(item_snapshot)),
  price INTEGER NOT NULL CHECK(${moneyCheck('price')}),
  created_at TEXT NOT NULL,
  UNIQUE(period_id, slot)
) STRICT;

CREATE INDEX purchase_profile_history ON purchase(profile_id, created_at);

CREATE TABLE goal_selection (
  profile_id TEXT PRIMARY KEY NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  goal_id TEXT,
  selected_at TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK(${counterCheck('revision')})
) STRICT;

CREATE TABLE goal_claim (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
  command_id TEXT NOT NULL UNIQUE REFERENCES command_receipt(command_id) DEFERRABLE INITIALLY DEFERRED,
  profile_id TEXT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL,
  cost_snapshot INTEGER NOT NULL CHECK(${moneyCheck('cost_snapshot')}),
  period_id TEXT NOT NULL REFERENCES period(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, goal_id)
) STRICT;

CREATE INDEX goal_claim_profile_history ON goal_claim(profile_id, created_at);
`;
