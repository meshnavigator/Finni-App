# S10-002: Провести независимую визуальную и функциональную приёмку

## Цель
Собрать воспроизводимый release-комплект и отдельно подтвердить художественное
соответствие эталону и работоспособность полного финансового цикла.

## Контекст
Визуальная и функциональная приёмки независимы: красивый персонаж не компенсирует
неверные суммы, а корректная экономика — неперенесённый художественный образ.

## Состав работ
- пройти QA-001–022 и пять периодов economy-v2;
- сравнить layered Финни, комнату, состояния, движение и общий экран с REF-001;
- выполнить clean signed build/install/offline full-flow ×3;
- сверить editable layered sources, deterministic exports, licenses, manifest,
  hashes и export instructions;
- подготовить APK, screenshots, short video, test report и limitations;
- создать новый release lineage, не перезаписывая M1/M2.

## Источники
- DEC-2026-09-19-006 и DEC-2026-09-19-007 (Accepted), DEC-2026-09-26-014;
- 3D-дополнение §§13–15 только как renderer-neutral acceptance criteria;
  QA-001–022; VR-012;
- `asset-manifest.json` и approved reference;
- S4-001 demo fixture и актуальные release decisions.

## Критерии приёмки
- art owner и functional/product owner подписали отдельные результаты;
- каждый QA-001–022 имеет evidence или честное открытое ограничение;
- контрольный итог: balance 40, savings 30, total 70, growth 13, stage 3;
- APK, commit, version, manifest и hashes относятся к одной сборке;
- исходники графики и права входят в поставку; M1/M2 неизменны.

## Зависимости
- S10-001 PASS;
- S4-001 и актуальный release lineage.

Это внешний приёмочный gate для оставшихся критериев S9-001/003/004; завершённая реализация Sprint 9 является входным evidence, а не заявлением финального PASS. Проверка ребёнком/специалистом, внешнее методическое и редакторское ревью фиксируются фактически, без подмены художественной приёмкой владельца.

## Verify
- clean signed build/install и offline full-flow ×3;
- independent visual/product review;
- economy fixture и full configured Verify;
- hash/version/manifest/link checks;
- `git diff --check` до release tag.

## Out of scope
- публикация в RuStore;
- заявления об образовательной эффективности без исследования;
- исправления после freeze без нового release process.
