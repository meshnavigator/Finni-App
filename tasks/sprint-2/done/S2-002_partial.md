# S2-002 — completion report

- Статус: **partial**
- Дата Verify: 2026-09-21
- Ветка: `S2-001/shop-purchases-and-ledger`
- Follow-up: [S2-006](../S2-006_verify-sprint2-android-runtime.md)

## Результат
Реализованы 3 цели, выбор/смена без потери накоплений, preview и подтверждение
переводов B↔S, однократный claim с сохранением превышения, очищение выбранной
цели после claim и журнал. UNIQUE, revision и receipt защищают повтор и stale
confirmation; B и S неотрицательны, перевод сохраняет B+S.

## Изменения
- цели и каталоги в `src/domain/catalog.ts`;
- `goal_selection`, `goal_claim` и purchase/overrun migration v4;
- transfer/select/claim/history в `CommerceRepository` и `AppRuntime`;
- `SavingsScreen`, `LedgerScreen` и file-backed savings tests.

## Verify
- transfer/withdraw, смена цели, surplus claim, replay/restart/concurrency и
  ordered history — PASS;
- `npm run test:core` — 52/52 PASS; полный suite — 69/69 PASS;
- lint/typecheck/content/fixtures/diff-check — PASS;
- Android withdrawal preview/confirm runtime — **NOT RUN**: нет adb/SDK.

## Решения, риски и документация
Claim не уменьшает повторно вклад дня: growth использует committed savings и
lifetime claims. Device-остаток вынесен в S2-006. Коммит/push не выполнялись.
