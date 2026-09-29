---
name: generate-tasks
description: Generate or review sprint tasks from the project's approved documentation, implementation map, decisions, backlog, and current code state. Use for sprint planning or documentation-to-development decomposition.
---

# Generate Tasks

Read `docs/INDEX.md`, accepted decisions, current implementation, existing
`tasks/TASKS.md`, related completed reports and the relevant code boundary.

Create small independently verifiable tasks. Each file
`tasks/sprint-{N}/S{N}-{NNN}_slug.md` must contain goal, context, work items,
sources, acceptance criteria, dependencies, verification and explicit out of
scope. Update `tasks/TASKS.md` in the same change.

Do not schedule future-phase requirements as current defects. Do not create
GitHub milestones/issues unless `repository` is configured and the user asked
for external project-management actions. When reviewing a sprint, preserve
completed history and record corrections in a dated summary.
