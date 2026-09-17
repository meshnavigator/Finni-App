import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  PET_COMBINATIONS,
  normalizePetName,
  petAppearance,
  petNameError,
} from '../src/domain/pet-profile.ts';
import {
  errorScreenModel,
  homeScreenModel,
  loadingScreenModel,
  onboardingScreenModel,
} from '../src/application/ui-model.ts';
import { counter } from '../src/domain/numeric.ts';
import { migrateDatabase } from '../src/persistence/migrations.ts';
import {
  LOCAL_PROFILE_ID,
  ProfileRepository,
} from '../src/persistence/profile-repository.ts';
import { SqliteFileAdapter } from './sqlite-file-adapter.mjs';

const folders = [];
test.after(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true });
});

const databasePath = () => {
  const folder = mkdtempSync(join(tmpdir(), 'finni-profile-'));
  folders.push(folder);
  return join(folder, 'profile.db');
};

test('onboarding exposes exactly nine distinct pet combinations', () => {
  assert.equal(PET_COMBINATIONS.length, 9);
  assert.equal(
    new Set(PET_COMBINATIONS.map((item) => `${item.shapeId}:${item.patternId}`)).size,
    9,
  );
});

test('pet name normalization and validation share the 2–16 code point contract', () => {
  assert.equal(normalizePetName('  Фи\u0301нни   7  '), 'Фи́нни 7'.normalize('NFC'));
  assert.equal(petNameError(' '), 'Имя должно содержать от 2 до 16 символов');
  assert.equal(petNameError('Я'), 'Имя должно содержать от 2 до 16 символов');
  assert.equal(petNameError('12345678901234567'), 'Имя должно содержать от 2 до 16 символов');
  assert.equal(petNameError('Финни!'), 'Используй буквы, цифры, пробел или дефис');
  assert.equal(petNameError('Фи\u200Bнни'), 'Используй буквы, цифры, пробел или дефис');
  assert.equal(petNameError('Финни-7'), null);
});

test('loading, error and onboarding component models are finite and actionable', () => {
  assert.equal(loadingScreenModel.finite, true);
  assert.match(loadingScreenModel.message, /домик/i);
  assert.equal(errorScreenModel().action, 'Попробовать снова');
  assert.deepEqual(
    onboardingScreenModel.directions.map((item) => item.id),
    ['need', 'want', 'save'],
  );
});

test('home component model shows all summary data and unlocks routes by state', () => {
  const profile = Object.freeze({
    id: LOCAL_PROFILE_ID,
    name: 'Очень-Длинный-16',
    shapeId: 'round',
    patternId: 'spots',
    createdAt: '2026-09-17T00:00:00.000Z',
    timeZone: 'UTC',
    revision: counter(3),
  });
  const lifecycle = Object.freeze({
    profileId: LOCAL_PROFILE_ID,
    mode: 'normal',
    state: 'DRAFT',
    revision: counter(3),
    available: 999999999,
    savings: 888888888,
    periodId: 'period-1',
    periodIndex: counter(1),
    calendarDate: '2026-09-17',
    timeZone: 'UTC',
    clockGeneration: counter(0),
    nextEligibleDate: null,
    maxOpenedDate: '2026-09-17',
    ruleBundle: null,
  });
  const model = homeScreenModel(profile, lifecycle);
  assert.equal(model.availableLabel, '999999999 монет');
  assert.equal(model.savingsLabel, '888888888 монет');
  assert.match(model.goalLabel, /не выбрана/);
  assert.match(model.careLabel, /Еда и уход/);
  assert.match(model.lessonLabel, /Задание/);
  assert.equal(model.action.route, 'plan');
  assert.equal(model.planAvailable, true);
  assert.equal(model.spendingAvailable, false);
});

test('profile creation is single, update keeps identity, and restart restores a second combination', async () => {
  const path = databasePath();
  const firstDatabase = new SqliteFileAdapter(path);
  await migrateDatabase(firstDatabase);
  const first = new ProfileRepository('normal', firstDatabase);
  const initial = petAppearance({ name: 'Финни', shapeId: 'round', patternId: 'plain' });
  const input = {
    appearance: initial,
    timeZone: 'UTC',
    calendarDate: '2026-09-17',
    createdAt: '2026-09-17T08:00:00.000Z',
  };
  const [created, repeated] = await Promise.all([
    first.createProfile(input),
    first.createProfile(input),
  ]);
  assert.equal(created.id, LOCAL_PROFILE_ID);
  assert.equal(repeated.id, LOCAL_PROFILE_ID);
  assert.equal(
    (await firstDatabase.getFirstAsync('SELECT COUNT(*) AS count FROM profile')).count,
    1,
  );

  const changed = await first.updatePet(
    created.id,
    created.revision,
    petAppearance({ name: 'Рыжик-7', shapeId: 'floppy', patternId: 'stripes' }),
  );
  assert.equal(changed.id, created.id);
  assert.equal(changed.revision, 1);
  await first.close();

  const reopenedDatabase = new SqliteFileAdapter(path);
  await migrateDatabase(reopenedDatabase);
  const reopened = new ProfileRepository('normal', reopenedDatabase);
  const restored = await reopened.readProfile();
  assert.deepEqual(
    { id: restored.id, name: restored.name, shapeId: restored.shapeId, patternId: restored.patternId },
    { id: LOCAL_PROFILE_ID, name: 'Рыжик-7', shapeId: 'floppy', patternId: 'stripes' },
  );
  assert.deepEqual(
    await reopenedDatabase.getFirstAsync(
      'SELECT available, savings FROM wallet_projection WHERE profile_id = ?',
      LOCAL_PROFILE_ID,
    ),
    { available: 0, savings: 0 },
  );
  await reopened.close();
});

test('compact home source keeps scroll fallback and 48 dp interaction targets', () => {
  const source = readFileSync(new URL('../src/ui/AppRoot.tsx', import.meta.url), 'utf8');
  assert.match(source, /<ScrollView contentContainerStyle=\{styles\.homeContent\}>/);
  assert.match(source, /minHeight: 48/g);
  assert.match(source, /Доступно/);
  assert.match(source, /Копилка/);
  assert.match(source, /ТЕКУЩАЯ ЦЕЛЬ/);
  assert.match(source, /АКТИВНОЕ ЗАНЯТИЕ/);
  assert.match(source, /Для взрослого/);
});
