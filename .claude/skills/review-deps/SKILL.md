---
name: review-deps
description: Review dependency manifests and lockfiles for known vulnerabilities, unsupported or deprecated versions, lock drift, peer/engine conflicts, non-registry sources, license policy, provenance, and reproducibility. Excludes code-quality and application-security review.
---

# Review Dependencies

Identify every package ecosystem from the scoped manifests and lockfiles. Use
the project's configured commands and authoritative ecosystem tools. Networked
audits require normal user authorization when the environment asks for it.

Check manifest/lock consistency, direct and relevant transitive vulnerabilities,
deprecated/retracted releases, peer/engine constraints, `file:`/Git/tarball
sources, unused or duplicate direct packages, license policy, package provenance
and pinned build-tool versions. Distinguish a vulnerable package from a
reachable exploit and an available update from an applicable safe update.

Write a sprint-scoped report with evidence, installed/fixed versions, suggested
action, unverified registries and a formal verdict.
