---
name: review-quality
description: Perform evidence-based code-quality review for architecture, domain invariants, state transitions, deterministic behavior, error transparency, maintainability, and test adequacy. Excludes security and dependency findings.
---

# Review Quality

Resolve the exact diff/task scope, acceptance criteria and belief-map boundary.
Read project invariants and accepted decisions before judging implementation.

Report only reproducible defects or concrete risks. Each finding must include
severity, file/line, violated contract or invariant, execution path, impact,
and the smallest reasonable correction. Separate confirmed defects from open
questions. Do not report style preferences, hypothetical edge cases without a
reachable path, security issues or package-version issues.

Write `tasks/reviews/sprint-{N}/{date}_review-quality_{scope}.md` and include
unverified areas plus a formal merge verdict based on confirmed severity.
