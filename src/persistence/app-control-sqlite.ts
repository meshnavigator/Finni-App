import { counter, type Counter } from '../domain/numeric.ts';
import type { SqlDatabase } from './database.ts';
import { RepositoryExecutor } from './repository-executor.ts';

type ControlRow = Readonly<{ serialized: string; control_revision: number }>;
type PresentationPreferencesRow = Readonly<{ motion_enabled: number; sound_enabled: number }>;

export type PresentationPreferences = Readonly<{
  motionEnabled: boolean;
  soundEnabled: boolean;
}>;

const DEFAULT_PRESENTATION_PREFERENCES: PresentationPreferences = Object.freeze({
  motionEnabled: true,
  soundEnabled: true,
});

function checkedFlag(value: boolean): number {
  if (typeof value !== 'boolean') throw new TypeError('Presentation preference must be a boolean');
  return value ? 1 : 0;
}

async function rollbackQuietly(database: SqlDatabase): Promise<void> {
  try {
    await database.execAsync('ROLLBACK');
  } catch {
    // Preserve the original transaction error.
  }
}

/** Dedicated dependency-free SQLite storage for AppControl, separate from both game DBs. */
export class SqliteAppControlStorage {
  readonly #executor: RepositoryExecutor;

  private constructor(database: SqlDatabase) {
    this.#executor = new RepositoryExecutor(database);
  }

  static async initialize(database: SqlDatabase): Promise<SqliteAppControlStorage> {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS app_control (
        singleton INTEGER PRIMARY KEY NOT NULL CHECK(singleton = 1),
        control_revision INTEGER NOT NULL
          CHECK(typeof(control_revision) = 'integer' AND control_revision >= 0),
        serialized TEXT NOT NULL CHECK(json_valid(serialized))
      ) STRICT;
      CREATE TABLE IF NOT EXISTS presentation_preferences (
        singleton INTEGER PRIMARY KEY NOT NULL CHECK(singleton = 1),
        motion_enabled INTEGER NOT NULL CHECK(motion_enabled IN (0, 1)),
        sound_enabled INTEGER NOT NULL CHECK(sound_enabled IN (0, 1))
      ) STRICT;
    `);
    return new SqliteAppControlStorage(database);
  }

  read(): Promise<string | null> {
    return this.#executor.run(async (database) => {
      const row = await database.getFirstAsync<ControlRow>(
        'SELECT serialized, control_revision FROM app_control WHERE singleton = 1',
      );
      return row?.serialized ?? null;
    });
  }

  /** Device-wide preferences survive mode changes and game-data reset. */
  readPresentationPreferences(): Promise<PresentationPreferences> {
    return this.#executor.run(async (database) => {
      const row = await database.getFirstAsync<PresentationPreferencesRow>(
        'SELECT motion_enabled, sound_enabled FROM presentation_preferences WHERE singleton = 1',
      );
      if (!row) return DEFAULT_PRESENTATION_PREFERENCES;
      return Object.freeze({
        motionEnabled: row.motion_enabled === 1,
        soundEnabled: row.sound_enabled === 1,
      });
    });
  }

  setMotionEnabled(enabled: boolean): Promise<void> {
    const flag = checkedFlag(enabled);
    return this.#executor.run(async (database) => {
      await database.runAsync(
        `INSERT INTO presentation_preferences(singleton, motion_enabled, sound_enabled)
         VALUES (1, ?, 1)
         ON CONFLICT(singleton) DO UPDATE SET motion_enabled = excluded.motion_enabled`,
        flag,
      );
    });
  }

  setSoundEnabled(enabled: boolean): Promise<void> {
    const flag = checkedFlag(enabled);
    return this.#executor.run(async (database) => {
      await database.runAsync(
        `INSERT INTO presentation_preferences(singleton, motion_enabled, sound_enabled)
         VALUES (1, 1, ?)
         ON CONFLICT(singleton) DO UPDATE SET sound_enabled = excluded.sound_enabled`,
        flag,
      );
    });
  }

  replaceInTransaction(
    expectedRevision: Counter,
    nextRevision: Counter,
    serialized: string,
  ): Promise<boolean> {
    const expected = counter(expectedRevision);
    const next = counter(nextRevision);
    if (next !== expected + 1) throw new TypeError('Control revision must advance exactly once');
    JSON.parse(serialized);
    return this.#executor.run(async (database) => {
      await database.execAsync('BEGIN IMMEDIATE');
      try {
        const current = await database.getFirstAsync<ControlRow>(
          'SELECT serialized, control_revision FROM app_control WHERE singleton = 1',
        );
        let changed = false;
        if (!current && expected === 0) {
          const result = await database.runAsync(
            'INSERT INTO app_control(singleton, control_revision, serialized) VALUES (1, ?, ?)',
            next,
            serialized,
          );
          changed = result.changes === 1;
        } else if (current?.control_revision === expected) {
          const result = await database.runAsync(
            `UPDATE app_control SET control_revision = ?, serialized = ?
             WHERE singleton = 1 AND control_revision = ?`,
            next,
            serialized,
            expected,
          );
          changed = result.changes === 1;
        }
        if (!changed) {
          await database.execAsync('ROLLBACK');
          return false;
        }
        await database.execAsync('COMMIT');
        return true;
      } catch (error) {
        await rollbackQuietly(database);
        throw error;
      }
    });
  }

  close(): Promise<void> {
    return this.#executor.close();
  }
}
