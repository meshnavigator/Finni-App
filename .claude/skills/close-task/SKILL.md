---
name: close-task
description: Close a task as done, partial, postponed, or cancelled; create its completion report, update TASKS.md, and optionally complete the PR and issue workflow. Use after status and verification are known.
---

# Close Task

Supported statuses: `done`, `partial`, `postponed`, `cancelled`. Do not infer
`done` when required acceptance criteria or checks are incomplete.

Create `tasks/sprint-{N}/done/{task-id}_{status}.md` with outcome, changed files,
decisions, actual Verify, commits, remaining work and risks. Update the task
entry in `tasks/TASKS.md` without erasing history.

For `partial`, create a follow-up task for remaining scope. For `postponed`,
record the target sprint and reason. For `done`/`partial`, push/PR/merge only
when the user authorized those external actions; follow branches from config
and never stage unrelated changes. Update GitHub issue/project state only when
configured and requested.
