import * as SQLite from 'expo-sqlite';
import { SqliteAppControlStorage } from './app-control-sqlite.ts';

export const CONTROL_DATABASE_FILE = 'finni-control.db';

export async function openExpoAppControlStorage(): Promise<SqliteAppControlStorage> {
  const database = await SQLite.openDatabaseAsync(CONTROL_DATABASE_FILE, {
    useNewConnection: true,
  });
  try {
    return await SqliteAppControlStorage.initialize(database);
  } catch (error) {
    await database.closeAsync();
    throw error;
  }
}
