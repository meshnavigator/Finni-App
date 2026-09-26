# Commit baa3374 — domain economy-v2 contracts

## Summary

Коммит `baa3374` (`feat(domain): implement economy-v2 contracts`) реализует
независимое от React и SQLite доменное финансовое ядро Sprint 1. Родительский
baseline — `e5c7158`, локальная ветка — `S1-001/domain-economy-contracts`.

## Связанная задача

- [S1-001](../../sprint-1/S1-001_domain-economy-contracts.md)
- Внешний issue отсутствует: `repository` в `.project-kit/config.json` пуст.

## Затронутые файлы

### Domain

- `Finni App/src/domain/numeric.ts` — `Amount`, `MoneyDelta`, `Counter`,
  `NetFlow`, safe-integer арифметика и границы;
- `Finni App/src/domain/errors.ts` — каталог ошибок §16.4;
- `Finni App/src/domain/economy.ts` — B+S, доход/награда, план и дополнения,
  D−W, high-water роста и стадии;
- `Finni App/src/domain/contracts.ts` — Clock, command/meta/result/receipt и
  Repository transaction contracts;
- `Finni App/src/domain/index.ts` — публичная чистая domain-граница.

### Tests и fixtures

- `Finni App/tests/domain*.test.mjs` — numeric boundaries, TC-005–013,
  TC-153–164, эталон пяти периодов и проверка изоляции;
- `Finni App/fixtures/economy-v2.json` — строки §19.1 и контрпримеры §19.7;
- `Finni App/scripts/check-fixtures.mjs` — проверка bootstrap и economy-v2;
- `Finni App/tsconfig.json` — разрешены явные `.ts`-импорты для Node 22
  test runner при `noEmit`.

## Поведение и контракты

- компоненты `Amount` ограничены `0…1_000_000_000`, операции с положительной
  суммой используют отдельный конструктор;
- агрегаты `Counter` и знаковый `NetFlow` используют безопасный целочисленный
  диапазон; переполнение результата возвращает `NUMERIC_LIMIT`;
- доход периода равен 100, одна награда за занятие — 20; решения являются
  чистыми и детерминированными;
- исходный план неизменяем, дополнения ограничены фактически полученным новым
  доходом и не снимают исторический overrun;
- high-water считает только новый итоговый committed saving, получение цели не
  обнуляет достижение, возврат прежних накоплений не начисляет новое очко;
- каноническая business identity исключает runtime `sessionEpoch` и revision;
  фактическое сохранение receipt/idempotency остаётся scope S1-002.

## Источники и решения

- `docs/Finni_SRS_v1.3_2026-09-16.md`, §§5.2, 7.1, 7.3–7.6, 8.2,
  16.1–16.4, 19.1 и 19.7;
- FR-06–10, FR-57/58; DEV-03/44; TC-005–013, TC-153–164;
- нового Accepted-решения не принято: реализована уже утверждённая economy-v2.

## Verify

- `npm.cmd run lint` — PASS;
- `npm.cmd run typecheck` — PASS;
- `npm.cmd test` — PASS, 14/14;
- `npm.cmd run content` — PASS;
- `npm.cmd run fixtures` — PASS;
- `git diff --cached --check` — PASS;
- full rebuild belief map — PASS: 7 source modules, 83 entities;
- `analyze src/domain/economy` — только `numeric`/`errors`, внешний UI/SQLite
  blast radius отсутствует.

## Breaking changes и миграции

Breaking change и миграция данных отсутствуют: это первый domain-контракт,
SQLite ещё не реализована. S1-002 должна реализовать атомарные receipts,
idempotency и реальные Repository transactions поверх этих типов.

## Риски

- runtime Node 22 печатает безвредное предупреждение
  `MODULE_TYPELESS_PACKAGE_JSON`; добавление `type: module` не выполнялось,
  чтобы не ломать существующий CommonJS `eslint.config.js`;
- S0-006 (физический Android API 26 без Metro) остаётся отдельным carry-over
  gate и этим коммитом не закрывается.
