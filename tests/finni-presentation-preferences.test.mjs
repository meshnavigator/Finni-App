import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { SqliteAppControlStorage } from '../src/persistence/app-control-sqlite.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

test('AN-016 motion and sound choices persist independently across restart', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'finni-preferences-'));
  const path = join(folder, 'finni-control.db');
  try {
    const first = await SqliteAppControlStorage.initialize(new SqliteFileAdapter(path));
    assert.deepEqual(await first.readPresentationPreferences(), {
      motionEnabled: true,
      soundEnabled: true,
    });

    await Promise.all([first.setMotionEnabled(false), first.setSoundEnabled(false)]);
    assert.deepEqual(await first.readPresentationPreferences(), {
      motionEnabled: false,
      soundEnabled: false,
    });
    await first.close();

    const restarted = await SqliteAppControlStorage.initialize(new SqliteFileAdapter(path));
    assert.deepEqual(await restarted.readPresentationPreferences(), {
      motionEnabled: false,
      soundEnabled: false,
    });
    await restarted.setMotionEnabled(true);
    assert.deepEqual(await restarted.readPresentationPreferences(), {
      motionEnabled: true,
      soundEnabled: false,
    });
    await restarted.setSoundEnabled(true);
    assert.deepEqual(await restarted.readPresentationPreferences(), {
      motionEnabled: true,
      soundEnabled: true,
    });
    assert.throws(() => restarted.setMotionEnabled('off'), TypeError);
    await restarted.close();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
