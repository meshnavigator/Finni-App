# S1-001 — completion evidence

- Статус: done
- Дата Verify: 2026-09-17
- Ветка: `S1-001/domain-economy-contracts`
- Commit: `baa3374` (`feat(domain): implement economy-v2 contracts`)

## Результат

Реализовано чистое TypeScript-ядро economy-v2 без импортов React/Expo/SQLite:
денежные типы и safe-integer границы, полный каталог доменных ошибок §16.4,
Clock/Repository/command contracts, формулы B+S и D−W, доход 100, награда 20,
неизменяемый исходный план с дополнениями нового дохода, high-water накоплений
и расчёт трёх стадий.

Эталон пяти периодов даёт `B=40`, `S=30`, 13 очков и stage 3. Контрпримеры
v1.3 подтверждают, что D40/W40/D40 не создаёт повторного savePoint, превышение
плана не исчезает после позднего дополнения, отрицательный D−W допустим, а
получение цели не обнуляет committed saving.

## Изменённые файлы

- `Finni App/src/domain/{numeric,errors,economy,contracts,index}.ts`;
- `Finni App/tests/domain*.test.mjs`;
- `Finni App/fixtures/economy-v2.json`;
- `Finni App/scripts/check-fixtures.mjs`;
- `Finni App/tsconfig.json`.

## Источники решения

- `tasks/sprint-1/S1-001_domain-economy-contracts.md`;
- `tasks/sprint-1/SPRINT1_EXECUTION_ORDER.md`;
- `docs/Finni_SRS_v1.3_2026-09-16.md`, §§5.2, 7.1, 7.3–7.6, 8.2,
  16.1–16.4, 19.1, 19.7;
- FR-06–10, FR-57/58; DEV-03/44; TC-005–013, TC-153–164.

## Решения и границы

- `Amount` остаётся компонентом до 1 млрд; сумма плана и B+S являются
  безопасными агрегатами, а не ошибочно суженными `Amount`;
- persisted idempotency не имитируется in-memory: domain задаёт receipt и
  canonical identity, а COMMIT/restart semantics остаются S1-002;
- нового Accepted-решения не принято; `IMPLEMENTATION_DECISIONS.md` не менялся;
- UI-flow и Mermaid не менялись.

## Verify

- `npm.cmd run lint` — PASS;
- `npm.cmd run typecheck` — PASS;
- `npm.cmd test` — PASS, 14/14;
- `npm.cmd run content` — PASS;
- `npm.cmd run fixtures` — PASS, bootstrap + economy-v2;
- `git diff --cached --check` — PASS перед commit;
- full rebuild belief map — PASS: 7 source modules, 83 entities;
- belief-map boundary: `economy -> numeric/errors`, `contracts ->
  economy/numeric/errors`; UI/SQLite dependents отсутствуют.

## Commits и внешние действия

- bootstrap baseline на локальной `dev`: `e5c7158`;
- реализация S1-001: `baa3374`;
- push, PR, issue и GitHub project actions не выполнялись.

## Оставшаяся работа и риски

- S1-002 должна реализовать реальную SQLite-транзакцию, журнал, проекции,
  receipts, повтор после COMMIT и ROLLBACK;
- предупреждение Node `MODULE_TYPELESS_PACKAGE_JSON` не влияет на результат
  тестов; package-wide ESM не включён из-за CommonJS ESLint config;
- S0-006 остаётся незакрытым carry-over gate физического API 26 и не мешает
  статусу S1-001, но блокирует итоговый PASS Sprint 1.
