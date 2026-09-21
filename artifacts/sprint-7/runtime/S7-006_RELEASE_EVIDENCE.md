# S7-006 production 2D cleanup and release evidence

- Evidence date: 2026-09-21 (Europe/Moscow)
- Source commit: `cefa6f3`
- Branch: `S7-006/retire-3d-stack`
- Preserved S7-002 evidence commit: `19c8777b4572da686e2b2dc9a66421a47a2edeaf`
- Unchanged integration branch: `dev` at `f9232d21c96795d90b0afe949887b334b50b544b`

## Runtime result

- Default `App.tsx` has one production route to `AppRoot`.
- Home renders `FinniHomeScene` with exact `FINNI-2D-MASTER-V1` room,
  neutral and blink PNG hashes accepted in S7-004.
- The component owns presentation-only `Image`/`Animated` state. It imports no
  application, domain or persistence module; `AppRoot` remains the owner of
  profile/economy/persistence state.
- App background, help modal and reduced-motion pause animation; cleanup stops
  native animation and blink interval. Image decode failure renders a labelled
  local fallback.
- Filament, Worklets Core, GLB asset extension, diagnostic routes/assets/tests
  and temporary S7-005 entry/release path are absent from the runtime graph.

## Source and dependency verification

- Fresh `npm ci`: PASS; 706 packages installed / 707 audited.
- Configured Verify inside release script: PASS — lint, typecheck, 49/49
  current tests, content and fixtures.
- `npm ls react-native-filament react-native-worklets-core
  @babel/plugin-transform-shorthand-properties --all`: empty.
- `npm audit`: 10 moderate, 0 high, 0 critical. Findings are transitive through
  Expo CLI/config/xcode/uuid; npm's offered fix is an incompatible downgrade to
  Expo 46, so no automatic mutation was applied.
- Full belief-map rebuild: 29 source modules / 278 edges; `FinniHomeScene` has
  only `AppRoot` as dependent and no application/domain/persistence import.
- `git diff --check`: PASS before source commit.

## Clean signed release

- Command: `npm run android:release` with process-only DPAPI signing values.
- SDK: official packages under workspace `tmp/android-sdk`, exposed through
  `S:` because the native Windows toolchain mis-parses the spaced project path.
- Result: `BUILD SUCCESSFUL in 11m 15s`; 262 actionable tasks.
- Bundle: production `index.ts`, 636 modules, 3 local assets.
- Artifact: `artifacts/sprint-7/finni-0.1.0-s7-006-release.apk`.
- Size: 78,656,529 bytes.
- SHA-256:
  `8EB37A8DE5ADF9FF9FC38BD62282D31D8C2F26AC6F1D032F3A4F14CD82F8B32E`.
- Signature: APK Signature Scheme v2; one RSA-4096 signer; certificate DN
  `CN=Better Together, O=Better Together, C=RU`; certificate SHA-256
  `902d920bbc11ef0d704766edfe9e983d2cf96581417b30376ebe974e15495b7d`.
- Manifest: `com.meshnavigator.finni`, version 0.1.0/code 1, minSdk 26,
  targetSdk 36, compileSdk 36, portrait MainActivity.
- Native ABI: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.
- APK/build graph search found no Filament, Worklets or `.glb` entry.

## API 26 runtime

- Fresh uninstall/install: PASS.
- Launch without Metro: PASS; cold launch TotalTime 1375 ms, PID 9538.
- App log scan: no fatal Android/React Native, missing bundle, Metro localhost
  or connection-refused match.
- Local profile creation and production Home: PASS. Accessibility tree exposes
  `finni-home-scene` with the accepted Home label and does not expose the
  fallback.
- Reduced-motion static Home: PASS after temporary Android scale 0; animation
  scales were restored to 1.
- Help modal: PASS; modal tree exposes only overlay content and no
  `finni-home-scene`, confirming lower-layer input isolation.
- HOME/resume ×10: PASS; PID remained 9538.
- Evidence: `S7-006_HOME_API26.png`, `S7-006_HOME_API26.xml`,
  `S7-006_MODAL_API26.xml`.

## Remaining limit

This closes the emulator functional/release cleanup gate. DEC-007 still keeps
physical-device frame, decode and memory budgets in S10; no physical-device
performance PASS is claimed here.
