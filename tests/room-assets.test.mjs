import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const packageDir = path.resolve('assets/2d/room/S8-002');
const manifest = JSON.parse(readFileSync(path.join(packageDir, 'asset-manifest.json'), 'utf8'));
const catalog = readFileSync('src/domain/catalog.ts', 'utf8');
const runtime = readFileSync('src/ui/room-assets.ts', 'utf8');
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const ids = (expression) => [...catalog.matchAll(expression)].map((match) => match[1]).sort();

test('room asset package covers the implemented purchase and goal IDs exactly', () => {
  const items = ids(/item\('(IT-\d+)'/g);
  const goals = ids(/id: '(GL-\d+)'/g);
  assert.equal(items.length, 8);
  assert.equal(goals.length, 3);
  assert.deepEqual(manifest.assets.filter((asset) => asset.itemId).map((asset) => asset.itemId).sort(), items);
  assert.deepEqual(manifest.assets.filter((asset) => asset.goalId).map((asset) => asset.goalId).sort(), goals);
  assert.equal(new Set(manifest.assets.map((asset) => asset.assetId)).size, manifest.assets.length);
  for (const id of [...items, ...goals]) assert.match(runtime, new RegExp(`'${id}': require\\(`));
});

test('all local PNG bindings have matching hashes and valid PNG signatures', () => {
  const sources = [manifest.baseRoom, ...manifest.assets];
  for (const source of sources) {
    const file = path.resolve(packageDir, source.path);
    const bytes = readFileSync(file);
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], source.assetId);
    assert.ok(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, source.assetId);
    assert.equal(sha256(file), source.sha256, source.assetId);
    assert.match(runtime, new RegExp(path.basename(source.path).replaceAll('.', '\\.')));
  }
});
