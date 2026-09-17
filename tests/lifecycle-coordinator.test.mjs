import assert from 'node:assert/strict';
import {
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  AppControlStore,
  LifecycleCoordinator,
} from '../src/application/index.ts';
import { counter } from '../src/domain/index.ts';
import { DATABASE_FILES } from '../src/persistence/index.ts';

const folders = [];
test.after(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true });
});

const folder = () => {
  const value = mkdtempSync(join(tmpdir(), 'finni-control-'));
  folders.push(value);
  return value;
};

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
};

const fileStorage = (path) => ({
  async read() {
    try {
      return await readFile(path, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  },
  async writeAtomic(serialized) {
    await mkdir(join(path, '..'), { recursive: true });
    const temporary = `${path}.next`;
    await writeFile(temporary, serialized, 'utf8');
    await rm(path, { force: true });
    await rename(temporary, path);
  },
});

const fixedModePaths = (root, mode) => {
  const base = join(root, DATABASE_FILES[mode]);
  return [base, `${base}-wal`, `${base}-shm`, `${base}.backup`, `${base}.migration.tmp`];
};

const dataDriver = (root) => ({
  async removeKnownModeData(mode) {
    await Promise.all(fixedModePaths(root, mode).map((path) => rm(path, { force: true })));
  },
  async verifyModeDataAbsent(mode) {
    const presence = await Promise.all(fixedModePaths(root, mode).map(exists));
    return presence.every((value) => !value);
  },
  async clearUiState() {},
});

const factory = (root, closed) => ({
  async open(mode) {
    const present = await exists(join(root, DATABASE_FILES[mode]));
    return {
      profileId: present ? `${mode}-profile` : null,
      repository: {
        async close() {
          closed.push(mode);
        },
      },
    };
  },
});

const assertCode = (code) => (error) => error?.domain?.code === code;

test('mode switches invalidate queued and round-trip sessions by monotonic epoch', async () => {
  const root = folder();
  await Promise.all([
    writeFile(join(root, DATABASE_FILES.normal), 'normal'),
    writeFile(join(root, DATABASE_FILES.demo), 'demo'),
  ]);
  const store = new AppControlStore(fileStorage(join(root, 'app-control.json')));
  const closed = [];
  const coordinator = new LifecycleCoordinator(
    store,
    factory(root, closed),
    dataDriver(root),
  );
  const normal = await coordinator.bootstrap();
  assert.equal(normal.mode, 'normal');

  let release;
  let startedResolve;
  const started = new Promise((resolve) => { startedResolve = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  const committed = coordinator.submit(normal, async () => {
    startedResolve();
    await gate;
    return 'committed';
  });
  await started;
  const staleQueued = coordinator.submit(normal, async () => 'must-not-run');
  const switching = coordinator.switchMode('demo', counter(0));
  release();
  assert.equal(await committed, 'committed');
  await assert.rejects(staleQueued, assertCode('SESSION_EXPIRED'));
  const demo = await switching;
  assert.equal(demo.mode, 'demo');
  assert.notEqual(demo.sessionEpoch, normal.sessionEpoch);

  const normalAgain = await coordinator.switchMode('normal', counter(1));
  assert.notEqual(normalAgain.sessionEpoch, demo.sessionEpoch);
  await assert.rejects(
    coordinator.submit(normal, async () => 'stale-round-trip'),
    assertCode('SESSION_EXPIRED'),
  );
  assert.deepEqual(closed, ['normal', 'demo']);
});

test('pending admin intent deterministically resumes after interruption at every phase', async (t) => {
  const phases = [
    'PREPARED',
    'QUEUE_STOPPED',
    'CONNECTION_CLOSED',
    'DATA_REMOVED',
    'UI_CLEARED',
    'VERIFIED',
  ];
  for (const phase of phases) {
    await t.test(`resume after ${phase}`, async () => {
      const root = folder();
      const [normalDb, normalWal, normalShm] = fixedModePaths(root, 'normal');
      const demoDb = join(root, DATABASE_FILES.demo);
      await Promise.all([
        writeFile(normalDb, 'corrupted sqlite bytes'),
        writeFile(normalWal, 'wal'),
        writeFile(normalShm, 'shm'),
        writeFile(demoDb, 'demo must survive'),
      ]);
      const controlPath = join(root, 'app-control.json');
      const store = new AppControlStore(fileStorage(controlPath));
      const closed = [];
      let interrupted = false;
      const crashing = new LifecycleCoordinator(
        store,
        factory(root, closed),
        dataDriver(root),
        {
          afterAdminPhase(current) {
            if (!interrupted && current === phase) {
              interrupted = true;
              throw new Error(`interrupt:${phase}`);
            }
          },
        },
      );
      await crashing.bootstrap();
      await assert.rejects(
        crashing.runAdminOperation(`intent-${phase}`, 'DELETE_PROFILE', counter(0)),
        new RegExp(`interrupt:${phase}`),
      );

      const recoveringStore = new AppControlStore(fileStorage(controlPath));
      const recovering = new LifecycleCoordinator(
        recoveringStore,
        factory(root, closed),
        dataDriver(root),
      );
      const session = await recovering.bootstrap();
      assert.equal(session.mode, 'normal');
      assert.equal(session.profileId, null);
      assert.equal((await recoveringStore.load()).pendingAdminIntent, null);
      assert.equal(await exists(normalDb), false);
      assert.equal(await exists(normalWal), false);
      assert.equal(await exists(normalShm), false);
      assert.equal(await exists(demoDb), true);
      const controlText = await readFile(controlPath, 'utf8');
      assert.equal(controlText.includes('corrupted sqlite bytes'), false);
      assert.equal(controlText.includes('normal-profile'), false);
    });
  }
});
