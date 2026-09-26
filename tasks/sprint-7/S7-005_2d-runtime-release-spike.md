# S7-005: Проверить layered 2D runtime и signed release boundary

## Статус

**DONE, 2026-09-21.** Functional/runtime и clean signed-release gates прошли
на Android API 26 emulator. DEC-2026-09-19-007 приняла React Native core
`Image`/`Animated`; physical-device performance остаётся финальным gate S10.

## Цель

Доказать на Expo 57 / React Native 0.86.3 минимальный локальный 2D pipeline для
слоёв, deterministic transforms, image swap/sprite playback, lifecycle и
signed release до выбора production technology.

## Контекст

POC содержит PNG, sprite sheet, MP4 previews и JSON contract, но не интегрирован
в приложение. Production путь остаётся `src/ui/AppRoot.tsx` через
`application/ui-model.ts` и `application/app-runtime.ts`. Существующий
`src/ui/HomeSceneSpike.tsx` с `home-scene-spike-contract.ts` и dependents
`HomeSceneSpikeFinniCandidate.tsx`/`HomeSceneSpikeFoxDiagnostic.tsx` —
изолированный 3D diagnostic boundary, а не место молчаливой замены.

## Состав работ

- создать отдельный opt-in 2D diagnostic screen/contract рядом с `src/ui`, не
  подключая его к default `AppRoot` до PASS;
- загрузить локальные candidate layers из versioned production-candidate path,
  реализовать idle transform, blink image swap и один sprite sequence;
- проверить deterministic timing, pause/resume, background/foreground,
  navigation/remount, modal input blocking и disposal/cache policy;
- проверить static reduced-motion state и подписанные RN controls без
  зависимости от скрытых hotspots;
- измерить decode time, peak/resident memory, dropped frames и cold start на
  release build; проверить missing/corrupt asset fallback;
- выполнить clean signed release без Metro и по evidence перевести
  DEC-2026-09-19-007 в Accepted либо записать точный blocker.

## Источники

- DEC-2026-09-19-006 и Proposed DEC-2026-09-19-007;
- `Finni_S7-002_2D_POC/animation-contract.json`, `VERIFY.md`;
- DEC-2026-09-18-004 renderer-neutral composition baseline;
- DEC-2026-09-18-005 evidence/device rules; SRS v1.3 §§14, 17–18.

## Критерии приёмки

- candidate layers декодируются только локально и воспроизводят три техники
  без потери alpha/масштаба;
- lifecycle ×10, navigation/remount ×20 и modal blocking не оставляют stale
  animation, input или неограниченный cache;
- reduced motion даёт статический эквивалент и не меняет игровое состояние;
- fresh install и clean signed release проходят без Metro;
- measurements и выбранная техника/версии/limits зафиксированы в Accepted
  DEC-2026-09-19-007 либо задача завершается точным blocker report.

## Зависимости

- Accepted DEC-2026-09-19-006;
- кандидат S7-004 может использоваться до art PASS только с явной маркировкой
  diagnostic/not-production; production wiring ждёт S7-004 PASS;
- release key/DPAPI process из S0-005.

## Verify

- configured Verify и targeted 2D contract tests;
- clean `npm ci`, signed release, signature/manifest/ABI/SHA-256 checks;
- Android install/run без Metro, background ×10, navigation ×20;
- decode/cache/memory/frame evidence и reduced-motion/missing-asset scenarios;
- full belief-map rebuild после новых imports/routes и `git diff --check`.

## Out of scope

- изменение domain/persistence/economy-v2;
- удаление Filament/Worklets до принятия DEC-2026-09-19-007;
- полный production art set Sprint 8 и финальная device matrix Sprint 10.
