# S0-002 — completion evidence

- Статус: done
- Дата Verify: 2026-09-17
- Scope: project-doctor и повторяемый verify-контур фактического bootstrap.

## Результат

После появления исходного кода в `Finni App` в
`.project-kit/config.json` зарегистрированы только реально существующие
frontend-команды:

- `npm run lint`;
- `npm run typecheck`;
- `npm run test`;
- `npm run content`;
- `npm run fixtures`.

Все команды повторно выполнены с exit code 0. Project-doctor не обнаружил
ошибок или предупреждений. Backend, integration, docs и whitespace arrays
оставлены пустыми, поскольку отдельных проектных команд для них нет.
`android:release` и физический API 26 runtime не добавлены в обычный
verify-контур: это отдельные evidence-gates S0-005 и S0-006.

## Изменённые файлы

- `.project-kit/config.json`;
- `docs/CURRENT_IMPLEMENTATION.md`;
- `tasks/TASKS.md`;
- `tasks/sprint-0/SPRINT0_EXECUTION_ORDER.md`;
- `tasks/sprint-0/done/S0-002_done.md`.

## Источники решения

- `.project-kit/config.json`, секция `verify`;
- `Finni App/package.json`, секция `scripts`;
- `AGENTS.md`, раздел «Проверки»;
- `tasks/sprint-0/S0-002_configure-verification.md`;
- SRS v1.3, §§20.2, 22.1–22.2.1.

## Verify

- `python -B .project-kit/scripts/project_doctor.py .` — PASS:
  `errors=0`, `warnings=0`;
- `npm.cmd run lint` — PASS, exit 0;
- `npm.cmd run typecheck` — PASS, exit 0;
- `npm.cmd run test` — PASS, exit 0: 3/3 tests;
- `npm.cmd run content` — PASS, exit 0;
- `npm.cmd run fixtures` — PASS, exit 0;
- `git diff --check` в `Finni App` — PASS;
- `git diff --no-index --check` для 37 новых текстовых файлов — PASS.

## Commits и внешние действия

Коммиты, ветки, push, PR и GitHub-сущности не создавались. Governance-корень
остаётся вне Git.

## Риски и ограничения

- Verify baseline доказывает качество bootstrap-конфигурации, но не заменяет
  установку и запуск APK на физическом Android API 26.
- При добавлении backend, integration или docs tooling соответствующие группы
  config необходимо дополнить только после появления исполняемых команд.

`CURRENT_IMPLEMENTATION.md` и порядок Sprint 0 синхронизированы. Нового
архитектурного решения и изменения Mermaid нет, поэтому
`IMPLEMENTATION_DECISIONS.md` и диаграммы не менялись.
