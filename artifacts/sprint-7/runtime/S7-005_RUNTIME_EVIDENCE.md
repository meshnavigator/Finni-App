# S7-005 runtime/release evidence

- Evidence date: 2026-09-21 (Europe/Moscow)
- Scope: diagnostic-only layered 2D spike; not production art or default AppRoot
- Runtime: Expo 57 / React Native 0.86.3, React Native core `Image`, `Animated`, `ScrollView`
- Integration commit: `dc4d877983dca1bd07bf6388e9f03bf25d9f3c45`
- Reachability commit: `50ce16011f3fa7a571ae543c53a19c643861e951`
- Final content-sizing commit: `a19d7666d7a27ae77472a88b3f7cbf2e04417ab3`

This report records actual source, build and API 26 emulator evidence. It does
not accept DEC-2026-09-19-007, does not authorize S7-006, and does not claim
physical-device performance evidence.

## Implemented boundary

- Dedicated entry: `index.s7-005.ts`, selected only by
  `FINNI_2D_SPIKE_ENTRY=1`.
- Default `App.tsx` / `AppRoot` routing remains unchanged.
- Static local assets only, registered by
  `assets/2d/candidates/s7-002-poc-v1/manifest.ts`.
- Techniques: native-driver transform, open/blink PNG swap, 4×3 / 12-frame
  sprite sheet.
- Lifecycle: animation clock pauses for modal/background/reduced motion;
  background releases the stage; effects clear their interval and stop native
  animations on cleanup/remount.
- Reduced motion: static open-state image, no pressed-scale animation and no
  modal fade.
- Failure boundary: explicit missing/corrupt diagnostic scenarios and
  `Image.onError` converge on a labelled safe fallback.
- Accessibility: signed `Pressable` controls with labels, hints, role/state and
  a minimum 48 dp target. The screen is a vertical `ScrollView`; the modal is
  outside it and exposes only modal content while open.

## Asset identity

| Asset | SHA-256 |
|---|---|
| open PNG | `88cd415a30faa7e3a2b9c70cd57ff59ea1d68d86ca9601438b3db93ad8ca8b86` |
| blink PNG | `0afee6b06cd93d018458a30dae6c240fbbdbc07075e70ce5c0e206912d0dded9` |
| idle sprite PNG | `7f82deb89fbb85f22fe22a4ebd1a80c7fd02d4cdc6741093a9f7e2ca2bfa918e` |

All three are marked diagnostic/not-production.

## Source and dependency verification

- `npm run verify`: PASS after both UI fixes; lint and typecheck PASS; 65/65
  tests PASS; content and fixtures PASS.
- `git diff --check`: PASS.
- `npm ci`: PASS from the lockfile, 710 packages installed / 711 audited.
  npm reports 10 moderate vulnerabilities; no automatic dependency mutation
  was performed.
- Final tracked worktree after source commits: clean.

## Clean signed release

- Command: `npm run android:release:2d-spike`.
- Gradle result: `BUILD SUCCESSFUL in 14m 13s`, 368 actionable tasks
  (310 executed, 58 up-to-date).
- The release script ran configured Verify before `gradlew clean
  :app:assembleRelease` and bundled `index.s7-005.ts` (583 modules, 3 assets).
- SDK root: workspace SDK through `S:` alias, required because the native CMake
  toolchain shortens the spaced SDK path incorrectly.
- Signing material stayed process-local: DPAPI `PSCredential` username mapped
  to alias and its `SecureString` to store/key passwords; secret values were
  not printed or persisted in the repository.
- APK: `android/app/build/outputs/apk/release/app-release.apk`.
- APK size: 113,943,923 bytes.
- APK SHA-256:
  `A36CFC277E94FC9CE7EF3FADC2B1BFA54A1A4C70DF01262DE8B4A186B915BB06`.
- Signature: verifies with APK Signature Scheme v2; one RSA-4096 signer;
  certificate SHA-256
  `902d920bbc11ef0d704766edfe9e983d2cf96581417b30376ebe974e15495b7d`.
- Manifest: package `com.meshnavigator.finni`, version `0.1.0` / code 1,
  compile SDK 36, min SDK 26, target SDK 36, portrait launch activity
  `com.meshnavigator.finni.MainActivity`.
- Native ABIs: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.
- APK contains `assets/index.android.bundle`.

## API 26 runtime

- Target: AVD `finni_s7_005_api26`, Android API 26 x86_64, 1080×1920,
  density 420 dpi; this is emulator evidence, not physical-device evidence.
- Fresh replacement install: PASS.
- Launch without Metro: PASS; process and resumed `MainActivity` confirmed.
- App-PID-only logcat scan: no `FATAL EXCEPTION`, AndroidRuntime app error,
  ReactNativeJS error/exception, missing-script error, Metro localhost/8081 or
  connection-refused match.
- Reduced motion: PASS; UI exposed `Reduced motion · static` with the static
  character image. Final measured local image decode display value: 427.4 ms.
- Modal: opened by an on-screen touch; tree exposed only modal title/text and
  the 126 px-high Continue control. Lower controls were absent, confirming
  input blocking.
- Missing fallback: actual on-screen touch PASS.
- Corrupt/decode fallback: actual on-screen touch PASS.
- Restore asset: actual on-screen touch PASS.
- Remount: 20 actual on-screen touches PASS; the process remained alive and
  the character/control tree returned.
- Background/foreground: 10 HOME/resume cycles PASS; the same process remained
  alive and `MainActivity` resumed.
- Android animation scale overrides were deleted after the reduced-motion
  check; all three settings read `null`, meaning the emulator default applies.

## Reachability before / after

| Check | Before | After final fix |
|---|---|---|
| Container | Non-scrollable fixed root | `two-d-scene-scroll`, vertical native ScrollView |
| Scene sizing | `stage: flex: 1` fixed ScrollView content to viewport and let later children overflow | Stage uses natural content height plus 16 dp vertical padding |
| Missing button | `[0,0][0,0]` in the original runtime capture; later first fix exposed only a clipped 63 px region | `[42,1527][360,1653]`, 318×126 px |
| Corrupt button | `[0,0][0,0]` originally / clipped after first fix | `[381,1527][699,1653]`, 318×126 px |
| Restore button | `[0,0][0,0]` originally / clipped after first fix | `[720,1527][1038,1653]`, 318×126 px |
| 48 dp gate | FAIL | PASS: 126 px / 2.625 density = 48 dp |

The modal and remount controls also measure 126 px high. No hidden hotspot or
D-pad invocation is used in the final fallback evidence.

## Measurements

### Cold start

Three `am force-stop` + `am start -W` runs:

| Run | ThisTime | TotalTime | WaitTime |
|---|---:|---:|---:|
| 1 | 824 ms | 824 ms | 833 ms |
| 2 | 856 ms | 856 ms | 874 ms |
| 3 | 775 ms | 775 ms | 794 ms |

Mean TotalTime: 818.3 ms.

### Memory

`dumpsys meminfo` values are PSS in KB on the API 26 emulator.

| Point | Total PSS | Native heap | Java heap |
|---|---:|---:|---:|
| Before lifecycle stress | 66,459 KB | 15,380 KB | 3,836 KB |
| Immediately after 20 remount + 10 resume | 76,832 KB | 19,308 KB | 4,408 KB |
| 30 s settled | 76,020 KB | 19,092 KB | 3,828 KB |

Settled delta versus baseline: +9,561 KB total, +3,712 KB native and -8 KB
Java. One bounded stress sample cannot prove a leak slope; it does show a
stable live process and bounded heap in the executed sequence.

### Frames

After resetting `gfxinfo`, 12 seconds of active transform animation produced:

- 409 total frames; 409 janky (100.00%);
- p50 48 ms, p90 85 ms, p95 101 ms, p99 121 ms;
- 279 missed vsync, 0 high-input-latency frames, 259 slow UI-thread frames,
  3 slow bitmap uploads and 409 slow issue-draw-command frames.

This AVD is a headless/software-rendered API 26 emulator. These values are
recorded honestly but are not a physical-device performance acceptance result.
DEC-2026-09-18-005 keeps the final physical-device gate deferred.

## Verdict and limits

S7-005's source, signed-release and functional API 26 emulator gates PASS:
local decode, three techniques, lifecycle/remount/modal behavior, reduced
motion, fallback, 48 dp touch reachability, fresh install and no-Metro launch
were observed on the final APK.

The remaining limitation is performance interpretation: the software-rendered
emulator reports 100% jank, so this report cannot establish production frame
performance. The physical-device gate remains deferred, not silently passed.
Art also remains diagnostic/not-production until S7-004 accepts provenance.
DEC-2026-09-19-007 must therefore be decided explicitly from this evidence;
this report itself does not accept it, and Filament/Worklets remain installed.
