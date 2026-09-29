# ЛЦТ 2026 — задачи

Roadmap построен по официальному ТЗ, образовательной рамке для 7–11 лет и SRS v1.3. Это последовательность контрольных результатов, а не обещание вместить полный объём 124 ч в расчётные 42 ч до M1.

**Статус разработки на 2026-09-29:** владелец принял текущую реализацию как
финальную для сдачи (DEC-2026-09-29-015); версия поставки — 1.0.0.
Незавершённые приёмочные задачи ниже не переименованы в `done` без протокола.
Точный комплект и оставшиеся проверки: [паспорт версии](../docs/RELEASE_HANDOFF_2026-09-29.md).

## Обозначения

- `[ ]` — не завершено; статус подтверждается только фактическим Verify и completion-report;
- `[~]` — partial: часть критериев подтверждена, остаток вынесен в follow-up task;
- `[x]` — сохранённая историческая отметка bootstrap; сама галочка не заменяет доказательство;
- S5 выполняется только после подтверждения статуса финалиста и разрешённого окна;
- обязательное ядро имеет приоритет над P03/B03, визуальными эффектами и optional Family.

## Спринт 0: среда и ограничения — 16–17 сентября

**Статус: В РАБОТЕ (2026-09-17).** Канонический порядок запуска, зависимости
и gates: [SPRINT0_EXECUTION_ORDER.md](sprint-0/SPRINT0_EXECUTION_ORDER.md).

- [x] [S0-001](sprint-0/S0-001_initialize-governance.md) — Инициализировать project governance
- [x] [S0-002](sprint-0/S0-002_configure-verification.md) — Настроить verify-команды и выполнить project-doctor — [отчёт](sprint-0/done/S0-002_done.md)
- [x] [S0-003](sprint-0/S0-003_build-belief-map.md) — Построить belief map после появления кода — [отчёт](sprint-0/done/S0-003_done.md)
- [x] [S0-004](sprint-0/S0-004_lock-scope-and-resources.md) — Зафиксировать scope, вопросы и ресурсы проверки
- [~] [S0-005](sprint-0/S0-005_bootstrap-android-release.md) — Создать каркас приложения и первый release APK — partial; [отчёт](sprint-0/done/S0-005_partial.md)
- [ ] [S0-006](sprint-0/S0-006_verify-api26-runtime.md) — Проверить установку и запуск release APK на физическом Android API 26

**Контрольная точка:** release APK запускается на API 26 без Metro; gate перенесён
в S0-006, поскольку физическое устройство будет подключено позже.

## Спринт 1: сохраняемая рабочая вертикаль — 18–20 сентября

**Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА 2026-09-18; итоговый PASS ожидает S0-006.**

- [x] [S1-001](sprint-1/S1-001_domain-economy-contracts.md) — Реализовать доменные типы и economy-v2 — [отчёт](sprint-1/done/S1-001_done.md)
- [x] [S1-002](sprint-1/S1-002_sqlite-command-transactions.md) — Реализовать SQLite и атомарные денежные команды — [отчёт](sprint-1/done/S1-002_done.md)
- [x] [S1-003](sprint-1/S1-003_lifecycle-clocks-and-modes.md) — Реализовать периоды, часы и режимы — [отчёт](sprint-1/done/S1-003_done.md)
- [x] [S1-004](sprint-1/S1-004_onboarding-pet-and-home.md) — Реализовать профиль, питомца и компактный домик — [отчёт](sprint-1/done/S1-004_done.md)
- [x] [S1-006](sprint-1/S1-006_verify-onboarding-home-runtime.md) — Проверить onboarding и домик на Android 360 dp — [отчёт](sprint-1/done/S1-006_done.md)
- [x] [S1-005](sprint-1/S1-005_budget-plan-and-fact.md) — Реализовать план бюджета и сравнение с фактом — [отчёт](sprint-1/done/S1-005_done.md)

**Контрольная точка:** профиль, деньги и план сохраняются после перезапуска; пересчитана фактическая скорость.

## Спринт 2: основной финансовый цикл — 21–24 сентября

**Статус: DONE 2026-09-22.** Automated suite и signed release на API 26 AVD
прошли; physical-device acceptance сохранена для Sprint 10 по DEC-009.

- [x] [S2-001](sprint-2/S2-001_shop-purchases-and-ledger.md) — Магазин, покупки и журнал: automated + emulator PASS; [исторический partial-отчёт](sprint-2/done/S2-001_partial.md)
- [x] [S2-002](sprint-2/S2-002_savings-goals-and-claims.md) — Цели и накопления: automated + emulator PASS; [исторический partial-отчёт](sprint-2/done/S2-002_partial.md)
- [x] [S2-003](sprint-2/S2-003_period-close-and-pet-progress.md) — Итоги и развитие питомца: automated + emulator PASS; [исторический partial-отчёт](sprint-2/done/S2-003_partial.md)
- [x] [S2-004](sprint-2/S2-004_history-adult-and-data-controls.md) — History/Help/Adult и data controls: emulator PASS; [исторический partial-отчёт](sprint-2/done/S2-004_partial.md)
- [x] [S2-005](sprint-2/S2-005_persistence-integration-regression.md) — Automated regression 69/69 и emulator recovery/upgrade PASS; [исторический partial-отчёт](sprint-2/done/S2-005_partial.md)
- [x] [S2-006](sprint-2/S2-006_verify-sprint2-android-runtime.md) — Signed API 26 emulator acceptance PASS; [отчёт](sprint-2/done/S2-006_done.md)

**Контрольная точка:** сквозной финансовый цикл работает и не теряет данные; physical-device gate остаётся в Sprint 10.

## Спринт 3: содержание и методическая проверка — 25–27 сентября

- [x] [S3-001](sprint-3/S3-001_lesson-engine-and-rewards.md) — Движок заданий и атомарная награда реализованы; [отчёт](sprint-3/done/S3-001_done.md)
- [x] [S3-002](sprint-3/S3-002_budget-and-purchase-lessons.md) — B01/B02 и P01/P02 реализованы, интегрированы и пройдены на Android API 26 AVD; [отчёт](sprint-3/done/S3-002_done.md)
- [x] [S3-003](sprint-3/S3-003_savings-lessons.md) — S01/S02 реализованы, доступны в demo и не создают денежных проводок; [отчёт](sprint-3/done/S3-003_done.md)
- [x] [S3-004](sprint-3/S3-004_content-schema-manifest-validator.md) — schema v3, bundle 1.2.0, manifest и строгий валидатор готовы; [отчёт](sprint-3/done/S3-004_done.md)
- [x] [S3-005](sprint-3/S3-005_receipt-and-workshop-lessons.md) — P03 и WorkshopLite B03 подключены к demo-каталогу; evaluator, renderer и проверки пройдены; [отчёт](sprint-3/done/S3-005_done.md)
- [x] [S3-006](sprint-3/S3-006_shared-help-and-discoveries.md) — Общие подсказки, сохранённые открытия, варианты и контекстный возврат реализованы; [отчёт](sprint-3/done/S3-006_done.md)
- [x] [S3-007](sprint-3/S3-007_editorial-and-methodical-review.md) — Редакторская сверка и независимый просмотр восьми заданий подтверждены; подписанный review APK, ограничения variantId и [отчёт](sprint-3/done/S3-007_done.md)

**Контрольная точка:** сначала готовы 6 заданий по 3 темам; затем P03/B03. Scope M1 после 27 сентября не расширяется.

## Спринт 4: фиксация и M1 — 28–29 сентября

- [ ] [S4-001](sprint-4/S4-001_demo-fixture-and-appendix-a.md) — Demo, пятидневная fixture и маршрут A.1–A.12 реализованы; фактический release APK-прогон открыт
- [ ] [S4-002](sprint-4/S4-002_accessibility-and-visual-polish.md) — Проверить доступность и обязательный UI
- [ ] [S4-003](sprint-4/S4-003_security-offline-backup-and-licenses.md) — Backup/release permissions исправлены в source; новый APK, офлайн и лицензии открыты
- [ ] [S4-004](sprint-4/S4-004_device-performance-regression.md) — Физическая и производительная регрессия
- [ ] [S4-005](sprint-4/S4-005_docs-traceability-and-store-draft.md) — Документация, трассируемость и карточка
- [ ] [S4-006](sprint-4/S4-006_m1-package-freeze-and-access.md) — Зафиксировать и передать M1

**Контрольная точка:** внутренний cutoff 29 сентября 20:00 МСК; официальный — 23:59 МСК. Затем M1 заморожен.

## Freeze: 30 сентября — 15 октября

Не является спринтом разработки. Код, контент, APK, документы и URL M1 не изменяются без отдельного письменного разрешения организатора.

## Спринт 5: условный M2 для финалистов — 16–20 октября

- [ ] [S5-001](sprint-5/S5-001_finalist-scope-and-feedback.md) — Подтвердить статус и scope M2
- [ ] [S5-002](sprint-5/S5-002_priority-fixes-and-migrations.md) — Исправить приоритетные пробелы M1
- [ ] [S5-003](sprint-5/S5-003_final-regression-and-handoff-docs.md) — Финальная регрессия и комплект передачи
- [ ] [S5-004](sprint-5/S5-004_m2-release-package.md) — Выпустить M2 APK и финальный комплект
- [ ] [S5-005](sprint-5/S5-005_optional-family-cards.md) — Optional Family только при подтверждённом запасе

**Контрольная точка:** M2 не перезаписывает M1; optional Family не является дефектом обязательного scope.

## Визуальная программа Sprint 6–10 — layered 2D rebaseline

Sprint 6 и ранний Sprint 7 сохраняются как historical 3D evidence. По
DEC-2026-09-19-006 target изменён на layered 2D cutout/2.5D: `REF-001`, V4.2,
HUD, экономика, стадии, внешности, catalog IDs, доступность и release lineage
сохраняются. `Finni_S7-002_2D_POC` — comparative candidate, не production PASS.
React Native core `Image`/`Animated` принят DEC-2026-09-19-007 по S7-005;
physical-device performance остаётся gate S10. Sprint 0–5 и ранее
зафиксированные артефакты не переписываются.

## Спринт 6: V0 — источники истины и функциональный макет

**Статус: PARTIAL CLOSURE 2026-09-18.** Обе задачи закрыты как partial;
остатки вынесены в S8-002, S9-001 и S10-001. Владельцы art, engineering и
QA/device ещё не назначены.

- [~] [S6-001](sprint-6/S6-001_reconcile-3d-scope-and-catalog.md) — Сверка и M1 rebaseline завершены; 8 IT/3 GL asset bindings добавлены S8-002, owner/art/device gates открыты — [отчёт](sprint-6/done/S6-001_partial.md)
- [~] [S6-002](sprint-6/S6-002_home-hud-functional-layouts.md) — non-device layout/state/a11y contracts реализованы; 200% review conflict и независимая приёмка вынесены — [отчёт](sprint-6/done/S6-002_partial.md)

**Контрольная точка:** конфликт SRS/аддендума решён Accepted/Rejected-записью,
а макеты сохраняют обязательную сводку на 360 dp и font scale 200%.

## Спринт 7: V1 — layered 2D art/runtime vertical slice

**Статус: DONE 2026-09-21.** S7-001 остаётся historical
partial evidence. S7-002 закрыта partial/superseded: R1–R4 не получили art
PASS, а 2D POC принят только как более точное направление. S7-003 сохраняет
исторический Worklets/Babel blocker; operational dependency удалена S7-006.
S7-004 art/provenance, S7-005 runtime/release и S7-006 cleanup завершены;
DEC-007 Accepted.

- [~] [S7-001](sprint-7/S7-001_3d-renderer-native-spike.md) — Historical partial: diagnostic contracts и clean debug boundary — [отчёт](sprint-7/done/S7-001_partial.md)
- [~] [S7-002](sprint-7/S7-002_finni-art-quality-slice.md) — Partial/superseded; R1–R4 и 2D POC сохранены comparative evidence — [отчёт](sprint-7/done/S7-002_partial_superseded.md)
- [~] [S7-003](sprint-7/S7-003_resolve-signed-release-babel-dependency.md) — Historical superseded blocker; operationally removed by S7-006 — [отчёт](sprint-7/done/S7-003_superseded.md)
- [x] [S7-004](sprint-7/S7-004_2d-art-provenance-acceptance.md) — Layered 2D art/provenance принят — [отчёт](sprint-7/done/S7-004_done.md)
- [x] [S7-005](sprint-7/S7-005_2d-runtime-release-spike.md) — Core 2D runtime и signed release PASS — [отчёт](sprint-7/done/S7-005_done.md)
- [x] [S7-006](sprint-7/S7-006_retire-3d-stack-restore-release.md) — Superseded 3D stack удалён; clean signed production release PASS — [отчёт](sprint-7/done/S7-006_done.md)

**Контрольная точка:** S7-004 PASS, S7-005 PASS, Accepted DEC-007 и S7-006
signed release. Device acceptance остаётся в S0-006/S10.

## Спринт 8: V2 — layered 2D production package

**Статус: В РАБОТЕ 2026-09-23.** S7-004/S7-005/S7-006 и DEC-007 завершены;
Промежуточная реализация S8-001/002/003 включена в `dev` merge-коммитом `b49a52c`;
задачи остаются открытыми до указанных ниже art/device gates.

S8-001 и S8-002 начаты параллельно, S8-003 начата после фиксации контракта
слоёв. Engineering Verify выполнен; art/device gates ещё открыты.

- [ ] [S8-001](sprint-8/S8-001_finni-variants-stages-rig.md) — В работе: матрица 3×3 ear-seams-v3 художественно принята; neutral/blink и API26 smoke PASS; happy/thoughtful/inspired и итоговая проверка 27 сочетаний во всех позах открыты
- [ ] [S8-002](sprint-8/S8-002_room-objects-and-catalog-assets.md) — В работе: Home, 5 OBJ и 8 IT/3 GL v3 художественно приняты, права заявлены владельцем; API 26 эмулятор пройден, physical-device отложен до S10, offline/release QA открыты
- [ ] [S8-003](sprint-8/S8-003_animation-set-and-transitions.md) — AN-001–014 приняты; callback fix и native regression PASS в отчётном scope, physical/release gates открыты

**Контрольная точка:** editable layers, deterministic exports, 27 сочетаний,
room/catalog assets, animation matrix, rights и runtime import validation PASS.

## Спринт 9: V3 — интеграция представления и игрового цикла

**Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА 2026-09-26; внешний PASS ожидает S10-001/002.**
Принятый art/runtime slice Sprint 8 и зависимости Sprint 2–3 использованы;
открытые art/device gates Sprint 8 остаются видимыми. По DEC-2026-09-26-014
S10-001 начинается от готовности реализации, без кругового требования PASS S9.

- [~] [S9-001](sprint-9/S9-001_home-scene-hud-integration.md) — Home/HUD реализованы и приняты в scope DEC-013; physical/TalkBack/performance → S10 — [отчёт](sprint-9/done/S9-001_partial.md)
- [x] [S9-002](sprint-9/S9-002_persisted-results-presentation.md) — Эффекты после persisted receipts, replay/cancel/restart и native schema 2→6 PASS — [отчёт](sprint-9/done/S9-002_done.md)
- [~] [S9-003](sprint-9/S9-003_financial-screens-visual-language.md) — Финансовый UI реализован и художественно принят; old-schema upgrade PASS, внешний gate → S10 — [отчёт](sprint-9/done/S9-003_partial.md)
- [~] [S9-004](sprint-9/S9-004_lessons-history-adult-visual-language.md) — Учебный/исторический/adult UI реализован и художественно принят; внешнее ревью → S10 — [отчёт](sprint-9/done/S9-004_partial.md)

**Контрольная точка:** полный пользовательский цикл использует реальные данные,
а presentation-слой не меняет economy-v2 и не повторяет эффекты после restart.
Итоговая внешняя приёмка определяется после S10-001/002; её отсутствие не
отменяет проверенную готовность реализации.

## Спринт 10: V4 — аппаратная проверка и поставка

**Статус: ГОТОВ К ВНЕШНЕМУ GATE после реализации Sprint 9.** S10-001 открыт к
физической проверке; S10-002 ожидает фактический PASS S10-001. Device/TalkBack,
performance и независимая приёмка пока не объявляются выполненными.

- [ ] [S10-001](sprint-10/S10-001_3d-accessibility-lifecycle-performance.md) — Проверить 2D decode/cache/memory, accessibility, lifecycle и performance
- [ ] [S10-002](sprint-10/S10-002_visual-functional-acceptance.md) — Провести независимую визуальную и функциональную приёмку

**Контрольная точка:** QA-001–022 подтверждены evidence одной release-версии,
визуальная и функциональная приёмки независимы, M1/M2 не перезаписаны.

## Правила сокращения

1. Сначала сложные эффекты и необязательная полировка.
2. Затем optional Family и дополнительные варианты.
3. Затем P03/B03 — только по явному решению владельца.
4. Не сокращать шесть заданий/три темы, 9 комбинаций, 8 позиций, 3 цели, 3 стадии, 5 demo-периодов, три направления бюджета, сохранение и Приложение А.

## Внешние действия

GitHub issues/milestones не создаются: `repository` в конфигурации пуст, пользователь их не запрашивал.
