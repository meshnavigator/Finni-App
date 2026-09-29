import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { homeLessonStatus, recommendHomeLesson } from '../src/application/home-lesson.ts';
import { homePetFrame, HOME_PET_BOUNDS } from '../src/ui/home-scene-layout.ts';
import { FINNI_ANCHORS, FINNI_STAGE_SCALE } from '../src/ui/finni-layer-contract.ts';
import { migrateDatabase } from '../src/persistence/migrations.ts';
import { LessonRepository } from '../src/persistence/lesson-repository.ts';
import { startLessonAttempt } from '../src/domain/lesson.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const catalog = ['A', 'B', 'C'].map((id, i) => ({ definition: { lessonId: id }, title: id, unlockPeriod: i + 1 }));
const order = ['B', 'A', 'C'];
const entry = (lessonId, phase, sequence) => ({ lessonId, phase, sequence });
test('Home recommendation obeys unlock, unfinished sequence, manifest order and circular practice', () => {
  assert.equal(recommendHomeLesson('normal', null, [], catalog, order).title, 'A');
  assert.equal(recommendHomeLesson('normal', 1, [], catalog, order).title, 'A');
  assert.equal(recommendHomeLesson('demo', null, [], catalog, order).title, 'B');
  assert.equal(recommendHomeLesson('demo', 1, [entry('A', 'draft', 3), entry('C', 'evaluated', 4)], catalog, order).title, 'C');
  assert.equal(recommendHomeLesson('normal', 1, [entry('C', 'draft', 4)], catalog, order).title, 'A');
  assert.equal(recommendHomeLesson('demo', 1, [entry('B', 'completed', 1)], catalog, order).title, 'A');
  assert.equal(recommendHomeLesson('demo', 1, [entry('B', 'completed', 2), entry('A', 'completed', 3), entry('C', 'completed', 4)], catalog, order).title, 'B');
  assert.equal(recommendHomeLesson('demo', 1, [entry('A', 'draft', 1), entry('B', 'completed', 2), entry('A', 'completed', 3)], catalog, order).title, 'C');
  assert.equal(recommendHomeLesson('demo', 1, [entry('A', 'completed', 1), entry('B', 'completed', 2), entry('A', 'draft', 3)], catalog, order).title, 'A');
  assert.equal(homeLessonStatus([entry('A', 'draft', 1), entry('A', 'completed', 3)], 'A'), 'completed');
  assert.equal(homeLessonStatus([entry('A', 'completed', 1), entry('A', 'draft', 3)], 'A'), 'in-progress');
  assert.equal(homeLessonStatus([], 'A'), 'new');
});

test('all stage silhouettes fit the smallest and ordinary reserves with invariant feet', () => {
  for (const region of [{ x: 6, y: 250, width: 97, height: 100 }, { x: 8, y: 220, width: 200, height: 216 }, { x: 8, y: 220, width: 250, height: 400 }]) {
    const frames = [1, 2, 3].map((stage) => homePetFrame(region, stage));
    for (const frame of frames) {
      assert.ok(Math.abs(frame.left + FINNI_ANCHORS.feet.x * frame.scale - frame.anchorX) < 1e-8);
      assert.ok(Math.abs(frame.top + FINNI_ANCHORS.feet.y * frame.scale - frame.anchorY) < 1e-8);
      assert.equal(frame.anchorY, frames[0].anchorY);
      assert.ok(frame.left + HOME_PET_BOUNDS.left * frame.scale >= region.x);
      assert.ok(frame.left + HOME_PET_BOUNDS.right * frame.scale <= region.x + region.width);
      const breathingTop = frame.anchorY - (FINNI_ANCHORS.feet.y - HOME_PET_BOUNDS.top) * frame.scale * 1.006;
      assert.ok(breathingTop >= region.y);
      assert.ok(frame.top + HOME_PET_BOUNDS.bottom * frame.scale <= region.y + region.height);
    }
    assert.ok(Math.abs(frames[2].scale / frames[0].scale - FINNI_STAGE_SCALE[3] / FINNI_STAGE_SCALE[1]) < 1e-8);
  }
});

test('Home history projection survives restart, isolates profiles and uses internal insertion order', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'finni-home-history-'));
  const filename = join(dir, 'state.db');
  let db = new SqliteFileAdapter(filename);
  try {
    await migrateDatabase(db);
    for (const id of ['first', 'second']) await db.runAsync("INSERT INTO profile(id, pet_name, shape_id, pattern_id, created_at, time_zone) VALUES (?, 'Финни', 'pointy', 'plain', '2026-09-25', 'UTC')", id);
    const repo = new LessonRepository('normal', db);
    for (const [attemptId, profileId, lessonId] of [['one', 'first', 'A'], ['two', 'second', 'C'], ['three', 'first', 'B']]) {
      await repo.createAttempt(startLessonAttempt({ attemptId, profileId, periodId: null, periodState: 'WAITING', definition: { lessonId, contentVersion: 'test', variantId: 'one', mechanic: 'allocation', parameters: {}, hints: ['one', 'two'] }, startedAt: '2026-09-25T00:00:00Z' }));
    }
    const before = await repo.listHomeHistory('first');
    assert.deepEqual(before.map((row) => row.lessonId), ['B', 'A']);
    await repo.close();
    db = new SqliteFileAdapter(filename);
    const reopened = new LessonRepository('normal', db);
    assert.deepEqual(await reopened.listHomeHistory('first'), before);
    assert.deepEqual((await reopened.listHomeHistory('second')).map((row) => row.lessonId), ['C']);
  } finally {
    await db.closeAsync();
    rmSync(dir, { recursive: true, force: true });
  }
});
