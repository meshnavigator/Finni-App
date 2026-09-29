---
name: project-bootstrap
description: Deploy or update the portable Project Governance Kit in an empty or existing software project, including instructions, task/report structure, local skills, and configuration. Use when the user asks to initialize, replicate, or install this project-management structure; do not overwrite existing governance files without explicit approval.
---

# Project Bootstrap

Deploy the kit safely and leave the target project usable, not merely scaffolded.

## Workflow

1. Resolve the exact target project root and inspect existing `AGENTS.md`,
   `.agents/`, `.claude/`, `docs/` and `tasks/`.
2. Infer project name and code root. Read repository/branch names from Git when
   available; do not require GitHub configuration.
3. Run the bundled bootstrap in dry-run mode first:

```text
python <plugin-root>/scripts/bootstrap_project.py <target> --name <name> --code-root <path> --dry-run
```

4. Run it without `--dry-run`. Never pass `--force` unless the user explicitly
   authorizes replacing existing files.
5. For conflicts, inspect `.project-kit/generated/` and merge only applicable
   sections into existing files. Preserve project-specific instructions.
6. Customize `AGENTS.md`, `.project-kit/config.json`,
   `.project-kit/model-routing.json`, `docs/INDEX.md` and
   `docs/CURRENT_IMPLEMENTATION.md` from evidence in the target project.
7. Run the bundled `project_doctor.py` and report remaining warnings.

Do not publish, create GitHub issues, change branches, or install dependencies
unless separately requested.
