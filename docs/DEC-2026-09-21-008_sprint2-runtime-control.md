# DEC-2026-09-21-008 — Sprint 2 persistence, runtime control и recovery

- Status: Accepted, 2026-09-21
- Scope: schema v4/v5, общая SQLite-очередь, period summary, production mode и
  admin recovery
- Related tasks: S2-001–S2-006

## Контекст
Sprint 2 добавляет несколько денежных repositories, закрытие периода и
удаление mode data. Независимые executors на одном соединении допускают гонки
revision и не дают гарантировать закрытие БД перед delete. AppControl должен
переживать удаление игровой БД и восстанавливать прерванный admin intent до её
повторного открытия.

## Решение
- один AppRuntime владеет одним `RepositoryExecutor`; все repositories получают
  его через injection, а runtime закрывает соединение ровно один раз;
- schema v4 хранит purchase slots, selected/claimed goals и overrun; schema v5
  хранит `pet_stage` и immutable `period_summary`;
- `ClosePeriod` выполняется отдельной receipt-first транзакцией;
- control state хранится в отдельной `finni-control.db` с transactional CAS;
- production UI выполняет команды только через LifecycleCoordinator и
  captured `sessionEpoch`;
- reset/delete используют только фиксированные mode filenames после остановки
  очереди и закрытия соединения;
- без filesystem capability успешный `deleteDatabaseAsync` плюс идемпотентный
  recovery является ограниченным verification contract; открытие отсутствующей
  БД для проверки запрещено, physical evidence остаётся S2-006.

## Последствия
Normal/demo и control data разделены; stale UI не может продолжить команду
после mode/admin boundary. История операций и итог периода воспроизводимы по
immutable snapshots. Native process-kill/disk-full/upgrade не считаются
пройденными по Node SQLite тестам.

## Verify
- `npm run test:core` — 52/52 PASS;
- полный suite — 69/69 PASS;
- migration failure/retry, receipt replay, reconciliation, mode isolation и
  recovery каждой admin phase — PASS;
- Android device/release gate — NOT RUN, вынесен в S2-006.
