# S7-005 — layered 2D runtime и signed release boundary

## Outcome

**DONE, 2026-09-21.** Изолированный Expo 57 / React Native 0.86.3 spike
подтвердил local PNG layers, deterministic native-driver transform,
open/blink swap, sprite playback, lifecycle, reduced motion, input blocking,
fallback и clean signed release. По evidence принята DEC-2026-09-19-007.

## Implementation and evidence

- Runtime commits: `dc4d877983dca1bd07bf6388e9f03bf25d9f3c45`,
  `50ce16011f3fa7a571ae543c53a19c643861e951`,
  `a19d7666d7a27ae77472a88b3f7cbf2e04417ab3`.
- Evidence commit: `77e6d114eb7498337424ca22ec69812c47157452`.
- Detailed report:
  `Finni App/artifacts/sprint-7/runtime/S7-005_RUNTIME_EVIDENCE.md`.
- Default `AppRoot` не переключался в spike; production wiring принадлежит
  S7-006 после art/decision gates.

## Verify

- `npm ci` — PASS; 710 packages installed, npm reports 10 moderate
  vulnerabilities без автоматической мутации dependencies.
- Configured Verify — PASS: lint, typecheck, 65/65 tests, content, fixtures.
- Clean signed release — PASS; APK SHA-256
  `A36CFC277E94FC9CE7EF3FADC2B1BFA54A1A4C70DF01262DE8B4A186B915BB06`;
  v2 signature, 4 ABI, minSdk 26 / targetSdk 36.
- API 26 install/run без Metro, reduced motion, modal blocking,
  missing/corrupt fallback, lifecycle ×10 и remount ×20 — PASS.
- 48 dp touch reachability — PASS после ScrollView/natural-sizing fixes.

## Measurements and limits

- mean cold-start TotalTime: 818.3 ms; local decode display: 427.4 ms;
- settled PSS: 76,020 KB против 66,459 KB baseline после bounded stress;
- software-rendered AVD: 409/409 janky frames. Это честно зафиксированное
  ограничение среды, не physical-device performance PASS и не доказательство
  production frame budget.

Physical-device frame/memory/decode gate сохраняется в S10. S7-006 разрешено
удалить superseded 3D dependencies и выпустить clean production-path APK.
