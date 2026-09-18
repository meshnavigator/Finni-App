import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('3D diagnostic entry is gated and ordinary AppRoot remains the default', () => {
  const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const diagnostic = readFileSync(new URL('../src/ui/HomeSceneSpikeFoxDiagnostic.tsx', import.meta.url), 'utf8');
  assert.match(app, /EXPO_PUBLIC_FINNI_3D_DIAGNOSTIC === '1'/);
  assert.match(app, /return <HomeSceneSpikeFoxDiagnostic \/>;/);
  assert.match(app, /return <AppRoot \/>;/);
  assert.match(diagnostic, /require\('\.\.\/\.\.\/assets\/3d\/diagnostic\/Fox\.glb'\)/);
  assert.match(diagnostic, /skeletalClipIndex: 0/);
  assert.match(diagnostic, /Diagnostic sample only/);
});