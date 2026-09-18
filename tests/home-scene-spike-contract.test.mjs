import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { diagnosticAssetProblem, isDiagnosticAssetReady } from '../src/ui/home-scene-spike-contract.ts';

const licensedAsset = Object.freeze({
  id: 'licensed-diagnostic-sample',
  bundleUri: 'assets/3d/diagnostic/licensed-sample.glb',
  license: Object.freeze({ source: 'local licence record', terms: 'diagnostic-only', reviewedAt: '2026-09-18' }),
  skeletalClipIndex: 0,
});

test('diagnostic GLB contract permits only documented bundled GLB assets', () => {
  assert.equal(diagnosticAssetProblem(undefined), 'Локальный GLB ещё не зарегистрирован для diagnostic runtime.');
  assert.equal(isDiagnosticAssetReady(licensedAsset), true);
  assert.match(diagnosticAssetProblem({ ...licensedAsset, bundleUri: 'https://example.test/sample.glb' }), /bundled asset/);
  assert.match(diagnosticAssetProblem({ ...licensedAsset, license: { ...licensedAsset.license, terms: '' } }), /обязательны/);
  assert.match(diagnosticAssetProblem({ ...licensedAsset, skeletalClipIndex: -1 }), /неотрицательным/);
});

test('diagnostic scene has app lifecycle, bundled model, hit-test and modal paths', () => {
  const source = readFileSync(new URL('../src/ui/HomeSceneSpike.tsx', import.meta.url), 'utf8');
  assert.match(source, /AppState\.addEventListener\('change'/);
  assert.match(source, /setIsRendererPaused\(nextState !== 'active'\)/);
  assert.match(source, /!isRendererPaused \? <FilamentView/);
  assert.match(source, /<Model source=\{\{ uri: diagnosticAsset\.bundleUri \}\}/);
  assert.match(source, /onPress=\{handleModelPress\}/);
  assert.match(source, /<Modal visible=\{isModalOpen\}/);
  assert.match(source, /onRequestClose=\{closeModal\}/);
  assert.match(source, /<Animator animationIndex=\{diagnosticAsset\.skeletalClipIndex\}/);
});
