import type { Mode } from '../domain/contracts.ts';

export type SqlValue = string | number | null;

export type SqlRunResult = Readonly<{
  changes: number;
  lastInsertRowId: number;
}>;

/** Minimal common surface implemented by expo-sqlite and the file SQLite test adapter. */
export type SqlDatabase = Readonly<{
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: SqlValue[]) => Promise<SqlRunResult>;
  getFirstAsync: <T>(sql: string, ...params: SqlValue[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, ...params: SqlValue[]) => Promise<T[]>;
  closeAsync: () => Promise<void>;
}>;

export const DATABASE_FILES: Readonly<Record<Mode, string>> = Object.freeze({
  normal: 'finni-main.db',
  demo: 'finni-demo.db',
});

export function databaseFileForMode(mode: Mode): string {
  return DATABASE_FILES[mode];
}
