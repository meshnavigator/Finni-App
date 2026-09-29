import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { PET_COMBINATIONS } from '../src/domain/pet-profile.ts';
import { renderedFinniAppearance, homeFinniAppearance } from '../src/ui/finni-appearance-policy.ts';
import { FINNI_LAYER_ORDER } from '../src/ui/finni-layer-contract.ts';

const packageDir = path.resolve('assets/2d/variants/FINNI-POINTY-SPOTS-V1');
const manifest = JSON.parse(readFileSync(path.join(packageDir, 'asset-manifest.json'), 'utf8'));
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

test('all nine domain combinations resolve to their own rendered artwork', () => {
  const ids = PET_COMBINATIONS.map((appearance) => {
    const expected = `${appearance.shapeId}/${appearance.patternId}`;
    assert.equal(renderedFinniAppearance(appearance), expected);
    assert.equal(homeFinniAppearance(appearance), expected);
    return expected;
  });
  assert.equal(new Set(ids).size, 9);
  assert.equal(renderedFinniAppearance({ shapeId: 'unknown', patternId: 'spots' }), null);
  assert.equal(homeFinniAppearance({ shapeId: 'unknown', patternId: 'spots' }), 'pointy/plain');
});

test('accepted spotted frames and nine source layers have verified local PNG hashes', () => {
  assert.deepEqual(manifest.appearance, { shapeId: 'pointy', patternId: 'spots' });
  assert.deepEqual(manifest.runtimeFrames, ['neutral', 'blink']);
  assert.deepEqual(manifest.neutralExportLayerOrder, FINNI_LAYER_ORDER);
  assert.deepEqual(manifest.canvas, [941, 1672]);
  assert.deepEqual(manifest.origin, [0, 0]);
  assert.equal(manifest.artStatus, 'owner-accepted-2026-09-25');
  for (const asset of manifest.assets) {
    const file = path.join(packageDir, asset.path);
    const bytes = readFileSync(file);
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], asset.dimensions, asset.path);
    assert.equal(bytes[25], 6, asset.path);
    assert.equal(sha(file), asset.sha256, asset.path);
    if (asset.path.startsWith('layers/')) assert.deepEqual(asset.dimensions, [941, 1672]);
  }
  assert.equal(sha(path.join(packageDir, 'neutral.png')), manifest.source.approvedNeutralSha256);
  assert.equal(sha(path.join(packageDir, 'source/finni-expressive-spots.ora')), manifest.source.oraSha256);
  assert.notEqual(sha(path.join(packageDir, 'neutral.png')), sha(path.join(packageDir, 'blink.png')));
});


test('matrix package supplies eighteen unique frames and matching source hashes', () => {
  const root = path.resolve('assets/2d/variants/FINNI-MATRIX-V1');
  const matrix = JSON.parse(readFileSync(path.join(root, 'asset-manifest.json'), 'utf8'));
  assert.deepEqual(matrix.layerOrder, FINNI_LAYER_ORDER);
  assert.equal(matrix.variants.length, 9);
  assert.equal(new Set(matrix.variants.map((v) => v.neutralSha256)).size, 9);
  for (const variant of matrix.variants) {
    assert.equal(sha(path.join(root, variant.id, 'neutral.png')), variant.neutralSha256);
    assert.equal(sha(path.join(root, variant.id, 'blink.png')), variant.blinkSha256);
    assert.equal(sha(path.join(root, variant.id, 'source.ora')), variant.oraSha256);
    assert.notEqual(variant.neutralSha256, variant.blinkSha256);
  }
  for (const asset of matrix.assets) {
    const file = path.join(root, asset.path);
    assert.equal(sha(file), asset.sha256, asset.path);
    if (!asset.dimensions) continue;
    const bytes = readFileSync(file);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], asset.dimensions);
    assert.equal(bytes[25], 6);
    if (!asset.path.endsWith('/preview.png')) assert.deepEqual(asset.dimensions, [941, 1672]);
  }
});
