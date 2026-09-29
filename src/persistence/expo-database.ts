import * as SQLite from 'expo-sqlite';
import type { Mode } from '../domain/contracts.ts';
import { databaseFileForMode, type SqlDatabase } from './database.ts';

export async function openExpoDatabase(mode: Mode): Promise<SqlDatabase> {
  return SQLite.openDatabaseAsync(databaseFileForMode(mode), {
    useNewConnection: true,
  });
}
