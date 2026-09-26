---
name: sprint-summary
description: Produce an evidence-based sprint summary from task status, completion reports, reviews, commits, decisions, and Git history. Use at sprint close or for readiness assessment of the next sprint.
---

# Sprint Summary

Use `tasks/TASKS.md`, task and done files, sprint-scoped reviews/commit reports,
accepted decisions, Git history and configured repository data. Reconcile
planned, done, partial, postponed and cancelled counts; do not use commit count
as a substitute for completed scope.

Write `tasks/sprint-{N}/summary/SPRINT-{N}_SUMMARY_{YYYY-MM-DD}.md` with dates,
scope metrics, delivered outcomes, unfinished work, code/quality evidence,
retrospective, risks and prerequisites for the next sprint. Include a compact
machine-readable YAML summary. Mark unknown data as unknown rather than zero.
