# DEC-2026-09-19-007 — Технология layered 2D runtime

- Status: Accepted, 2026-09-21
- Scope: concrete React Native asset/render/animation implementation
- Related tasks: S7-004, S7-005, S7-006, S9-001, S10-001
- Evidence commit: `77e6d114eb7498337424ca22ec69812c47157452`

## Контекст

DEC-2026-09-19-006 приняла layered 2D cutout/2.5D как целевое направление,
но оставила конкретную runtime technology открытой до S7-005. S7-005 на Expo
57 / React Native 0.86.3 проверила локальный decode, transform, image swap,
sprite playback, lifecycle, reduced motion, modal/input boundary, fallback и
clean signed release на Android API 26 emulator.

S7-004 отдельно приняла пакет `FINNI-2D-MASTER-V1` и его exact hashes. Поэтому
runtime-решение может быть принято без переноса diagnostic S7-002 assets в
production.

## Решение

- Production runtime использует React Native 0.86.3 core `Image` и `Animated`;
  новые graphics/runtime dependencies не добавляются.
- Разрешённые техники: локальная композиция PNG-слоёв, deterministic
  transforms с native driver, open/blink image swap и sprite sheet playback.
- Production Home использует только принятые S7-004 assets:
  - `FINNI-ROOM-CLEAN-V1` —
    `2c76a1e29090e61de615c5e228bf309d34016f89aa74cac9ea1b990821ac6140`;
  - `FINNI-PET-NEUTRAL-CANVAS-V1` —
    `8b2932caa23b99ae0d6575105940cda70858619f32333d564847d9b0dcdb6cc0`;
  - `FINNI-PET-BLINK-CANVAS-V1` —
    `2797ab29e3d6b91d4342f80a71c892a574751513833c569c53e7f8c077b51905`.
- S7-002 open/blink/sprite assets остаются diagnostic comparative evidence и
  не получают production status этим решением.
- Animation clock обязан останавливаться для background, modal и reduced
  motion; эффекты освобождают timers/animations при cleanup/remount. Reduced
  motion показывает эквивалентный статический neutral state и не меняет
  игровое состояние.
- Decode/missing/corrupt errors переходят в подписанный локальный fallback;
  визуальный компонент не владеет economy, profile или persistence data.
- Rollback boundary — один Home presentation component и его локальные assets.
  `AppRoot`, application/domain/persistence contracts и catalog IDs не меняют
  владельца и не зависят от image animation state.
- S7-006 разрешено удалить Filament, Worklets, GLB diagnostic routing и
  временный S7-005 entry после подключения принятого Home component и
  повторного clean signed release.

## Измерения и ограничения

- signed diagnostic APK: SHA-256
  `A36CFC277E94FC9CE7EF3FADC2B1BFA54A1A4C70DF01262DE8B4A186B915BB06`,
  APK Signature Scheme v2, 4 ABI, install/run без Metro — PASS;
- API 26 emulator: lifecycle ×10, remount ×20, modal blocking, reduced motion,
  missing/corrupt fallback и 48 dp controls — PASS;
- mean cold-start TotalTime: 818.3 ms; local image decode display: 427.4 ms;
- settled PSS после stress: 76,020 KB против 66,459 KB baseline; единичная
  bounded выборка не доказывает leak slope;
- software-rendered AVD показал 409/409 janky frames. Эта цифра фиксируется как
  ограничение среды и не является production performance PASS.

Принятие technology относится к функциональной и release-пригодности core
pipeline. Оно не отменяет physical-device performance gate из DEC-005 и S10:
frame time, memory trend и decode budgets должны быть повторно измерлены на
физическом целевом устройстве до финального release acceptance.

## Последствия

Filament/Worklets и GLB больше не являются production dependencies. S7-006
удалила их из current runtime, сохранила historical 3D evidence вне runtime и
выпустила clean signed APK с SHA-256
`8EB37A8DE5ADF9FF9FC38BD62282D31D8C2F26AC6F1D032F3A4F14CD82F8B32E`.
Sprint 8 производит полный набор
стадий/3×3/анимаций на принятом core pipeline; Sprint 10 остаётся финальным
device/performance gate.

## Verify

- `Finni App/artifacts/sprint-7/runtime/S7-005_RUNTIME_EVIDENCE.md` связывает
  source commits, configured Verify, release build, APK/signature/manifest/ABI,
  install/run и runtime measurements;
- S7-005: configured Verify PASS, 65/65 tests; clean signed release PASS;
- S7-006: configured Verify PASS, 49/49 current tests; production clean signed
  release, fresh API 26 install/run и Home/modal/lifecycle checks PASS;
- S7-004 owner verdict: Скоробагатько Константин Владимирович, руководитель
  разработки, принял exact `FINNI-2D-MASTER-V1` hashes 2026-09-21;
- внешний repository не настроен; GitHub-действия не выполнялись.
