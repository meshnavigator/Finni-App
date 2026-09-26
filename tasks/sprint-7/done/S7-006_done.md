# S7-006 — удалить superseded 3D stack и восстановить signed release

## Outcome

**DONE, 2026-09-21.** Default Home переведён на accepted
`FINNI-2D-MASTER-V1` через React Native core `Image`/`Animated`. Runtime
Filament/Worklets/GLB boundary удалена; historical governance packages и
commit S7-002 сохранены.

## Changes

- Source commit: `cefa6f384dbd29399f24a021940a7003d7c91889`.
- Release evidence commit: `3c65b53cd28a21b43a6069b0210cdb071c06bf6a`.
- Clean integration commit from unchanged `dev`:
  `d439255`; its tree hash exactly matches `3c65b53`, but its history excludes
  the intermediate S7-002/S7-005 commits.
- `App.tsx` теперь имеет единственный default `AppRoot` route.
- Новый `FinniHomeScene` использует local room/neutral/blink master hashes,
  deterministic native-driver transform, blink swap, AppState/reduced-motion/
  modal pause, cleanup и labelled decode fallback.
- `AppRoot` по-прежнему владеет application/domain/persistence state; scene —
  presentation-only boundary.
- Удалены 3D routes/components/contracts/assets/tests, Filament, Worklets,
  Worklets Babel plugin, Metro GLB extension и временный S7-005 entry/build
  path. Diagnostic S7-002 app copies удалены; исходные governance packages не
  изменены.

## Verify

- fresh `npm ci` — PASS, 706 packages / 707 audited;
- configured Verify — PASS: lint, typecheck, 49/49 current tests, content,
  fixtures;
- removed dependency `npm ls` — empty; runtime/build search — no
  Filament/Worklets/GLB/temporary entry;
- full belief-map rebuild — 29 modules / 278 edges; new scene has only
  `AppRoot` dependent and no financial/persistence imports;
- clean signed release — PASS in 11m15s; v2 signature, 4 ABI, minSdk 26,
  targetSdk 36;
- final APK: `Finni App/artifacts/sprint-7/finni-0.1.0-s7-006-release.apk`,
  78,656,529 bytes, SHA-256
  `8EB37A8DE5ADF9FF9FC38BD62282D31D8C2F26AC6F1D032F3A4F14CD82F8B32E`;
- fresh API 26 install/run без Metro, Home, reduced motion, modal isolation и
  HOME/resume ×10 — PASS; PID stable;
- detailed evidence:
  `Finni App/artifacts/sprint-7/runtime/S7-006_RELEASE_EVIDENCE.md`.

## Preservation and limits

- `S7-002/finni-art-quality-slice` указывает на historical commit
  `19c8777b4572da686e2b2dc9a66421a47a2edeaf`; `dev` остался на `f9232d2`.
- R1–R4, 3D addendum/reviews, S7-002 POC и completion reports сохранены вне
  app runtime.
- `npm audit`: 10 moderate transitive Expo CLI/config/xcode/uuid findings;
  0 high/critical. Предлагаемый npm fix несовместим с Expo 57, поэтому не
  применялся.
- Physical-device performance остаётся gate S0-006/S10; API 26 emulator PASS
  не подменяет frame/memory/decode evidence физического устройства.
