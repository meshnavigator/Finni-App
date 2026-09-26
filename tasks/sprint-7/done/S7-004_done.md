# S7-004 — принять layered 2D art master и provenance

## Outcome

**DONE, 2026-09-21.** `FINNI-2D-MASTER-V1` is accepted for the defined
layered-2D art and project/rights scope. This is a governance/art acceptance;
it does not accept a runtime technology, a signed release or the downstream
full production set.

## Delivered evidence

- Editable OpenRaster source, clean-room room layer, aligned neutral/blink
  layers and acceptance exports are in
  `docs/Finni_S7-004_2D_MASTER_v1/`.
- Exact checksums are registered in
  `docs/Finni_S7-004_2D_MASTER_v1/SHA256SUMS.txt`; the six accepted master
  assets and `REF-001` are repeated in
  `docs/Finni_S7-004_2D_ART_ACCEPTANCE/OWNER_VERDICTS_2026-09-21.md`.
- The owner record identifies `Скоробагатько Константин Владимирович`,
  руководитель разработки, as art and project/rights owner. It records an
  identity/art acceptance and authorization for contest-submission/public APK
  scope; RuStore publication during the contest remains excluded.
- `master-inventory.json` records canvas, format, dimensions, alpha bounds and
  immutable IDs. The existing compatibility design preserves only the current
  `shapeId`/`patternId` domain values and stages 1–3.

## Decision sources

- DEC-2026-09-19-006: layered 2D cutout/2.5D is the accepted medium.
- SRS v1.3 §§8, 12.5 and 22.8/NFR-19: variants/stages and asset provenance.
- User owner statement, 2026-09-21, recorded in the verdict file.

## Verify

- Historical reference and POC checksum records were compared with the master
  inventory.
- `MECHANICAL_VERIFY.md` records successful decode/dimensions/alpha-bounds,
  OpenRaster structure, aligned layers and clean-room content checks.
- Fresh SHA-256 rehash of the ORA, room, neutral/blink layers and Home exports
  — PASS; all six accepted asset hashes match the owner verdict.
- `master-manifest.json` JSON parse — PASS; status and named owner fields are
  present. Administrative README/manifest hashes were refreshed in
  `SHA256SUMS.txt`; accepted art binary hashes did not change.

## Remaining work and risks

- Exact backend model/generation IDs remain unavailable; the product/rights
  owner accepts the stated scope with this provenance limitation.
- S8 owns the full 3 stages, 3×3 production variants, catalog/room assets and
  animation set; this master does not claim their delivery.
- S7-005 still must prove runtime, lifecycle, reduced motion and signed
  release; DEC-007 stays Proposed and S7-006 remains blocked.
- R1–R4, S7-002 POC and 3D addendum remain immutable historical evidence.
