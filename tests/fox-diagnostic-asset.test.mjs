import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();

test('Khronos Fox stays an attributed diagnostic-only asset with a stable binary hash', () => {
  const readme = readFileSync(new URL('../assets/3d/diagnostic/README.md', import.meta.url), 'utf8');
  const license = readFileSync(new URL('../assets/3d/diagnostic/FOX_LICENSE.md', import.meta.url), 'utf8');
  assert.equal(
    sha256(new URL('../assets/3d/diagnostic/Fox.glb', import.meta.url)),
    'D97044E701822BAC5A62696459B27D7B375AADA5DE8574ED4362EDBBA94771F7',
  );
  assert.match(readme, /diagnostic-only/);
  assert.match(readme, /CC0-1\.0/);
  assert.match(readme, /CC-BY-4\.0/);
  assert.match(license, /Creative Commons Zero/);
  assert.match(license, /Creative Commons Attribution/);
});
