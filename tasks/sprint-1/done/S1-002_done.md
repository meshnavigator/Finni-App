# S1-002 — completion repor

- Статус: **done**
- Дата: 2026-09-17
- Task-ветка: `S1-002/sqlite-command-transactions
- Task-коммит: `042a77d
- Локальный merge в `dev`: `3da4683

## Результат

Реализован первый транзакционный SQLite-контур приложения. Одна денежная
команда сериализованно выполняет проверку receipt и revision, добавляет запись
журнала, обновляет проекцию и revision, сохраняет audit event и
`CommandReceipt`, после чего делает `COMMIT`. Любая ошибка приводит к полному
`ROLLBACK`; повтор committed-команды с теми же бизнес-параметрами возвращает
исходный receipt без второй проводки.

Normal и demo используют фиксированные разные файлы `finni-main.db` и
`finni-demo.db`. Добавлена последовательная migration framework со schema v1,
`foreign_keys`, WAL и запретом тихого downgrade неизвестной версии.

## Изменённые файлы

### Приложение

- `Finni App/package.json`, `package-lock.json` — `expo-sqlite@57.0.3`;
- `Finni App/src/persistence/database.ts` — общий SQL adapter и mapping режимов;
- `Finni App/src/persistence/expo-database.ts` — production adapter;
- `Finni App/src/persistence/migrations.ts` — connection pragmas и migrations;
- `Finni App/src/persistence/repository-executor.ts` — единая очередь;
- `Finni App/src/persistence/schema.ts` — schema v1, CHECK/UNIQUE/FK/индексы;
- `Finni App/src/persistence/sqlite-repository.ts` — транзакция, receipt и replay;
- `Finni App/src/persistence/index.ts` — публичный persistence boundary;
- `Finni App/tests/persistence.test.mjs` — основные integration gates;
- `Finni App/tests/persistence-counter.test.mjs` — safe-integer/rollback gate;
- `Finni App/tests/sqlite-file-adapter.mjs` — file-backed SQLite test adapter.

### Governance

- `docs/CURRENT_IMPLEMENTATION.md` — фактическая persistence-архитектура;
- `docs/mermaid/PROJECT_FLOW_MERMAID.md` — data/transaction flow;
- `tasks/TASKS.md`, `tasks/sprint-1/SPRINT1_EXECUTION_ORDER.md` — closure волны;
- этот completion report и commit report `042a77d`.

## Критические инварианты

- balances и monetary deltas хранятся целыми значениями в доменных диапазонах;
- Counter-backed поля имеют SQLite CHECK до `Number.MAX_SAFE_INTEGER`;
- один period income и одна lesson reward на период защищены partial UNIQUE;
- journal, projection, audit и receipt изменяются одной транзакцией;
- повтор `commandId` сверяет type/profile/mode/canonical business identity;
- чтения и записи проходят через один `RepositoryExecutor`;
- произвольное имя БД не принимается публичным mapping режимов.

## Источники решения

- официальное ТЗ §§2.5.13, 3.2, 3.4;
- `Finni_SRS_v1.3_2026-09-16.md` §§15.1–15.5, 16.1–16.4;
- S1-001 domain contracts и numeric invariants;
- task S1-002, DEV-04, TC-062–070 и TC-079/080.

Нового Accepted-решения не принято: реализация не отклоняется от утверждённых
источников. `IMPLEMENTATION_DECISIONS.md` не менялся.

## Verify

- `npm.cmd run verify` на task-ветке — **PASS**: lint, typecheck, tests 20/20,
  content, fixtures;
- `git diff --cached --check` перед task-коммитом — **PASS**;
- `npm.cmd run verify` после локального merge в `dev` — **PASS**: 20/20;
- file-backed SQLite — **PASS**: COMMIT, trigger-induced ROLLBACK, replay,
  idempotency conflict, close/reopen, ledger/projection consistency,
  CHECK/UNIQUE/FK, income/reward uniqueness, queue serialization и mode isolation;
- full belief-map rebuild — **PASS**: 14 modules, 113 entities, 20 imports,
  52 refs;
- `analyze src/persistence/sqlite-repository` — 12 entities, 6 direct imports,
  22 refs, 0 dependents, 7 boundary files.

## Commits и внешние действия

- task-коммит: `042a77d feat(persistence): implement atomic SQLite transactions`;
- локальный merge: `3da4683 merge: complete S1-002 atomic SQLite transactions`;
- push, PR, issue и project board не выполнялись.

## Оставшаяся работа и риски

- Application/UI пока не подключены к repository; это последующий scope;
- lifecycle, clocks, profile creation и interruption recovery входят в S1-003/4;
- backup/corruption recovery и admin reset/delete остаются последующими задачами;
- production `expo-sqlite` не проверялся на физическом Android в этой задаче;
  integration evidence использует реальный файловый SQLite Node 22;
- S0-006 (release APK на физическом Android API 26 без Metro) остаётся открыт.

## Влияние на документацию и диаграммы

`CURRENT_IMPLEMENTATION.md` и `PROJECT_FLOW_MERMAID.md` обновлены. Нового
архитектурного решения, требующего записи в `IMPLEMENTATION_DECISIONS.md`, нет.
