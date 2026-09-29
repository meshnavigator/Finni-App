---
name: check-api
description: Compare implemented API routes and clients with the project's public contract, schemas, errors, authentication, authorization, rate limits, streaming, and concurrency/version rules. Use for API drift or release-gate checks.
---

# Check API

Find the authoritative API specification through `docs/INDEX.md`. Determine the
active product phase and trust boundary before classifying missing routes.

For each scoped endpoint verify method/path, auth, request/response schemas,
content types, status and error codes, pagination/streaming, revision or
idempotency rules, rate limits, CORS and client usage. Trace persistence fields
when they affect the contract. Use project-map for backend/client blast radius.

Report compliant and non-compliant endpoints with exact spec and code evidence,
future-scope exclusions, and areas not runtime-tested. Do not mutate the API or
spec during a review-only request.
