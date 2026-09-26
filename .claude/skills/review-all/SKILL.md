---
name: review-all
description: Run a complete project review by combining independent quality, security, and dependency reviews, then normalize severity, deduplicate overlap, and issue a formal merge verdict with a machine-readable summary. Use for major task, release, or explicit full-review requests.
---

# Review All

Resolve task/diff scope and belief-map boundary once. When subagents are
available and the request permits full review, run `review-quality`,
`review-security`, and `review-deps` in parallel with identical resolved scope;
otherwise run the three reviews sequentially without dropping a domain.

## Execution floor

Run every domain review and the final normalization/aggregate pass with
**GPT-6 Sol XHigh** by default. Allowed executors are:

- GPT-6 Sol with `xhigh`, `max`, or `ultra` reasoning;
- GPT-6 Astra with `xhigh`, `max`, or `ultra` reasoning, only after the
  separate user confirmation required by the project Astra approval policy.

This floor overrides a lower adaptive route for `review-all`; do not assign any
part of the review to Luna or reasoning below `xhigh`. If Astra would be
preferred but the user has not approved it, use GPT-6 Sol XHigh. If neither an
eligible subagent nor an eligible current model is available, stop and report
the execution constraint instead of silently lowering the model or reasoning.

Require each domain report to distinguish confirmed findings, questions and
unverified areas. Normalize severity by actual impact and exploitability,
deduplicate cross-domain findings while preserving related evidence, and sort
merge blockers first.

Write the three domain reports and one aggregate report under
`tasks/reviews/sprint-{N}/`. Aggregate output must include scope, sources,
counts, top findings, unverified critical areas, task compliance, formal
`PASS`/`PASS_WITH_WARNINGS`/`FAIL` verdict, and a machine-readable YAML summary.
