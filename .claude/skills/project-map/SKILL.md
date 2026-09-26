---
name: project-map
description: Build and query a codespaces belief map to scope non-trivial changes, find module boundaries, dependencies, reverse dependencies, API/data flow, and the minimal source files to read. Use before cross-module code work or blast-radius analysis; skip for simple Git or one-file tasks.
---

# Project Map

Read `.project-kit/config.json`. Work from its `code_root`.

## Locate tools

Use `belief_map.tool_root`, then `CODESPACES_HOME`, then
`C:\tmp\codespaces-go` or `/tmp/codespaces-go`. If unavailable, report the
missing prerequisite rather than inventing commands or copying scripts.

## Workflow

1. Build only when the map is missing or stale. Use `--full` after structural,
   import, route, SQL or migration changes; add `--lsp` when precise call edges
   materially help.
2. Run `quick "keyword"`, or `search`/`entity` followed immediately by
   `analyze <full-module-id>`.
3. Run `deps`, `rdeps`, and `boundary --files` at the smallest useful depth.
4. Read only returned boundary files when they are sufficient.
5. Report target module, direct dependencies, blast radius, files to read or
   change, and unresolved edges.

Never guess module IDs or read the complete `.belief_map.sexp`. If results
contain `worktrees/` or another repository copy, label them as noise and use
only the active code root.
