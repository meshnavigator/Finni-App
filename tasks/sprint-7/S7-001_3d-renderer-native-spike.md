# S7-001: Проверить 3D-рендер и native build boundary

## Статус

**PARTIAL — CLOSED, 2026-09-18.** Filament 1.11.0, локальный licensed GLB,
skeletal clip contract, lifecycle, hit-testing path, HUD и modal blocking
реализованы; source Verify и clean debug build прошли. Signed release имеет
точный dependency blocker S7-003. Аппаратный evidence отложен в S0-006 и
S10-001 по DEC-2026-09-18-005 и не заявляется выполненным.

## Цель
Доказать совместимость выбранного 3D pipeline с фактическими версиями приложения,
API 26 и release APK до массового производства графики.

## Контекст
React Native Filament — только первый кандидат. Документация библиотеки не
доказывает совместимость с Expo 57, RN 0.86.3, ABI и сохранённым Android-каталогом.

## Состав работ
- зафиксировать кандидат, версии, lockfile и минимальный native diff;
- загрузить локальный GLB, проиграть skeletal clip и показать HUD overlay;
- проверить hit testing, modal blocking, pause/resume и resource disposal;
- собрать development и signed release без Metro для нужных ABI;
- измерить frame time, память, cold start и локальный feedback;
- оформить Accepted tech decision либо доказанный blocker.

## Источники
- 3D-дополнение §§10–12; TECH-001–004, PERF-001–002;
- VR-003; DEC-2026-09-18-002 и DEC-2026-09-18-004;
- SRS v1.3 §§14, 17–18.

## Критерии приёмки
- воспроизводимая сборка использует зафиксированные версии;
- GLB, клип, overlay и touch-blocking работают на целевом устройстве;
- background/return не оставляет чёрную сцену и утечку ресурсов;
- release APK запускается без Metro на API 26 и нужных ABI;
- PASS приводит к Accepted tech decision, FAIL — к точному blocker report.

## Зависимости
- Accepted DEC-2026-09-18-002 и композиционный baseline DEC-2026-09-18-004;
- инженерную интеграцию и сборочные проверки можно начать сейчас;
- S0-006 либо эквивалентный физический API 26 evidence обязателен до PASS.

## Verify
- clean debug/release build и install;
- physical API 26 run, background/foreground ×10, navigation ×20;
- frame-time/memory/resource-release evidence;
- configured Verify и `git diff --check`.

## Out of scope
- полный персонаж и каталог;
- изменение minSdk или economy-v2;
- выбор рендера по рекламным заявлениям без runtime evidence.

## Закрытие 2026-09-18

Задача закрыта как `partial`: подтверждены code contracts и clean debug native
boundary, но signed release и device/runtime budgets не подтверждены. Evidence:
[S7-001_partial.md](done/S7-001_partial.md). Release blocker вынесен в S7-003,
аппаратный scope — в S0-006/S10-001.
