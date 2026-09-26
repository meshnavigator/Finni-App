# S3-002 — задания B01/B02 и P01/P02

- Статус: done
- Дата закрытия: 2026-09-23
- Task branch commit: `11290ab`
- Integration commits: `49249f1`, `8a48f45`, evidence `534df56`
- Интеграционная ветка: `sprint-3/lessons-content-integration`
- [Android runtime evidence](../../../Finni%20App/docs/S3-002_android-runtime-evidence.md)

## Результат

Реализованы и подключены четыре задания: распределение бюджета B01/B02 и
детективы покупок P01/P02. Уроки используют валидированный bundle 1.2.0,
immutable snapshot параметров попытки, отдельные учебные монеты и общий
LessonShell. P01/P02 раскрывают сведения о товаре, требуют выбора упаковок и
расчёта общей стоимости/остатка; P02 различает более экономный выбор и
допустимую дорогую альтернативу при одинаковом покрытии.

## Verify

- Android API 26 AVD: B01/B02/P01/P02 прошли успешным и допустимым неуспешным
  путём с оценкой, объяснением и завершением — PASS.
- P02 более дорогая допустимая альтернатива — PASS.
- После тренировочных уроков Home: кошелёк 0, копилка 0; реальная покупка не
  совершалась — PASS.
- Canonical fixtures всех вариантов B01/B02/P01/P02 через actual evaluator,
  component/runtime-contract tests — PASS.
- `npm.cmd run verify` — PASS: lint, typecheck, 101/101 tests, content,
  validator и fixtures; `git diff --cached --check` — PASS перед evidence-коммитом.
- [Commit-report](../../commits/sprint-3/2026-09-23_s3-002-android-runtime_534df56.md).

## Решения и ограничения

Нового архитектурного решения нет; `docs/IMPLEMENTATION_DECISIONS.md` не менялся.
`docs/CURRENT_IMPLEMENTATION.md` и схема обновлены только в статусе evidence:
runtime/data flow не изменён. Проверка проводилась с debug APK и Metro на
эмуляторе, не с signed/offline release и не на физическом устройстве. Отдельные
device/OEM/accessibility/performance gates остаются в Sprint 10.
