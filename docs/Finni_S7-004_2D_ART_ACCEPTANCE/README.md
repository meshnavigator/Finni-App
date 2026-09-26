# S7-004 — layered 2D art / provenance acceptance gate

Статус пакета: **BLOCKED, 2026-09-20.** Это owner-ready governance package,
не новый master и не production delivery. Он не изменяет `Finni_S7-002_2D_POC`,
R1–R4, 3D addendum или app runtime.

## Что зафиксировано

- [Inventory](inventory.json) регистрирует только существующие reference/POC
  files как historical/comparative evidence.
- [Side-by-side sheet](SIDE_BY_SIDE_ACCEPTANCE_SHEET.md) задаёт одинаковый
  масштаб и критерии для независимой art review.
- [Compatibility design](VARIANT_STAGE_COMPATIBILITY.md) запрещает новые
  `shapeId`/`patternId` и описывает требование к будущему editable master.
- [Owner verdict forms](OWNER_VERDICTS.md) привязывают решение к exact hashes.

## Непройденные gates

1. Нет editable layered master и clean-room Home art slice.
2. Нет production IDs, exports, dimensions/alpha-bounds scan или production
   checksums для нового master.
3. Нет named art owner verdict по identity/silhouette/eyes/color/character.
4. Нет named product/legal owner verdict по конкретным hashes, terms и
   разрешённому release scope.

Поэтому assets здесь не допускаются к production wiring. S7-005 может
использовать POC только в isolated diagnostic path с маркировкой
`candidate/not-production`; S7-006 и production wiring ждут S7-004 PASS.

## Mechanical acceptance sequence после появления нового master

1. Поместить editable source и exports в новый immutable versioned package, не
   подменяя POC filenames.
2. Зафиксировать SHA-256, decode, dimensions, color model и non-transparent
   alpha bounds для каждого source/export.
3. Выпустить same-scale sheet с hash `REF-001`, neutral и blink export.
4. Проверить отсутствие финансовых сумм, catalog IDs, продуктовых строк и
   утверждений о runtime/release внутри Home art slice.
5. Получить оба verdicts из `OWNER_VERDICTS.md`; только затем менять status
   master на accepted-for-production.
