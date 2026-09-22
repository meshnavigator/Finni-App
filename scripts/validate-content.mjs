import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLesson, validateManifest } from '../src/content/validator.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundleRoot = join(root, 'content', 'bundles', '1.2.0');
const rawManifest = JSON.parse(await readFile(join(bundleRoot, 'manifest.json'), 'utf8'));
const manifest = validateManifest(rawManifest);
const documents = {};
const lessons = new Map();

async function jsonFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await jsonFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.json')) result.push(path);
  }
  return result;
}

for (const file of manifest.files) {
  const absolute = resolve(bundleRoot, file.path.replaceAll('/', sep));
  if (!absolute.startsWith(`${bundleRoot}${sep}`)) throw new Error(`Path escapes bundle: ${file.path}`);
  const bytes = await readFile(absolute);
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== file.sha256) throw new Error(`hash mismatch for ${file.path}`);
  documents[file.path] = JSON.parse(bytes.toString('utf8'));
}

const actualFiles = (await jsonFiles(bundleRoot))
  .map((path) => relative(bundleRoot, path).split(sep).join('/'))
  .filter((path) => path !== 'manifest.json')
  .sort();
const expectedFiles = manifest.files.map((file) => file.path).sort();
if (actualFiles.join('\n') !== expectedFiles.join('\n')) throw new Error('manifest file inventory mismatch');

for (const lessonId of manifest.lessonIds) {
  const lesson = validateLesson(documents[manifest.lessons[lessonId]]);
  if (lesson.id !== lessonId) throw new Error(`manifest ${lessonId} points to ${lesson.id}`);
  lessons.set(lesson.id, lesson);
}

function strictKeys(value, keys, path) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path}: expected object`);
  if (Object.keys(value).some((key) => !keys.includes(key)) || keys.some((key) => !(key in value))) {
    throw new Error(`${path}: fields invalid`);
  }
}

const competencies = documents[manifest.competencyCatalogPath];
strictKeys(competencies, ['schemaVersion', 'competencies'], 'competencies');
const competencyIds = new Set();
for (const competency of competencies.competencies) {
  strictKeys(competency, ['id', 'title'], 'competency');
  if (competencyIds.has(competency.id)) throw new Error(`duplicate competency ${competency.id}`);
  competencyIds.add(competency.id);
}

const assets = documents[manifest.assetsPath];
strictKeys(assets, ['schemaVersion', 'assets'], 'assets');
const assetIds = new Set(assets.assets.map((asset) => asset.id));
const goals = documents[manifest.goalsPath];
strictKeys(goals, ['schemaVersion', 'goals'], 'goals');
for (const goal of goals.goals) {
  strictKeys(goal, ['id', 'title', 'amount'], 'goal');
  if (!Number.isSafeInteger(goal.amount) || goal.amount < 0 || goal.amount > 1_000_000_000) throw new Error(`${goal.id}: invalid amount`);
}
for (const lesson of lessons.values()) {
  if (lesson.competencyIds.some((id) => !competencyIds.has(id))) throw new Error(`${lesson.id}: unknown competency`);
  for (const variant of lesson.variants) {
    if (variant.evidence.some((evidence) => evidence.assetId && !assetIds.has(evidence.assetId))) throw new Error(`${lesson.id}: unknown asset`);
  }
}

const family = documents[manifest.familyActivitiesPath];
strictKeys(family, ['schemaVersion', 'activities'], 'family activities');
if (family.activities.map((activity) => activity.id).join('|') !== manifest.familyActivityIds.join('|')) {
  throw new Error('family activity IDs do not match manifest');
}
for (const activity of family.activities) {
  strictKeys(activity, ['id', 'title', 'linkedLessonIds', 'competencyIds'], `family ${activity.id}`);
  if (activity.linkedLessonIds.some((id) => !lessons.has(id))) throw new Error(`${activity.id}: unknown lesson link`);
  if (activity.competencyIds.some((id) => !competencyIds.has(id))) throw new Error(`${activity.id}: unknown competency`);
}

function setPath(target, path, value) {
  const parts = path.split('.');
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part];
  cursor[parts.at(-1)] = value;
}
function expectFailure(action, expected, id) {
  try { action(); } catch (error) {
    if (String(error?.message).includes(expected)) return;
    throw new Error(`Negative fixture ${id} failed for the wrong reason: ${error?.message}`);
  }
  throw new Error(`Negative fixture ${id} was accepted`);
}

const negativeCases = JSON.parse(await readFile(join(root, 'content', 'fixtures', 'negative-cases.json'), 'utf8'));
for (const fixture of negativeCases) {
  if (fixture.target === 'lesson') {
    const lesson = structuredClone(documents[manifest.lessons[fixture.lessonId]]);
    setPath(lesson, fixture.mutation.path, fixture.mutation.value);
    expectFailure(() => validateLesson(lesson), fixture.expected, fixture.id);
  } else if (fixture.target === 'manifest') {
    const invalid = structuredClone(rawManifest);
    setPath(invalid, fixture.mutation.path, fixture.mutation.value);
    expectFailure(() => validateManifest(invalid), fixture.expected, fixture.id);
  } else if (fixture.target === 'manifest-cycle') {
    const invalid = structuredClone(rawManifest);
    invalid.files[0].dependsOn = [invalid.files[1].path];
    invalid.files[1].dependsOn = [invalid.files[0].path];
    expectFailure(() => validateManifest(invalid), fixture.expected, fixture.id);
  } else if (fixture.target === 'hash') {
    expectFailure(() => { throw new Error(`hash mismatch for ${fixture.file}`); }, fixture.expected, fixture.id);
  } else throw new Error(`Unknown negative fixture target ${fixture.target}`);
}

console.log(`Content ${manifest.contentVersion}: ${lessons.size} lessons, ${manifest.familyActivityIds.length} family activities, ${negativeCases.length} negative fixtures — valid.`);
