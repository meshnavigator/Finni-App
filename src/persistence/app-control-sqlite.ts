import { counter, type Counter } from '../domain/numeric.ts';
import type { SqlDatabase } from './database.ts';
import { RepositoryExecutor } from './repository-executor.ts';

type ControlRow = Readonly<{ serialized: string; control_revision: number }>;

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
