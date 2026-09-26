# S2-001 — completion report

- Статус: **partial**
- Дата Verify: 2026-09-21
- Ветка: `S2-001/shop-purchases-and-ledger`
- Follow-up: [S2-006](../S2-006_verify-sprint2-android-runtime.md)

## Результат
Реализованы 8 канонических позиций, preview/confirm, один слот
`food|care|activity` на период, предупреждение plan overrun, безопасная
нехватка средств, immutable purchase snapshot, ledger/audit/receipt и доступные
Shop/History экраны. Receipt replay и revision защищают от двойного нажатия.

## Изменения
- `src/domain/catalog.ts`, `src/persistence/schema-v4.ts`;
- `src/persistence/commerce-repository.ts`, shared `RepositoryExecutor`;
- `src/ui/ShopScreen.tsx`, `src/ui/LedgerScreen.tsx`, `AppRoot` routes;
- `tests/commerce.test.mjs`, `tests/core-regression.test.mjs`.

## Verify
- `npm run test:core` — **52/52 PASS**;
- `npm test` — **69/69 PASS**;
- lint/typecheck/content/fixtures и `git diff --check` — PASS;
- file-backed insufficient funds, slot uniqueness, replay, restart и
  reconciliation — PASS;
- Android runtime обязательной/необязательной покупки — **NOT RUN**: нет adb/SDK.

## Решения, риски и документация
Каталог остаётся source-coded, а историческая операция хранит snapshot. Новое
правило экономики не вводилось. Runtime-остаток вынесен в S2-006; current
implementation, DEC-008 и workflow diagram обновлены общим Sprint 2 пакетом.
Коммит, push и внешние действия не выполнялись.
