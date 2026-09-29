import { assertCalendarDate, assertTimeZone } from '../domain/clocks.ts';
import { failure } from '../domain/errors.ts';
import {
  petAppearance,
  type PetAppearance,
  type PetPatternId,
  type PetShapeId,
} from '../domain/pet-profile.ts';
import {
  addCounter,
  counter,
  type Counter,
} from '../domain/numeric.ts';
import type { Mode } from '../domain/contracts.ts';
import type { SqlDatabase } from './database.ts';
import { RepositoryExecutor } from './repository-executor.ts';

export const LOCAL_PROFILE_ID = 'local-profile';

export type ProfileSnapshot = Readonly<{
  id: string;
  name: string;
  shapeId: PetShapeId;
  patternId: PetPatternId;
  createdAt: string;
  timeZone: string;
  revision: Counter;
}>;

type ProfileRow = Readonly<{
  id: string;
  pet_name: string;
  shape_id: string;
  pattern_id: string;
  created_at: string;
  time_zone: string;
  revision: number;
}>;

function fromRow(row: ProfileRow): ProfileSnapshot {
  const appearance = petAppearance({
    name: row.pet_name,
    shapeId: row.shape_id,
    patternId: row.pattern_id,
  });
  return Object.freeze({
    id: row.id,
    ...appearance,
    createdAt: row.created_at,
    timeZone: assertTimeZone(row.time_zone),
    revision: counter(row.revision),
  });
}

async function selectProfile(
  database: SqlDatabase,
  profileId?: string,
): Promise<ProfileRow | null> {
  const where = profileId ? 'WHERE profile.id = ?' : '';
  return database.getFirstAsync<ProfileRow>(
    `SELECT profile.id, profile.pet_name, profile.shape_id, profile.pattern_id,
            profile.created_at, profile.time_zone, profile_state.revision
     FROM profile
     JOIN profile_state ON profile_state.profile_id = profile.id
     ${where}
     ORDER BY profile.created_at ASC LIMIT 1`,
    ...(profileId ? [profileId] : []),
  );
}

async function rollbackQuietly(database: SqlDatabase): Promise<void> {
  try {
    await database.execAsync('ROLLBACK');
  } catch {
    // Preserve the original storage error.
  }
}

export class ProfileRepository {
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

  readProfile(): Promise<ProfileSnapshot | null> {
    return this.#executor.run(async (database) => {
      const row = await selectProfile(database);
      return row ? fromRow(row) : null;
    });
  }

  async createProfile(input: Readonly<{
    appearance: PetAppearance;
    timeZone: string;
    calendarDate: string;
    createdAt: string;
  }>): Promise<ProfileSnapshot> {
    const appearance = petAppearance(input.appearance);
    const timeZone = assertTimeZone(input.timeZone);
    const calendarDate = assertCalendarDate(input.calendarDate);
    const createdAt = new Date(input.createdAt).toISOString();
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        const existing = await selectProfile(database);
        if (existing) {
          await database.execAsync('COMMIT');
          return fromRow(existing);
        }
        await database.runAsync(
          `INSERT INTO profile(
             id, pet_name, shape_id, pattern_id, created_at, time_zone, clock_generation
           ) VALUES (?, ?, ?, ?, ?, ?, 0)`,
          LOCAL_PROFILE_ID,
          appearance.name,
          appearance.shapeId,
          appearance.patternId,
          createdAt,
          timeZone,
        );
        await database.runAsync(
          `INSERT INTO wallet_projection(profile_id, available, savings)
           VALUES (?, 0, 0)`,
          LOCAL_PROFILE_ID,
        );
        await database.runAsync(
          `INSERT INTO profile_state(profile_id, revision)
           VALUES (?, 0)`,
          LOCAL_PROFILE_ID,
        );
        await database.runAsync(
          `INSERT INTO game_clock(
             profile_id, time_zone, virtual_date, clock_generation,
             next_eligible_date, max_opened_date, updated_at
           ) VALUES (?, ?, ?, 0, NULL, NULL, ?)`,
          LOCAL_PROFILE_ID,
          timeZone,
          this.#mode === 'demo' ? calendarDate : null,
          createdAt,
        );
        const created = await selectProfile(database, LOCAL_PROFILE_ID);
        if (!created) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
        await database.execAsync('COMMIT');
        return fromRow(created);
      } catch (error) {
        await rollbackQuietly(database);
        if (error instanceof TypeError || (error instanceof Error && 'domain' in error)) {
          throw error;
        }
        throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' }, true);
      }
    });
  }

  async updatePet(
    profileId: string,
    expectedRevision: Counter,
    input: PetAppearance,
  ): Promise<ProfileSnapshot> {
    const appearance = petAppearance(input);
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        const current = await selectProfile(database, profileId);
        if (!current) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
        if (counter(current.revision) !== counter(expectedRevision)) {
          throw failure('STALE_STATE', undefined, true);
        }
        const revision = addCounter(counter(current.revision), counter(1));
        await database.runAsync(
          `UPDATE profile SET pet_name = ?, shape_id = ?, pattern_id = ?
           WHERE id = ?`,
          appearance.name,
          appearance.shapeId,
          appearance.patternId,
          profileId,
        );
        await database.runAsync(
          'UPDATE profile_state SET revision = ? WHERE profile_id = ?',
          revision,
          profileId,
        );
        const updated = await selectProfile(database, profileId);
        if (!updated) throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' });
        await database.execAsync('COMMIT');
        return fromRow(updated);
      } catch (error) {
        await rollbackQuietly(database);
        if (error instanceof TypeError || (error instanceof Error && 'domain' in error)) {
          throw error;
        }
        throw failure('STORAGE_WRITE_FAILED', { entity: 'profile' }, true);
      }
    });
  }
}
