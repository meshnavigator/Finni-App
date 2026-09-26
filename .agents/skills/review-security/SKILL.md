---
name: review-security
description: Perform trust-boundary security review of authentication, authorization, sessions, untrusted parsers/uploads, injection, secrets, network boundaries, background jobs, and frontend exposure. Excludes general quality and dependency-version review.
---

# Review Security

Start by drawing the actual trust boundary from docs, config and code. Resolve
the scoped entry points and data flow with project-map.

Check authentication/authorization, tenant or session isolation, input/resource
limits, parser and archive abuse, path traversal, injection, SSRF, secret/log
exposure, cryptographic use, queue/worker boundaries, browser storage, CSP/CORS
and production configuration. Demonstrate a reachable path or state the exact
missing evidence. Do not label opaque tokens as locally verifiable JWTs without
proof.

Write a sprint-scoped security report with confirmed vulnerabilities, risks,
questions, good controls, unverified surfaces and merge verdict. Do not mix in
style or outdated-package findings.
