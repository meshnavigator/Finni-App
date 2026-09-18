import { HomeSceneSpike } from './HomeSceneSpike';
import type { LocalGlbDiagnosticAsset } from './home-scene-spike-contract';

// Keep this static require beside the concrete bundled asset. Metro discovers
// the GLB at bundle time; bundlePath below is evidence metadata only.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro must statically discover this binary.
const foxModule = require('../../assets/3d/diagnostic/Fox.glb');

const FOX_DIAGNOSTIC_ASSET: LocalGlbDiagnosticAsset = Object.freeze({
  id: 'khronos-fox-diagnostic-only',
  bundlePath: 'assets/3d/diagnostic/Fox.glb',
  module: foxModule,
  license: Object.freeze({
    source: 'KhronosGroup/glTF-Sample-Assets Models/Fox',
    terms: 'CC0-1.0 model; CC-BY-4.0 rigging, animation and glTF conversion; see FOX_LICENSE.md and README.md',
    reviewedAt: '2026-09-18',
  }),
  skeletalClipIndex: 0,
});

/** Diagnostic sample only. It is neither Финни nor a production visual asset. */
export function HomeSceneSpikeFoxDiagnostic() {
  return <HomeSceneSpike diagnosticAsset={FOX_DIAGNOSTIC_ASSET} />;
}
