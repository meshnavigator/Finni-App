import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { FINNI_ANCHORS, FINNI_CANVAS, FINNI_STAGE_SCALE } from '../src/ui/finni-layer-contract.ts';

const root = new URL('../', import.meta.url);
const app = await readFile(new URL('App.tsx', root), 'utf8');
const appRoot = await readFile(new URL('src/ui/AppRoot.tsx', root), 'utf8');
const awaitHome = await readFile(new URL('src/ui/HomeScreen.tsx', root), 'utf8');
const scene = await readFile(new URL('src/ui/FinniHomeScene.tsx', root), 'utf8');
const manifest = JSON.parse(
  await readFile(new URL('assets/2d/master/FINNI-2D-MASTER-V1/asset-manifest.json', root), 'utf8'),
);

const expected = new Map([
  ['room_clean_v1.png', '2c76a1e29090e61de615c5e228bf309d34016f89aa74cac9ea1b990821ac6140'],
  ['pet_neutral_canvas_v1.png', '8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0'],
  ['pet_blink_canvas_v1.png', '2797ab29e3d6b91d4342f80a71c892a574751513833c569c53e7f8c077b51905'],
]);

test('default app has one production root and no 3D diagnostic route', () => {
  assert.match(app, /<SafeAreaProvider[^>]*><AppRoot \/><\/SafeAreaProvider>/);
  assert.doesNotMatch(app, /HomeSceneSpike|FINNI_3D|Filament|Worklets/);
  assert.match(appRoot, /<HomeScreen/);
  assert.match(awaitHome, /<FinniHomeScene/);
  assert.match(appRoot, /scenePaused=\{helpOpen \|\| rootMenuOpen\}/);
});

test('production master copies match accepted S7-004 hashes', async () => {
  assert.equal(manifest.packageId, 'FINNI-2D-MASTER-V1');
  for (const asset of manifest.assets) {
    const bytes = await readFile(
      new URL(`assets/2d/master/FINNI-2D-MASTER-V1/${asset.path}`, root),
    );
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.equal(asset.sha256, expected.get(asset.path));
    assert.equal(hash, expected.get(asset.path));
  }
});

test('Home scene is local, lifecycle-aware, reduced-motion safe and bounded', () => {
  assert.doesNotMatch(scene, /https?:|application\/|domain\/|persistence\//);
  assert.match(scene, /AppState\.addEventListener\('change', setAppState\)/);
  assert.match(scene, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(scene, /reduceMotionChanged/);
  assert.match(scene, /useNativeDriver: true/);
  assert.match(scene, /clearInterval\(blinkTimer\)/);
  assert.match(scene, /idle\.stop\(\)/);
  assert.match(scene, /props\.paused/);
  assert.match(scene, /onError=\{\(\) => setDecodeError\(true\)\}/);
  assert.match(scene, /testID="finni-home-scene-fallback"/);
});

test('three stage frames preserve the same room floor contact', () => {
  const footY = FINNI_ANCHORS.feet.y / FINNI_CANVAS.height;
  const footX = FINNI_ANCHORS.feet.x / FINNI_CANVAS.width;
  for (const stage of [1, 2, 3]) {
    const scale = FINNI_STAGE_SCALE[stage];
    const left = (1 - scale) * footX;
    const top = (1 - scale) * footY;
    assert.ok(Math.abs(left + scale * footX - footX) < 1e-12);
    assert.ok(Math.abs(top + scale * footY - footY) < 1e-12);
  }
  assert.deepEqual(Object.keys(FINNI_STAGE_SCALE), ['1', '2', '3']);
});

test('first blink waits for its decoded frame without swapping image sources', () => {
  assert.match(scene, /loadedBlinkAppearance === appearanceId/);
  assert.match(scene, /onLoad=\{\(\) => setLoadedBlinkAppearance\(appearanceId\)\}/);
  assert.match(scene, /source=\{sources\.neutral\}/);
  assert.match(scene, /source=\{sources\.blink\}/);
  assert.match(scene, /opacity: showBlink \? 0 : 1/);
  assert.match(scene, /opacity: showBlink \? 1 : 0/);
  assert.doesNotMatch(scene, /source=\{animationActive/);
});
