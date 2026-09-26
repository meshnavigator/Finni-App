---
name: commit-report
description: Create a traceable Markdown report for a commit, linking its intent, task, files, contracts, verification, and migration impact. Use after a commit or when documenting an existing commit.
---

# Commit Report

Inspect the commit message, body, diff, parent, task ID and actual verification
evidence. Do not infer tests that were not run.

Write:

`tasks/commits/sprint-{N}/{YYYY-MM-DD}_{slug}_{short-hash}.md`

Include summary, linked task/issue, affected files grouped by subsystem,
behavioral details, decisions/docs impact, Verify, breaking changes/migrations,
and remaining risks. If amend or squash changes the final hash, rename and
update the report. Do not place new reports directly in `tasks/commits/`.
