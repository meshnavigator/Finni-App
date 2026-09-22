-- Finni schema fixture version: 4
-- Represents a persisted pre-period-summary profile; migrations must preserve it.
INSERT INTO profile(
  id, pet_name, shape_id, pattern_id, created_at, time_zone, clock_generation
) VALUES (
  'fixture-v4-profile', 'Финни', 'round', 'spots',
  '2026-09-18T09:00:00.000Z', 'Europe/Moscow', 2
);

INSERT INTO wallet_projection(profile_id, available, savings)
VALUES ('fixture-v4-profile', 80, 20);

INSERT INTO profile_state(
  profile_id, revision, savings_high_water, new_saving_periods, lifetime_growth
) VALUES ('fixture-v4-profile', 7, 20, 1, 3);
