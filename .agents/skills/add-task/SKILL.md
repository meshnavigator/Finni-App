---
name: add-task
description: Add one bug, missed requirement, improvement, or feature to the active sprint with a detailed task file and TASKS.md entry. Use for a concrete new work item; optionally create a linked GitHub issue when configured and requested.
---

# Add Task

1. Read config, `tasks/TASKS.md`, the active sprint and related docs/code.
2. Search existing tasks and issues for duplicates.
3. Allocate the next ID using `task_id_pattern`.
4. Create `tasks/sprint-{N}/{ID}_slug.md` with goal, evidence, scope, acceptance
   criteria, dependencies, verification and out of scope.
5. Add the matching unchecked entry to `tasks/TASKS.md`.
6. If GitHub publication is authorized and `repository` is non-empty, create
   the issue, replace placeholders with its actual number, and verify labels,
   milestone and project status.

Do not start a branch unless the user also asks to start the task.
