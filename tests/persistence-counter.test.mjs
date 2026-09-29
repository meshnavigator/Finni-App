import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DATABASE_FILES, SqliteRepository } from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

test('schema rejects unsafe Counter values and the transaction rolls back fully', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'finni-counter-'));
  const database = new SqliteFileAdapter(join(directory, DATABASE_FILES.normal));
  const repository = new SqliteRepository('normal', database);
  try {
    await repository.initialize();
    await database.execAsync(`
      INSERT INTO profile(
        id, pet_name, shape_id, pattern_id, created_at, time_zone, clock_generation
      ) VALUES (
        'profile-1', 'Финни', 'round', 'plain',
        '2026-09-17T09:00:00.000Z', 'Europe/Moscow', 0
      );
      INSERT INTO wallet_projection(profile_id, available, savings)
      VALUES ('profile-1', 0, 0);
      INSERT INTO profile_state(profile_id, revision)
      VALUES ('profile-1', 0);
      BEGIN IMMEDIATE;
      UPDATE wallet_projection SET available = 1 WHERE profile_id = 'profile-1';
    `);

    await assert.rejects(
      database.runAsync(
        `UPDATE profile_state SET revision = 9007199254740992
         WHERE profile_id = 'profile-1'`,
      ),
      /CHECK constraint failed/,
    );
    await database.execAsync('ROLLBACK');
    assert.deepEqual(await repository.readWallet('profile-1'), {
      available: 0,
      savings: 0,
      revision: 0,
    });
  } finally {
    await repository.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
