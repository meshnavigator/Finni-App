# Commit 5ce7af8 — persisted presentation и интеграция UI

- Ветка: `S8-001/production-layer-prototype`; родитель: `b49a52c` (`dev` на момент commit).
- Сообщение: `feat(s9): connect persisted results to presentation`.
- Задача: [S9-002](../../sprint-9/S9-002_persisted-results-presentation.md); сопутствующая интеграция уже реализованных S9-001/003/004 и принятых art assets Sprint 8 нужна для самодостаточного app diff.
- Объём: 633 файла; исходники приложения, тесты, production assets и QA evidence. Проектные `docs/` и `tasks/` находятся вне Git-корня `Finni App` и не входят в этот commit.

## Поведение и файлы

- `src/application/app-runtime.ts`, `receipt-presentation.ts`: persisted receipts для commerce, очередь эффектов, дедупликация commandId, проверки профиля/режима/эпохи/revision, точные before/after, cancel и completion без денежной команды.
- `src/ui/AppRoot.tsx`, `LessonShell.tsx`: сериализация double submit, показ после commit и загрузки snapshot, реакция награды урока до штатного перехода на другой экран. В commit также вошёл ранее реализованный общий UI S9-001/003/004, необходимый для сборки.
- `assets/2d/variants/`, `assets/2d/room/S8-002/`, `assets/ui/`: используемые финальным UI изображения, манифесты и принятые исходники, проверяемые тестами по SHA256.
- `tests/`: persisted/replay/rollback/crash-after-commit и UI/art contracts.
- `artifacts/sprint-9/S9-002-receipt-presentation/`: QA APK, native screenshots, SQLite audit, hashes и журналы. Принятая expression sheet Sprint 8 включена как зависимость теста.

## Источники и Verify

- Основание: EVT-001–004, QA-008–015, DEC-2026-09-19-006, DEC-2026-09-26-014 и [completion report](../../sprint-9/done/S9-002_done.md).
- `npm run verify` после подготовки staged diff — PASS: lint, typecheck, 147/147 tests, content, fixtures.
- `git diff --cached --check` перед commit — PASS.
- Offline x86_64/API 26 QA APK — PASS, SHA256 `4e1d7b5f2ac2bf54349758ecda2d2d83b9dca2b333903f0e59bb7134a4e40651`.
- Native schema 2→6 install-over — PASS; старые profile/wallet/period/receipt совпали, SQLite integrity `ok`. Покупка и награда урока сохранились по одному разу; после restart баланс 90 и нет повторной реакции.

## Контракты, миграция и остаток

- Публичные command contracts и economy-v2 не изменены; S9-002 использует существующие атомарные receipts. Native переход schema 2→6 повторён поверх старого APK.
- Физическое устройство, spoken TalkBack, performance и независимая приёмка остаются S10-001/002. QA APK подписан локальным debug ключом и не заменяет production ARM/signing gate.
- Прежние архивные артефакты Sprint 8/9 остаются локальными незакоммиченными файлами вне этого commit.

## Доставка

2026-09-26 commit `5ce7af8109fb34ba9da100159c3cb1a78f6475c5` отправлен в `origin/S8-001/production-layer-prototype` и fast-forward включён в `origin/dev` (`b49a52c` → `5ce7af8`). После повторного fetch локальная `dev`, `origin/dev` и HEAD рабочей ветки указывают на один commit. Прямого push в `main` не было.
