# S9-002 — эффекты после persisted command results

## Outcome

**DONE, 2026-09-26.** Purchase, savings, lesson reward, goal и stage reactions запускаются после успешного commit и загрузки persisted snapshot. Двойная отправка, повтор receipt, отмена, storage failure, crash-after-commit и restart не повторяют денежную операцию или декоративный эффект. Economy-v2 не изменена.

## Изменения и источники

- `Finni App/src/application/app-runtime.ts`: receipt methods при сохранении прежних snapshot wrappers.
- `Finni App/src/application/receipt-presentation.ts`: context/idempotency, точные before/after, bounded priority queue и cancellation.
- `Finni App/src/ui/AppRoot.tsx`, `src/ui/LessonShell.tsx`: сериализация команды и показ только после подтверждённого snapshot; сумма награды урока берётся из receipt и видна до возврата на другой экран.
- `Finni App/tests/receipt-presentation.test.mjs`, `tests/savings-commerce.test.mjs`, `tests/period-close.test.mjs`: integration/replay/rollback и обновлённые wiring assertions.
- Основание: EVT-001–004, QA-008–015, S9-002, DEC-2026-09-19-006. Разделение внешнего gate — DEC-2026-09-26-014; current implementation и диаграмма S9_001_HOME_LAYERS обновлены.
- Точный APK, native schema 2→6, screenshots и журналы: `Finni App/artifacts/sprint-9/S9-002-receipt-presentation/README.md`.

## Verify

- `npm run verify` — PASS: lint, typecheck, 147/147 tests, content, fixtures; economy fixture B=40/S=30/total=70/growth=13/stage=3.
- `node --test tests/receipt-presentation.test.mjs` — PASS: 5/5 сценариев с реальной SQLite для replay, storage rollback и crash-after-commit.
- Offline Gradle QA release — PASS; x86_64/API 26, SHA256 `4e1d7b5f2ac2bf54349758ecda2d2d83b9dca2b333903f0e59bb7134a4e40651`; установленный APK совпал по hash.
- Native install-over schema 2→6 — PASS: профиль, кошелёк, период и receipt совпали до/после; `integrity_check=ok`.
- Native purchase/double tap/restart — PASS: одна purchase IT-01/30 и один `ConfirmPurchase`, кошелёк 100→70; реакция после commit и отсутствие replay после restart.
- Native lesson reward/restart — PASS: LS-B01 показывает из receipt 20 монет на экране урока до возврата к плану; после restart кошелёк 90/0, ровно один `CompleteLesson` и одна `LESSON_REWARD` ledger entry, без повтора реакции.
- Full belief-map rebuild — PASS; `git diff --check` — PASS; новые файлы проверены на trailing whitespace.

## Остаток и ограничения

Физическое устройство, spoken TalkBack, performance и независимая приёмка находятся в S10-001/002. QA APK подписан локальным публичным debug ключом и не заменяет production ARM/signing gate. Рабочая копия `Finni App` сохраняет предшествующие незакоммиченные архивные артефакты Sprint 8/9; Git delivery описана ниже.

## Git delivery 2026-09-26

По отдельному поручению владельца создан commit `5ce7af8109fb34ba9da100159c3cb1a78f6475c5`, рабочая ветка отправлена в `origin/S8-001/production-layer-prototype`, затем этот commit fast-forward включён в `origin/dev`. Прежние архивные артефакты Sprint 8/9 остались локальными и не входят в merge. [Commit report](../../commits/sprint-9/2026-09-26_s9-002_persisted-presentation_5ce7af8.md).
