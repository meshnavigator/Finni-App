import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { AppRuntime } from '../src/application/app-runtime.ts';
import { DEMO_INITIAL_DATE } from '../src/application/demo-scenario.ts';
import { plan } from '../src/domain/economy.ts';
import { DATABASE_FILES } from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const appearance = Object.freeze({ name: 'Финни', shapeId: 'round', patternId: 'plain' });
const root = mkdtempSync(join(tmpdir(), 'finni-demo-runtime-'));
test.after(() => rmSync(root, { recursive: true, force: true }));

async function open(mode, path) {
  return AppRuntime.initialize(mode, new SqliteFileAdapter(path));
}

test('three demo runs advance five persisted dates without real waits or touching normal data', async () => {
  const normal = await open('normal', join(root, DATABASE_FILES.normal));
  const normalProfile = await normal.createProfile(appearance);
  assert.equal(normalProfile.lifecycle.available, 0);

  for (let run = 1; run <= 3; run += 1) {
    const path = join(root, `run-${run}-${DATABASE_FILES.demo}`);
    let demo = await open('demo', path);
    let state = await demo.createProfile(appearance);
    assert.equal(state.lifecycle.calendarDate, DEMO_INITIAL_DATE);
    for (let day = 1; day <= 5; day += 1) {
      assert.equal(state.lifecycle.state, 'READY');
      assert.equal(state.lifecycle.calendarDate, `2026-09-${String(16 + day).padStart(2, '0')}`);
      state = await demo.openDay(state);
      assert.equal(state.lifecycle.periodIndex, day);
      assert.equal(state.lifecycle.available, day * 100);
      state = await demo.confirmPlan(state, plan(0, 0, 0), true);
      state = await demo.closePeriod(state);
      assert.equal(state.lifecycle.state, 'WAITING');
      assert.equal(state.lifecycle.closedPeriods, day);
      if (day === 3) {
        await demo.close();
        demo = await open('demo', path);
        state = await demo.load();
        assert.equal(state.lifecycle.calendarDate, '2026-09-19');
      }
      if (day < 5) {
        state = await demo.advanceDemoDay(state);
        assert.equal(state.lifecycle.state, 'READY');
      }
    }
    assert.equal(state.lifecycle.available, 500);
    assert.equal(state.lifecycle.savings, 0);
    await demo.close();
  }

  const unchanged = await normal.load();
  assert.equal(unchanged.lifecycle.available, 0);
  assert.equal(unchanged.lifecycle.closedPeriods, 0);
  await normal.close();
});
