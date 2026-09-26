# S3-001 — движок заданий и награды

- Статус: done
- Дата: 2026-09-22
- Ветка: S3-001/lesson-engine-and-rewards
- Commit: aeb4f6a

## Результат

Реализован расширяемый lesson engine с evaluator/renderer registry,
LessonShell и состояниями draft → evaluated → explanation_seen → completed.
L1/L2 подсказки не изменяют ответ и не подтверждают попытку. Допустимый
needs_review завершается как reviewed только после объяснения; invalid_inpu
не завершает занятие.

Schema v6 сохраняет attempt, immutable evaluation и completion. Attemp
закрепляет contentVersion, variantId, mechanic, исходные parameters и hints.
CompleteLesson одной транзакцией сохраняет completion, receipt и audit и,
если это первое допустимое занятие ACTIVE-периода, LESSON_REWARD=20 вместе с
ledger, wallet и revision.

## Изменённые области

- src/domain/lesson.ts и domain contracts/errors;
- src/application/learning-service.ts;
- src/persistence/lesson-repository.ts, schema-v6 и migration chain;
- src/ui/LessonShell.tsx и lesson-renderer-registry.ts;
- domain, shell и file-backed integration/stability tests.

## Решения

DEC-2026-09-22-010 фиксирует state machine, pinned attempt snapshot,
training semantics и атомарную дневную награду.

## Verify

- npm.cmd run lint — PASS;
- npm.cmd run typecheck — PASS;
- npm.cmd test — PASS, 85/85;
- npm.cmd run content — PASS;
- npm.cmd run fixtures — PASS;
- git diff --cached --check — PASS;
- full belief-map rebuild — PASS: 53 nodes, 389 entities, 498 edges;
- runtime/browser LessonShell — NOT RUN: generic shell ещё не имеет concrete
  content/renderers/routes в AppRoot; это scope S3-002–S3-004.

## Покрытые риски

- восемь разных lesson definitions дают восемь completions и одну награду;
- почти одновременные completions не дублируют reward;
- receipt replay возвращает прежний результат;
- draft, solution, hints и pinned parameters переживают restart;
- старая evaluation после изменения ответа не завершается;
- injected late-transaction failure откатывает completion, receipt, audit,
  ledger, wallet и revision;
- CLOSED/WAITING и завершение после закрытия периода не меняют деньги.

## Оставшаяся работа

S3-002 и S3-003 добавляют concrete evaluators/renderers/content. S3-004
фиксирует schemaVersion 3, manifest и validator и затем проверяет общий пакет.
До их интеграции нет сквозного runtime-маршрута пользовательского урока.
