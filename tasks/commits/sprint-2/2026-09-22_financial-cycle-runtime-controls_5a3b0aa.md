# Commit 5a3b0aa — финансовый цикл и runtime controls Sprint 2

## Summary

Коммит `feat(s2): implement financial cycle and runtime controls` реализует
автоматизируемый scope S2-001–S2-005: магазин, накопления, итоги периода,
развитие питомца, историю, adult/data controls и интеграционную регрессию.

## Связанные задачи

- [S2-001](../../sprint-2/S2-001_shop-purchases-and-ledger.md)
- [S2-002](../../sprint-2/S2-002_savings-goals-and-claims.md)
- [S2-003](../../sprint-2/S2-003_period-close-and-pet-progress.md)
- [S2-004](../../sprint-2/S2-004_history-adult-and-data-controls.md)
- [S2-005](../../sprint-2/S2-005_persistence-integration-regression.md)
- Оставшийся Android/device gate: [S2-006](../../sprint-2/S2-006_verify-sprint2-android-runtime.md)

## Изменённые подсистемы

- Domain: каталог из 8 товаров и 3 целей.
- Application: `ProductionAppController`, adult access, lifecycle/session control.
- Persistence: commerce и period-summary repositories, schema v4/v5,
  `finni-control.db`, Expo control/admin adapters, единый `RepositoryExecutor`.
- UI: Shop, Savings, Ledger, PeriodResult, History, Help и Adult screens.
- Tests: commerce, savings, period close, adult/history/control, crash/replay,
  migration fixture и reconciliation regression.

## Поведение и контракты

- Покупки, deposits/withdrawals, claims и period close атомарны и replay-safe.
- Receipt фиксируется в одной транзакции с ledger и проекциями.
- Pending admin intent восстанавливается до открытия game DB.
- Adult unlock хранится только в памяти и снимается при background, exit,
  смене mode/session и idle timeout.
- Reset/delete ограничены известными normal/demo database files.

## Решения и документация

- Принята `DEC-2026-09-21-008_sprint2-runtime-control.md`.
- Обновлены `CURRENT_IMPLEMENTATION.md`, `TASKS.md` и Mermaid data/runtime flow.
- Изменения governance находятся вне Git-репозитория `Finni App`.

## Verify

- `npm run test:core`: 52/52 PASS.
- `npm test`: 69/69 PASS.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run content`: PASS.
- `npm run fixtures`: PASS.
- `git diff --cached --check`: PASS перед коммитом.
- Belief map: 47 nodes, 340 entities, 434 edges.

## Breaking changes и миграции

- Schema повышена до v5; migration v4→v5 проверена file-backed fixture.
- Более новая неизвестная schema отклоняется без reset данных.
- Публичного сетевого API и серверной миграции нет.

## Оставшиеся риски

Не выполнены физические Android process-kill/disk-full, signed APK upgrade
v4→v5, пять cold starts и device latency/demo runs. Они не объявляются PASS и
вынесены в S2-006.
