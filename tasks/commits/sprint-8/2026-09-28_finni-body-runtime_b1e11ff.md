# Commit b1e11ff — движения тела Финни и регрессия S8-003

- Ветка: `S8-003/full-body-runtime`; родитель: `e1e350d` (`dev`).
- Сообщение: `feat(s8-003): complete Finni body animation runtime and regression`.
- Задача: [S8-003](../../sprint-8/S8-003_animation-set-and-transitions.md).

## Изменение и источники

- `src/ui/FinniPuppet.tsx`, `finni-body-motion.ts`, `FinniHomeScene.tsx` и реестр AN: послойные движения головы, корпуса и хвоста, предметные действия, пропуск и отмена. Терминальный callback теперь однократный после finish, skip или cancel.
- `assets/2d/poses/`, `scripts/export-puppet-groups.py` и `build-puppet-registry.mjs`: 54 детерминированных экспорта из принятых слоёв и три принятые владельцем нижние позы с hash-привязкой приёмки.
- `tests/finni-*`: контрактные проверки движения, ассетов и однократного завершения.
- [Контракт AN](../../../assets/2d/FINNI-S8-003-ANIMATION-CONTRACT.md), `docs/CURRENT_IMPLEMENTATION.md` и реестр задач обновлены по фактической реализации. Основание — S8-003, DEC-006/007/011 и приёмка владельца от 2026-09-28. Нового архитектурного решения и изменения workflow-диаграммы не потребовалось.

## Verify

- Перед коммитом `npm.cmd run verify` — PASS: lint, typecheck, 155 тестов, content, fixtures.
- `git diff --cached --check` — PASS.
- [Native evidence](../../../artifacts/sprint-8/S8-003-body-runtime/regression/README.md) из реализации: API 26, 60 реакций с 60 однократными завершениями, чистые новые Metro/native логи, повторный просмотр клипов и рискованных поз. Исторический `TypeError` на чистом запуске не воспроизведён; его старая причина неизвестна.

## Совместимость и остаток

- Публичные команды, экономика и SQLite не менялись; миграция не требуется.
- S8-003 остаётся открытой по внешним gate S10: физический Android и производительность, настоящий TalkBack, release acceptance. Видео эмулятора не подтверждает эти пункты.
