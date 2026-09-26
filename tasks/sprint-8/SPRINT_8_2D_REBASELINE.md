# Sprint 8 — V2 layered 2D production package

## Gate

Blocked until S7-004 PASS, S7-005 PASS, DEC-2026-09-19-007 Accepted and
S7-006 signed-release boundary complete.

## Reinterpreted tasks

- **S8-001**: layered 2D character master instead of 3D model/rig. Deliver
  editable layers, stages 1–3, `round|pointy|floppy`,
  `plain|spots|stripes`, expression states, deterministic exports, hashes and
  the 27-combination matrix without new domain IDs.
- **S8-002**: layered 2D/2.5D room and catalog assets instead of 3D models.
  Preserve ROOM-BASE, planner/chest/care/goal/item semantics, canonical IDs,
  local/offline packaging, signed 48 dp controls, hit regions and provenance.
- **S8-003**: deterministic transform, image-swap and sprite animation contract
  instead of skeletal clips. Preserve priorities, interruption/cancel/skip,
  rapid taps, static reduced-motion equivalents and the rule that presentation
  never changes economy or persistence.

## Control point

Editable sources, deterministic export, 27 combinations, room/catalog assets,
animation/state matrix, hashes, provenance and import/runtime validation pass.
