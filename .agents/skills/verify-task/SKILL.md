---
name: verify-task
description: Select and run proportionate verification for a task or diff using project-configured backend, frontend, integration, documentation, and whitespace commands. Use before declaring implementation complete, committing, or opening a PR.
---

# Verify Task

1. Read `.project-kit/config.json`, the task acceptance criteria, and the actual
   diff. Never invent commands not supported by the project.
2. Select every affected verification group from `verify`.
3. Add contract-specific checks when the diff changes API schemas, migrations,
   generated code, background jobs, file formats, reports or public types.
4. UI behavior requires a runtime/browser check when an executable UI exists;
   typecheck and unit tests alone do not prove visual behavior.
5. Check whether `IMPLEMENTATION_DECISIONS`, `CURRENT_IMPLEMENTATION` or a
   workflow diagram must change. State explicitly when they are unaffected.
6. Run `git diff --check` unless the project defines an equivalent.

Report only commands actually run:

```text
Verify

- <command> — PASS | FAIL | NOT RUN: reason
```

Do not mark the task complete while a required check fails.
