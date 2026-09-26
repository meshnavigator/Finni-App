# Commit 498aef7 — merge Sprint 2 financial cycle в dev

## Summary

Merge-коммит `merge: integrate Sprint 2 financial cycle` объединяет
`S2-001/shop-purchases-and-ledger` с integration branch `dev` без конфликтов.

## Источник

- Feature-коммит: `5a3b0aa`.
- Feature commit-report:
  [2026-09-22_financial-cycle-runtime-controls_5a3b0aa.md](2026-09-22_financial-cycle-runtime-controls_5a3b0aa.md).
- База `dev` до merge: `2fd0b50`.

## Verify

- Merge strategy: `ort`, конфликтов нет.
- Feature verification: `test:core` 52/52, полный suite 69/69, typecheck,
  lint, content, fixtures и whitespace PASS.
- `dev` опубликован в `origin` как `498aef7`.

## Риски

Android/device gates остаются в S2-006 и этим merge не закрываются.
