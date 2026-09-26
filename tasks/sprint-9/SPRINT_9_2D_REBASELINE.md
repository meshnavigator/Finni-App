# Sprint 9 — V3 layered 2D integration

- **S9-001** integrates a renderer-neutral layered Home scene and Finni cutout
  with the existing HUD/state model, safe areas, modal/tap blocking, lifecycle,
  reduced motion and missing-asset fallback.
- **S9-002** remains the persisted-result presentation controller. Rename
  renderer/clip terminology to visual effect/state; command receipts and
  idempotency do not change.
- **S9-003** keeps the financial-screen UI-kit scope and removes only claims
  about a required 3D room.
- **S9-004** keeps lessons/history/adult scope; avoid separate decorative scenes
  without functional need rather than specifically prohibiting 3D rooms.

Production integration uses the accepted Sprint 8 art/runtime slice and the
existing Sprint 2–3 data dependencies. Open Sprint 8 art/device gates remain
visible in Sprint 8 and Sprint 10. Sprint 9 implementation readiness feeds
S10-001; final external acceptance follows S10-001/002 (DEC-2026-09-26-014).
Presentation remains downstream of atomic persistence.
