# S9-004 — задания, история и adult UI

## Outcome

**PARTIAL, 2026-09-26.** Восемь занятий, история, справка и adult controls оформлены и функционально проверены; владелец принял художественный результат. Связанный пробел native old-schema install-over закрыт проверкой schema 2→6 на финальном APK. Внешний gate остаётся S10-001/002 по DEC-2026-09-26-014.

## Изменения, источники, evidence

Предыдущий UI пакет и его точные limits: `Finni App/artifacts/sprint-9/S9-003-004-details/README.md`. Миграция/restart: `Finni App/artifacts/sprint-9/S9-002-receipt-presentation/README.md`. Основание — S9-004, DEC-2026-09-19-006, DEC-2026-09-25-013 и DEC-2026-09-26-014. В этом закрытии изменены задача, реестр и current implementation; lesson content/evaluator/reward contracts не менялись.

## Verify

Предыдущие 8 native lessons/17 checks, 53 matrix cases и configured Verify — PASS по исходному evidence. Совместный Verify 2026-09-26 — PASS: 147/147 tests/lint/typecheck/content/fixtures; API 26 schema 2→6 install-over/restart — PASS; `git diff --check` — PASS.

## Follow-up и риски

S10-001: physical device и spoken TalkBack. S10-002: независимое детское/методическое/редакторское и итоговое functional/art review. Эти проверки NOT RUN; художественная приёмка владельца не является их заменой. Коммитов и внешних GitHub-действий при этом закрытии не было.
