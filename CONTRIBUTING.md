# CONTRIBUTING.md — ЛЦТ 2026

Ветки и repository задаются в `.project-kit/config.json`.

## Ветки

- `main` — релизная, только через PR.
- `dev` — интеграционная, только через PR.
- `S{N}-{NNN}/slug` — task branch от integration branch.
- `fix/slug` — обычный багфикс от integration branch.
- `hotfix/slug` — срочный production fix от main branch.

## Коммиты

Один коммит — одно логическое изменение. Рекомендуемый формат:

```text
S1-001: краткое действие
fix: краткое описание
```

Для нетривиальных изменений body:

```text
Backend

- file: что изменено и зачем.

Frontend

- file: что изменено и зачем.

Verify

- command — PASS

Migration note

- Миграции, breaking changes и действия при обновлении либо «нет».
```

## Pull Request

- task/fix → integration: squash merge;
- integration → main: merge commit;
- UI-изменения сопровождаются скриншотами или runtime evidence;
- merge выполняется только после релевантных проверок и review.

## Запрещено

- прямой push в main/integration без явного разрешения;
- смешение нескольких задач в одной ветке;
- `git add .` без проверки состава изменений;
- destructive Git-команды для очистки пользовательской работы.
