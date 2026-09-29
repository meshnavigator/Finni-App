import * as SQLite from 'expo-sqlite';
import type { AdminDataDriver } from '../application/lifecycle-coordinator.ts';
import type { AdminOperation } from '../application/app-control.ts';
import type { Mode } from '../domain/contracts.ts';
import { databaseFileForMode } from './database.ts';

export function createExpoAdminDataDriver(
  clearUiState: (mode: Mode) => Promise<void> | void,
): AdminDataDriver {
  return Object.freeze({
    async removeKnownModeData(mode: Mode, operation: AdminOperation): Promise<void> {
      if (operation === 'RESET_PROFILE' && mode !== 'demo') {
        throw new TypeError('RESET_PROFILE is reserved for demo mode');
      }
      await SQLite.deleteDatabaseAsync(databaseFileForMode(mode));
    },
    async verifyModeDataAbsent(): Promise<boolean> {
      /**
       * expo-sqlite has no non-opening exists API. Success means the known-name
       * delete resolved in this run. If the process stopped after deletion, the
       * durable DATA_REMOVED phase causes idempotent delete replay on bootstrap;
       * we never open a missing game DB merely to "verify" it.
       */
      return true;
    },
    async clearUiState(mode: Mode): Promise<void> {
      await clearUiState(mode);
    },
  });
}
