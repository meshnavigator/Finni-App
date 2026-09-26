# S1-003 — completion report

- Статус: **done**
- Дата: 2026-09-17
- Task-ветка: `S1-003/lifecycle-clocks-and-modes`
- Task-коммит: `47f8e89`
- Локальный merge в `dev`: `e102dec`

## Результат

Реализован сохраняемый lifecycle периодов и режимов. Persisted-состояния
переходят только DRAFT → ACTIVE → CLOSED; READY/WAITING выводятся из состояния
последнего периода и календарной доступности. `OpenPeriod` одной SQLite-
транзакцией создаёт DRAFT, начисляет ровно 100, обновляет wallet/revision/clock,
пишет audit и receipt. Повтор committed-команды возвращает прежний receipt, а
partial UNIQUE остаётся окончательной защитой единственного дохода периода.

`NormalClock` использует зафиксированный IANA-пояс профиля, `VirtualClock` —
сохраняемую виртуальную ISO-дату. Demo проходит пять периодов без ожидания и
работает только в `finni-demo.db`; normal остаётся в `finni-main.db`. Пропуски
не создают периоды или автоматические проводки, часы назад блокируют новый
доход, а далёкий переход вперёд открывает только один текущий период.

Единый `LifecycleCoordinator` владеет mode/profile/sessionEpoch. Переключение
сначала инвалидирует не начатые заявки, дожидается уже начатой транзакции,
закрывает старое соединение и меняет selectedMode. Reset/Delete используют
AppControl intent с шестью сохраняемыми фазами; bootstrap детерминированно
продолжает протокол после прерывания на любой фазе до открытия игровой БД.

## Изменённые файлы

### Приложение

- `Finni App/src/domain/clocks.ts` — ISO/IANA validation, NormalClock,
  VirtualClock и календарное прибавление дня;
- `Finni App/src/domain/lifecycle.ts` — допустимые переходы и READY/WAITING
  projection;
- `Finni App/src/domain/index.ts` — публичные экспорты;
- `Finni App/src/persistence/schema.ts`, `migrations.ts` — migration v2,
  `game_clock`, period rule/plan snapshot;
- `Finni App/src/persistence/lifecycle-repository.ts` — атомарные
  Open/Confirm/Close/Advance/Correct, receipts и revisions;
- `Finni App/src/persistence/index.ts` — публичный persistence export;
- `Finni App/src/application/app-control.ts` — selectedMode/controlRevision и
  pending admin intent;
- `Finni App/src/application/lifecycle-coordinator.ts`, `index.ts` — epoch,
  очередь, mode switch и recovery;
- `Finni App/tests/lifecycle.test.mjs` — clocks/state/migration/restart/time
  anomaly/demo/correction/rollback evidence;
- `Finni App/tests/lifecycle-coordinator.test.mjs` — mode switch и прерывание
  каждой admin-фазы;
- `Finni App/tests/persistence.test.mjs` — актуализированные ожидания schema v2;
- `Finni App/fixtures/demo-five-periods.json`,
  `scripts/check-fixtures.mjs` — fixture пяти последовательных demo-периодов.

### Governance

- `docs/CURRENT_IMPLEMENTATION.md` — фактическая lifecycle-архитектура;
- `docs/mermaid/PROJECT_FLOW_MERMAID.md` — mode/clock/admin data flow;
- `tasks/TASKS.md`, `tasks/sprint-1/SPRINT1_EXECUTION_ORDER.md` — closure волны;
- этот completion report.

## Критические инварианты

- один профиль имеет не более одного DRAFT/ACTIVE периода;
- `(profileId, clockGeneration, calendarDate)` и partial UNIQUE дохода не
  позволяют повторить дату или начисление;
- OpenPeriod фиксирует period, income, wallet, revision, clock, audit и receipt
  одной транзакцией; ошибка откатывает всё;
- READY/WAITING не сохраняются отдельной конкурирующей истиной;
- demo date сдвигается только явным AdvanceDemoDay и не начисляет деньги;
- CorrectClock запрещён при DRAFT/ACTIVE, не создаёт ledger entry и ставит
  nextEligibleDate на следующий календарный день нового generation;
- каждое period/clock изменение повышает ProfileState.revision;
- stale epoch отклоняется даже после normal→demo→normal;
- pending admin intent читается до открытия игровой БД, удаляет только
  фиксированные пути выбранного режима и не хранит профиль/кошелёк;
- rule bundle фиксируется в периоде и после restart не заменяется новой версией.

## Источники решения

- `Finni_SRS_v1.3_2026-09-16.md` §§6.1–6.5, 15.9–15.10, 16.1–16.4;
- FR-32–36, FR-59/60/63; DEV-05/24/45;
- TC-053–070, TC-165–173, period-snapshot часть TC-186/187;
- S1-001 domain/numeric contracts и S1-002 RepositoryExecutor/schema/receipt.

Нового Accepted-решения не принято: SRS однозначно задаёт календарную модель,
clock correction и admin recovery. `IMPLEMENTATION_DECISIONS.md` не менялся.

## Verify

- `npm.cmd run lint` — **PASS**;
- `npm.cmd run typecheck` — **PASS**;
- `npm.cmd run test` — **PASS**, 34/34 tests;
- `npm.cmd run content` — **PASS**;
- `npm.cmd run fixtures` — **PASS**, включая demo lifecycle fixture;
- `git diff --check` в `Finni App` — **PASS**;
- file-backed SQLite — **PASS**: v1→v2 migration, lifecycle COMMIT/ROLLBACK,
  durable receipt/restart, clock rollback/forward anomaly, generation correction,
  VirtualClock restart и изоляция normal/demo;
- lifecycle coordinator — **PASS**: начатая операция завершается, queued stale
  epoch отклоняется, recovery проходит после PREPARED, QUEUE_STOPPED,
  CONNECTION_CLOSED, DATA_REMOVED, UI_CLEARED и VERIFIED;
- full belief-map rebuild — **PASS**: 20 modules, 164 entities, 146 edges;
- `analyze src/persistence/lifecycle-repository` — 18 entities, 8 imports,
  30 refs, 0 dependents, 9 boundary files;
- `analyze src/application/lifecycle-coordinator` — 8 entities, 4 imports,
  1 data flow, 10 refs, 0 dependents, 5 boundary files.

## Commits и внешние действия

Реализация зафиксирована task-коммитом `47f8e89` и локально объединена в `dev`
merge-коммитом `e102dec`. Push, PR, issue и project board не выполнялись:
`repository` в конфигурации пуст, внешние действия не входят в scope.

## Оставшаяся работа и риски

- S1-004 должен подключить `RuntimeFactory`, `AppControlStorage`,
  `AdminDataDriver` и lifecycle repository к Expo shell/profile onboarding;
- взрослый UI/барьер и пользовательские экраны удаления относятся к S2-004;
- snapshot учебной попытки из TC-187 реализуется вместе с lesson engine/content
  schema; S1-003 фиксирует период и rule bundle, но не создаёт ещё не
  существующие lesson tables;
- локальные часы без сервера предотвращают случайные дубли, но не являются
  банковской anti-fraud защитой от владельца устройства;
- production Android runtime этой задачи не выполнялся; S0-006 (release APK на
  физическом Android API 26 без Metro) остаётся открыт и не объявляется PASS.

## Влияние на документацию и диаграммы

Обновлены `CURRENT_IMPLEMENTATION.md` и `PROJECT_FLOW_MERMAID.md`. Нового
архитектурного решения, отклоняющегося от SRS и требующего Accepted-записи, нет.
