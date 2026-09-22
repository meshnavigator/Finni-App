import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { loadContentBundle, lessonDefinitionSnapshot } from '../src/content/loader.ts';
import {
  ContentValidationError,
  evaluateContentFixture,
  validateLesson,
  validateManifest,
} from '../src/content/validator.ts';

const bundleRoot = join(process.cwd(), 'content', 'bundles', '1.2.0');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

async function canonicalBundle() {
  const manifest = await readJson(join(bundleRoot, 'manifest.json'));
  const documents = {};
  for (const file of manifest.files) documents[file.path] = await readJson(join(bundleRoot, file.path));
  return { manifest, documents };
}

test('canonical manifest loads exactly eight strict schema-v3 lessons', async () => {
  const { manifest, documents } = await canonicalBundle();
  const bundle = loadContentBundle(manifest, documents);
  assert.equal(bundle.manifest.schemaVersion, 3);
  assert.equal(bundle.manifest.contentVersion, '1.2.0');
  assert.equal(bundle.lessons.size, 8);
  assert.deepEqual([...bundle.lessons.keys()], manifest.lessonIds);
  for (const lesson of bundle.lessons.values()) {
    assert.equal(lesson.rendererId, lesson.mechanic);
    assert.ok(lesson.observableAction.length > 0);
    assert.ok(lesson.explanation.length > 0);
  }
});

test('attempt definition is an immutable version/variant snapshot', async () => {
  const { manifest, documents } = await canonicalBundle();
  const bundle = loadContentBundle(manifest, documents);
  const lesson = bundle.lessons.get('LS-P02');
  const snapshot = lessonDefinitionSnapshot(lesson, 'quantity_two');
  documents['lessons/LS-P02.json'].variants[1].params.budget = 999;
  assert.equal(snapshot.contentVersion, '1.2.0');
  assert.equal(snapshot.variantId, 'quantity_two');
  assert.equal(snapshot.parameters.budget, 50);
  assert.equal(snapshot.parameters.mode, 'compare_offers');
  assert.throws(() => { snapshot.parameters.budget = 1; }, TypeError);
});

test('manifest rejects broken links and dependency cycles', async () => {
  const { manifest } = await canonicalBundle();
  const broken = structuredClone(manifest);
  broken.lessons['LS-B01'] = 'lessons/missing.json';
  assert.throws(() => validateManifest(broken), /broken link/);

  const cyclic = structuredClone(manifest);
  cyclic.files[0].dependsOn = [cyclic.files[1].path];
  cyclic.files[1].dependsOn = [cyclic.files[0].path];
  assert.throws(() => validateManifest(cyclic), /dependency cycle/);
});

test('lesson schema rejects non-canonical semver, URLs, unknown fields and fixture contradictions', async () => {
  const lesson = await readJson(join(bundleRoot, 'lessons', 'LS-B01.json'));
  for (const mutate of [
    (value) => { value.contentVersion = '01.2.0'; },
    (value) => { value.variants[0].copy.intro = 'Открой https://example.test'; },
    (value) => { value.unexpected = true; },
    (value) => { value.variants[0].fixtures[0].expectedOutcome = 'needs_review'; },
  ]) {
    const invalid = structuredClone(lesson);
    mutate(invalid);
    assert.throws(() => validateLesson(invalid), ContentValidationError);
  }
});

test('basket minimum excludes impossible simultaneous alternative-group offers', async () => {
  const lesson = validateLesson(await readJson(join(bundleRoot, 'lessons', 'LS-P02.json')));
  const variant = {
    ...lesson.variants[0],
    params: {
      budget: 100,
      requiredUnits: { pencil: 2 },
      offers: [
        { id: 'a', kind: 'pencil', packSize: 1, packPrice: 10, maxPackages: 1, qualityKey: 'same', properties: ['A'], alternativeGroup: 'single-choice' },
        { id: 'b', kind: 'pencil', packSize: 1, packPrice: 10, maxPackages: 1, qualityKey: 'same', properties: ['B'], alternativeGroup: 'single-choice' },
        { id: 'bundle', kind: 'pencil', packSize: 2, packPrice: 50, maxPackages: 1, qualityKey: 'same', properties: ['Два'] },
      ],
      preferLowerCostForEqualCoverage: true,
    },
  };
  assert.equal(evaluateContentFixture(lesson, variant, {
    packageCountByOfferId: { bundle: 1 },
    statedTotal: 50,
    statedRemainder: 50,
  }), 'meets_goal');
  assert.equal(evaluateContentFixture(lesson, variant, {
    packageCountByOfferId: { a: 1, b: 1 },
    statedTotal: 20,
    statedRemainder: 80,
  }), 'invalid_input');
});
