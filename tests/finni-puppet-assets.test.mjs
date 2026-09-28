import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
test('puppet exports retain source lineage and all nine appearances have five heads', async () => {
  const dir = 'assets/2d/poses/FINNI-PUPPET-V1/';
  const manifest = JSON.parse(await readFile(new URL(`${dir}asset-manifest.json`, root), 'utf8'));
  assert.equal(manifest.assets.length, 54);
  for (const asset of manifest.assets) {
    const bytes = await readFile(new URL(dir + asset.path, root));
    assert.equal(sha(bytes), asset.sha256);
    assert.equal(sha(await readFile(new URL(asset.source, root))), asset.sourceSha256);
    assert.equal(bytes.readUInt32BE(16), 941);
    assert.equal(bytes.readUInt32BE(20), 1672);
    assert.equal(asset.selectedPixelDifference, 0);
  }
  for (const shape of ['pointy','round','floppy']) for (const pattern of ['plain','spots','stripes']) {
    for (const expression of ['neutral','blink','happy','thoughtful','inspired']) {
      assert.ok(manifest.assets.some(a => a.path === `${shape}-${pattern}/${expression}-head.png`));
    }
  }
});
test('gesture owner acceptance is bound to the exact source and export hashes', async () => {
  const dir = 'assets/2d/poses/FINNI-GESTURE-V1/';
  const manifest = JSON.parse(await readFile(new URL(`${dir}asset-manifest.json`, root), 'utf8'));
  assert.equal(manifest.status, 'owner-accepted');
  const acceptance = JSON.parse(await readFile(new URL(dir + manifest.ownerAcceptance.record, root), 'utf8'));
  assert.equal(acceptance.status, manifest.status);
  assert.equal(acceptance.date, manifest.ownerAcceptance.date);
  assert.deepEqual(acceptance.assets, manifest.assets.map(({ pattern, sourceSha256, sha256 }) => ({ pattern, sourceSha256, sha256 })));
  assert.deepEqual(manifest.assets.map(a => a.pattern), ['plain','spots','stripes']);
  for (const asset of manifest.assets) {
    assert.equal(sha(await readFile(new URL(dir + asset.path, root))), asset.sha256);
    assert.equal(sha(await readFile(new URL(dir + asset.source, root))), asset.sourceSha256);
  }
});
