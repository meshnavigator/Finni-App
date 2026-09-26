# Commit report — 042a77d

## Summary

Коммит `042a77d` (`feat(persistence): implement atomic SQLite transactions`)
реализует S1-002: schema v1, сериализованную очередь SQLite, атомарную денежную
транзакцию, persisted receipts/idempotency и изоляцию normal/demo. Родитель —
локальный `dev` baseline `78e9ea4` после завершения S1-001.

## Связанная задача

- [S1-002](../../sprint-1/S1-002_sqlite-command-transactions.md)
- Completion: [S1-002_done.md](../../sprint-1/done/S1-002_done.md)
- GitHub issue отсутствует: `repository` в конфигурации пуст.

## Затронутые файлы

### Dependency/runtime

- `package.json`, `package-lock.json` — добавлен совместимый `expo-sqlite`.

### Persistence

- `src/persistence/database.ts`, `expo-database.ts` — adapter boundary и файлы
  `finni-main.db`/`finni-demo.db`;
- `src/persistence/schema.ts`, `migrations.ts` — schema v1 и последовательная
  migration framework;
- `src/persistence/repository-executor.ts` — сериализация доступа;
- `src/persistence/sqlite-repository.ts`, `index.ts` — команда, receipt, replay,
  diagnostics и публичные exports.

### Tests

- `tests/sqlite-file-adapter.mjs` — file-backed Node SQLite adapter;
- `tests/persistence.test.mjs` — transaction/restart/constraints/isolation;
- `tests/persistence-counter.test.mjs` — unsafe Counter + rollback.

## Поведение и контракты

- `BEGIN IMMEDIATE` охватывает ledger, wallet/revision, audit и receipt;
- deferred FK связывает ledger/audit с receipt внутри той же транзакции;
- повтор после COMMIT возвращает сохранённый result до revision precondition;
- другой payload/type/profile/mode при том же ID даёт `IDEMPOTENCY_CONFLICT`;
- CHECK защищают integer/range/sign и JavaScript safe-integer counters;
- UNIQUE/FK защищают источник дохода, награду, открытый период и ownership;
- все публичные операции одного repository проходят через одну очередь.

## Источники и решения

Реализация следует официальному ТЗ §§2.5.13, 3.2, 3.4, SRS v1.3
§§15.1–15.5/16.1–16.4 и domain contracts S1-001. Нового Accepted-решения или
изменения публичного сетевого контракта нет.

## Verify

- `npm.cmd run verify` — **PASS**: lint, typecheck, 20/20 tests, content,
  fixtures;
- `git diff --cached --check` — **PASS**;
- full belief-map rebuild — **PASS**: 14 modules, 113 entities, 72 edges;
- persistence boundary — **PASS**: 6 direct imports, 0 dependents.

## Breaking changes и миграции

Breaking changes отсутствуют: ранее persistence и пользовательские БД не
существовали. `user_version=1` создаётся последовательной транзакционной
миграцией; более новая неизвестная версия отклоняется без downgrade.

## Оставшиеся риски

- physical Android / production Expo SQLite runtime не входил в этот gate;
- Application wiring, lifecycle recovery и admin data controls ещё не готовы;
- предупреждения Node про typeless ESM и experimental `node:sqlite` относятся
  только к test runtime и не меняют результат integration tests.
