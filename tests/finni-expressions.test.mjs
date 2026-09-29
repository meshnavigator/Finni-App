import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('assets/2d/variants/FINNI-EXPRESSIONS-V1');
const matrixRoot = path.resolve('assets/2d/variants/FINNI-MATRIX-V1');
const manifest = JSON.parse(readFileSync(path.join(root, 'asset-manifest.json'), 'utf8'));
const acceptance = JSON.parse(readFileSync('artifacts/sprint-8/S8-001-expressions-v1/acceptance.json', 'utf8'));
const source = readFileSync('src/ui/finni-expression-assets.ts', 'utf8');
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

test('all 27 expression bindings have packaged full-canvas PNGs and accepted base hashes', () => {
  assert.equal(manifest.variants.length, 9);
  assert.deepEqual(manifest.canvas, [941, 1672]);
  assert.deepEqual(manifest.feetAnchor, [470, 1272]);
  assert.equal(manifest.artStatus, 'owner-accepted');
  assert.equal(manifest.artAcceptance.record, 'artifacts/sprint-8/S8-001-expressions-v1/acceptance.json');
  assert.equal(acceptance.status, 'owner-accepted');
  assert.equal(sha('artifacts/sprint-8/S8-001-expressions-v1/review/expressions-27.jpg'), acceptance.reviewSheetSha256);
  for (const variant of manifest.variants) {
    const approved = acceptance.variants.find((entry) => entry.id === variant.id);
    assert.ok(approved, variant.id);
    assert.equal(variant.artStatus, 'owner-accepted');
    assert.deepEqual(variant.expressions, approved.expressions);
    assert.equal(variant.expressionsOraSha256, approved.expressionsOraSha256);
    assert.equal(sha(path.join(matrixRoot, variant.id, 'neutral.png')), variant.acceptedNeutralSha256);
    assert.equal(sha(path.join(matrixRoot, variant.id, 'blink.png')), variant.acceptedBlinkSha256);
    assert.equal(sha(path.join(matrixRoot, variant.id, 'source.ora')), variant.acceptedOraSha256);
    assert.equal(sha(path.join(root, variant.id, 'expressions.ora')), variant.expressionsOraSha256);
    for (const expression of ['happy', 'thoughtful', 'inspired']) {
      const file = path.join(root, variant.id, `${expression}.png`);
      const bytes = readFileSync(file);
      assert.equal(sha(file), variant.expressions[expression]);
      assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [941, 1672]);
      assert.match(source, new RegExp(`FINNI-EXPRESSIONS-V1/${variant.id}/${expression}\\.png`));
    }
  }
  assert.equal(manifest.assets.length, 279);
  for (const asset of manifest.assets) {
    assert.equal(sha(path.join(root, asset.path)), asset.sha256, asset.path);
  }
});
