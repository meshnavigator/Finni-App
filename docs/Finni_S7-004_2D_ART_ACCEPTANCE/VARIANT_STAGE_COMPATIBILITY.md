# 3-stage × 3×3 compatibility design

This is a design constraint for a future editable layered master. It does not
claim that any of the 27 visual compositions, a room, or a production export
exists today.

## Domain invariant

No new profile/domain identifiers are introduced. The only appearance keys are
the existing values from the historical manifest:

| Key | Values |
| --- | --- |
| `shapeId` | `round`, `pointy`, `floppy` |
| `patternId` | `plain`, `spots`, `stripes` |
| stage | `1`, `2`, `3` |

## Required master slots

The editable master must separate a stable base/face/eyes anchor from these
composable slots: `stage-1..3`, `ears-round|pointy|floppy` and
`pattern-plain|spots|stripes`. Each layer records canvas, origin/anchor,
opacity/alpha rule and permitted transform. Neutral and blink are two face/eye
states sharing that anchor.

| Stage | Required valid combinations |
| --- | --- |
| 1 | round/plain, round/spots, round/stripes, pointy/plain, pointy/spots, pointy/stripes, floppy/plain, floppy/spots, floppy/stripes |
| 2 | round/plain, round/spots, round/stripes, pointy/plain, pointy/spots, pointy/stripes, floppy/plain, floppy/spots, floppy/stripes |
| 3 | round/plain, round/spots, round/stripes, pointy/plain, pointy/spots, pointy/stripes, floppy/plain, floppy/spots, floppy/stripes |

Before acceptance, an art owner must inspect composed samples sufficient to
prove no clipping, incompatible silhouette, misplaced pattern or eye/face
misalignment. S7-004 does not require 27 flattened PNG exports; Sprint 8 owns
mass production and import validation.
