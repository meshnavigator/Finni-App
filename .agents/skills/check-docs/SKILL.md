---
name: check-docs
description: Compare implementation with approved requirements, accepted decisions, current-implementation documentation, diagrams, and public contracts. Use to find evidence-backed documentation drift without treating future scope as a defect.
---

# Check Docs

Resolve scope and active delivery phase first. Read `docs/INDEX.md`, applicable
accepted decisions and current implementation, then use `project-map` to locate
the relevant code boundary.

Classify each item as compliant, implementation defect, documentation drift,
missing current-phase behavior, planned future scope, or open ambiguity. Every
finding needs a documentation reference and a code/test reference. Never claim
compliance for uninspected behavior.

Write the report under `tasks/reviews/sprint-{N}/` with summary, evidence,
severity, recommended action, and explicitly unverified areas.
