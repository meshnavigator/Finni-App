import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(root, '..');
const matrix = readFileSync(path.join(projectRoot, 'docs/M1_TRACEABILITY.md'), 'utf8');
const expected = [
  ...Array.from({ length: 56 }, (_, index) => `FR-${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 22 }, (_, index) => `NFR-${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 12 }, (_, index) => `A.${index + 1}`),
];
const rows = matrix.split(/\r?\n/).filter((line) => /^\| (?:FR-\d{2}|NFR-\d{2}|A\.\d+) \|/.test(line));
const ids = rows.map((line) => line.split('|')[1].trim());
assert.deepEqual([...ids].sort(), [...expected].sort(), 'Matrix IDs must cover FR-01..56, NFR-01..22 and A.1..12 exactly once');

const prefixes = ['src/', 'tests/', 'scripts/', 'plugins/', 'docs/', 'android/', 'content/', 'fixtures/', 'artifacts/'];
const missing = [];
for (const row of rows) {
  const id = row.split('|')[1].trim();
  const paths = [...row.matchAll(/`([^`]+)`|\]\(\.\.\/([^)]*)\)/g)]
    .map((match) => (match[1] ?? match[2]).replace(/^Finni%20App\//, ''))
    .filter((candidate) => prefixes.some((prefix) => candidate.startsWith(prefix)));
  assert.ok(paths.length > 0 || ['NFR-02', 'NFR-04', 'NFR-05', 'NFR-14', 'NFR-17', 'NFR-18', 'NFR-19', 'NFR-22'].includes(id), `${id}: no source or evidence path`);
  for (const candidate of paths) {
    const base = candidate.startsWith('docs/') ? projectRoot : root;
    if (!existsSync(path.join(base, candidate))) missing.push(`${id}: ${candidate}`);
  }
}
assert.deepEqual(missing, [], `Missing matrix paths:\n${missing.join('\n')}`);
console.log(`M1 traceability: ${ids.length} IDs and local paths valid`);
