---
name: project-doctor
description: Audit a Project Governance Kit installation for missing instructions, invalid configuration, stale or noisy belief maps, skill-mirror drift, and missing local tools. Use for setup verification or governance troubleshooting; the audit is read-only.
---

# Project Doctor

Run the project-local script when available:

```text
python .project-kit/scripts/project_doctor.py [project-root]
```

Otherwise run the plugin-bundled `scripts/project_doctor.py` against the target.
Use `--json` only when machine-readable output is needed.

Summarize errors first, then warnings. Do not fix findings unless the user also
asks for repair. For skill drift, `.agents/skills` is canonical and
`.claude/skills` is the compatibility mirror; use `sync_project_skills.py
--check` to obtain the exact delta.
