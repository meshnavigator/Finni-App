# S3-004 — schema v3, manifest и валидатор контента

- Статус: done
- Дата: 2026-09-22
- Task branch commit: `8f31eaa`
- Integration commits: `b230d0d`, `8a48f45`
- Интеграционная ветка: `sprint-3/lessons-content-integration`

## Результат

Добавлен единственный активный пакет `content/bundles/1.2.0` с
`schemaVersion: 3`, manifest, SHA-256, dependency graph, каталогами и восемью
JSON-заданиями. Строгий валидатор запрещает неизвестные поля, исполняемый
контент/URL, некорректные суммы, IDs, placeholders, modes/renderers, битые и
циклические ссылки и противоречащие evaluator fixtures.

Loader создаёт immutable `LessonDefinition` snapshot с contentVersion,
variantId, mode, параметрами и hints. Шесть основных B/P/S lessons используют
этот snapshot в runtime; отдельного активного TS-реестра definitions больше нет.

## Verify

- `validate:content` — PASS: 8 lessons, 3 family activities, 7 negative fixtures;
- manifest hashes, links/cycles, schema strictness, semver/URL/placeholders и immutable snapshot tests — PASS;
- concrete evaluators совпадают со всеми canonical fixtures шести runnable lessons;
- общий suite — 101/101 PASS;
- lint, typecheck, content, fixtures и whitespace — PASS;
- full belief map — 62 nodes, 496 entities, 578 edges.

## Решения и диаграммы

Нового архитектурного решения не потребовалось: реализация следует SRS
§§13.11–13.12 и принятому DEC-2026-09-22-010. Общая data-flow диаграмма
обновлена путём content bundle → validated catalog → LessonShell/evaluator →
LessonRepository.
