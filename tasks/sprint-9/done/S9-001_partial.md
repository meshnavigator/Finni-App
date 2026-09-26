# S9-001 — Home scene, HUD и навигация

## Outcome

**PARTIAL, 2026-09-26.** Реализация Home, адаптивной сводки, 2D Финни и пяти корневых маршрутов завершена; художественный результат пяти roots позднее принят владельцем в scope DEC-2026-09-25-013. Ранние отчёты, созданные до этой приёмки, сохранены исторически. Остаток — внешний gate S10-001/002.

## Изменения, источники, evidence

Код `Finni App/src/ui/AppRoot.tsx`, `HomeScreen.tsx`, `FinniHomeScene.tsx` и связанные assets/layout/navigation уже внедрены предыдущими пакетами. Evidence: `Finni App/artifacts/sprint-9/S9-001-layout/`, `S9-001-redesign/`, `S9-001-polish/`, `S9-001-structure/`, `S9-001-navigation/`. Текущее разделение статусов и зависимостей зафиксировано DEC-2026-09-26-014 и `docs/mermaid/SPRINT_7_10_2D_GATE.md`. В этом закрытии обновлены задача, реестр и диаграмма; новая геометрия Home не создавалась.

## Verify

Предыдущие configured/native API 26 проверки и точные limits приведены в перечисленных evidence. Совместный configured Verify 2026-09-26 — PASS: 147/147 tests, lint, typecheck, content, fixtures. Native S9-002 schema 2→6 и restart на точном QA APK — PASS; `git diff --check` — PASS.

## Follow-up и риски

S10-001: физический Android, spoken TalkBack, decode/cache/performance, lifecycle/asset errors. S10-002: независимая итоговая visual/functional acceptance. Эти проверки NOT RUN на физическом устройстве; `partial` не утверждает их PASS. Коммитов и внешних GitHub-действий при этом закрытии не было.
