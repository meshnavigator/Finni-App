# Sprint 10 — V4 2D device verification and acceptance

- **S10-001** measures local image decode, peak/resident memory, cache bounds,
  dropped frames, cold start, background/return, remount, low-memory behavior,
  missing/corrupt asset fallback and animation cleanup. API 26, offline,
  TalkBack, 360 dp, font 100/150/200%, stress and reduced motion remain gates.
- **S10-002** compares 2D identity, silhouette, eyes, fur, expressions,
  animation stability, composition and screen priority with `REF-001`.
  Functional/economy acceptance, hashes, rights, APK lineage and independent
  art/product verdicts remain unchanged.

Control point: one identified signed release has separate visual and functional
acceptance; device/runtime evidence is not replaced by offline previews.

Entry gate: Sprint 9 implementation readiness, including persisted-result
presentation and native old-schema install-over. S9 final external PASS is an
outcome of S10-001/002, not a prerequisite for S10-001 (DEC-2026-09-26-014).
