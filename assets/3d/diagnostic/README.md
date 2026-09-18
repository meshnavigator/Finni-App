# S7-001 diagnostic GLB contract

В этом каталоге есть только один **diagnostic-only** GLB — `Fox.glb`; это не
Финни и не production asset. `PET-MASTER` и `CLIP-001…014` в каноническом asset
manifest имеют `status: to_produce` и `licenseStatus: to_document`.

## Fox provenance and attribution

- Source: `KhronosGroup/glTF-Sample-Assets`, `Models/Fox`, retrieved 2026-09-18.
- Canonical model page: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox
- Download URL: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb
- SHA-256 (`Fox.glb`): `D97044E701822BAC5A62696459B27D7B375AADA5DE8574ED4362EDBBA94771F7`.
- Model: © 2014 PixelMannen, CC0-1.0.
- Rigging and animation: © 2014 tomkranis, CC-BY-4.0.
- glTF conversion: © 2017 AsoboStudio and scurest, CC-BY-4.0.

The copied upstream license is [FOX_LICENSE.md](FOX_LICENSE.md). Preserve this
attribution and licence split when copying, redistributing or presenting this
diagnostic sample. Its three skeletal clips are Survey, Walk and Run; this
harness selects clip index 0 only to demonstrate the animation API.

To register another local GLB, place it here and pass `HomeSceneSpike` a
`diagnosticAsset`. Its `module` must be the opaque module ID from a **static**
Metro require; `bundlePath` is validation metadata, not a dynamic loading URI:

```ts
const diagnosticAsset = {
  id: 'licensed-diagnostic-sample',
  bundlePath: 'assets/3d/diagnostic/licensed.glb',
  module: require('./licensed.glb'),
  license: { source: '...', terms: 'diagnostic-only', reviewedAt: '2026-09-18' },
  skeletalClipIndex: 0,
};
```

Metro does not have to bundle a GLB named only by a string path. Do not use a
remote URL, file URI or asset without a documented licence, and never present a
sample as a production Финни resource.

`HomeSceneSpike` is not connected to ordinary Home. Run it only behind the
build-time gate `EXPO_PUBLIC_FINNI_3D_DIAGNOSTIC=1`; otherwise `AppRoot` remains
the default entry. Its runtime evidence is not production PASS.