# S1-004 — completion report

- Статус: **done**
- Дата: 2026-09-17
- Task-ветка: `S1-004/onboarding-pet-and-home`
- Основной task-коммит: `58464ba`
- Runtime-fix/evidence коммит: `e5437da`
- Merge в `dev`: `37c954e`
- Signing-note follow-up/merge: `5854561` / `07f3ff1`

## Результат

Первая пользовательская вертикаль завершена: onboarding без регистрации/PII,
один локальный профиль, девять комбинаций питомца, повторное редактирование,
loading/error shell и compact home с обязательными финансовыми показателями.
Функциональное описание исходной реализации сохранено в
`S1-004_partial.md`; этот отчёт закрывает отложенный Android runtime-gate.

Первый неизменяемый APK выявил реальный дефект Android safe-area. Домик
исправлен: контент начинается ниже status bar, компактные подписи шапки и
навигации остаются однострочными и читаемыми, фиксированные 48 dp controls не
переполняются при `fontScale=2`. Общий контент по-прежнему увеличивается и
доступен через ScrollView.

## Источники решения

- официальное ТЗ §§2.5.1–2.5.3, 2.6;
- SRS v1.3: UC-01, SC-01–04, FR-01–05/55/62;
- DEV-06/07/47; TC-001–004, TC-075/076, TC-183–185;
- существующие S1-002 SQLite и S1-003 lifecycle contracts.

Нового Accepted-решения нет: изменён только Android layout/adaptive-text слой;
публичные, persistence и domain contracts не менялись.

## Verify

- `npm.cmd run verify` — **PASS** после fix и повторно после merge в `dev`;
- lint/typecheck/content/fixtures — **PASS**;
- tests — **PASS**, 40/40;
- `git diff --check`, `git diff --cached --check` — **PASS**;
- full belief-map rebuild — **PASS**: 25 modules, 207 entities, 233 edges;
- `analyze src/ui/AppRoot` — 15 entities, 4 imports, 14 refs, 1 dependent,
  6 boundary files;
- Android release build r4 — **PASS**, 75 814 685 bytes, SHA-256
  `3486DA3B6F0BFC46FC03D52CE2E2C825DF818CEE62A222D24732BF0EDD6B2804`;
- AVD Android API 36, 360×640 dp: onboarding, две комбинации, cancel edit,
  force-stop/offline relaunch, fontScale 1/2 — **PASS**;
- runtime protocol: `Finni App/artifacts/sprint-1/runtime/S1-006_RUNTIME_EVIDENCE.md`.

## Риски и ограничения

- физический Android API 26 не проверен; это отдельный carry-over gate S0-006;
- r4 подписан локальным runtime-test ключом; production/M1 APK нужно собрать
  штатным release-ключом владельца;
- SQLite-файл release APK нельзя читать через `run-as`; единственность профиля
  и неизменность ID доказаны file-backed integration test, runtime подтверждает
  сохранение имени, вида и денег;
- screen shell остаётся normal-only; mode/admin UI относится к S2-004.

## Документация и диаграммы

Обновлены `CURRENT_IMPLEMENTATION.md`, task registry и execution order. Нового
решения нет, `IMPLEMENTATION_DECISIONS.md` не менялся. Runtime fix не меняет
data flow или workflow, поэтому Mermaid-диаграммы не обновлялись.

## Внешние действия

Merge выполнен только локально. Push, PR, issue и project board не создавались:
`repository` в конфигурации пуст и внешние действия не входили в scope.
