import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { AppRuntime } from '../src/application/app-runtime.ts';
import { DEMO_INITIAL_DATE } from '../src/application/demo-scenario.ts';
import { lessonDefinitionSnapshot, loadContentBundle } from '../src/content/loader.ts';
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

const demoFixture = JSON.parse(readFileSync(new URL('../fixtures/demo-five-periods.json', import.meta.url), 'utf8'));
const bundleRoot = join(process.cwd(), 'content', 'bundles', '1.2.0');
const manifest = JSON.parse(readFileSync(join(bundleRoot, 'manifest.json'), 'utf8'));
const documents = Object.fromEntries(manifest.files.filter((item) => item.kind === 'lesson').map((item) => [
  item.path, JSON.parse(readFileSync(join(bundleRoot, item.path), 'utf8')),
]));
const lessons = loadContentBundle(manifest, documents).lessons;

async function completeStandardLesson(runtime, snapshot, lessonId) {
  const lesson = lessons.get(lessonId);
  assert.ok(lesson, `lesson ${lessonId}`);
  const variant = lesson.variants.find((item) => item.id === lesson.defaultVariantId);
  const solution = variant?.fixtures.find((item) => item.expectedOutcome === 'meets_goal')?.solution;
  assert.ok(solution, `standard successful solution ${lessonId}`);
  const attempt = await runtime.startLesson(snapshot, lessonDefinitionSnapshot(lesson, variant.id));
  await runtime.saveLesson(attempt.attemptId, solution);
  const { evaluation } = await runtime.evaluateLesson(attempt.attemptId);
  assert.equal(evaluation.outcome, 'meets_goal', lessonId);
  await runtime.viewLessonExplanation(attempt.attemptId, evaluation.evaluationId);
  const receipt = await runtime.completeLesson(snapshot, attempt.attemptId, evaluation.evaluationId);
  assert.equal(receipt.result.ok, true, lessonId);
  return runtime.load();
}

test('three complete five-day demo runs persist B40/S30, all lessons, reset, and normal isolation', async () => {
  const normalPath = join(root, DATABASE_FILES.normal);
  const demoPath = join(root, DATABASE_FILES.demo);
  const normal = await open('normal', normalPath);
  const normalBefore = await normal.createProfile({ name: 'Обычный Финни', shapeId: 'round', patternId: 'plain' });
  await normal.close();

  for (let run = 1; run <= 3; run += 1) {
    if (run > 1) rmSync(demoPath, { force: true });
    let demo = await open('demo', demoPath);
    let state = await demo.createProfile({ name: `Демо ${run}`, shapeId: 'round', patternId: run % 2 ? 'plain' : 'spots' });
    assert.equal(state.lifecycle.calendarDate, DEMO_INITIAL_DATE);
    assert.equal(state.lifecycle.available, 0);
    assert.equal(state.lifecycle.savings, 0);

    for (const period of demoFixture.periods) {
      assert.equal(state.lifecycle.state, 'READY');
      assert.equal(state.lifecycle.calendarDate, period.calendarDate);
      await assert.rejects(demo.advanceDemoDay(state), /Следующий демо-день/);
      state = await demo.openDay(state);
      assert.equal(state.lifecycle.periodIndex, period.index);
      const previousBalance = period.index === 1 ? 0 : demoFixture.periods[period.index - 2].expected.available;
      assert.equal(state.lifecycle.available, previousBalance + period.income);
      if (period.index === 1) state = await demo.selectGoal(state, demoFixture.goalId);
      const balanceBeforePlan = state.lifecycle.available;
      state = await demo.confirmPlan(state, plan(...period.plan), true);
      assert.equal(state.lifecycle.available, balanceBeforePlan);
      for (const lessonId of period.lessons) state = await completeStandardLesson(demo, state, lessonId);
      let purchaseIndex = 0;
      for (const itemId of period.purchases) {
        state = await demo.purchase(state, itemId, true);
        purchaseIndex += 1;
        if (period.rejectedPurchase && purchaseIndex === 2) {
          const before = state.lifecycle.available;
          const preview = await demo.previewPurchase(state, period.rejectedPurchase);
          assert.equal(preview.after, null);
          await assert.rejects(demo.purchaseReceipt(state, period.rejectedPurchase, true), /INSUFFICIENT_FUNDS/);
          state = await demo.load();
          assert.equal(state.lifecycle.available, before);
        }
      }
      if (period.deposit) state = await demo.depositSavings(state, period.deposit);
      if (period.claimGoal) state = await demo.claimGoal(state, period.claimGoal);
      state = await demo.closePeriod(state);
      assert.equal(state.lifecycle.state, 'WAITING');
      assert.equal(state.lifecycle.available, period.expected.available, `run ${run}, day ${period.index}: B`);
      assert.equal(state.lifecycle.savings, period.expected.savings, `run ${run}, day ${period.index}: S`);
      assert.equal(state.lifecycle.lifetimeGrowth, period.expected.lifetimeGrowth, `run ${run}, day ${period.index}: growth`);
      assert.equal(state.lifecycle.petStage, period.expected.stage, `run ${run}, day ${period.index}: stage`);
      assert.equal(state.lifecycle.closedPeriods, period.index);
      assert.equal(state.lifecycle.latestSummary.facts.expensePlanOverrun, period.index === 2);
      assert.ok(state.lifecycle.latestSummary.explanation.length > 0);
      if (period.index === 3 || period.index === 5) {
        await demo.close();
        demo = await open('demo', demoPath);
        state = await demo.load();
        assert.equal(state.lifecycle.available, period.expected.available);
        assert.equal(state.lifecycle.savings, period.expected.savings);
      }
      if (period.index < demoFixture.periods.length) state = await demo.advanceDemoDay(state);
    }

    assert.deepEqual(state.commerce.claimedGoalIds, [demoFixture.goalId]);
    assert.equal(state.homeLessons.length, demoFixture.expected.completedLessons);
    assert.equal(state.lifecycle.available, demoFixture.expected.finalAvailable);
    assert.equal(state.lifecycle.savings, demoFixture.expected.finalSavings);
    await demo.close();

    const evidence = new SqliteFileAdapter(demoPath);
    const counts = await evidence.getFirstAsync(`SELECT
      (SELECT COUNT(*) FROM period) AS periods,
      (SELECT COUNT(*) FROM lesson_completion) AS lessons,
      (SELECT COUNT(*) FROM purchase) AS purchases,
      (SELECT COUNT(*) FROM goal_claim) AS goals,
      (SELECT COUNT(*) FROM ledger_entry WHERE type = 'PERIOD_INCOME') AS incomes,
      (SELECT COUNT(*) FROM ledger_entry WHERE type = 'LESSON_REWARD') AS rewards`);
    assert.equal(counts.periods, 5);
    assert.equal(counts.lessons, demoFixture.expected.completedLessons);
    assert.equal(counts.purchases, demoFixture.periods.reduce((sum, period) => sum + period.purchases.length, 0));
    assert.equal(counts.goals, 1);
    assert.equal(counts.incomes, demoFixture.expected.incomeEntries);
    assert.equal(counts.rewards, demoFixture.expected.rewardEntries);
    await evidence.closeAsync();

    const normalAgain = await open('normal', normalPath);
    const normalAfter = await normalAgain.load();
    assert.deepEqual(normalAfter, normalBefore, `normal data after demo run ${run}`);
    await normalAgain.close();
  }
});
