import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  ADULT_ACCESSIBLE_QUESTION,
  ADULT_HOLD_DURATION_MS,
  ADULT_IDLE_TIMEOUT_MS,
  AdultAccessSession,
  AppControlStore,
  isAdultAccessibleAnswer,
} from '../src/application/index.ts';
import { counter } from '../src/domain/index.ts';
import { SqliteAppControlStorage } from '../src/persistence/index.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const folders = [];
test.after(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true });
});

function folder() {
  const value = mkdtempSync(join(tmpdir(), 'finni-adult-control-'));
  folders.push(value);
  return value;
}

function source(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('TC-071/169 adult access is memory-only, deliberate and relocks on idle/background', () => {
  assert.equal(ADULT_HOLD_DURATION_MS, 3000);
  assert.equal(ADULT_IDLE_TIMEOUT_MS, 120000);
  assert.equal(ADULT_ACCESSIBLE_QUESTION, 'Сколько будет 2 + 3?');
  assert.equal(isAdultAccessibleAnswer(' 5 '), true);
  assert.equal(isAdultAccessibleAnswer('4'), false);

  const access = new AdultAccessSession();
  assert.equal(access.isUnlocked(1), false);
  access.unlock(1000);
  assert.equal(access.isUnlocked(120999), true);
  assert.equal(access.recordActivity(120999), true);
  assert.equal(access.isUnlocked(240998), true);
  assert.equal(access.isUnlocked(240999), false);
  access.unlock(300000);
  access.handleAppState('inactive');
  assert.equal(access.isUnlocked(300001), false);
  assert.equal(new AdultAccessSession().isUnlocked(300001), false);
});

test('TC-173 control database serializes CAS and survives file-backed restart', async () => {
  const path = join(folder(), 'finni-control.db');
  const firstStorage = await SqliteAppControlStorage.initialize(new SqliteFileAdapter(path));
  const first = new AppControlStore(firstStorage);
  const second = new AppControlStore(firstStorage);

  const raced = await Promise.allSettled([
    first.selectMode('demo', counter(0)),
    second.selectMode('normal', counter(0)),
  ]);
  assert.equal(raced.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = raced.find((result) => result.status === 'rejected');
  assert.equal(rejected.reason?.domain?.code, 'STALE_STATE');

  const durable = await first.load();
  assert.equal(durable.controlRevision, 1);
  assert.equal(durable.pendingAdminIntent, null);
  await firstStorage.close();

  const restartedStorage = await SqliteAppControlStorage.initialize(new SqliteFileAdapter(path));
  const restarted = await new AppControlStore(restartedStorage).load();
  assert.deepEqual(restarted, durable);
  await restartedStorage.close();
});

test('History and Help expose factual child-safe content and return contract', () => {
  const history = source('../src/ui/HistoryScreen.tsx');
  const help = source('../src/ui/HelpScreen.tsx');
  assert.match(history, /latestSummary/);
  assert.match(history, /commerce\?\.history/);
  assert.match(history, /selectedGoal/);
  assert.match(history, /closedPeriods/);
  assert.match(history, /Завершённых занятий пока нет/);
  assert.match(history, /accessibilityLabel/);
  assert.match(help, /Короткий словарь/);
  assert.match(help, /Вернуться туда, где я был/);
  assert.match(help, /Настоящие деньги здесь не используются/);
});

test('Adult UI and AppRoot enforce gate, relock and coordinator-only runtime actions', () => {
  const adult = source('../src/ui/AdultScreen.tsx');
  const root = source('../src/ui/AppRoot.tsx');
  assert.match(adult, /onPressIn={start}/);
  assert.match(adult, /onPressOut={stop}/);
  assert.match(adult, /Удерживать 3 секунды/);
  assert.match(adult, /Доступный вариант без удержания/);
  assert.match(adult, /Это не оценка способностей/);
  assert.match(adult, /Alert\.alert/);
  assert.match(adult, /Сбросить демонстрацию/);
  assert.match(adult, /Удалить данные выбранного режима/);
  assert.match(root, /ProductionAppController\.initialize/);
  assert.match(root, /AppState\.addEventListener/);
  assert.match(root, /handleAppState/);
  assert.match(root, /\.runSnapshot\(/);
  assert.match(root, /\.submit\(/);
  assert.doesNotMatch(root, /runtime\.current/);
  assert.doesNotMatch(root, /openExpoDatabase/);
});

test('Production adapters use dedicated control DB and known-name idempotent delete semantics', () => {
  const control = source('../src/persistence/expo-control.ts');
  const admin = source('../src/persistence/expo-admin-data.ts');
  const coordinator = source('../src/application/lifecycle-coordinator.ts');
  assert.match(control, /CONTROL_DATABASE_FILE = 'finni-control\.db'/);
  assert.match(control, /openDatabaseAsync\(CONTROL_DATABASE_FILE/);
  assert.match(admin, /deleteDatabaseAsync\(databaseFileForMode\(mode\)\)/);
  assert.match(admin, /RESET_PROFILE is reserved for demo mode/);
  assert.match(admin, /idempotent delete replay/);
  assert.doesNotMatch(admin, /openDatabaseAsync/);
  assert.doesNotMatch(admin, /expo-file-system/);
  assert.match(coordinator, /await this\.#closeRepository\(\);[\s\S]*removeKnownModeData/);
  assert.match(coordinator, /DATA_REMOVED[\s\S]*idempotent replay/);
});
