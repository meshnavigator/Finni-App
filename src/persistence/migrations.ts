import type { SqlDatabase } from './database.ts';
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_V3, SCHEMA_VERSION } from './schema.ts';

type UserVersionRow = Readonly<{ user_version: number }>;
type Migration = Readonly<{ version: number; sql: string }>;

const MIGRATIONS: readonly Migration[] = Object.freeze([
  Object.freeze({ version: 1, sql: SCHEMA_V1 }),
  Object.freeze({ version: 2, sql: SCHEMA_V2 }),
  Object.freeze({ version: 3, sql: SCHEMA_V3 }),
]);

async function rollbackQuietly(database: SqlDatabase): Promise<void> {
  try {
    await database.execAsync('ROLLBACK');
  } catch {
    // Preserve the migration error; ROLLBACK can fail if BEGIN itself failed.
  }
}

export async function configureConnection(database: SqlDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
  `);
}

export async function migrateDatabase(database: SqlDatabase): Promise<number> {
  await configureConnection(database);
  const row = await database.getFirstAsync<UserVersionRow>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (!Number.isSafeInteger(current) || current < 0) {
    throw new Error(`Invalid SQLite user_version: ${String(current)}`);
  }
  if (current > SCHEMA_VERSION) {
    throw new Error(
      `Unsupported SQLite schema version ${current}; maximum is ${SCHEMA_VERSION}`,
    );
  }

  let applied = current;
  for (const migration of MIGRATIONS) {
    if (migration.version <= applied) continue;
    if (migration.version !== applied + 1) {
      throw new Error(`Missing sequential migration after schema ${applied}`);
    }
    await database.execAsync('BEGIN IMMEDIATE');
    try {
      await database.execAsync(migration.sql);
      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
      await database.execAsync('COMMIT');
      applied = migration.version;
    } catch (error) {
      await rollbackQuietly(database);
      throw error;
    }
  }
  return applied;
}
