# S3-003 — задания S01/S02 по накоплениям

- Статус: done
- Дата: 2026-09-22
- Task branch commit: `5d3f0a9`
- Integration commits: `a6484fb`, `8a48f45`
- Интеграционная ветка: `sprint-3/lessons-content-integration`

## Результат

Реализованы LS-S01 `schedule` и LS-S02 `withdrawal_preview` по canonical
schema-v3 контракту. S01 принимает три целочисленных игровых взноса, показывает
прогноз и остаток до цели. S02 рассчитывает учебные остатки для `buy` и
`postpone`, не обещает доходность/дату и не вызывает repository, ledger или
wallet command.

Оба задания входят в валидированный demo-каталог шести основных занятий,
открываются через общий LessonShell и используют pinned parameters попытки.

## Verify

- evaluator и renderer tests S01/S02 — PASS;
- canonical fixtures обоих уроков проходят actual LessonEvaluatorRegistry;
- тест подтверждает отсутствие денежных команд и неизменность основного кошелька;
- общий suite — 101/101 PASS;
- lint, typecheck, content, validate:content, fixtures и whitespace — PASS;
- full belief map — 62 nodes, 496 entities, 578 edges.

## Ограничения

Отдельный Android UI smoke не выполнен из-за отсутствия `adb`/SDK/device.
Критерии task-файла покрыты evaluator/component/runtime-contract тестами;
физическая доступность и производительность остаются общим device gate.
