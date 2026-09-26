# S7-004 art/provenance gate — 2026-09-20

## Verdict

**BLOCKED — do not close S7-004 and do not wire the POC into production.**

## Evidence reviewed

- Accepted [DEC-006](../../../docs/DEC-2026-09-19-006_2d-cutout-target.md)
  accepts the layered 2D direction but calls `Finni_S7-002_2D_POC`
  comparative/diagnostic evidence pending separate art/provenance and
  runtime/release gates.
- POC [README](../../../docs/Finni_S7-002_2D_POC/README.md),
  [VERIFY](../../../docs/Finni_S7-002_2D_POC/VERIFY.md),
  [PROVENANCE](../../../docs/Finni_S7-002_2D_POC/PROVENANCE.md) and
  `SHA256SUMS.txt` record candidate PNGs, derivative previews and initial
  checksums, not an editable production master.
- SRS §8 and §12.5 require three stages and nine shape/pattern combinations;
  §22.8/NFR-19 require traceable provenance. S05-15 allows generation but does
  not verify a service's concrete rights.

## Mechanical package prepared

`docs/assets-register.md` and
`docs/Finni_S7-004_2D_ART_ACCEPTANCE/` now record source identifiers, declared
POC dimensions, freshly reverified hashes, PNG color modes and non-zero-alpha
bounds, same-scale review procedure, compatibility design and hash-bound blank
verdicts. They make no production assertion. Fresh scan: `REF-001` 941×1672
RGB without alpha; OPEN bbox `[0,0,1178,1294)`, BLINK bbox
`[0,0,1180,1298)`, IDLE-SHEET bbox `[7,11,2026,1623)`.

## Acceptance gaps

1. No editable layered master or clean-room Home art slice exists.
2. No immutable production IDs/paths/dimensions/alpha bounds/SHA-256 inventory
   exists for a new master.
3. No named art owner has accepted identity, silhouette, eyes, colour or
   character against `REF-001`.
4. No named product/legal owner has accepted exact hashes, terms applicability
   or permitted distribution scope. POC reports its exact backend identifier
   and generation IDs unavailable.
5. The POC only supplies neutral/blink and a 12-frame sheet; it does not prove
   a compatible layered source for 3 stages × 3×3 appearance combinations.

## Required next actions

1. Produce a separate versioned editable master and clean-room Home slice.
2. Run decode/dimension/color/alpha-bound/SHA-256 scans and register each new
   source/export without overwriting POC.
3. Complete both forms in `OWNER_VERDICTS.md` against the final hashes.
4. If both approve and all mechanical fields exist, use `close-task` to create
   the S7-004 completion report and only then allow production wiring.

## Non-effects

This gate does not choose the runtime technology (DEC-007 remains Proposed),
does not alter `Finni App`, and does not remove Filament/Worklets. Historical
R1–R4, POC and 3D addendum remain unchanged.
